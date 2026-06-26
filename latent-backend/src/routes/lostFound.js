const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail, paged } = require('../utils/response');

// GET /api/lost-found
router.get('/', auth, async (req, res) => {
  try {
    const { type, status = 'open', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (type) {
      params.push(type);
      conditions.push(`lf.type = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`lf.status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);
    params.push(offset);

    const { rows } = await db.query(
      `SELECT lf.id, lf.type, lf.title, lf.category, lf.description, lf.image_url,
              lf.location_hint, lf.status, lf.created_at, lf.resolved_at,
              jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url) AS "user"
       FROM lost_found lf JOIN users u ON u.id=lf.user_id
       ${where}
       ORDER BY lf.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countResult = await db.query(
      `SELECT COUNT(*)::int FROM lost_found lf ${where}`,
      params.slice(0, params.length - 2)
    );
    paged(res, rows, countResult.rows[0].count, page, limit);
  } catch (err) {
    fail(res, 'Failed to fetch lost & found', 500);
  }
});

// POST /api/lost-found
router.post('/', auth, async (req, res) => {
  try {
    const { type, title, category, description, image_url, location_hint } = req.body;
    if (!type || !title) return fail(res, 'type and title required');
    if (!['lost','found'].includes(type)) return fail(res, 'type must be lost or found');

    const { rows } = await db.query(
      `INSERT INTO lost_found (user_id,type,title,category,description,image_url,location_hint)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, type, title, category, description, image_url || '', location_hint]
    );
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to create listing', 500);
  }
});

// PUT /api/lost-found/:id/resolve
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT user_id FROM lost_found WHERE id=$1', [req.params.id]);
    if (!rows.length) return fail(res, 'Item not found', 404);
    if (rows[0].user_id !== req.user.id) return fail(res, 'Unauthorized', 403);

    await db.query(
      `UPDATE lost_found SET status='resolved', resolved_at=NOW() WHERE id=$1`,
      [req.params.id]
    );
    ok(res, { status: 'resolved' });
  } catch (err) {
    fail(res, 'Failed to resolve', 500);
  }
});

// DELETE /api/lost-found/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT user_id FROM lost_found WHERE id=$1', [req.params.id]);
    if (!rows.length) return fail(res, 'Item not found', 404);
    if (rows[0].user_id !== req.user.id) return fail(res, 'Unauthorized', 403);
    await db.query('DELETE FROM lost_found WHERE id=$1', [req.params.id]);
    ok(res, { deleted: true });
  } catch (err) {
    fail(res, 'Failed to delete', 500);
  }
});

module.exports = router;
