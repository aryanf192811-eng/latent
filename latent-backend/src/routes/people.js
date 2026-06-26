const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail, paged } = require('../utils/response');

// GET /api/people — discover people on campus
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, department, year, q } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    const conditions = ['u.id != $1'];

    if (department) {
      params.push(department);
      conditions.push(`u.department = $${params.length}`);
    }
    if (year) {
      params.push(year);
      conditions.push(`u.year = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.department ILIKE $${params.length})`);
    }

    const where = conditions.join(' AND ');
    params.push(limit);
    params.push(offset);

    const { rows } = await db.query(
      `SELECT u.id, u.name, u.avatar_url, u.department, u.year, u.campus_status, u.bio, u.hostel_type,
              (SELECT COUNT(*)::int FROM follows WHERE following_id=u.id) AS followers_count,
              EXISTS(SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=u.id) AS is_following
       FROM users u
       WHERE ${where}
       ORDER BY u.last_seen DESC NULLS LAST
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countResult = await db.query(
      `SELECT COUNT(*)::int FROM users u WHERE ${conditions.join(' AND ')}`,
      params.slice(0, params.length - 2)
    );
    paged(res, rows, countResult.rows[0].count, page, limit);
  } catch (err) {
    console.error(err);
    fail(res, 'Failed to fetch people', 500);
  }
});

// GET /api/people/seniors — list senior mentors
router.get('/seniors', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.avatar_url, u.department, u.year,
              sm.bio_mentor, sm.subjects, sm.opted_in_at,
              EXISTS(SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=u.id) AS is_following
       FROM senior_mentors sm
       JOIN users u ON u.id = sm.user_id
       ORDER BY u.year DESC, u.name ASC`,
      [req.user.id]
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch seniors', 500);
  }
});

module.exports = router;
