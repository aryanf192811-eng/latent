# LATENT — Senior Testing Engineer Prompt for Antigravity IDE
# Role: You are a senior full-stack testing engineer.
# Mission: Validate every endpoint, fix every dead button, protect all design.
# This is a pre-presentation production pass. Zero tolerance for broken features.

---

## PRIME DIRECTIVE

1. READ EVERYTHING FIRST before changing a single line
2. SNAPSHOT (git commit) before each fix batch
3. NEVER touch CSS classes, color variables, layout, typography, or component structure
4. Fix only JavaScript logic, API calls, route paths, and request/response parsing
5. If a button has no backend endpoint → add a "coming soon" toast with this exact pattern:
   `toast({ title: 'Coming Soon', description: 'Feature launching after presentation 🚀', variant: 'default' })`
6. Weather widget → implement fully (spec below)
7. Every fix must be verified with the browser agent before moving to the next

---

## STEP 0: ORIENTATION (do this before anything else)

```bash
# Run these in terminal and read every output carefully
ls -la                          # confirm you're at project root
ls latent-backend/src/routes/   # see all backend route files
ls latent-frontend/src/         # see frontend structure
cat latent-backend/.env         # read all env variables (especially OPENWEATHER_API_KEY)
cat latent-backend/src/app.js   # read ALL route mount paths
cat latent-frontend/src/lib/api.js   # read the axios base URL and interceptors
git log --oneline -5            # check recent commits
```

Then answer these before proceeding:
- What is the backend base URL? (usually http://localhost:5000)
- What is the exact route prefix for posts? (`/api/feed/posts` OR `/api/posts`)
- What is the profile route? (`/api/profile/:id` OR `/api/users/:id`)
- Is OPENWEATHER_API_KEY set in .env?

---

## STEP 1: CREATE BASELINE SNAPSHOT

```bash
cd [project-root]
git add -A
git commit -m "snapshot: baseline before testing-engineer pass"
git tag baseline-before-fix
echo "✅ Baseline snapshot created. Tag: baseline-before-fix"
```

---

## STEP 2: BUILD THE API MAP

### 2A — Scan all backend routes
```bash
# For each routes file, print its router definitions
grep -n "router\.\(get\|post\|put\|patch\|delete\)" latent-backend/src/routes/*.js \
  | awk -F: '{print $1, $3}' \
  | sort
```

Also read `latent-backend/src/app.js` to get all prefix mounts:
```bash
grep "app.use" latent-backend/src/app.js
```

Build a list like:
```
BACKEND ENDPOINTS:
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me
POST  /api/auth/onboarding
PATCH /api/auth/update-profile     ← note: NOT /api/users/me
POST  /api/auth/status
POST  /api/auth/forgot-password
POST  /api/auth/verify-otp
POST  /api/auth/reset-password
GET   /api/feed/posts              ← NOTE: /api/feed/posts, not /api/posts
POST  /api/feed/posts
...etc
```

### 2B — Scan all frontend API calls
```bash
grep -rn "api\.\(get\|post\|put\|patch\|delete\)\|axios\." \
  latent-frontend/src/ --include="*.jsx" --include="*.js" --include="*.ts" --include="*.tsx" \
  | grep -v "node_modules" \
  | sort
```

Also grep for hardcoded fetch calls:
```bash
grep -rn "fetch(" latent-frontend/src/ --include="*.jsx" --include="*.js"
```

### 2C — CRITICAL KNOWN MISALIGNMENT TO CHECK FIRST

The most common breaking mismatch in this codebase:

| Frontend calls           | Backend has                | Status        |
|--------------------------|---------------------------|---------------|
| `/api/posts`             | `/api/feed/posts`          | ❌ MISMATCH   |
| `/api/users/me`          | `/api/auth/update-profile` | ❌ MISMATCH   |
| `/api/users/:id/profile` | `/api/profile/:id`         | ⚠️ CHECK      |
| `/api/posts/:id/react`   | `/api/feed/posts/:id/react`| ❌ MISMATCH   |
| `/api/posts/:id/save`    | `/api/feed/posts/:id/save` | ❌ MISMATCH   |
| `/api/posts/:id/comments`| `/api/feed/posts/:id/comments`| ❌ MISMATCH|
| `/api/study-groups`      | check if exists            | ⚠️ CHECK      |

---

## STEP 3: FIX API MISALIGNMENTS

For each mismatch found, fix the FRONTEND call path. Do NOT rename backend routes.
The backend path is the source of truth.

### Fix pattern (example):
```js
// BEFORE (wrong)
const res = await api.get('/api/posts?filter=for_you');

// AFTER (correct — matches backend mount)
const res = await api.get('/api/feed/posts?filter=for_you');
```

### Files to fix (scan these specifically):
```
latent-frontend/src/pages/FeedPage.jsx (or Feed.jsx)
latent-frontend/src/pages/PostDetail.jsx
latent-frontend/src/hooks/usePosts.js (or useQuery hooks)
latent-frontend/src/pages/ProfilePage.jsx
latent-frontend/src/pages/EditProfile.jsx
latent-frontend/src/pages/MapPage.jsx
latent-frontend/src/pages/StudyGroupsPage.jsx
latent-frontend/src/services/api.js (or api.js / queryFns.js)
```

### After fixing routes — snapshot:
```bash
git add -A
git commit -m "fix: align all frontend API routes to match backend mount paths"
```

---

## STEP 4: VALIDATE EVERY ENDPOINT WITH CURL

Run each test. Note: replace TOKEN with a real JWT from login.

```bash
BASE="http://localhost:5000"

# Get a real token first
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email_or_enrollment":"aryan.shah@paruluniversity.ac.in","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

echo "Token acquired: ${TOKEN:0:20}..."

# Health check
echo "=== HEALTH ===" && curl -s $BASE/api/health | python3 -m json.tool

# Feed
echo "=== FEED ===" && curl -s "$BASE/api/feed/posts?filter=for_you&page=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('success:', d.get('success'))
items = d.get('data',{}).get('items',[])
print('posts returned:', len(items))
if items: print('first post keys:', list(items[0].keys()))
"

# Create post
echo "=== CREATE POST ===" && curl -s -X POST $BASE/api/feed/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test post from engineer","post_type":"general","is_anonymous":false}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('success:',d.get('success'), 'post_id:',d.get('data',{}).get('post',{}).get('id','ERROR'))"

# React to post (get first post ID first)
FIRST_POST_ID=$(curl -s "$BASE/api/feed/posts?filter=for_you&page=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
items=d.get('data',{}).get('items',[])
print(items[0]['id'] if items else 'NONE')")

echo "=== REACT TO POST $FIRST_POST_ID ===" && curl -s -X POST $BASE/api/feed/posts/$FIRST_POST_ID/react \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reaction_type":"fire"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('success:',d.get('success'))"

# Profile
echo "=== MY PROFILE ===" && curl -s $BASE/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
u=d.get('data',{}).get('user',{})
print('success:',d.get('success'), 'user:',u.get('name','ERROR'), 'id:',u.get('id','ERROR'))"

# Map locations
echo "=== MAP LOCATIONS ===" && curl -s $BASE/api/map/locations \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('success:',d.get('success'), 'count:',len(d.get('data',{}).get('items',[])))"

# Mess today
echo "=== MESS TODAY ===" && curl -s $BASE/api/mess/today \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('success:',d.get('success'))
if d.get('data'):
  print('mess:', d['data'].get('mess',{}).get('name','ERROR'))
  print('meals:', list(d['data'].get('today',{}).keys()))"

# Events
echo "=== EVENTS ===" && curl -s "$BASE/api/events?filter=all&page=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('success:',d.get('success'), 'count:',len(d.get('data',{}).get('items',[])))"

# Clubs
echo "=== CLUBS ===" && curl -s "$BASE/api/clubs?page=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('success:',d.get('success'), 'count:',len(d.get('data',{}).get('items',[])))"

# Study groups
echo "=== STUDY GROUPS ===" && curl -s "$BASE/api/study-groups?page=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('success:',d.get('success'), 'count:',len(d.get('data',{}).get('items',[])))"

# Create study group
echo "=== CREATE STUDY GROUP ===" && curl -s -X POST $BASE/api/study-groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"GATE CS 2028","location_text":"CV Raman Centre, Room 204","scheduled_at":"2024-07-10T18:00:00Z","max_members":6}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('success:',d.get('success'))"

# Seniors
echo "=== SENIORS ===" && curl -s "$BASE/api/seniors?page=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('success:',d.get('success'), 'count:',len(d.get('data',{}).get('items',[])))"

# Lost & Found
echo "=== LOST & FOUND ===" && curl -s "$BASE/api/lost-found?type=lost&status=open&page=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('success:',d.get('success'), 'count:',len(d.get('data',{}).get('items',[])))"

# Market
echo "=== MARKET ===" && curl -s "$BASE/api/market?page=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('success:',d.get('success'), 'count:',len(d.get('data',{}).get('items',[])))"

# Weather
echo "=== WEATHER ===" && curl -s $BASE/api/weather \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Pulse
echo "=== PULSE ===" && curl -s $BASE/api/pulse \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Notifications
echo "=== NOTIFICATIONS ===" && curl -s "$BASE/api/notifications?page=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('success:',d.get('success'), 'count:',len(d.get('data',{}).get('items',[])))"

echo "=== ALL CURL TESTS COMPLETE ==="
```

**For each FAILED test (non-200, success:false, or error):**
1. Read the exact error message
2. Check if it's a frontend path mismatch OR a backend bug
3. Fix at the correct layer
4. Re-run that specific curl test until it passes

---

## STEP 5: BUTTON AUDIT — Find and Fix Every Dead Button

### 5A — Scan for onClick handlers that do nothing
```bash
# Find buttons with empty handlers or TODO comments
grep -rn "onClick.*coming\|onClick.*todo\|onClick.*{}\|onClick.*undefined\|disabled\|Coming Soon" \
  latent-frontend/src/ --include="*.jsx" --include="*.tsx"

# Find buttons that call functions not yet implemented
grep -rn "onClick" latent-frontend/src/ --include="*.jsx" | grep -v "node_modules"
```

### 5B — Specific buttons to verify and fix

For each button below, check if it works end-to-end:

**FEED PAGE**
- [ ] "Post" button in composer → calls `POST /api/feed/posts` → post appears in feed
- [ ] Reaction buttons (🔥❤️😂👏⚡) → calls `POST /api/feed/posts/:id/react` → count updates optimistically
- [ ] "Save" button → calls `POST /api/feed/posts/:id/save`
- [ ] Poll vote → calls `POST /api/feed/polls/:id/vote`
- [ ] "Comments" → loads from `GET /api/feed/posts/:id/comments`
- [ ] Submit comment → calls `POST /api/feed/posts/:id/comments`
- [ ] Anonymous toggle → sets `is_anonymous: true` in post body
- [ ] Photo upload icon → file input triggers, `image_urls` populated

**MAP PAGE**
- [ ] "Check in here" → calls `POST /api/map/checkin { location_id }` → success toast
- [ ] Category filter pills → filters markers on map (client-side, no API needed)
- [ ] Location marker click → slides detail panel open

**MESS PAGE**
- [ ] "Book Now" (Breakfast/Lunch/Dinner) → opens booking modal
- [ ] Person count +/- → updates price
- [ ] "Pay from Wallet" → calls `POST /api/mess/book-wallet` → ticket generated
- [ ] "Pay with Razorpay" → calls `POST /api/mess/create-order` → Razorpay modal opens
- [ ] Mess selector (all 15 messes) → loads from `GET /api/mess/messes`
- [ ] "My Tickets" tab → calls `GET /api/mess/tickets?status=active`
- [ ] "This Week" tab → calls `GET /api/mess/menu?mess_id=X&day_of_week=X`

**EVENTS PAGE**
- [ ] "RSVP" button → calls `POST /api/events/:id/rsvp { status:'going' }`
- [ ] RSVP toggle (Going → remove) → calls `DELETE /api/events/:id/rsvp`
- [ ] Filter tabs (Today/This Week/My Clubs) → calls API with filter param
- [ ] "Upload Memory" (if event passed) → calls `POST /api/events/:id/memories`

**CLUBS PAGE**
- [ ] "Join" → calls `POST /api/clubs/:id/join`
- [ ] "Leave" (if joined) → calls `DELETE /api/clubs/:id/leave`
- [ ] Category filter → `GET /api/clubs?category=X`
- [ ] Club card click → navigates to `/clubs/:id`

**PEOPLE PAGE**
- [ ] "Follow" → calls `POST /api/users/:id/follow`
- [ ] "Following" (toggle) → calls `DELETE /api/users/:id/follow`
- [ ] Department filter → `GET /api/people?department=X`
- [ ] Year filter → `GET /api/people?year=X`
- [ ] "Free now" filter → `GET /api/people?status=free`

**PROFILE PAGE**
- [ ] Profile loads → calls `GET /api/profile/:id` OR `GET /api/users/:id/profile`
- [ ] Follow/Unfollow button → correct endpoint
- [ ] "Edit Profile" → navigates to edit page
- [ ] Tabs (Posts/Activity/Interests) → each loads data

**LOST & FOUND PAGE**
- [ ] "Report Item" → POST form with type/title/location works
- [ ] Lost/Found filter → filters correctly
- [ ] "Contact Poster" → navigates to profile page

**MARKET PAGE**
- [ ] "List Item" modal → calls `POST /api/market` (multipart)
- [ ] Category filter → `GET /api/market?category=X`
- [ ] "Contact Seller" → navigates to profile

**STUDY GROUPS PAGE**
- [ ] "Create Group" → calls `POST /api/study-groups` → group appears in list
- [ ] "Join" → calls `POST /api/study-groups/:id/join`
- [ ] "Leave" → calls `DELETE /api/study-groups/:id/leave`

**SENIORS PAGE**
- [ ] "Connect" → calls `POST /api/users/:id/follow`
- [ ] Department filter → `GET /api/seniors?department=X`
- [ ] "Become a Mentor" (if year >= 3) → calls `POST /api/seniors/opt-in`

**NOTIFICATIONS PAGE**
- [ ] "Mark all read" → calls `PATCH /api/notifications/read-all`
- [ ] Individual notification click → calls `PATCH /api/notifications/:id/read`
- [ ] Bell count badge → driven by SSE unread_count event

**COMING SOON pattern for no-backend buttons:**
```jsx
// Import this toast (use whatever toast library is already installed)
// DO NOT change the import style from what's already in the file

const handleComingSoon = (featureName) => {
  // Use the EXACT toast pattern already in use across the codebase
  // Look at how other toasts are called and mirror that pattern
  toast({
    title: '🚀 Coming Soon',
    description: `${featureName} launches after presentation`,
    variant: 'default',
    duration: 3000,
  });
};
```

---

## STEP 6: WEATHER WIDGET — FULL IMPLEMENTATION

### 6A — Verify backend weather route

```bash
# Check the weather route exists and returns data
curl -s http://localhost:5000/api/weather \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Expected response shape:
```json
{
  "success": true,
  "data": {
    "temp": 34,
    "feels_like": 38,
    "humidity": 65,
    "description": "partly cloudy",
    "icon": "02d",
    "wind_speed": 12,
    "city": "Waghodia",
    "dt": 1720000000
  }
}
```

If weather route returns error: check `.env` for `OPENWEATHER_API_KEY`.
If key is missing: the backend should return mock weather data as fallback.

Add this fallback to `weather.routes.js` / `weather.controller.js`:
```js
// Fallback if API key missing or API fails
const FALLBACK_WEATHER = {
  temp: 34, feels_like: 38, humidity: 65,
  description: "partly cloudy", icon: "02d",
  wind_speed: 12, city: "Waghodia", country: "IN"
};
```

### 6B — Frontend Weather Widget Implementation

Find the main layout file (AppLayout, Header, or Topbar component).

**DESIGN RULE**: Inherit ALL styles from existing theme. Match font-family, colors, border-radius, and spacing exactly. Do NOT add new CSS variables or classes beyond what's specified here.

Add the weather widget in the TOPBAR (right side, before the notification bell):

```jsx
// WeatherWidget.jsx — NEW FILE
// Place in: src/components/weather/WeatherWidget.jsx

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

// SVG weather icons (inline — no external deps)
const WeatherIcon = ({ code, size = 24 }) => {
  // code = OpenWeather icon code (01d, 02d, 03d, etc.)
  const isNight = code?.endsWith('n');
  const base = code?.slice(0, 2);
  
  const icons = {
    '01': (  // Clear
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" fill={isNight ? "#94A3B8" : "#F59E0B"} />
        {!isNight && <>
          <line x1="12" y1="2" x2="12" y2="5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="19" x2="12" y2="22" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
          <line x1="2" y1="12" x2="5" y2="12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
          <line x1="19" y1="12" x2="22" y2="12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
          <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
          <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
          <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
          <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
        </>}
      </svg>
    ),
    '02': (  // Few clouds
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="13" r="3" fill="#94A3B8"/>
        <circle cx="12" cy="12" r="2.5" fill="#CBD5E1"/>
        <circle cx="15" cy="13" r="3" fill="#94A3B8"/>
        <rect x="6" y="13" width="12" height="4" rx="2" fill="#94A3B8"/>
        <circle cx="8" cy="9" r="3" fill="#F59E0B" opacity="0.8"/>
      </svg>
    ),
    '03': (  // Scattered clouds
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="13" r="3.5" fill="#94A3B8"/>
        <circle cx="13" cy="11" r="4" fill="#CBD5E1"/>
        <circle cx="16" cy="13" r="3" fill="#94A3B8"/>
        <rect x="6" y="13" width="12" height="4" rx="2" fill="#94A3B8"/>
      </svg>
    ),
    '04': (  // Overcast
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="8" cy="12" r="4" fill="#64748B"/>
        <circle cx="13" cy="10" r="5" fill="#94A3B8"/>
        <circle cx="17" cy="12" r="3.5" fill="#64748B"/>
        <rect x="5" y="12" width="14" height="5" rx="2.5" fill="#94A3B8"/>
      </svg>
    ),
    '09': (  // Shower rain
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="9" r="3.5" fill="#64748B"/>
        <circle cx="14" cy="8" r="4" fill="#94A3B8"/>
        <rect x="6" y="9" width="11" height="4" rx="2" fill="#94A3B8"/>
        <line x1="9" y1="15" x2="8" y2="19" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="13" y1="15" x2="12" y2="19" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="17" y1="15" x2="16" y2="19" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    '10': (  // Rain
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="8" cy="9" r="3.5" fill="#64748B"/>
        <circle cx="13" cy="8" r="4" fill="#94A3B8"/>
        <circle cx="7" cy="9" r="2" fill="#F59E0B" opacity="0.7"/>
        <rect x="5" y="9" width="12" height="4" rx="2" fill="#94A3B8"/>
        <line x1="8" y1="15" x2="7" y2="19" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="15" x2="11" y2="19" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="16" y1="15" x2="15" y2="19" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    '13': (  // Snow
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="9" r="3.5" fill="#94A3B8"/>
        <circle cx="14" cy="8" r="4" fill="#CBD5E1"/>
        <rect x="6" y="9" width="11" height="4" rx="2" fill="#CBD5E1"/>
        <text x="8" y="20" fontSize="8" fill="#94A3B8">❄️❄️❄️</text>
      </svg>
    ),
    '11': (  // Thunderstorm
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="9" r="3.5" fill="#475569"/>
        <circle cx="14" cy="8" r="4" fill="#64748B"/>
        <rect x="6" y="9" width="11" height="4" rx="2" fill="#64748B"/>
        <polygon points="13,14 10,19 12,19 9,24 16,17 13,17" fill="#F59E0B"/>
      </svg>
    ),
  };
  return icons[base] || icons['02'];
};

export function WeatherWidget() {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['weather'],
    queryFn: () => api.get('/api/weather').then(r => r.data),
    refetchInterval: 30 * 60 * 1000, // refresh every 30 min
    staleTime: 25 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <button
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', borderRadius: 'var(--full)',
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          cursor: 'pointer', fontSize: '13px', color: 'var(--text-3)',
          fontFamily: 'inherit',
        }}
      >
        <span>—°C</span>
      </button>
    );
  }

  const w = data;
  if (!w) return null;

  return (
    <>
      {/* TRIGGER — in topbar */}
      <button
        onClick={() => setOpen(prev => !prev)}
        title="Campus weather — click for details"
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', borderRadius: 'var(--full)',
          background: open ? 'var(--blue-light)' : 'var(--bg-surface)',
          border: `1px solid ${open ? 'var(--blue)' : 'var(--border)'}`,
          cursor: 'pointer', transition: 'all 0.15s',
          fontFamily: 'inherit',
        }}
      >
        <WeatherIcon code={w.icon} size={18} />
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: '14px',
          color: open ? 'var(--blue)' : 'var(--text-1)',
          letterSpacing: '-0.01em',
        }}>
          {Math.round(w.temp)}°C
        </span>
      </button>

      {/* INLINE DETAIL PANEL — slides down below topbar */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: '64px',          // height of topbar
            right: '16px',
            width: '320px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r4)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 200,
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Panel header — gradient matching page theme */}
          <div style={{
            background: 'var(--grad)',
            padding: '20px 24px 24px',
            color: '#fff',
            position: 'relative',
          }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute', top: '12px', right: '12px',
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>

            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '8px' }}>
              ☁️ {w.city || 'Waghodia'}, Gujarat
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <WeatherIcon code={w.icon} size={56} />
              <div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '52px', fontWeight: 800,
                  letterSpacing: '-0.04em', lineHeight: 1, color: '#fff',
                }}>
                  {Math.round(w.temp)}°
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)',
                  textTransform: 'capitalize', marginTop: '2px' }}>
                  {w.description}
                </div>
              </div>
            </div>
          </div>

          {/* Detail grid */}
          <div style={{ padding: '16px 24px 20px' }}>
            {[
              { label: 'Feels like', value: `${Math.round(w.feels_like)}°C`, icon: '🌡️' },
              { label: 'Humidity',   value: `${w.humidity}%`,                icon: '💧' },
              { label: 'Wind',       value: `${Math.round(w.wind_speed || 0)} km/h`, icon: '🌬️' },
              { label: 'Campus',     value: 'Waghodia, Vadodara',             icon: '📍' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '13px', color: 'var(--text-3)' }}>
                  <span>{row.icon}</span>
                  <span>{row.label}</span>
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px', fontWeight: 500, color: 'var(--text-1)',
                }}>{row.value}</span>
              </div>
            ))}

            {/* Updated time */}
            <div style={{ marginTop: '12px', fontSize: '11px',
              color: 'var(--text-4)', fontFamily: "'JetBrains Mono', monospace",
              textAlign: 'right' }}>
              Updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
```

### 6C — Add WeatherWidget to the Topbar

Find where the topbar notification bell and user icon are rendered.
Add `<WeatherWidget />` BEFORE the notification bell:

```jsx
// In your Topbar/Header component — ADD the weather widget
// PRESERVE all existing elements — only ADD the WeatherWidget
import { WeatherWidget } from '../weather/WeatherWidget';

// In the JSX — add between search bar and notification icon:
<div className="topbar-actions">  {/* ← existing class, DO NOT rename */}
  <WeatherWidget />               {/* ← ADD THIS */}
  {/* ... existing notification bell, profile icon etc ... */}
</div>
```

---

## STEP 7: FIX RESPONSE PARSING

One major source of dead buttons: response shape mismatch.

Backend returns: `{ success: true, data: { items: [...] } }`
Frontend must unwrap correctly.

Check the axios instance in `latent-frontend/src/lib/api.js`:

```js
// The interceptor MUST unwrap like this:
api.interceptors.response.use(
  response => response.data,  // returns { success, data, message }
  error => { ... }
);
```

Then in each query:
```js
// Correct pattern — data is already { success, data: { items } }
const { data } = useQuery({
  queryFn: async () => {
    const response = await api.get('/api/feed/posts?filter=for_you');
    return response.data; // { items, total, hasMore, page, limit }
  }
});
// Usage: data?.items, data?.hasMore, data?.total
```

If the interceptor returns `response.data.data` instead of `response.data`, every query is double-unwrapping. Fix the interceptor first, then update all query functions.

---

## STEP 8: SSE REAL-TIME CONNECTION

Verify SSE is connecting and working:

```bash
# Test SSE endpoint in a separate terminal
curl -N -H "Accept: text/event-stream" \
  "http://localhost:5000/api/notifications/stream?token=$TOKEN"
# Should see: event:unread_count data:{...} within 2 seconds
# Should see: :heartbeat every 30 seconds
```

If SSE isn't connecting, check frontend `useSSE` hook:
```js
// The EventSource URL MUST pass token as query param (not header)
const es = new EventSource(
  `${import.meta.env.VITE_API_URL}/api/notifications/stream?token=${token}`
);
```

---

## STEP 9: POST-FIX BROWSER AGENT VERIFICATION

After all fixes are applied, use the browser agent to do a final walkthrough:

```
/browser
Open http://localhost:5173
Log in with: aryan.shah@paruluniversity.ac.in / password123

Then verify each of these in order:
1. Dashboard loads — Campus Pulse shows real numbers (not zeros or errors)
2. Feed loads — posts with images visible, no "undefined" or blank cards
3. Click 🔥 on a post — count increments immediately, stays after page change
4. Write a post in the composer and submit — appears at top of feed
5. Go to Map — markers appear on Parul campus, click one — panel slides in
6. Check in at a location — toast appears, button changes to "Checked in ✓"
7. Go to Mess — today's meals show with menu items and prices
8. Click "Book Now" on lunch — modal opens with price ₹65
9. Click "Pay from Wallet" — ticket appears with ID
10. Go to Events — event cards with banners visible, click RSVP — count changes
11. Join a club — button changes to "✓ Joined"
12. Follow a person on People page — button changes to "Following"
13. Create a study group — form submits, group appears in list
14. Go to Notifications — unread count matches bell badge
15. Click "Mark all read" — badge disappears
16. Click weather temperature in topbar — weather panel slides down with details
17. Click outside weather panel — it closes

Report PASS/FAIL for each item. For FAIL, give the exact console error.
```

---

## STEP 10: FINAL SNAPSHOT

After all fixes pass the browser verification:

```bash
git add -A
git commit -m "fix: testing-engineer pass — all endpoints connected, weather widget added, dead buttons fixed"
git tag presentation-ready

echo "==========================="
echo "✅ LATENT — PRESENTATION READY"
echo "==========================="
echo "To revert to baseline: git checkout baseline-before-fix"
echo "To see all changes: git diff baseline-before-fix HEAD"
```

---

## QUICK REFERENCE — ALL BACKEND ENDPOINT PATHS

These are the EXACT paths as mounted in `app.js`. Frontend must call these exactly.

```
AUTHENTICATION
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me
POST  /api/auth/onboarding
PATCH /api/auth/update-profile
POST  /api/auth/status
POST  /api/auth/forgot-password
POST  /api/auth/verify-otp
POST  /api/auth/reset-password

FEED (note: /api/feed/posts prefix — NOT /api/posts)
GET   /api/feed/posts?filter=for_you|following|department|trending|clubs|confessions
POST  /api/feed/posts
GET   /api/feed/posts/new-count?since=ISO&filter=for_you
GET   /api/feed/posts/:id
DELETE /api/feed/posts/:id
POST  /api/feed/posts/:id/react
DELETE /api/feed/posts/:id/react
POST  /api/feed/posts/:id/save
DELETE /api/feed/posts/:id/save
GET   /api/feed/posts/:id/comments
POST  /api/feed/posts/:id/comments
POST  /api/feed/comments/:id/replies
GET   /api/feed/polls/:id
POST  /api/feed/polls/:id/vote

EVENTS
GET   /api/events?filter=all|today|this_week|my_clubs
POST  /api/events/:id/rsvp
DELETE /api/events/:id/rsvp
GET   /api/events/:id/attendees
POST  /api/events/:id/memories
GET   /api/events/:id/memories

MAP
GET   /api/map/locations
POST  /api/map/checkin
GET   /api/map/checkins/today

MESS
GET   /api/mess/messes
GET   /api/mess/today
GET   /api/mess/menu?mess_id=X&day_of_week=X
GET   /api/mess/wallet
GET   /api/mess/tickets?status=active|past
POST  /api/mess/create-order
POST  /api/mess/verify-payment
POST  /api/mess/book-wallet

CLUBS
GET   /api/clubs?category=all|tech|cultural|sports|academic|social|nss
GET   /api/clubs/:id
POST  /api/clubs/:id/join
DELETE /api/clubs/:id/leave
GET   /api/clubs/:id/posts
GET   /api/clubs/:id/events
GET   /api/clubs/:id/members

USERS / PROFILE (check if /api/profile or /api/users)
GET   /api/profile/:id  (OR /api/users/:id — read app.js to confirm)
GET   /api/users/:id/posts

PEOPLE
GET   /api/people?department=X&year=X&status=X

FOLLOW (check exact paths in users.routes.js)
POST  /api/users/:id/follow
DELETE /api/users/:id/follow
GET   /api/users/:id/followers
GET   /api/users/:id/following

LOST & FOUND
GET   /api/lost-found?type=lost|found&status=open|resolved
POST  /api/lost-found
PATCH /api/lost-found/:id/resolve
DELETE /api/lost-found/:id

MARKET
GET   /api/market?category=all|books|notes|electronics|cycles|clothing|other
POST  /api/market
PATCH /api/market/:id/mark-sold

STUDY GROUPS
GET   /api/study-groups?subject=X
POST  /api/study-groups
POST  /api/study-groups/:id/join
DELETE /api/study-groups/:id/leave

SENIORS
GET   /api/seniors?department=X
POST  /api/seniors/opt-in
DELETE /api/seniors/opt-out

NOTIFICATIONS
GET   /api/notifications?page=1
PATCH /api/notifications/read-all
PATCH /api/notifications/:id/read
GET   /api/notifications/stream?token=JWT   ← SSE

SYSTEM
GET   /api/pulse
GET   /api/weather
GET   /api/health
```

---

## DESIGN PROTECTION RULES (repeat for emphasis)

These are the only safe changes:
✅ Change API endpoint strings: `/api/posts` → `/api/feed/posts`
✅ Fix query key arrays in useQuery
✅ Fix response data destructuring: `data.items` → `data.data.items`
✅ Add missing onClick handlers that call the API
✅ Add toast for coming-soon features
✅ Add the WeatherWidget component (new file)
✅ Add `<WeatherWidget />` to topbar JSX

These are FORBIDDEN:
❌ Changing any className
❌ Changing CSS variables or values
❌ Changing component layout structure
❌ Changing colors, fonts, sizes
❌ Adding new styled-components or CSS
❌ Removing existing UI elements
❌ Changing Leaflet marker styles
❌ Touching the pulse/heartbeat SVG animation

