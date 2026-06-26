const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// GET /api/map/locations
router.get('/locations', auth, async (req, res) => {
  try {
    const { category, campus } = req.query;
    const params = [];
    const conditions = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (campus) {
      params.push(campus);
      conditions.push(`campus = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT id, name, code, category, campus, lat, lng, description, image_url, floor_info
       FROM locations ${where} ORDER BY category, name`,
      params
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch locations', 500);
  }
});

// GET /api/map/locations/:id
router.get('/locations/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT l.*,
              (SELECT COUNT(*)::int FROM checkins
               WHERE location_id=l.id AND checked_in_at > NOW()-INTERVAL '1 hour') AS live_count,
              (SELECT jsonb_agg(jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url))
               FROM checkins ci JOIN users u ON u.id=ci.user_id
               WHERE ci.location_id=l.id AND ci.checked_in_at > NOW()-INTERVAL '1 hour'
               LIMIT 10) AS live_users
       FROM locations l WHERE l.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return fail(res, 'Location not found', 404);
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to fetch location', 500);
  }
});

// POST /api/map/checkin
router.post('/checkin', auth, async (req, res) => {
  try {
    const { location_id } = req.body;
    if (!location_id) return fail(res, 'location_id required');

    const loc = await db.query('SELECT id, name FROM locations WHERE id=$1', [location_id]);
    if (!loc.rows.length) return fail(res, 'Location not found', 404);

    const { rows } = await db.query(
      `INSERT INTO checkins (user_id,location_id) VALUES ($1,$2) RETURNING *`,
      [req.user.id, location_id]
    );

    // Update campus status
    await db.query(
      `UPDATE users SET campus_status='studying', status_expires_at=NOW()+INTERVAL '2 hours' WHERE id=$1`,
      [req.user.id]
    );

    ok(res, { checkin: rows[0], location: loc.rows[0] });
  } catch (err) {
    fail(res, 'Failed to check in', 500);
  }
});

// GET /api/map/checkins/live — live occupancy per location
router.get('/checkins/live', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT l.id, l.name, l.code, l.category, l.campus, l.lat, l.lng,
              COUNT(ci.id)::int AS live_count,
              jsonb_agg(jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url)) FILTER (WHERE u.id IS NOT NULL) AS live_users
       FROM locations l
       LEFT JOIN checkins ci ON ci.location_id=l.id AND ci.checked_in_at > NOW()-INTERVAL '1 hour'
       LEFT JOIN users u ON u.id=ci.user_id
       GROUP BY l.id
       ORDER BY live_count DESC`
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch live checkins', 500);
  }
});

module.exports = router;
