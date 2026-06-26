const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, enrollment_no, department, year, hostel_type } = req.body;
    if (!name || !email || !password) return fail(res, 'name, email and password are required');

    const exists = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return fail(res, 'Email already registered');

    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      `INSERT INTO users (name,email,enrollment_no,password_hash,department,year,hostel_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,email,department,year,avatar_url,onboarding_complete`,
      [name, email, enrollment_no || null, password_hash, department || null, year || null, hostel_type || 'hosteler']
    );
    const user = rows[0];
    // Create wallet
    await db.query('INSERT INTO mess_wallet (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    ok(res, { token, user });
  } catch (err) {
    console.error(err);
    fail(res, 'Registration failed: ' + err.message, 500);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email || req.body.identifier;
    const password = req.body.password;
    if (!email || !password) return fail(res, 'Email and password required');

    const { rows } = await db.query(
      `SELECT id,name,email,password_hash,department,year,avatar_url,
              onboarding_complete,campus_status,hostel_type,bio,enrollment_no
       FROM users WHERE email=$1`, [email]
    );
    if (!rows.length) return fail(res, 'Invalid email or password', 401);

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return fail(res, 'Invalid email or password', 401);

    const { password_hash, ...userOut } = user;
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Fetch interests
    const interests = await db.query('SELECT interest FROM user_interests WHERE user_id=$1', [user.id]);
    userOut.interests = interests.rows.map(r => r.interest);

    await db.query('UPDATE users SET last_seen=NOW() WHERE id=$1', [user.id]);
    ok(res, { token, user: userOut });
  } catch (err) {
    console.error(err);
    fail(res, 'Login failed: ' + err.message, 500);
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id,u.name,u.email,u.enrollment_no,u.department,u.year,u.bio,
              u.avatar_url,u.campus_status,u.hostel_type,u.onboarding_complete,
              u.default_mess_id,u.last_seen,u.created_at,
              (SELECT COUNT(*)::int FROM follows WHERE following_id=u.id) AS followers_count,
              (SELECT COUNT(*)::int FROM follows WHERE follower_id=u.id) AS following_count
       FROM users u WHERE u.id=$1`, [req.user.id]
    );
    if (!rows.length) return fail(res, 'User not found', 404);
    const user = rows[0];
    const interests = await db.query('SELECT interest FROM user_interests WHERE user_id=$1', [req.user.id]);
    user.interests = interests.rows.map(r => r.interest);
    ok(res, user);
  } catch (err) {
    fail(res, 'Failed to fetch profile', 500);
  }
});

// POST /api/auth/onboard
router.post('/onboard', auth, async (req, res) => {
  try {
    const { department, year, hostel_type, bio, interests, default_mess_id } = req.body;
    await db.query(
      `UPDATE users SET department=$1,year=$2,hostel_type=$3,bio=$4,
       default_mess_id=$5,onboarding_complete=TRUE WHERE id=$6`,
      [department, year, hostel_type || 'hosteler', bio, default_mess_id || null, req.user.id]
    );
    if (interests?.length) {
      await db.query('DELETE FROM user_interests WHERE user_id=$1', [req.user.id]);
      for (const interest of interests) {
        await db.query('INSERT INTO user_interests (user_id,interest) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, interest]);
      }
    }
    const { rows } = await db.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Onboarding failed', 500);
  }
});

// POST /api/auth/refresh-token
router.post('/refresh-token', auth, async (req, res) => {
  try {
    const token = jwt.sign({ id: req.user.id, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    ok(res, { token });
  } catch (err) {
    fail(res, 'Failed to refresh token', 500);
  }
});

module.exports = router;
