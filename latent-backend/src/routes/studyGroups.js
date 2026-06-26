const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail, paged } = require('../utils/response');

// GET /api/study-groups
router.get('/', auth, async (req, res) => {
  try {
    const { subject, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    // Build query without mixing userId param with filter params
    let whereClause = '';
    let countWhereClause = '';
    let subjectParam = null;

    if (subject) {
      subjectParam = `%${subject}%`;
      // userId = $1, subject = $2, limit = $3, offset = $4
      whereClause = `WHERE sg.subject ILIKE $2`;
      countWhereClause = `WHERE sg.subject ILIKE $1`;
    }

    const queryParams = subjectParam
      ? [userId, subjectParam, parseInt(limit), parseInt(offset)]
      : [userId, parseInt(limit), parseInt(offset)];

    const limitPlaceholder = subjectParam ? '$3' : '$2';
    const offsetPlaceholder = subjectParam ? '$4' : '$3';

    const { rows } = await db.query(
      `SELECT sg.id, sg.name, sg.subject, sg.location_text, sg.scheduled_at, sg.max_members, sg.created_at,
              jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url) AS creator,
              (SELECT COUNT(*)::int FROM study_group_members WHERE group_id=sg.id) AS member_count,
              EXISTS(SELECT 1 FROM study_group_members WHERE group_id=sg.id AND user_id=$1) AS is_member
       FROM study_groups sg JOIN users u ON u.id=sg.creator_id
       ${whereClause}
       ORDER BY sg.scheduled_at ASC NULLS LAST
       LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
      queryParams
    );

    const countResult = await db.query(
      `SELECT COUNT(*)::int FROM study_groups sg ${countWhereClause}`,
      subjectParam ? [subjectParam] : []
    );
    paged(res, rows, countResult.rows[0].count, page, limit);
  } catch (err) {
    console.error(err);
    fail(res, 'Failed to fetch study groups', 500);
  }
});

// POST /api/study-groups
router.post('/', auth, async (req, res) => {
  try {
    const { subject, name, location_text, scheduled_at, max_members = 6 } = req.body;
    if (!subject) return fail(res, 'subject required');

    const { rows } = await db.query(
      `INSERT INTO study_groups (subject,name,creator_id,location_text,scheduled_at,max_members)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [subject, name || `${subject} Group`, req.user.id, location_text, scheduled_at || null, max_members]
    );
    const gid = rows[0].id;
    await db.query('INSERT INTO study_group_members (group_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [gid, req.user.id]);
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to create study group', 500);
  }
});

// GET /api/study-groups/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT sg.*, 
              jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url) AS creator,
              (SELECT jsonb_agg(jsonb_build_object('id',mu.id,'name',mu.name,'avatar_url',mu.avatar_url,'department',mu.department))
               FROM study_group_members sgm JOIN users mu ON mu.id=sgm.user_id
               WHERE sgm.group_id=sg.id) AS members,
              EXISTS(SELECT 1 FROM study_group_members WHERE group_id=sg.id AND user_id=$2) AS is_member
       FROM study_groups sg JOIN users u ON u.id=sg.creator_id
       WHERE sg.id=$1`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return fail(res, 'Study group not found', 404);
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to fetch study group', 500);
  }
});

// POST /api/study-groups/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    // Check capacity
    const group = await db.query('SELECT max_members FROM study_groups WHERE id=$1', [req.params.id]);
    if (!group.rows.length) return fail(res, 'Study group not found', 404);

    const count = await db.query('SELECT COUNT(*) FROM study_group_members WHERE group_id=$1', [req.params.id]);
    if (parseInt(count.rows[0].count) >= group.rows[0].max_members) {
      return fail(res, 'Study group is full');
    }

    await db.query(
      'INSERT INTO study_group_members (group_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, req.user.id]
    );
    ok(res, { joined: true });
  } catch (err) {
    fail(res, 'Failed to join study group', 500);
  }
});

// DELETE /api/study-groups/:id/leave
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM study_group_members WHERE group_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    ok(res, { joined: false });
  } catch (err) {
    fail(res, 'Failed to leave study group', 500);
  }
});

module.exports = router;
