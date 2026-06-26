-- Drop everything if rebuilding
DROP TABLE IF EXISTS
  wallet_transactions, mess_coupons, mess_orders, mess_wallet, mess_menu, messes,
  event_memories, event_rsvps, events,
  poll_votes, poll_options, polls, saved_posts,
  comment_replies, comments, post_reactions, posts,
  club_members, clubs,
  study_group_members, study_groups,
  market_listings, lost_found,
  senior_mentors, notifications, announcements,
  otp_tokens, checkins, locations,
  user_interests, follows, users
CASCADE;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS
CREATE TABLE users (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  email                 VARCHAR(150) UNIQUE NOT NULL,
  enrollment_no         VARCHAR(30)  UNIQUE,
  password_hash         TEXT NOT NULL,
  department            VARCHAR(60),
  year                  SMALLINT CHECK (year BETWEEN 1 AND 6),
  bio                   TEXT,
  avatar_url            TEXT DEFAULT '',
  campus_status         VARCHAR(20) DEFAULT 'free'
                        CHECK (campus_status IN ('free','studying','at_mess','at_gym','in_class','in_hostel')),
  status_expires_at     TIMESTAMPTZ,
  hostel_type           VARCHAR(15) DEFAULT 'hosteler'
                        CHECK (hostel_type IN ('hosteler','day_scholar')),
  default_mess_id       INT,
  onboarding_complete   BOOLEAN DEFAULT FALSE,
  last_seen             TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_interests (
  user_id   INT REFERENCES users(id) ON DELETE CASCADE,
  interest  VARCHAR(50),
  PRIMARY KEY (user_id, interest)
);

CREATE TABLE follows (
  follower_id  INT REFERENCES users(id) ON DELETE CASCADE,
  following_id INT REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE TABLE otp_tokens (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(150) NOT NULL,
  token       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- CAMPUS LOCATIONS (map)
CREATE TABLE locations (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  code         VARCHAR(10),
  category     VARCHAR(20) NOT NULL
               CHECK (category IN ('academic','food','sports','hostel','service','medical','library','admin','bank','parking')),
  campus       VARCHAR(10) DEFAULT 'main'
               CHECK (campus IN ('main','east')),
  lat          DECIMAL(10,7) NOT NULL,
  lng          DECIMAL(10,7) NOT NULL,
  description  TEXT,
  image_url    TEXT,
  floor_info   TEXT
);

CREATE TABLE checkins (
  id             SERIAL PRIMARY KEY,
  user_id        INT REFERENCES users(id) ON DELETE CASCADE,
  location_id    INT REFERENCES locations(id) ON DELETE CASCADE,
  checked_in_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_checkins_loc_time ON checkins(location_id, checked_in_at);

-- MESSES
CREATE TABLE messes (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  hostel_block    VARCHAR(80),
  capacity        INT DEFAULT 300,
  breakfast_start TIME DEFAULT '06:00',
  breakfast_end   TIME DEFAULT '07:30',
  lunch_start     TIME DEFAULT '08:00',
  lunch_end       TIME DEFAULT '13:30',
  dinner_start    TIME DEFAULT '14:00',
  dinner_end      TIME DEFAULT '20:00',
  location_id     INT REFERENCES locations(id),
  is_active       BOOLEAN DEFAULT TRUE
);

ALTER TABLE users ADD CONSTRAINT fk_default_mess
  FOREIGN KEY (default_mess_id) REFERENCES messes(id) ON DELETE SET NULL;

CREATE TABLE mess_menu (
  id           SERIAL PRIMARY KEY,
  mess_id      INT REFERENCES messes(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type    VARCHAR(15) NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner')),
  items        JSONB NOT NULL DEFAULT '[]'
);
CREATE UNIQUE INDEX idx_mess_menu ON mess_menu(mess_id, day_of_week, meal_type);

CREATE TABLE mess_wallet (
  user_id    INT REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  balance    DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mess_orders (
  id                 SERIAL PRIMARY KEY,
  user_id            INT REFERENCES users(id),
  mess_id            INT REFERENCES messes(id),
  meal_type          VARCHAR(15) NOT NULL,
  meal_date          DATE NOT NULL,
  persons            SMALLINT DEFAULT 1,
  amount             DECIMAL(8,2) NOT NULL,
  razorpay_order_id  VARCHAR(120) UNIQUE,
  status             VARCHAR(20) DEFAULT 'pending'
                     CHECK (status IN ('pending','paid','failed')),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mess_coupons (
  id                    SERIAL PRIMARY KEY,
  ticket_id             VARCHAR(40) UNIQUE NOT NULL,
  user_id               INT REFERENCES users(id) ON DELETE CASCADE,
  mess_id               INT REFERENCES messes(id),
  order_id              INT REFERENCES mess_orders(id),
  meal_type             VARCHAR(15) NOT NULL,
  persons               SMALLINT DEFAULT 1,
  amount                DECIMAL(8,2) NOT NULL,
  meal_date             DATE NOT NULL,
  valid_until           TIME,
  qr_data               TEXT,
  payment_method        VARCHAR(20) DEFAULT 'razorpay'
                        CHECK (payment_method IN ('razorpay','wallet')),
  razorpay_payment_id   VARCHAR(120),
  status                VARCHAR(15) DEFAULT 'active'
                        CHECK (status IN ('active','used','expired')),
  booked_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
  id            SERIAL PRIMARY KEY,
  user_id       INT REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(10) NOT NULL CHECK (type IN ('debit','credit')),
  amount        DECIMAL(8,2) NOT NULL,
  description   TEXT,
  ref_id        INT,
  balance_after DECIMAL(10,2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- CLUBS
CREATE TABLE clubs (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  category     VARCHAR(30) CHECK (category IN ('tech','cultural','sports','academic','social','nss')),
  logo_url     TEXT DEFAULT '',
  banner_url   TEXT DEFAULT '',
  founded_year SMALLINT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE club_members (
  id        SERIAL PRIMARY KEY,
  user_id   INT REFERENCES users(id) ON DELETE CASCADE,
  club_id   INT REFERENCES clubs(id) ON DELETE CASCADE,
  role      VARCHAR(20) DEFAULT 'member' CHECK (role IN ('president','moderator','member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, club_id)
);

-- EVENTS
CREATE TABLE events (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  location_name VARCHAR(100),
  location_id   INT REFERENCES locations(id),
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ,
  club_id       INT REFERENCES clubs(id),
  banner_url    TEXT DEFAULT '',
  max_capacity  INT,
  created_by    INT REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_rsvps (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  event_id   INT REFERENCES events(id) ON DELETE CASCADE,
  status     VARCHAR(15) NOT NULL CHECK (status IN ('going','interested','not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, event_id)
);

CREATE TABLE event_memories (
  id         SERIAL PRIMARY KEY,
  event_id   INT REFERENCES events(id) ON DELETE CASCADE,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  caption    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POSTS + SOCIAL
CREATE TABLE posts (
  id           SERIAL PRIMARY KEY,
  user_id      INT REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT,
  image_urls   JSONB DEFAULT '[]',
  post_type    VARCHAR(20) DEFAULT 'general'
               CHECK (post_type IN ('general','photo','poll','event_share','check_in','lost_found','market','confession')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  ref_id       INT,
  ref_type     VARCHAR(30),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_user ON posts(user_id, created_at DESC);

CREATE TABLE post_reactions (
  id             SERIAL PRIMARY KEY,
  user_id        INT REFERENCES users(id) ON DELETE CASCADE,
  post_id        INT REFERENCES posts(id) ON DELETE CASCADE,
  reaction_type  VARCHAR(10) NOT NULL CHECK (reaction_type IN ('fire','heart','laugh','clap','wow')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);
CREATE INDEX idx_reactions_post ON post_reactions(post_id);

CREATE TABLE comments (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  post_id    INT REFERENCES posts(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comments_post ON comments(post_id, created_at ASC);

CREATE TABLE comment_replies (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  comment_id  INT REFERENCES comments(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE saved_posts (
  user_id  INT REFERENCES users(id) ON DELETE CASCADE,
  post_id  INT REFERENCES posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE polls (
  id       SERIAL PRIMARY KEY,
  post_id  INT REFERENCES posts(id) ON DELETE CASCADE UNIQUE,
  question TEXT NOT NULL,
  ends_at  TIMESTAMPTZ
);

CREATE TABLE poll_options (
  id           SERIAL PRIMARY KEY,
  poll_id      INT REFERENCES polls(id) ON DELETE CASCADE,
  option_text  VARCHAR(200) NOT NULL,
  position     SMALLINT DEFAULT 0
);

CREATE TABLE poll_votes (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  poll_id    INT REFERENCES polls(id) ON DELETE CASCADE,
  option_id  INT REFERENCES poll_options(id) ON DELETE CASCADE,
  voted_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, poll_id)
);

-- LOST & FOUND
CREATE TABLE lost_found (
  id             SERIAL PRIMARY KEY,
  user_id        INT REFERENCES users(id) ON DELETE CASCADE,
  type           VARCHAR(10) NOT NULL CHECK (type IN ('lost','found')),
  title          VARCHAR(200) NOT NULL,
  category       VARCHAR(30),
  description    TEXT,
  image_url      TEXT DEFAULT '',
  location_hint  TEXT,
  status         VARCHAR(15) DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ
);

-- MARKET
CREATE TABLE market_listings (
  id           SERIAL PRIMARY KEY,
  user_id      INT REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  category     VARCHAR(30) NOT NULL
               CHECK (category IN ('books','notes','electronics','cycles','clothing','other')),
  condition    VARCHAR(15) CHECK (condition IN ('new','like_new','good','fair')),
  price        DECIMAL(10,2) NOT NULL,
  image_urls   JSONB DEFAULT '[]',
  status       VARCHAR(15) DEFAULT 'available' CHECK (status IN ('available','sold')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- STUDY GROUPS
CREATE TABLE study_groups (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(100),
  subject        VARCHAR(100) NOT NULL,
  creator_id     INT REFERENCES users(id) ON DELETE CASCADE,
  location_id    INT REFERENCES locations(id),
  location_text  VARCHAR(100),
  scheduled_at   TIMESTAMPTZ,
  max_members    SMALLINT DEFAULT 6 CHECK (max_members BETWEEN 2 AND 20),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE study_group_members (
  group_id   INT REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- SENIORS
CREATE TABLE senior_mentors (
  user_id      INT REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  bio_mentor   TEXT,
  subjects     JSONB DEFAULT '[]',
  opted_in_at  TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  actor_id   INT REFERENCES users(id) ON DELETE SET NULL,
  type       VARCHAR(30) NOT NULL,
  content    TEXT NOT NULL,
  ref_id     INT,
  ref_type   VARCHAR(30),
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notif_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE TABLE announcements (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  content     TEXT,
  priority    VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('urgent','normal','info')),
  department  VARCHAR(60),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
