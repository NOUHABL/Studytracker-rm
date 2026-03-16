'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { subjectColor, formatDuration } from '@/lib/utils';
import type { WeekStats, SubjectStat, TodayStats } from '@/types';

// ── Daily / Subject Bar ───────────────────────────────────────
interface DailyChartProps { stats: TodayStats | null; }

export function DailyChart({ stats }: DailyChartProps) {
  if (!stats) return <ChartSkeleton />;
  const data = Object.entries(stats.by_subject).map(([subject, minutes]) => ({ subject, minutes }));
  if (!data.length) return <EmptyChart label="No sessions today" />;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={28}>
        <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#0D0D0D80' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="bg-white shadow-xl rounded-xl px-3 py-2 text-xs font-semibold text-ink border border-ink/8">
                {payload[0].payload.subject}: {formatDuration(payload[0].value as number)}
              </div>
            ) : null
          }
        />
        <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={subjectColor(i)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Weekly Bar ────────────────────────────────────────────────
interface WeeklyChartProps { stats: WeekStats | null; }

export function WeeklyChart({ stats }: WeeklyChartProps) {
  if (!stats) return <ChartSkeleton />;

  // Build 7-day array
  const days: { day: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key  = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-GB', { weekday: 'short' });
    days.push({ day: label, minutes: stats.by_day[key] || 0 });
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={days} barSize={22}>
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#0D0D0D80' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="bg-white shadow-xl rounded-xl px-3 py-2 text-xs font-semibold text-ink border border-ink/8">
                {payload[0].payload.day}: {formatDuration(payload[0].value as number)}
              </div>
            ) : null
          }
        />
        <Bar dataKey="minutes" fill="#4A7C59" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Subject Pie ───────────────────────────────────────────────
interface SubjectPieChartProps { subjects: SubjectStat[] | null; }

export function SubjectPieChart({ subjects }: SubjectPieChartProps) {
  if (!subjects) return <ChartSkeleton />;
  if (!subjects.length) return <EmptyChart label="No data yet" />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={subjects}
          dataKey="minutes"
          nameKey="subject"
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
        >
          {subjects.map((_, i) => <Cell key={i} fill={subjectColor(i)} />)}
        </Pie>
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-ink/60">{value}</span>}
        />
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="bg-white shadow-xl rounded-xl px-3 py-2 text-xs font-semibold text-ink border border-ink/8">
                {payload[0].name}: {formatDuration(payload[0].value as number)}
              </div>
            ) : null
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function ChartSkeleton() {
  return <div className="h-48 rounded-2xl bg-ink/5 animate-pulse" />;
}
function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-48 flex items-center justify-center text-ink/30 text-sm">{label}</div>
  );
}
