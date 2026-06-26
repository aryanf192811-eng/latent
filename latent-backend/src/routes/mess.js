const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

// Meal prices
const MEAL_PRICES = { breakfast: 60, lunch: 100, dinner: 80 };

// GET /api/mess/messes
router.get('/messes', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*, l.name AS location_name, l.lat, l.lng
       FROM messes m LEFT JOIN locations l ON l.id=m.location_id
       WHERE m.is_active=TRUE ORDER BY m.name`
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch messes', 500);
  }
});

// GET /api/mess/today
router.get('/today', auth, async (req, res) => {
  try {
    const { rows: userRows } = await db.query('SELECT default_mess_id FROM users WHERE id=$1', [req.user.id]);
    const defaultMessId = userRows[0]?.default_mess_id;
    if (!defaultMessId) return fail(res, 'No default mess selected');

    const { rows: messRows } = await db.query('SELECT * FROM messes WHERE id=$1', [defaultMessId]);
    if (!messRows.length) return fail(res, 'Mess not found');
    const mess = messRows[0];

    // Today is roughly day 0 for simplicity (or we could use JS Date.getDay() 0-6 where 0=Sunday)
    const dayOfWeek = new Date().getDay();
    const { rows: menuRows } = await db.query(
      'SELECT meal_type, items FROM mess_menu WHERE mess_id=$1 AND day_of_week=$2',
      [defaultMessId, dayOfWeek]
    );

    const todayMenu = {};
    menuRows.forEach(row => {
      todayMenu[row.meal_type] = row.items;
    });

    ok(res, { mess, today: todayMenu });
  } catch (err) {
    console.error(err);
    fail(res, 'Failed to fetch today mess', 500);
  }
});

// GET /api/mess/menu/:messId
router.get('/menu/:messId', auth, async (req, res) => {
  try {
    const { day } = req.query;
    const params = [req.params.messId];
    let extra = '';
    if (day !== undefined) {
      params.push(day);
      extra = ` AND day_of_week=$2`;
    }
    const { rows } = await db.query(
      `SELECT day_of_week, meal_type, items FROM mess_menu
       WHERE mess_id=$1${extra} ORDER BY day_of_week, meal_type`,
      params
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch menu', 500);
  }
});

// GET /api/mess/wallet
router.get('/wallet', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT balance, updated_at FROM mess_wallet WHERE user_id=$1',
      [req.user.id]
    );
    const wallet = rows[0] || { balance: 0 };
    const txns = await db.query(
      `SELECT type, amount, description, balance_after, created_at
       FROM wallet_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    );
    ok(res, { ...wallet, transactions: txns.rows });
  } catch (err) {
    fail(res, 'Failed to fetch wallet', 500);
  }
});

// POST /api/mess/order — create order (Razorpay or wallet)
router.post('/order', auth, async (req, res) => {
  try {
    const { mess_id, meal_type, meal_date, persons = 1, payment_method = 'wallet' } = req.body;
    if (!mess_id || !meal_type || !meal_date) return fail(res, 'mess_id, meal_type, meal_date required');

    const price = MEAL_PRICES[meal_type];
    if (!price) return fail(res, 'Invalid meal_type');
    const amount = price * persons;

    if (payment_method === 'wallet') {
      // Debit from wallet
      const wallet = await db.query('SELECT balance FROM mess_wallet WHERE user_id=$1 FOR UPDATE', [req.user.id]);
      if (!wallet.rows.length || wallet.rows[0].balance < amount) {
        return fail(res, 'Insufficient wallet balance');
      }
      const newBalance = parseFloat(wallet.rows[0].balance) - amount;

      await db.query('UPDATE mess_wallet SET balance=$1, updated_at=NOW() WHERE user_id=$2', [newBalance, req.user.id]);

      const { rows: orderRows } = await db.query(
        `INSERT INTO mess_orders (user_id,mess_id,meal_type,meal_date,persons,amount,status)
         VALUES ($1,$2,$3,$4,$5,$6,'paid') RETURNING id`,
        [req.user.id, mess_id, meal_type, meal_date, persons, amount]
      );
      const orderId = orderRows[0].id;

      await db.query(
        `INSERT INTO wallet_transactions (user_id,type,amount,description,ref_id,balance_after)
         VALUES ($1,'debit',$2,$3,$4,$5)`,
        [req.user.id, amount, `${meal_type} at mess #${mess_id}`, orderId, newBalance]
      );

      // Generate coupon
      const ticketId = `LT-${uuidv4().slice(0, 8).toUpperCase()}`;
      const qrData = JSON.stringify({ ticket_id: ticketId, meal_type, meal_date, persons, mess_id });
      const { rows: couponRows } = await db.query(
        `INSERT INTO mess_coupons (ticket_id,user_id,mess_id,order_id,meal_type,persons,amount,meal_date,qr_data,payment_method,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'wallet','active') RETURNING *`,
        [ticketId, req.user.id, mess_id, orderId, meal_type, persons, amount, meal_date, qrData]
      );

      return ok(res, { coupon: couponRows[0], wallet_balance: newBalance });
    }

    // Razorpay flow
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const rpOrder = await razorpay.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: `mess_${Date.now()}`,
      });
      const { rows: orderRows } = await db.query(
        `INSERT INTO mess_orders (user_id,mess_id,meal_type,meal_date,persons,amount,razorpay_order_id,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING id`,
        [req.user.id, mess_id, meal_type, meal_date, persons, amount, rpOrder.id]
      );
      ok(res, { razorpay_order: rpOrder, order_id: orderRows[0].id });
    } catch {
      fail(res, 'Payment gateway unavailable. Use wallet payment.', 503);
    }
  } catch (err) {
    console.error(err);
    fail(res, 'Failed to create order', 500);
  }
});

// POST /api/mess/order/:orderId/verify — verify Razorpay payment
router.post('/order/:orderId/verify', auth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const { rows } = await db.query(
      'SELECT * FROM mess_orders WHERE id=$1 AND user_id=$2', [req.params.orderId, req.user.id]
    );
    if (!rows.length) return fail(res, 'Order not found', 404);
    const order = rows[0];

    // Verify signature
    const crypto = require('crypto');
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return fail(res, 'Invalid payment signature', 400);
    }

    // Mark as paid
    await db.query('UPDATE mess_orders SET status=\'paid\' WHERE id=$1', [order.id]);

    // Generate coupon
    const ticketId = `LT-${uuidv4().slice(0, 8).toUpperCase()}`;
    const qrData = JSON.stringify({ ticket_id: ticketId, meal_type: order.meal_type, meal_date: order.meal_date, persons: order.persons, mess_id: order.mess_id });
    const { rows: couponRows } = await db.query(
      `INSERT INTO mess_coupons (ticket_id,user_id,mess_id,order_id,meal_type,persons,amount,meal_date,qr_data,payment_method,razorpay_payment_id,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'razorpay',$10,'active') RETURNING *`,
      [ticketId, req.user.id, order.mess_id, order.id, order.meal_type, order.persons, order.amount, order.meal_date, qrData, razorpay_payment_id]
    );
    ok(res, { coupon: couponRows[0] });
  } catch (err) {
    fail(res, 'Payment verification failed', 500);
  }
});

// GET /api/mess/coupons — active coupons
router.get('/coupons', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT mc.*, m.name AS mess_name
       FROM mess_coupons mc JOIN messes m ON m.id=mc.mess_id
       WHERE mc.user_id=$1 AND mc.status='active'
       ORDER BY mc.meal_date DESC`,
      [req.user.id]
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch coupons', 500);
  }
});

// GET /api/mess/history — order history
router.get('/history', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT mo.id, mo.meal_type, mo.meal_date, mo.amount, mo.status, mo.created_at,
              m.name AS mess_name,
              mc.ticket_id, mc.status AS coupon_status
       FROM mess_orders mo
       JOIN messes m ON m.id=mo.mess_id
       LEFT JOIN mess_coupons mc ON mc.order_id=mo.id
       WHERE mo.user_id=$1
       ORDER BY mo.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch history', 500);
  }
});

module.exports = router;
