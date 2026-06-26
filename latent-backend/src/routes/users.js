const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail, paged } = require('../utils/response');

// GET /api/users/me/saved
router.get('/me/saved', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const { rows } = await db.query(
      `SELECT p.id, p.content, p.image_urls, p.post_type, p.created_at,
              jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url) AS "user",
              sp.saved_at
       FROM saved_posts sp
       JOIN posts p ON p.id = sp.post_id
       JOIN users u ON u.id = p.user_id
       WHERE sp.user_id=$1
       ORDER BY sp.saved_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    const count = await db.query('SELECT COUNT(*)::int FROM saved_posts WHERE user_id=$1', [req.user.id]);
    paged(res, rows, count.rows[0].count, page, limit);
  } catch (err) {
    fail(res, 'Failed to fetch saved posts', 500);
  }
});

// PUT /api/users/me — update own profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, bio, department, year, avatar_url, hostel_type, campus_status, default_mess_id, interests } = req.body;
    await db.query(
      `UPDATE users SET
        name=COALESCE($1,name), bio=COALESCE($2,bio), department=COALESCE($3,department),
        year=COALESCE($4,year), avatar_url=COALESCE($5,avatar_url),
        hostel_type=COALESCE($6,hostel_type), campus_status=COALESCE($7,campus_status),
        default_mess_id=COALESCE($8,default_mess_id)
       WHERE id=$9`,
      [name, bio, department, year, avatar_url, hostel_type, campus_status, default_mess_id, req.user.id]
    );
    if (interests) {
      await db.query('DELETE FROM user_interests WHERE user_id=$1', [req.user.id]);
      for (const i of interests) {
        await db.query('INSERT INTO user_interests (user_id,interest) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, i]);
      }
    }
    const { rows } = await db.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to update profile', 500);
  }
});

// PATCH /api/users/me/status
router.patch('/me/status', auth, async (req, res) => {
  try {
    const { campus_status, status_expires_at } = req.body;
    await db.query(
      'UPDATE users SET campus_status=$1, status_expires_at=$2 WHERE id=$3',
      [campus_status, status_expires_at || null, req.user.id]
    );
    ok(res, { campus_status });
  } catch (err) {
    fail(res, 'Failed to update status', 500);
  }
});

// GET /api/users/:id/profile
router.get('/:id/profile', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.enrollment_no, u.department, u.year,
              u.bio, u.avatar_url, u.campus_status, u.hostel_type, u.last_seen, u.created_at,
              (SELECT COUNT(*)::int FROM follows WHERE following_id=u.id) AS followers_count,
              (SELECT COUNT(*)::int FROM follows WHERE follower_id=u.id) AS following_count,
              (SELECT COUNT(*)::int FROM posts WHERE user_id=u.id) AS posts_count,
              EXISTS(SELECT 1 FROM follows WHERE follower_id=$2 AND following_id=u.id) AS is_following
       FROM users u WHERE u.id=$1`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return fail(res, 'User not found', 404);
    const user = rows[0];
    const interests = await db.query('SELECT interest FROM user_interests WHERE user_id=$1', [req.params.id]);
    user.interests = interests.rows.map(r => r.interest);

    // Their posts
    const postRows = await db.query(
      `SELECT p.id, p.content, p.image_urls, p.post_type, p.is_anonymous, p.created_at,
              (SELECT COUNT(*)::int FROM post_reactions WHERE post_id=p.id) AS total_reactions,
              (SELECT COUNT(*)::int FROM comments WHERE post_id=p.id) AS comment_count
       FROM posts p WHERE p.user_id=$1 AND p.is_anonymous=FALSE
       ORDER BY p.created_at DESC LIMIT 20`,
      [req.params.id]
    );
    user.posts = postRows.rows;
    ok(res, user);
  } catch (err) {
    fail(res, 'Failed to fetch profile', 500);
  }
});

// POST /api/users/:id/follow
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return fail(res, 'Cannot follow yourself');
    await db.query(
      'INSERT INTO follows (follower_id,following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.id]
    );
    ok(res, { following: true });
  } catch (err) {
    fail(res, 'Failed to follow', 500);
  }
});

// DELETE /api/users/:id/follow
router.delete('/:id/follow', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM follows WHERE follower_id=$1 AND following_id=$2',
      [req.user.id, req.params.id]
    );
    ok(res, { following: false });
  } catch (err) {
    fail(res, 'Failed to unfollow', 500);
  }
});

// GET /api/users/:id/followers
router.get('/:id/followers', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.avatar_url, u.department, u.year,
              EXISTS(SELECT 1 FROM follows WHERE follower_id=$2 AND following_id=u.id) AS is_following
       FROM follows f JOIN users u ON u.id=f.follower_id
       WHERE f.following_id=$1`,
      [req.params.id, req.user.id]
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch followers', 500);
  }
});

// GET /api/users/:id/following
router.get('/:id/following', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.avatar_url, u.department, u.year,
              EXISTS(SELECT 1 FROM follows WHERE follower_id=$2 AND following_id=u.id) AS is_following
       FROM follows f JOIN users u ON u.id=f.following_id
       WHERE f.follower_id=$1`,
      [req.params.id, req.user.id]
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch following', 500);
  }
});

module.exports = router;
