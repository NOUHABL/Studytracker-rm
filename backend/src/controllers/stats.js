const supabase = require('../config/supabase');

// ── GET /stats/today ──────────────────────────────────────────
async function todayStats(req, res) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('study_sessions')
    .select('subject, duration, task_type, lesson_name, start_time, end_time')
    .eq('user_id', req.user.id)
    .gte('start_time', today.toISOString())
    .lt('start_time', tomorrow.toISOString())
    .not('end_time', 'is', null);

  if (error) return res.status(500).json({ error: error.message });

  const totalMinutes = data.reduce((sum, s) => sum + (s.duration || 0), 0);

  const bySubject  = {};
  const byTaskType = {};
  data.forEach(s => {
    bySubject[s.subject]           = (bySubject[s.subject]           || 0) + (s.duration || 0);
    byTaskType[s.task_type || '?'] = (byTaskType[s.task_type || '?'] || 0) + (s.duration || 0);
  });

  res.json({
    date:          today.toISOString().slice(0, 10),
    total_minutes: totalMinutes,
    sessions:      data.length,
    by_subject:    bySubject,
    by_task_type:  byTaskType,
  });
}

// ── GET /stats/week ───────────────────────────────────────────
async function weekStats(req, res) {
  const now     = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('study_sessions')
    .select('subject, duration, task_type, start_time')
    .eq('user_id', req.user.id)
    .gte('start_time', weekAgo.toISOString())
    .not('end_time', 'is', null);

  if (error) return res.status(500).json({ error: error.message });

  const byDay      = {};
  const byTaskType = {};
  data.forEach(s => {
    const day = s.start_time.slice(0, 10);
    byDay[day]                     = (byDay[day]                     || 0) + (s.duration || 0);
    byTaskType[s.task_type || '?'] = (byTaskType[s.task_type || '?'] || 0) + (s.duration || 0);
  });

  res.json({
    week_start:    weekAgo.toISOString().slice(0, 10),
    total_minutes: data.reduce((sum, s) => sum + (s.duration || 0), 0),
    sessions:      data.length,
    by_day:        byDay,
    by_task_type:  byTaskType,
  });
}

// ── GET /stats/subjects ───────────────────────────────────────
async function subjectStats(req, res) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('subject, duration')
    .eq('user_id', req.user.id)
    .not('end_time', 'is', null);

  if (error) return res.status(500).json({ error: error.message });

  const bySubject = {};
  data.forEach(s => {
    bySubject[s.subject] = (bySubject[s.subject] || 0) + (s.duration || 0);
  });

  const sorted = Object.entries(bySubject)
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  res.json({ subjects: sorted });
}

// ── GET /stats/tasks ──────────────────────────────────────────
async function taskStats(req, res) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('task_type, duration')
    .eq('user_id', req.user.id)
    .not('end_time', 'is', null);

  if (error) return res.status(500).json({ error: error.message });

  const map = {};
  data.forEach(s => {
    const t = s.task_type || 'unknown';
    if (!map[t]) map[t] = { task_type: t, minutes: 0, sessions: 0 };
    map[t].minutes  += s.duration || 0;
    map[t].sessions += 1;
  });

  const tasks = Object.values(map).sort((a, b) => b.minutes - a.minutes);
  res.json({ tasks });
}

// ── GET /stats/active ─────────────────────────────────────────
async function activeSession(req, res) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', req.user.id)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ session: data });
}

module.exports = { todayStats, weekStats, subjectStats, taskStats, activeSession };