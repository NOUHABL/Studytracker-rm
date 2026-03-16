const supabase = require('../config/supabase');

/**
 * Extract the domain from a URL safely.
 */
function parseDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ── POST /activity ────────────────────────────────────────────
async function logActivity(req, res) {
  const { session_id, url, time_spent } = req.body;

  if (!session_id || !url || time_spent == null) {
    return res.status(400).json({ error: 'session_id, url, and time_spent are required' });
  }

  // Verify the session belongs to this user
  const { data: session, error: sessErr } = await supabase
    .from('study_sessions')
    .select('id, end_time')
    .eq('id', session_id)
    .eq('user_id', req.user.id)
    .single();

  if (sessErr || !session) return res.status(404).json({ error: 'Session not found' });
  if (session.end_time)   return res.status(400).json({ error: 'Session already ended' });

  const domain = parseDomain(url);

  const { data, error } = await supabase
    .from('browsing_activity')
    .insert({ session_id, url, domain, time_spent })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ activity: data });
}

// ── GET /activity/:session_id ─────────────────────────────────
async function getSessionActivity(req, res) {
  const { session_id } = req.params;

  // Ownership check
  const { data: session } = await supabase
    .from('study_sessions')
    .select('id')
    .eq('id', session_id)
    .eq('user_id', req.user.id)
    .single();

  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { data, error } = await supabase
    .from('browsing_activity')
    .select('*')
    .eq('session_id', session_id)
    .order('timestamp', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ activity: data });
}

module.exports = { logActivity, getSessionActivity };
