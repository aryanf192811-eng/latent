const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail, paged } = require('../utils/response');

// GET /api/market
router.get('/', auth, async (req, res) => {
  try {
    const { category, status = 'available', page = 1, limit = 20, q } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (category) {
      params.push(category);
      conditions.push(`ml.category = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`ml.status = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`ml.title ILIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);
    params.push(offset);

    const { rows } = await db.query(
      `SELECT ml.id, ml.title, ml.description, ml.category, ml.condition, ml.price,
              ml.image_urls, ml.status, ml.created_at,
              jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url,'department',u.department) AS seller
       FROM market_listings ml JOIN users u ON u.id=ml.user_id
       ${where}
       ORDER BY ml.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countResult = await db.query(
      `SELECT COUNT(*)::int FROM market_listings ml ${where}`,
      params.slice(0, params.length - 2)
    );
    paged(res, rows, countResult.rows[0].count, page, limit);
  } catch (err) {
    fail(res, 'Failed to fetch market listings', 500);
  }
});

// POST /api/market
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, condition, price, image_urls = [] } = req.body;
    if (!title || !category || price === undefined) return fail(res, 'title, category, price required');

    const { rows } = await db.query(
      `INSERT INTO market_listings (user_id,title,description,category,condition,price,image_urls)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, title, description, category, condition, price, JSON.stringify(image_urls)]
    );
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to create listing', 500);
  }
});

// GET /api/market/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ml.*, jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url,'department',u.department) AS seller
       FROM market_listings ml JOIN users u ON u.id=ml.user_id WHERE ml.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return fail(res, 'Listing not found', 404);
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to fetch listing', 500);
  }
});

// PUT /api/market/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT user_id FROM market_listings WHERE id=$1', [req.params.id]);
    if (!rows.length) return fail(res, 'Listing not found', 404);
    if (rows[0].user_id !== req.user.id) return fail(res, 'Unauthorized', 403);

    const { title, description, category, condition, price, image_urls, status } = req.body;
    await db.query(
      `UPDATE market_listings SET
        title=COALESCE($1,title), description=COALESCE($2,description),
        category=COALESCE($3,category), condition=COALESCE($4,condition),
        price=COALESCE($5,price), image_urls=COALESCE($6,image_urls), status=COALESCE($7,status)
       WHERE id=$8`,
      [title, description, category, condition, price,
       image_urls ? JSON.stringify(image_urls) : null, status, req.params.id]
    );
    const updated = await db.query('SELECT * FROM market_listings WHERE id=$1', [req.params.id]);
    ok(res, updated.rows[0]);
  } catch (err) {
    fail(res, 'Failed to update listing', 500);
  }
});

// PATCH /api/market/:id/mark-sold
router.patch('/:id/mark-sold', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT user_id FROM market_listings WHERE id=$1', [req.params.id]);
    if (!rows.length) return fail(res, 'Listing not found', 404);
    if (rows[0].user_id !== req.user.id) return fail(res, 'Unauthorized', 403);
    await db.query(`UPDATE market_listings SET status='sold' WHERE id=$1`, [req.params.id]);
    const updated = await db.query('SELECT * FROM market_listings WHERE id=$1', [req.params.id]);
    ok(res, updated.rows[0]);
  } catch (err) {
    fail(res, 'Failed to mark as sold', 500);
  }
});

// DELETE /api/market/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT user_id FROM market_listings WHERE id=$1', [req.params.id]);
    if (!rows.length) return fail(res, 'Listing not found', 404);
    if (rows[0].user_id !== req.user.id) return fail(res, 'Unauthorized', 403);
    await db.query('DELETE FROM market_listings WHERE id=$1', [req.params.id]);
    ok(res, { deleted: true });
  } catch (err) {
    fail(res, 'Failed to delete listing', 500);
  }
});

module.exports = router;
