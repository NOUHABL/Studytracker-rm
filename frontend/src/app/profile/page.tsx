'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import { Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { getProfileData, getWeeklyHistory, type WeekHistory } from '@/lib/api';
import { formatDuration } from '@/lib/utils';

const SUBJECT_COLORS: Record<string, string> = {
  Math:      '#3C6EA6', Physics:   '#C05E3C', French:    '#7C4A7C',
  Arabic:    '#4A7C59', Science:   '#D4A017', Hist_Geo:  '#6C4AA6',
  English:   '#3C7C7C', Islam_Edu: '#A67C3C', Civil_Edu: '#C05E7C',
};

const TASK_COLORS: Record<string, string> = {
  lesson: '#3C6EA6', exercise: '#4A7C59', subject: '#7C4A7C', bem: '#D4A017',
};

const TASK_ICONS: Record<string, string> = {
  lesson: '📖', exercise: '✏️', subject: '📚', bem: '🎯',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function WeekCard({ week, index }: { week: WeekHistory; index: number }) {
  const [open, setOpen] = useState(index === 0);

  // Build 7-day array for this week
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(week.week_start);
    d.setDate(d.getDate() + i);
    const key     = d.toISOString().slice(0, 10);
    const minutes = week.by_day[key] || 0;
    return { key, label: DAYS[i], minutes };
  });

  const maxDay    = Math.max(...days.map(d => d.minutes), 1);
  const subjects  = Object.entries(week.by_subject).sort((a, b) => b[1] - a[1]);
  const taskTypes = Object.entries(week.by_task_type).sort((a, b) => b[1] - a[1]);

  const weekLabel = (() => {
    const start = new Date(week.week_start);
    const end   = new Date(week.week_start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  })();

  const isCurrentWeek = index === 0;

  return (
    <div className={`rounded-3xl border transition-all ${
      isCurrentWeek ? 'border-sage/30 shadow-lg shadow-sage/8' : 'border-ink/8'
    } bg-white/60 overflow-hidden`}>

      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-ink/2 transition-colors"
      >
        <div className="flex items-center gap-4">
          {isCurrentWeek && (
            <span className="text-xs font-bold text-sage bg-sage/10 px-2.5 py-1 rounded-full">This week</span>
          )}
          <div>
            <p className="font-display text-lg text-ink">{weekLabel}</p>
            <p className="text-sm text-ink/40 mt-0.5">
              {week.sessions} session{week.sessions !== 1 ? 's' : ''} · {formatDuration(week.total_minutes)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Mini day bars */}
          <div className="hidden sm:flex items-end gap-1 h-8">
            {days.map(d => (
              <div key={d.key} className="flex flex-col items-center gap-0.5">
                <div
                  className="w-4 rounded-sm transition-all"
                  style={{
                    height: d.minutes ? `${Math.max(4, Math.round((d.minutes / maxDay) * 28))}px` : '2px',
                    background: d.minutes ? '#4A7C59' : 'rgba(13,13,13,0.08)',
                  }}
                />
              </div>
            ))}
          </div>
          <span className="text-ink/30 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-6 pb-6 space-y-6 border-t border-ink/6">

          {/* Day-by-day bars */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">Daily breakdown</p>
            <div className="flex items-end gap-2 h-20">
              {days.map(d => (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-ink/40 font-semibold">
                    {d.minutes ? formatDuration(d.minutes) : ''}
                  </span>
                  <div className="w-full rounded-t-lg transition-all"
                    style={{
                      height: d.minutes ? `${Math.max(6, Math.round((d.minutes / maxDay) * 48))}px` : '4px',
                      background: d.minutes ? '#4A7C59' : 'rgba(13,13,13,0.06)',
                    }}
                  />
                  <span className="text-xs text-ink/30 font-semibold">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* By subject */}
            <div>
              <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">By subject</p>
              <div className="space-y-2">
                {subjects.map(([sub, mins]) => {
                  const pct   = Math.round((mins / week.total_minutes) * 100);
                  const color = SUBJECT_COLORS[sub] || '#4A7C59';
                  return (
                    <div key={sub}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-ink">{sub}</span>
                        <span className="text-ink/40">{formatDuration(mins)} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By task type */}
            <div>
              <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">By task type</p>
              <div className="space-y-2">
                {taskTypes.map(([type, mins]) => {
                  const pct   = Math.round((mins / week.total_minutes) * 100);
                  const color = TASK_COLORS[type] || '#9CA3AF';
                  const icon  = TASK_ICONS[type] || '•';
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-ink">{icon} {type}</span>
                        <span className="text-ink/40">{formatDuration(mins)} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile,  setProfile]  = useState<any>(null);
  const [history,  setHistory]  = useState<WeekHistory[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [weeks,    setWeeks]    = useState(8);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { router.push('/login'); return; }
      Promise.all([
        getProfileData(),
        getWeeklyHistory(weeks),
      ]).then(([p, h]) => {
        setProfile(p);
        setHistory(h.history);
        setLoading(false);
      }).catch(console.error);
    });
    return () => subscription.unsubscribe();
  }, [router, weeks]);

  const memberDays = profile ? Math.floor(
    (Date.now() - new Date(profile.stats.member_since).getTime()) / 86400000
  ) : 0;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-up">

        {/* Profile header */}
        {loading ? (
          <div className="h-32 rounded-3xl bg-ink/5 animate-pulse" />
        ) : profile && (
          <div className="bg-sage text-paper rounded-3xl px-8 py-6 shadow-xl shadow-sage/20 flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-paper/20 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-2xl font-bold text-paper">
                {(profile.user.name || profile.user.email)
                  .split(/[@\s]/, 1)[0]
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold">
                {profile.user.name || profile.user.email.split('@')[0]}
              </h1>
              <p className="text-paper/60 text-sm mt-0.5">{profile.user.email}</p>
              <p className="text-paper/50 text-xs mt-1">Member for {memberDays} days</p>
            </div>

            {/* All-time stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="font-display text-2xl font-bold">{formatDuration(profile.stats.total_minutes)}</p>
                <p className="text-paper/60 text-xs uppercase tracking-wider">Total studied</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold">{profile.stats.total_sessions}</p>
                <p className="text-paper/60 text-xs uppercase tracking-wider">Sessions</p>
              </div>
              {profile.stats.best_subject && (
                <div className="text-center">
                  <p className="font-display text-2xl font-bold">{profile.stats.best_subject}</p>
                  <p className="text-paper/60 text-xs uppercase tracking-wider">Top subject</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weekly history */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl text-ink">Weekly History</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink/40">Show</span>
              {[4, 8, 12].map(w => (
                <button key={w} onClick={() => setWeeks(w)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    weeks === w ? 'bg-sage text-paper' : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
                  }`}>
                  {w}w
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-3xl bg-ink/5 animate-pulse" />)}
            </div>
          ) : history.length === 0 ? (
            <Card>
              <div className="text-center py-16 text-ink/30">
                <p className="text-4xl mb-3">📅</p>
                <p className="font-medium">No sessions yet</p>
                <p className="text-sm">Start studying to build your history</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((week, i) => (
                <WeekCard key={week.week_start} week={week} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}