const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail, paged } = require('../utils/response');

const REACTION_COUNTS_SQL = `
  jsonb_build_object(
    'fire',   COUNT(CASE WHEN pr.reaction_type='fire'   THEN 1 END),
    'heart',  COUNT(CASE WHEN pr.reaction_type='heart'  THEN 1 END),
    'laugh',  COUNT(CASE WHEN pr.reaction_type='laugh'  THEN 1 END),
    'clap',   COUNT(CASE WHEN pr.reaction_type='clap'   THEN 1 END),
    'wow',    COUNT(CASE WHEN pr.reaction_type='wow'    THEN 1 END)
  )`;

function buildPostQuery(filter) {
  return `
    SELECT
      p.id, p.user_id, p.content, p.image_urls, p.post_type, p.is_anonymous,
      p.ref_id, p.ref_type, p.created_at,
      CASE WHEN p.is_anonymous THEN NULL ELSE
        jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url,
          'department',u.department,'year',u.year)
      END AS "user",
      ${REACTION_COUNTS_SQL} AS reaction_counts,
      (SELECT reaction_type FROM post_reactions WHERE post_id=p.id AND user_id=$1) AS user_reaction,
      (SELECT COUNT(*)::int FROM comments WHERE post_id=p.id) AS comment_count,
      EXISTS(SELECT 1 FROM saved_posts WHERE post_id=p.id AND user_id=$1) AS is_saved,
      CASE WHEN p.post_type='poll' THEN (
        SELECT jsonb_build_object(
          'id', pl.id, 'question', pl.question, 'ends_at', pl.ends_at,
          'is_ended', pl.ends_at < NOW(),
          'total_votes', (SELECT COUNT(*)::int FROM poll_votes WHERE poll_id=pl.id),
          'user_vote_option_id', (SELECT option_id FROM poll_votes WHERE poll_id=pl.id AND user_id=$1),
          'options', (
            SELECT jsonb_agg(jsonb_build_object(
              'id', po.id, 'option_text', po.option_text,
              'votes', (SELECT COUNT(*)::int FROM poll_votes WHERE option_id=po.id),
              'percentage', CASE WHEN (SELECT COUNT(*) FROM poll_votes WHERE poll_id=pl.id)=0 THEN 0
                ELSE ROUND((SELECT COUNT(*)::numeric FROM poll_votes WHERE option_id=po.id) /
                           (SELECT COUNT(*) FROM poll_votes WHERE poll_id=pl.id) * 100)
              END
            ) ORDER BY po.position)
            FROM poll_options po WHERE po.poll_id=pl.id
          )
        ) FROM polls pl WHERE pl.post_id=p.id
      ) ELSE NULL END AS poll
    FROM posts p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN post_reactions pr ON pr.post_id = p.id
    WHERE ${filter}
    GROUP BY p.id, u.id
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3`;
}

// GET /api/posts — feed with tabs
router.get('/', auth, async (req, res) => {
  try {
    const { tab = 'for_you', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    const filters = {
      for_you: `(p.user_id IN (SELECT following_id FROM follows WHERE follower_id=$1) OR p.user_id = $1 OR (SELECT department FROM users WHERE id=p.user_id) = (SELECT department FROM users WHERE id=$1))`,
      following: `p.user_id IN (SELECT following_id FROM follows WHERE follower_id=$1)`,
      department: `(SELECT department FROM users WHERE id=p.user_id) = (SELECT department FROM users WHERE id=$1)`,
      trending: `(SELECT COUNT(*) FROM post_reactions WHERE post_id=p.id AND created_at>NOW()-INTERVAL '24h')>2`,
      clubs: `p.user_id IN (SELECT cm.user_id FROM club_members cm WHERE cm.club_id IN (SELECT club_id FROM club_members WHERE user_id=$1))`,
      confessions: `p.is_anonymous = TRUE`,
    };

    const filter = filters[tab] || filters.for_you;
    const query = buildPostQuery(filter);
    const countFilter = filter.replace(/\$1/g, '$1');

    const [postsResult, countResult] = await Promise.all([
      db.query(query, [userId, limit, offset]),
      db.query(`SELECT COUNT(*)::int FROM posts p WHERE ${countFilter}`, countFilter.includes('$1') ? [userId] : []),
    ]);

    paged(res, postsResult.rows, countResult.rows[0].count, page, limit);
  } catch (err) {
    console.error(err);
    fail(res, 'Failed to fetch posts', 500);
  }
});

// POST /api/posts
router.post('/', auth, async (req, res) => {
  try {
    const { content, image_urls = [], post_type = 'general', is_anonymous = false } = req.body;
    if (!content && !image_urls.length) return fail(res, 'content or image_urls required');

    const { rows } = await db.query(
      `INSERT INTO posts (user_id,content,image_urls,post_type,is_anonymous)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, content, JSON.stringify(image_urls), post_type, is_anonymous]
    );
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to create post', 500);
  }
});

// GET /api/posts/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const query = buildPostQuery('p.id=$1');
    // Adjust param positions: $1=postId, $2=userId, $3=1, $4=0
    const q = query.replace('$2', '$2').replace('$3', '1').replace('$4', '0');
    const { rows } = await db.query(
      `SELECT
        p.id, p.user_id, p.content, p.image_urls, p.post_type, p.is_anonymous, p.ref_id, p.ref_type, p.created_at,
        CASE WHEN p.is_anonymous THEN NULL ELSE
          jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url,'department',u.department,'year',u.year)
        END AS "user",
        ${REACTION_COUNTS_SQL} AS reaction_counts,
        (SELECT reaction_type FROM post_reactions WHERE post_id=p.id AND user_id=$2) AS user_reaction,
        (SELECT COUNT(*)::int FROM comments WHERE post_id=p.id) AS comment_count,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id=p.id AND user_id=$2) AS is_saved
       FROM posts p
       LEFT JOIN users u ON u.id=p.user_id
       LEFT JOIN post_reactions pr ON pr.post_id=p.id
       WHERE p.id=$1
       GROUP BY p.id, u.id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return fail(res, 'Post not found', 404);
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to fetch post', 500);
  }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT user_id FROM posts WHERE id=$1', [req.params.id]);
    if (!rows.length) return fail(res, 'Post not found', 404);
    if (rows[0].user_id !== req.user.id) return fail(res, 'Unauthorized', 403);
    await db.query('DELETE FROM posts WHERE id=$1', [req.params.id]);
    ok(res, { message: 'Post deleted' });
  } catch (err) {
    fail(res, 'Failed to delete post', 500);
  }
});

// POST /api/posts/:id/react
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { reaction_type } = req.body;
    const valid = ['fire','heart','laugh','clap','wow'];
    if (!valid.includes(reaction_type)) return fail(res, 'Invalid reaction type');

    // Check if already reacted
    const existing = await db.query(
      'SELECT reaction_type FROM post_reactions WHERE post_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );

    if (existing.rows.length) {
      if (existing.rows[0].reaction_type === reaction_type) {
        // Remove reaction (toggle off)
        await db.query('DELETE FROM post_reactions WHERE post_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
        return ok(res, { action: 'removed' });
      } else {
        // Update reaction
        await db.query(
          'UPDATE post_reactions SET reaction_type=$1 WHERE post_id=$2 AND user_id=$3',
          [reaction_type, req.params.id, req.user.id]
        );
        return ok(res, { action: 'updated', reaction_type });
      }
    }

    await db.query(
      'INSERT INTO post_reactions (user_id,post_id,reaction_type) VALUES ($1,$2,$3)',
      [req.user.id, req.params.id, reaction_type]
    );
    ok(res, { action: 'added', reaction_type });
  } catch (err) {
    fail(res, 'Failed to react', 500);
  }
});

// GET /api/posts/:id/comments
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.content, c.created_at,
              jsonb_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url) AS "user"
       FROM comments c JOIN users u ON u.id=c.user_id
       WHERE c.post_id=$1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    ok(res, rows);
  } catch (err) {
    fail(res, 'Failed to fetch comments', 500);
  }
});

// POST /api/posts/:id/comments
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return fail(res, 'content required');
    const { rows } = await db.query(
      `INSERT INTO comments (user_id,post_id,content) VALUES ($1,$2,$3)
       RETURNING id,content,created_at`,
      [req.user.id, req.params.id, content]
    );
    ok(res, rows[0]);
  } catch (err) {
    fail(res, 'Failed to add comment', 500);
  }
});

// POST /api/posts/:id/save
router.post('/:id/save', auth, async (req, res) => {
  try {
    const existing = await db.query(
      'SELECT 1 FROM saved_posts WHERE post_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (existing.rows.length) {
      await db.query('DELETE FROM saved_posts WHERE post_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
      return ok(res, { saved: false });
    }
    await db.query('INSERT INTO saved_posts (user_id,post_id) VALUES ($1,$2)', [req.user.id, req.params.id]);
    ok(res, { saved: true });
  } catch (err) {
    fail(res, 'Failed to save post', 500);
  }
});

// POST /api/posts/:id/poll/vote
router.post('/:id/poll/vote', auth, async (req, res) => {
  try {
    const { option_id } = req.body;
    const poll = await db.query('SELECT id FROM polls WHERE post_id=$1', [req.params.id]);
    if (!poll.rows.length) return fail(res, 'No poll for this post', 404);
    const pollId = poll.rows[0].id;

    const existing = await db.query('SELECT id FROM poll_votes WHERE poll_id=$1 AND user_id=$2', [pollId, req.user.id]);
    if (existing.rows.length) {
      await db.query('UPDATE poll_votes SET option_id=$1 WHERE poll_id=$2 AND user_id=$3', [option_id, pollId, req.user.id]);
    } else {
      await db.query('INSERT INTO poll_votes (user_id,poll_id,option_id) VALUES ($1,$2,$3)', [req.user.id, pollId, option_id]);
    }
    ok(res, { voted: true, option_id });
  } catch (err) {
    fail(res, 'Failed to vote', 500);
  }
});

module.exports = router;
