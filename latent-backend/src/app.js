const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// CORS — allow frontend origins
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors()); // pre-flight for all routes

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many auth requests.' },
});

// Health check
app.get('/api/health', (req, res) =>
  res.json({ success: true, data: { status: 'ok', service: 'Latent API', version: '3.0.0' } })
);

// Routes — exact paths as specified in the contract
app.use('/api/auth',          authLimiter, require('./routes/auth'));
app.use('/api/posts',         require('./routes/posts'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/map',           require('./routes/map'));
app.use('/api/mess',          require('./routes/mess'));
app.use('/api/clubs',         require('./routes/clubs'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/people',        require('./routes/people'));
app.use('/api/lost-found',    require('./routes/lostFound'));
app.use('/api/market',        require('./routes/market'));
app.use('/api/study-groups',  require('./routes/studyGroups'));
app.use('/api/seniors',       require('./routes/seniors'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/pulse',         require('./routes/pulse'));
app.use('/api/weather',       require('./routes/weather'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

module.exports = app;
