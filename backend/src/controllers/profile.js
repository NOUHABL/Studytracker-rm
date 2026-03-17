const supabase = require('../config/supabase');

// ── GET /profile/history?weeks=8 ─────────────────────────────
async function getHistory(req, res) {
  const weeks  = Math.min(parseInt(req.query.weeks || '8', 10), 52);
  const since  = new Date();
  since.setDate(since.getDate() - weeks * 7);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('study_sessions')
    .select('subject, duration, task_type, lesson_name, start_time, end_time')
    .eq('user_id', req.user.id)
    .gte('start_time', since.toISOString())
    .not('end_time', 'is', null)
    .order('start_time', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Group sessions by week
  const weekMap = {};
  data.forEach(s => {
    const date  = new Date(s.start_time);
    // Get Monday of that week
    const day   = date.getDay();
    const diff  = (day === 0 ? -6 : 1) - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const weekKey = monday.toISOString().slice(0, 10);

    if (!weekMap[weekKey]) {
      weekMap[weekKey] = {
        week_start:    weekKey,
        total_minutes: 0,
        sessions:      0,
        by_subject:    {},
        by_task_type:  {},
        by_day:        {},
        session_list:  [],
      };
    }
    const w = weekMap[weekKey];
    w.total_minutes           += s.duration || 0;
    w.sessions                += 1;
    w.by_subject[s.subject]    = (w.by_subject[s.subject]    || 0) + (s.duration || 0);
    w.by_task_type[s.task_type || 'other'] = (w.by_task_type[s.task_type || 'other'] || 0) + (s.duration || 0);
    const dayKey = s.start_time.slice(0, 10);
    w.by_day[dayKey]           = (w.by_day[dayKey] || 0) + (s.duration || 0);
    w.session_list.push(s);
  });

  // Sort weeks newest first
  const history = Object.values(weekMap).sort((a, b) =>
    new Date(b.week_start) - new Date(a.week_start)
  );

  res.json({ history, total_weeks: history.length });
}

// ── GET /profile/me ───────────────────────────────────────────
async function getProfile(req, res) {
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (userErr) return res.status(500).json({ error: userErr.message });

  // Overall stats
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('duration, subject, start_time')
    .eq('user_id', req.user.id)
    .not('end_time', 'is', null);

  const totalMinutes = (sessions || []).reduce((s, r) => s + (r.duration || 0), 0);
  const totalSessions = (sessions || []).length;

  // Best subject
  const subjectMap = {};
  (sessions || []).forEach(s => {
    subjectMap[s.subject] = (subjectMap[s.subject] || 0) + (s.duration || 0);
  });
  const bestSubject = Object.entries(subjectMap).sort((a, b) => b[1] - a[1])[0];

  // Member since
  const memberSince = user.created_at;

  res.json({
    user,
    stats: {
      total_minutes:  totalMinutes,
      total_sessions: totalSessions,
      best_subject:   bestSubject ? bestSubject[0] : null,
      best_subject_minutes: bestSubject ? bestSubject[1] : 0,
      member_since:   memberSince,
    },
  });
}

module.exports = { getHistory, getProfile };