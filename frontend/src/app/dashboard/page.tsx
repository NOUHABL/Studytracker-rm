'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/ui/Navbar';
import { Card } from '@/components/ui';
import { DailyChart, WeeklyChart, SubjectPieChart } from '@/components/charts';
import { getTodayStats, getWeekStats, getSubjectStats, getActiveSession, getTaskStats, getTaskProgress, getStreak } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { formatDuration } from '@/lib/utils';
import type { TodayStats, WeekStats, SubjectStat, StudySession, TaskStat, TaskType, SubjectProgress } from '@/types';

// ── Task config ───────────────────────────────────────────────
const TASK_CONFIG: Record<TaskType, { icon: string; color: string; label: string }> = {
  lesson:   { icon: '📖', color: '#3C6EA6', label: 'Lessons'   },
  exercise: { icon: '✏️', color: '#4A7C59', label: 'Exercises' },
  subject:  { icon: '📚', color: '#7C4A7C', label: 'Subject Review' },
  bem:      { icon: '🎯', color: '#D4A017', label: 'BEM Prep'  },
};

// ── BEM Countdown ─────────────────────────────────────────────
const BEM_DATE = new Date('2026-05-19T08:00:00');
interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; over: boolean; }

function calc(): TimeLeft {
  const diff = BEM_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, over: true };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
    over:    false,
  };
}

function BEMCountdown() {
  const [time, setTime] = useState<TimeLeft | null>(null);
  useEffect(() => {
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) {
    return (
      <div className="bg-sage text-paper rounded-3xl px-6 py-5 shadow-xl shadow-sage/20">
        <p className="text-paper/70 text-xs font-semibold uppercase tracking-widest mb-0.5">Countdown to</p>
        <h2 className="font-display text-2xl font-bold">BEM Exam 2026</h2>
        <p className="text-paper/60 text-xs mt-0.5">June 1st, 2026 at 8:00 AM</p>
      </div>
    );
  }

  if (time.over) {
    return (
      <div className="bg-amber text-ink rounded-3xl px-6 py-5 text-center font-display text-xl shadow-xl shadow-amber/20">
        The BEM exam has started — good luck!
      </div>
    );
  }

  const units  = [
    { label: 'Days',    value: time.days },
    { label: 'Hours',   value: time.hours },
    { label: 'Minutes', value: time.minutes },
    { label: 'Seconds', value: time.seconds },
  ];
  const urgent  = time.days < 7;
  const warning = time.days < 30;
  const bg      = urgent ? 'bg-red-500' : warning ? 'bg-amber' : 'bg-sage';
  const shadow  = urgent ? 'shadow-red-500/20' : warning ? 'shadow-amber/20' : 'shadow-sage/20';

  return (
    <div className={`${bg} text-paper rounded-3xl px-6 py-5 shadow-xl ${shadow}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-paper/70 text-xs font-semibold uppercase tracking-widest mb-0.5">Countdown to</p>
          <h2 className="font-display text-2xl font-bold">BEM Exam 2026</h2>
          <p className="text-paper/60 text-xs mt-0.5">June 1st, 2026 at 8:00 AM</p>
        </div>
        <div className="flex items-center gap-3">
          {units.map((u, i) => (
            <div key={u.label} className="flex items-center gap-3">
              <div className="text-center">
                <div className="bg-paper/20 rounded-2xl px-3 py-2 min-w-[56px]">
                  <span className="font-display text-3xl font-bold tabular-nums">
                    {String(u.value).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-paper/60 text-xs mt-1 font-semibold uppercase tracking-wider">{u.label}</p>
              </div>
              {i < units.length - 1 && (
                <span className="font-display text-2xl font-bold text-paper/40 mb-5">:</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────
export default function DashboardPage() {
  const [today,        setToday]        = useState<TodayStats | null>(null);
  const [week,         setWeek]         = useState<WeekStats | null>(null);
  const [subjects,     setSubjects]     = useState<SubjectStat[] | null>(null);
  const [tasks,        setTasks]        = useState<TaskStat[] | null>(null);
  const [active,       setActive]       = useState<StudySession | null>(null);
  const [taskProgress, setTaskProgress] = useState<SubjectProgress[] | null>(null);
  const [streakData,   setStreakData]   = useState<{ streak: number; longest: number } | null>(null);

  useEffect(() => {
    // Wait for auth session before fetching
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) return;
      Promise.all([
        getTodayStats().then(setToday).catch(console.error),
        getWeekStats().then(setWeek).catch(console.error),
        getSubjectStats().then(d => setSubjects(d.subjects)).catch(console.error),
        getTaskStats().then(d => setTasks(d.tasks)).catch(console.error),
        getActiveSession().then(d => setActive(d.session)).catch(console.error),
        getTaskProgress().then(d => setTaskProgress(d.progress)).catch(console.error),
        getStreak().then(setStreakData).catch(console.error),
      ]);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-fade-up">

        {/* BEM Countdown */}
        <BEMCountdown />

        {/* Active session banner */}
        {active && (
          <div className="bg-sage text-paper rounded-3xl px-6 py-4 flex items-center justify-between shadow-xl shadow-sage/20">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-paper pulse-ring" />
              <div>
                <span className="font-semibold">{active.subject}</span>
                {active.task_type && (
                  <span className="ml-2 text-paper/70 text-sm">
                    {TASK_CONFIG[active.task_type]?.icon} {active.task_type}
                  </span>
                )}
                {active.lesson_name && (
                  <span className="ml-2 text-paper/60 text-sm">— {active.lesson_name}</span>
                )}
              </div>
            </div>
            <a href="/sessions" className="text-paper/70 hover:text-paper text-sm font-semibold transition">
              View →
            </a>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Today"
            value={today ? formatDuration(today.total_minutes) : '—'}
            sub={today ? `${today.sessions} session${today.sessions !== 1 ? 's' : ''}` : ''}
          />
          <StatCard
            label="This Week"
            value={week ? formatDuration(week.total_minutes) : '—'}
            sub={week ? `${week.sessions} sessions` : ''}
          />
          <StatCard
            label="🔥 Streak"
            value={streakData ? `${streakData.streak}d` : '—'}
            sub={streakData ? `best: ${streakData.longest}d` : ''}
          />
          <StatCard
            label="Top Subject"
            value={subjects?.[0]?.subject || '—'}
            sub={subjects?.[0] ? formatDuration(subjects[0].minutes) : ''}
          />
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-display text-lg text-ink mb-5">Today by Subject</h3>
            <DailyChart stats={today} />
          </Card>
          <Card>
            <h3 className="font-display text-lg text-ink mb-5">Weekly Overview</h3>
            <WeeklyChart stats={week} />
          </Card>
        </div>

        {/* Task breakdown + Subject breakdown */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Task type breakdown */}
          <Card>
            <h3 className="font-display text-lg text-ink mb-5">By Task Type</h3>
            {!tasks ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-2xl bg-ink/5 animate-pulse" />)}
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-ink/30 text-sm text-center py-10">No sessions yet</p>
            ) : (
              <div className="space-y-4">
                {(['lesson','exercise','subject','bem'] as TaskType[]).map(type => {
                  const stat   = tasks.find(t => t.task_type === type);
                  const cfg    = TASK_CONFIG[type];
                  const total  = tasks.reduce((a, b) => a + b.minutes, 0);
                  const mins   = stat?.minutes || 0;
                  const pct    = total ? Math.round((mins / total) * 100) : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cfg.icon}</span>
                          <span className="text-sm font-semibold text-ink">{cfg.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold" style={{ color: cfg.color }}>
                            {mins ? formatDuration(mins) : '—'}
                          </span>
                          {stat && (
                            <span className="text-xs text-ink/30 ml-2">
                              {stat.sessions} session{stat.sessions !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-ink/8 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: cfg.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Subject pie */}
          <Card>
            <h3 className="font-display text-lg text-ink mb-5">Subject Distribution</h3>
            <SubjectPieChart subjects={subjects} />
          </Card>
        </div>

        {/* Task progress by subject */}
        {taskProgress && taskProgress.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg text-ink">Task Progress by Subject</h3>
              <a href="/tasks" className="text-xs font-semibold text-sage hover:underline">Manage tasks →</a>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {taskProgress.map((p) => {
                const colors: Record<string, string> = {
                  Math:      '#3C6EA6',
                  Physics:   '#C05E3C',
                  French:    '#7C4A7C',
                  Arabic:    '#4A7C59',
                  Science:   '#D4A017',
                  Hist_Geo:  '#6C4AA6',
                  English:   '#3C7C7C',
                  Islam_Edu: '#A67C3C',
                  Civil_Edu: '#C05E7C',
                };
                const color = colors[p.subject] || '#4A7C59';
                return (
                  <a href="/tasks" key={p.subject} className="text-center p-3 rounded-2xl border border-ink/8 bg-white/50 hover:border-ink/20 transition-all">
                    <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2 truncate">{p.subject}</p>
                    <p className="font-display text-2xl font-bold mb-2" style={{ color }}>{p.percent}%</p>
                    <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.percent}%`, background: color }} />
                    </div>
                    <p className="text-xs text-ink/30">{p.completed}/{p.total}</p>
                  </a>
                );
              })}
            </div>
          </Card>
        )}

        {/* All-time subject breakdown */}
        <Card>
          <h3 className="font-display text-lg text-ink mb-5">All-time by Subject</h3>
          {subjects && subjects.length > 0 ? (
            <div className="space-y-3">
              {subjects.map((s, i) => {
                const total  = subjects.reduce((a, b) => a + b.minutes, 0);
                const pct    = total ? Math.round((s.minutes / total) * 100) : 0;
                const colors = ['#4A7C59','#D4A017','#C05E3C','#3C6EA6','#7C4A7C','#4A7C7C'];
                const color  = colors[i % colors.length];
                return (
                  <div key={s.subject}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-ink">{s.subject}</span>
                      <span className="text-ink/50">{formatDuration(s.minutes)} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-ink/8 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-ink/30 text-sm text-center py-10">Complete some sessions to see your breakdown</p>
          )}
        </Card>

      </main>
    </>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="text-center py-5">
      <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2">{label}</p>
      <p className="font-display text-2xl text-ink leading-none mb-1">{value}</p>
      {sub && <p className="text-xs text-ink/40">{sub}</p>}
    </Card>
  );
}