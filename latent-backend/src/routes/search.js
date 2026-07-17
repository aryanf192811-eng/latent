const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim() === '') {
      return res.json({ success: true, data: { users: [], clubs: [], events: [], studyGroups: [], market: [] } });
    }

    const searchTerm = `%${query.trim()}%`;

    const usersPromise = pool.query(`
      SELECT id, name, avatar_url, department
      FROM users
      WHERE name ILIKE $1 OR department ILIKE $1
      LIMIT 5
    `, [searchTerm]);

    const clubsPromise = pool.query(`
      SELECT id, name, category, logo_url
      FROM clubs
      WHERE name ILIKE $1 OR category ILIKE $1
      LIMIT 5
    `, [searchTerm]);

    const eventsPromise = pool.query(`
      SELECT id, title, start_time, banner_url
      FROM events
      WHERE title ILIKE $1
      LIMIT 5
    `, [searchTerm]);

    const studyGroupsPromise = pool.query(`
      SELECT id, name, subject
      FROM study_groups
      WHERE name ILIKE $1 OR subject ILIKE $1
      LIMIT 5
    `, [searchTerm]);

    const marketPromise = pool.query(`
      SELECT id, title, category, image_urls
      FROM market_listings
      WHERE title ILIKE $1 OR category ILIKE $1
      LIMIT 5
    `, [searchTerm]);

    const [usersRes, clubsRes, eventsRes, studyGroupsRes, marketRes] = await Promise.all([
      usersPromise, 
      clubsPromise, 
      eventsPromise,
      studyGroupsPromise,
      marketPromise
    ]);

    res.json({
      success: true,
      data: {
        users: usersRes.rows,
        clubs: clubsRes.rows,
        events: eventsRes.rows,
        studyGroups: studyGroupsRes.rows,
        market: marketRes.rows,
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Failed to perform search' });
  }
});

module.exports = router;
