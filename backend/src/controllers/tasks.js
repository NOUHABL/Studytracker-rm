const supabase = require('../config/supabase');

// ── GET /tasks?subject=Math ───────────────────────────────────
async function listTasks(req, res) {
  const { subject } = req.query;

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: true });

  if (subject) query = query.eq('subject', subject);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ tasks: data });
}

// ── POST /tasks ───────────────────────────────────────────────
async function createTask(req, res) {
  const { subject, title, task_type } = req.body;
  if (!subject)   return res.status(400).json({ error: 'subject is required' });
  if (!title)     return res.status(400).json({ error: 'title is required' });
  if (!task_type) return res.status(400).json({ error: 'task_type is required' });

  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: req.user.id, subject, title, task_type })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ task: data });
}

// ── PATCH /tasks/:id ──────────────────────────────────────────
async function updateTask(req, res) {
  const { completed, title } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .update({ 
      ...(completed !== undefined && { completed }),
      ...(title     !== undefined && { title }),
    })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Task not found' });
  res.json({ task: data });
}

// ── DELETE /tasks/:id ─────────────────────────────────────────
async function deleteTask(req, res) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
}

// ── GET /tasks/progress ───────────────────────────────────────
async function getProgress(req, res) {
  const { data, error } = await supabase
    .from('tasks')
    .select('subject, completed')
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });

  // Group by subject
  const map = {};
  data.forEach(t => {
    if (!map[t.subject]) map[t.subject] = { subject: t.subject, total: 0, completed: 0 };
    map[t.subject].total++;
    if (t.completed) map[t.subject].completed++;
  });

  const progress = Object.values(map).map(s => ({
    ...s,
    percent: s.total ? Math.round((s.completed / s.total) * 100) : 0,
  })).sort((a, b) => b.percent - a.percent);

  res.json({ progress });
}

// ── GET /tasks/streak ─────────────────────────────────────────
async function getStreak(req, res) {
  const { data, error } = await supabase
    .from('tasks')
    .select('completed_at')
    .eq('user_id', req.user.id)
    .eq('completed', true)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Get unique days (YYYY-MM-DD) that had at least one completed task
  const days = [...new Set(
    data.map(t => new Date(t.completed_at).toISOString().slice(0, 10))
  )].sort().reverse(); // newest first

  if (!days.length) return res.json({ streak: 0, longest: 0, last_active: null, active_days: [] });

  // Calculate current streak
  let streak  = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Streak is valid if last active day is today or yesterday
  if (days[0] !== today && days[0] !== yesterday) {
    streak = 0;
  } else {
    let current = new Date(days[0]);
    for (const day of days) {
      const d = new Date(day);
      const diff = Math.round((current - d) / 86400000);
      if (diff <= 1) {
        streak++;
        current = d;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longest    = 1;
  let tempStreak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round(
      (new Date(days[i-1]) - new Date(days[i])) / 86400000
    );
    if (diff === 1) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  res.json({
    streak,
    longest,
    last_active:  days[0],
    active_days:  days.slice(0, 30), // last 30 active days
  });
}

module.exports = { listTasks, createTask, updateTask, deleteTask, getProgress, getStreak };