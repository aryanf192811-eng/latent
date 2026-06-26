const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail, paged } = require('../utils/response');

// GET /api/events
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, club_id, upcoming } = req.query;
    const pg = Math.max(1, parseInt(page));
    const lm = Math.min(100, parseInt(limit) || 20);
    const offset = (pg - 1) * lm;
    const userId = req.user.id;

    // Use extra conditions as SQL fragments (safe — club_id is cast to int)
    const extraWhere = [];
    if (club_id) extraWhere.push(`e.club_id = ${parseInt(club_id)}`);
    if (upcoming === 'true') extraWhere.push(`e.start_time > NOW()`);
    const whereStr = extraWhere.length ? `WHERE ${extraWhere.join(' AND ')}` : '';

    const [eventsResult, countResult] = await Promise.all([
      db.query(
        `SELECT e.id, e.title, e.description, e.location_name, e.start_time, e.end_time,
                e.banner_url, e.max_capacity, e.created_at,
                jsonb_build_object('id',c.id,'name',c.name,'logo_url',c.logo_url) AS club,
                (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=e.id AND status='going') AS going_count,
                (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=e.id AND status='interested') AS interested_count,
                (SELECT status FROM event_rsvps WHERE event_id=e.id AND user_id=$1) AS user_rsvp
         FROM events e
         LEFT JOIN clubs c ON c.id = e.club_id
         ${whereStr}
         ORDER BY e.start_time ASC
         LIMIT $2 OFFSET $3`,
        [userId, lm, offset]
      ),
      db.query(`SELECT COUNT(*)::int FROM events e ${whereStr}`),
    ]);

    paged(res, eventsResult.rows, countResult.rows[0].count, pg, lm);
  } catch (err) {
    console.error(err);
    fail(res, 'Failed to fetch events', 500);
  }
});

// GET /api/events/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.id, e.title, e.description, e.location_name, e.start_time, e.end_time,
              e.banner_url, e.max_capacity, e.created_at,
              jsonb_build_object('id',c.id,'name',c.name,'logo_url',c.logo_url,'category',c.category) AS club,
              (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=e.id AND status='going') AS going_count,
              (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=e.id AND status='interested') AS interested_count,
              (SELECT status FROM event_rsvps WHERE event_id=e.id AND user_id=$2) AS user_rsvp,
              (SELECT jsonb_agg(jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url))
               FROM event_rsvps er JOIN users u ON u.id=er.user_id
               WHERE er.event_id=e.id AND er.status='going' LIMIT 10) AS going_users
       FROM events e
       LEFT JOIN clubs c ON c.id = e.club_id
       WHERE e.id=$1`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return fail(res, 'Event not found', 404);
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to fetch event', 500);
  }
});

// POST /api/events/:id/rsvp
router.post('/:id/rsvp', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['going','interested','not_going'];
    if (!valid.includes(status)) return fail(res, 'Invalid status');

    await db.query(
      `INSERT INTO event_rsvps (user_id,event_id,status,updated_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (user_id,event_id) DO UPDATE SET status=$3,updated_at=NOW()`,
      [req.user.id, req.params.id, status]
    );
    ok(res, { status });
  } catch (err) {
    fail(res, 'Failed to RSVP', 500);
  }
});

// GET /api/events/:id/memories
router.get('/:id/memories', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT em.id, em.image_url, em.caption, em.created_at,
              jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url) AS "user"
       FROM event_memories em JOIN users u ON u.id=em.user_id
       WHERE em.event_id=$1 ORDER BY em.created_at DESC`,
      [req.params.id]
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch memories', 500);
  }
});

// POST /api/events/:id/memories
router.post('/:id/memories', auth, async (req, res) => {
  try {
    const { image_url, caption } = req.body;
    if (!image_url) return fail(res, 'image_url required');
    const { rows } = await db.query(
      `INSERT INTO event_memories (event_id,user_id,image_url,caption)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.user.id, image_url, caption]
    );
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to add memory', 500);
  }
});

module.exports = router;
