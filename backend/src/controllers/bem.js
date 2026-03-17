const supabase = require('../config/supabase');

const SUBJECTS = ['Math', 'Physics', 'French', 'Arabic', 'Science', 'Hist_Geo', 'English', 'Islam_Edu', 'Civil_Edu'];
const YEARS    = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

// ── GET /bem ──────────────────────────────────────────────────
async function getBEM(req, res) {
  const { data, error } = await supabase
    .from('bem_progress')
    .select('year, subject, status, updated_at')
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });

  // Build a map: { year: { subject: status } }
  const map = {};
  YEARS.forEach(y => { map[y] = {}; });
  data.forEach(row => {
    if (map[row.year]) map[row.year][row.subject] = row.status;
  });

  // Stats
  const total   = YEARS.length * SUBJECTS.length;
  const solved  = data.filter(d => d.status === 'solved').length;
  const ongoing = data.filter(d => d.status === 'ongoing').length;

  res.json({ progress: map, stats: { total, solved, ongoing, not_yet: total - solved - ongoing } });
}

// ── POST /bem ─────────────────────────────────────────────────
async function updateBEM(req, res) {
  const { year, subject, status } = req.body;

  if (!year || !subject || !status) {
    return res.status(400).json({ error: 'year, subject, and status are required' });
  }
  if (!YEARS.includes(Number(year))) {
    return res.status(400).json({ error: 'Invalid year' });
  }
  if (!['not_yet', 'ongoing', 'solved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const { data, error } = await supabase
    .from('bem_progress')
    .upsert({
      user_id:    req.user.id,
      year:       Number(year),
      subject,
      status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,year,subject' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ row: data });
}

module.exports = { getBEM, updateBEM };