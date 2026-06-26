const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail, paged } = require('../utils/response');

// GET /api/notifications/stream
router.get('/stream', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).send('No token');

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial unread count
    const countResult = await db.query('SELECT COUNT(*)::int FROM notifications WHERE user_id=$1 AND is_read=FALSE', [decoded.id]);
    res.write(`event: unread_count\ndata: ${countResult.rows[0].count}\n\n`);

    // Heartbeat every 30s
    const interval = setInterval(() => {
      res.write(`:heartbeat\n\n`);
    }, 30000);

    req.on('close', () => {
      clearInterval(interval);
    });
  } catch (err) {
    return res.status(401).send('Invalid token');
  }
});

// GET /api/notifications
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    const [notifResult, announceResult, countResult] = await Promise.all([
      db.query(
        `SELECT n.id, n.type, n.content, n.ref_id, n.ref_type, n.is_read, n.created_at,
                CASE WHEN n.actor_id IS NOT NULL THEN
                  jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url)
                ELSE NULL END AS actor
         FROM notifications n
         LEFT JOIN users u ON u.id=n.actor_id
         WHERE n.user_id=$1
         ORDER BY n.created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      db.query(
        `SELECT id, title, content, priority, created_at
         FROM announcements
         WHERE (expires_at IS NULL OR expires_at > NOW())
         ORDER BY priority DESC, created_at DESC LIMIT 5`
      ),
      db.query('SELECT COUNT(*)::int FROM notifications WHERE user_id=$1 AND is_read=FALSE', [req.user.id]),
    ]);

    ok(res, {
      notifications: notifResult.rows,
      announcements: announceResult.rows,
      unread_count: countResult.rows[0].count,
    });
  } catch (err) {
    fail(res, 'Failed to fetch notifications', 500);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', auth, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1', [req.user.id]);
    ok(res, { updated: true });
  } catch (err) {
    fail(res, 'Failed to mark read', 500);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    ok(res, { updated: true });
  } catch (err) {
    fail(res, 'Failed to mark read', 500);
  }
});

module.exports = router;
