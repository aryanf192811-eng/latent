const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');
const db = require('../config/db');

module.exports = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return fail(res, 'Authentication required', 401);
  try {
    req.user = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    // Update last_seen in background (non-blocking)
    db.query('UPDATE users SET last_seen=NOW() WHERE id=$1', [req.user.id]).catch(() => {});
    next();
  } catch {
    return fail(res, 'Invalid or expired token', 401);
  }
};
