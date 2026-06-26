const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// GET /api/pulse — live campus activity summary
router.get('/', auth, async (req, res) => {
  try {
    const [
      activeUsers,
      locationBusy,
      recentPosts,
      studyGroups,
      upcomingEvents,
    ] = await Promise.all([
      // Users active in last 15 mins
      db.query(
        `SELECT campus_status, COUNT(*)::int AS count
         FROM users
         WHERE last_seen > NOW()-INTERVAL '15 minutes' AND campus_status != 'free'
         GROUP BY campus_status`
      ),
      // Top busy locations (check-ins last hour)
      db.query(
        `SELECT l.id, l.name, l.code, l.category, l.lat, l.lng,
                COUNT(ci.id)::int AS active_count
         FROM locations l
         JOIN checkins ci ON ci.location_id=l.id
         WHERE ci.checked_in_at > NOW()-INTERVAL '1 hour'
         GROUP BY l.id
         ORDER BY active_count DESC LIMIT 5`
      ),
      // Posts in last hour
      db.query(`SELECT COUNT(*)::int AS count FROM posts WHERE created_at > NOW()-INTERVAL '1 hour'`),
      // Open study groups
      db.query(`SELECT COUNT(*)::int AS count FROM study_groups WHERE scheduled_at > NOW()`),
      // Events starting soon (next 24h)
      db.query(
        `SELECT id, title, start_time, banner_url,
                (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=e.id AND status='going') AS going_count
         FROM events e
         WHERE start_time BETWEEN NOW() AND NOW()+INTERVAL '24 hours'
         ORDER BY start_time ASC LIMIT 3`
      ),
    ]);

    // Build campus status summary
    const statusMap = {};
    for (const row of activeUsers.rows) {
      statusMap[row.campus_status] = row.count;
    }
    const totalActive = Object.values(statusMap).reduce((a, b) => a + b, 0);

    ok(res, {
      active_users: totalActive,
      status_breakdown: statusMap,
      busy_locations: locationBusy.rows,
      posts_last_hour: recentPosts.rows[0].count,
      open_study_groups: studyGroups.rows[0].count,
      upcoming_events: upcomingEvents.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    fail(res, 'Failed to fetch campus pulse', 500);
  }
});

module.exports = router;
