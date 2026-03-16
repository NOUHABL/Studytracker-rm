require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const { globalRateLimit } = require('./middleware/rateLimit');
const sessionsRouter      = require('./routes/sessions');
const activityRouter      = require('./routes/activity');
const statsRouter         = require('./routes/stats');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security headers ─────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (e.g. mobile, curl, extension)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parser ───────────────────────────────────────────────
app.use(express.json());

// ── Rate limiting ─────────────────────────────────────────────
app.use(globalRateLimit);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Routes ────────────────────────────────────────────────────
app.use('/sessions', sessionsRouter);
app.use('/activity', activityRouter);
app.use('/stats',    statsRouter);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`StudyTracker API running on port ${PORT}`));
