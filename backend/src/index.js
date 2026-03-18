require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const { globalRateLimit } = require('./middleware/rateLimit');
const sessionsRouter      = require('./routes/sessions');
const activityRouter      = require('./routes/activity');
const statsRouter         = require('./routes/stats');
const tasksRouter         = require('./routes/tasks');
const bemRouter           = require('./routes/bem');
const profileRouter       = require('./routes/profile');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

// Allow all origins — lock down after confirming deployment works
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(globalRateLimit);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

app.use('/sessions', sessionsRouter);
app.use('/activity', activityRouter);
app.use('/stats',    statsRouter);
app.use('/tasks',    tasksRouter);
app.use('/bem',      bemRouter);
app.use('/profile',  profileRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`StudyTracker API running on port ${PORT}`));