const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// GET /api/seniors
router.get('/', auth, async (req, res) => {
  try {
    const { department } = req.query;
    const params = [req.user.id];
    let extra = '';
    if (department) {
      params.push(department);
      extra = ` AND u.department = $${params.length}`;
    }
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.avatar_url, u.department, u.year, u.bio,
              sm.bio_mentor, sm.subjects, sm.opted_in_at,
              EXISTS(SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=u.id) AS is_following
       FROM senior_mentors sm
       JOIN users u ON u.id=sm.user_id
       WHERE 1=1${extra}
       ORDER BY u.year DESC, u.name ASC`,
      params
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch seniors', 500);
  }
});

// POST /api/seniors/register — opt in as mentor
router.post('/register', auth, async (req, res) => {
  try {
    const { bio_mentor, subjects } = req.body;
    await db.query(
      `INSERT INTO senior_mentors (user_id,bio_mentor,subjects)
       VALUES ($1,$2,$3) ON CONFLICT (user_id) DO UPDATE SET bio_mentor=$2,subjects=$3`,
      [req.user.id, bio_mentor, JSON.stringify(subjects || [])]
    );
    ok(res, { registered: true });
  } catch (err) {
    fail(res, 'Failed to register as mentor', 500);
  }
});

// DELETE /api/seniors/register — opt out
router.delete('/register', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM senior_mentors WHERE user_id=$1', [req.user.id]);
    ok(res, { registered: false });
  } catch (err) {
    fail(res, 'Failed to opt out', 500);
  }
});

module.exports = router;
