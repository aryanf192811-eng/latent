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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return fail(res, 'Email is required');

    // Check if user exists
    const exists = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (!exists.rows.length) return fail(res, 'User not found', 404);

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Log to console as requested
    console.log(`\n======================================`);
    console.log(`🔐 OTP for ${email}: ${otp}`);
    console.log(`======================================\n`);

    // Invalidate existing OTPs for this email
    await db.query('UPDATE otp_tokens SET used=TRUE WHERE email=$1', [email]);

    // Insert new OTP with 10 mins expiry
    await db.query(
      `INSERT INTO otp_tokens (email, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
      [email, otp]
    );

    ok(res, { message: 'OTP sent successfully', otp });
  } catch (err) {
    console.error(err);
    fail(res, 'Failed to send OTP', 500);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return fail(res, 'Email and OTP are required');

    const { rows } = await db.query(
      `SELECT * FROM otp_tokens 
       WHERE email=$1 AND token=$2 AND used=FALSE AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (!rows.length) return fail(res, 'Invalid or expired OTP', 400);

    // Mark as used
    await db.query('UPDATE otp_tokens SET used=TRUE WHERE id=$1', [rows[0].id]);

    // Generate a reset token
    const reset_token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });

    ok(res, { reset_token });
  } catch (err) {
    console.error(err);
    fail(res, 'Failed to verify OTP', 500);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { reset_token, new_password } = req.body;
    if (!reset_token || !new_password) return fail(res, 'Token and new password required');

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
    } catch (e) {
      return fail(res, 'Invalid or expired reset token', 400);
    }

    const email = decoded.email;
    const password_hash = await bcrypt.hash(new_password, 12);

    await db.query('UPDATE users SET password_hash=$1 WHERE email=$2', [password_hash, email]);

    ok(res, { message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    fail(res, 'Failed to reset password', 500);
  }
});

module.exports = router;
