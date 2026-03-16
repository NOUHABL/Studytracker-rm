const supabase = require('../config/supabase');

// ── POST /sessions/start ──────────────────────────────────────
async function startSession(req, res) {
  const { subject, difficulty, notes } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject is required' });

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id:    req.user.id,
      subject,
      difficulty: difficulty || null,
      notes:      notes      || null,
      start_time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ session_id: data.id, session: data });
}

// ── POST /sessions/end ────────────────────────────────────────
async function endSession(req, res) {
  const { session_id, notes, difficulty } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id is required' });

  // Fetch the session to calculate duration
  const { data: existing, error: fetchErr } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('id', session_id)
    .eq('user_id', req.user.id)
    .single();

  if (fetchErr || !existing) return res.status(404).json({ error: 'Session not found' });
  if (existing.end_time)     return res.status(400).json({ error: 'Session already ended' });

  const end_time = new Date();
  const duration = Math.round((end_time - new Date(existing.start_time)) / 60000); // minutes

  const { data, error } = await supabase
    .from('study_sessions')
    .update({
      end_time:   end_time.toISOString(),
      duration,
      notes:      notes      ?? existing.notes,
      difficulty: difficulty ?? existing.difficulty,
    })
    .eq('id', session_id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ session: data });
}

// ── GET /sessions ─────────────────────────────────────────────
async function listSessions(req, res) {
  const limit  = Math.min(parseInt(req.query.limit  || '50', 10), 100);
  const offset = parseInt(req.query.offset || '0', 10);

  const { data, error, count } = await supabase
    .from('study_sessions')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('start_time', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ sessions: data, total: count, limit, offset });
}

// ── GET /sessions/:id ─────────────────────────────────────────
async function getSession(req, res) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*, browsing_activity(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Session not found' });
  res.json({ session: data });
}

module.exports = { startSession, endSession, listSessions, getSession };
