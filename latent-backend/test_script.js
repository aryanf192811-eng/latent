require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('./src/config/db');

async function testAll() {
  try {
    const { rows } = await db.query('SELECT * FROM users LIMIT 1');
    if (!rows.length) {
      console.error('No users found in DB');
      process.exit(1);
    }
    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log(`Testing with user: ${user.email}`);

    const BASE = 'http://localhost:5000';
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const tests = [
      { name: 'HEALTH', url: `${BASE}/api/health`, method: 'get' },
      { name: 'FEED', url: `${BASE}/api/posts?tab=for_you&page=1`, method: 'get' },
      { name: 'CREATE POST', url: `${BASE}/api/posts`, method: 'post', data: { content: 'Test post from engineer', post_type: 'general', is_anonymous: false } },
      { name: 'MY PROFILE', url: `${BASE}/api/users/${user.id}/profile`, method: 'get' },
      { name: 'MAP LOCATIONS', url: `${BASE}/api/map/locations`, method: 'get' },
      { name: 'MESS TODAY', url: `${BASE}/api/mess/today`, method: 'get' },
      { name: 'EVENTS', url: `${BASE}/api/events?page=1`, method: 'get' },
      { name: 'CLUBS', url: `${BASE}/api/clubs?page=1`, method: 'get' },
      { name: 'STUDY GROUPS', url: `${BASE}/api/study-groups?page=1`, method: 'get' },
      { name: 'CREATE STUDY GROUP', url: `${BASE}/api/study-groups`, method: 'post', data: { subject: 'GATE CS 2028', location_text: 'CV Raman Centre', max_members: 6 } },
      { name: 'SENIORS', url: `${BASE}/api/seniors?page=1`, method: 'get' },
      { name: 'LOST & FOUND', url: `${BASE}/api/lost-found?type=lost&status=open&page=1`, method: 'get' },
      { name: 'MARKET', url: `${BASE}/api/market?page=1`, method: 'get' },
      { name: 'WEATHER', url: `${BASE}/api/weather`, method: 'get' },
      { name: 'PULSE', url: `${BASE}/api/pulse`, method: 'get' },
      { name: 'NOTIFICATIONS', url: `${BASE}/api/notifications?page=1`, method: 'get' }
    ];

    for (const t of tests) {
      try {
        console.log(`\n=== ${t.name} ===`);
        const fetchOpts = { method: t.method, headers };
        if (t.data) fetchOpts.body = JSON.stringify(t.data);
        
        const res = await fetch(t.url, fetchOpts);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || res.statusText);
        
        console.log(`success: ${data.success}`);
        
        if (t.name === 'CREATE POST') {
           const pid = data.data.id;
           console.log(`Created Post ID: ${pid}`);
           console.log(`\n=== REACT TO POST ${pid} ===`);
           const reactRes = await fetch(`${BASE}/api/posts/${pid}/react`, { method: 'post', headers, body: JSON.stringify({ reaction_type: 'fire' }) });
           const reactData = await reactRes.json();
           console.log(`success: ${reactData.success}, action: ${reactData.data.action}`);
        }
      } catch (err) {
        console.error(`ERROR: ${err.message}`);
      }
    }
    console.log('\n=== ALL TESTS COMPLETE ===');

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

testAll();
