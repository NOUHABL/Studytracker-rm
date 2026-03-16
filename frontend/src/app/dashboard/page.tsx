'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/ui/Navbar';
import { Card } from '@/components/ui';
import { DailyChart, WeeklyChart, SubjectPieChart } from '@/components/charts';
import { getTodayStats, getWeekStats, getSubjectStats, getActiveSession } from '@/lib/api';
import { formatDuration } from '@/lib/utils';
import type { TodayStats, WeekStats, SubjectStat, StudySession } from '@/types';

export default function DashboardPage() {
  const [today,    setToday]    = useState<TodayStats | null>(null);
  const [week,     setWeek]     = useState<WeekStats | null>(null);
  const [subjects, setSubjects] = useState<SubjectStat[] | null>(null);
  const [active,   setActive]   = useState<StudySession | null>(null);

  useEffect(() => {
    Promise.all([
      getTodayStats().then(setToday).catch(console.error),
      getWeekStats().then(setWeek).catch(console.error),
      getSubjectStats().then(d => setSubjects(d.subjects)).catch(console.error),
      getActiveSession().then(d => setActive(d.session)).catch(console.error),
    ]);
  }, []);

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-fade-up">
        {/* Active session banner */}
        {active && (
          <div className="bg-sage text-paper rounded-3xl px-6 py-4 flex items-center justify-between shadow-xl shadow-sage/20">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-paper pulse-ring" />
              <span className="font-semibold">Active session: {active.subject}</span>
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
            label="Subjects"
            value={subjects ? String(subjects.length) : '—'}
            sub="studied overall"
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

        {/* Subject breakdown */}
        <div className="grid md:grid-cols-5 gap-6">
          <Card className="md:col-span-2">
            <h3 className="font-display text-lg text-ink mb-5">Subject Distribution</h3>
            <SubjectPieChart subjects={subjects} />
          </Card>

          <Card className="md:col-span-3">
            <h3 className="font-display text-lg text-ink mb-5">All-time Breakdown</h3>
            {subjects && subjects.length > 0 ? (
              <div className="space-y-3">
                {subjects.map((s, i) => {
                  const total = subjects.reduce((a, b) => a + b.minutes, 0);
                  const pct   = total ? Math.round((s.minutes / total) * 100) : 0;
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
        </div>
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
