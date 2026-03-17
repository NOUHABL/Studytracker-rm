'use client';

import { formatDate, formatTime, formatDuration } from '@/lib/utils';
import { Badge } from '@/components/ui';
import type { StudySession, TaskType } from '@/types';

interface Props { sessions: StudySession[]; loading?: boolean; }

const TASK_COLORS: Record<TaskType, string> = {
  lesson:   '#3C6EA6',
  exercise: '#4A7C59',
  subject:  '#7C4A7C',
  bem:      '#D4A017',
};

const TASK_ICONS: Record<TaskType, string> = {
  lesson:   '📖',
  exercise: '✏️',
  subject:  '📚',
  bem:      '🎯',
};

export default function SessionHistory({ sessions, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-ink/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="text-center py-16 text-ink/30">
        <p className="text-4xl mb-3">📚</p>
        <p className="font-medium">No sessions yet</p>
        <p className="text-sm">Start your first session above</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink/40 text-xs uppercase tracking-wider border-b border-ink/8">
            <th className="pb-3 pr-4 font-semibold">Date</th>
            <th className="pb-3 pr-4 font-semibold">Subject</th>
            <th className="pb-3 pr-4 font-semibold">Task</th>
            <th className="pb-3 pr-4 font-semibold">Duration</th>
            <th className="pb-3 font-semibold hidden md:table-cell">Lesson / Topic</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {sessions.map(s => (
            <tr key={s.id} className="hover:bg-ink/2 transition-colors">
              <td className="py-3.5 pr-4 text-ink/50 whitespace-nowrap">
                {formatDate(s.start_time)}
                <span className="block text-xs text-ink/30">{formatTime(s.start_time)}</span>
              </td>
              <td className="py-3.5 pr-4 font-semibold text-ink">{s.subject}</td>
              <td className="py-3.5 pr-4">
                {s.task_type ? (
                  <Badge
                    label={`${TASK_ICONS[s.task_type]} ${s.task_type}`}
                    color={TASK_COLORS[s.task_type]}
                  />
                ) : '—'}
              </td>
              <td className="py-3.5 pr-4 font-mono text-sage font-semibold">
                {s.duration ? formatDuration(s.duration) : (
                  <span className="text-amber text-xs">ongoing</span>
                )}
              </td>
              <td className="py-3.5 text-ink/50 max-w-xs truncate hidden md:table-cell">
                {s.lesson_name || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}