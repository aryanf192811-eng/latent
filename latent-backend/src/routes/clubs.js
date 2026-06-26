const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail, paged } = require('../utils/response');

// GET /api/clubs
router.get('/', auth, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const pg = Math.max(1, parseInt(page));
    const lm = Math.min(100, parseInt(limit) || 20);
    const offset = (pg - 1) * lm;
    const userId = req.user.id;

    // Safe: category is a known enum value, embed directly
    const validCategories = ['tech','cultural','sports','academic','social','nss'];
    const catFilter = (category && validCategories.includes(category))
      ? `AND c.category = '${category}'`
      : '';

    const whereStr = `WHERE c.is_active = TRUE ${catFilter}`;

    const [clubsResult, countResult] = await Promise.all([
      db.query(
        `SELECT c.id, c.name, c.description, c.category, c.logo_url, c.banner_url, c.founded_year,
                (SELECT COUNT(*)::int FROM club_members WHERE club_id=c.id) AS member_count,
                EXISTS(SELECT 1 FROM club_members WHERE club_id=c.id AND user_id=$1) AS is_member,
                (SELECT role FROM club_members WHERE club_id=c.id AND user_id=$1) AS user_role
         FROM clubs c
         ${whereStr}
         ORDER BY c.name
         LIMIT $2 OFFSET $3`,
        [userId, lm, offset]
      ),
      db.query(`SELECT COUNT(*)::int FROM clubs c ${whereStr}`),
    ]);
    paged(res, clubsResult.rows, countResult.rows[0].count, pg, lm);
  } catch (err) {
    console.error(err);
    fail(res, 'Failed to fetch clubs', 500);
  }
});

// GET /api/clubs/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*,
              (SELECT COUNT(*)::int FROM club_members WHERE club_id=c.id) AS member_count,
              EXISTS(SELECT 1 FROM club_members WHERE club_id=c.id AND user_id=$2) AS is_member,
              (SELECT role FROM club_members WHERE club_id=c.id AND user_id=$2) AS user_role,
              (SELECT jsonb_agg(jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url,'role',cm.role))
               FROM club_members cm JOIN users u ON u.id=cm.user_id
               WHERE cm.club_id=c.id ORDER BY cm.role LIMIT 20) AS members
       FROM clubs c WHERE c.id=$1`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return fail(res, 'Club not found', 404);

    // Upcoming events for this club
    const events = await db.query(
      `SELECT id, title, start_time, banner_url FROM events
       WHERE club_id=$1 AND start_time > NOW() ORDER BY start_time ASC LIMIT 5`,
      [req.params.id]
    );
    rows[0].upcoming_events = events.rows;
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to fetch club', 500);
  }
});

// POST /api/clubs/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    await db.query(
      `INSERT INTO club_members (user_id,club_id,role) VALUES ($1,$2,'member') ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.id]
    );
    ok(res, { joined: true });
  } catch (err) {
    fail(res, 'Failed to join club', 500);
  }
});

// DELETE /api/clubs/:id/leave
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM club_members WHERE user_id=$1 AND club_id=$2',
      [req.user.id, req.params.id]
    );
    ok(res, { joined: false });
  } catch (err) {
    fail(res, 'Failed to leave club', 500);
  }
});

module.exports = router;
