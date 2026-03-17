'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import type { TaskType } from '@/types';

const SUBJECTS = ['Math', 'Physics', 'French', 'Arabic', 'Science', 'Hist_Geo', 'English', 'Islam_Edu', 'Civil_Edu'];

const TASK_TYPES: { value: TaskType; label: string; icon: string; desc: string }[] = [
  { value: 'lesson',   label: 'Lesson',   icon: '📖', desc: 'Studying a new lesson'    },
  { value: 'exercise', label: 'Exercise', icon: '✏️', desc: 'Solving exercises'         },
  { value: 'subject',  label: 'Subject',  icon: '📚', desc: 'General subject review'    },
  { value: 'bem',      label: 'BEM Prep', icon: '🎯', desc: 'BEM exam preparation'      },
];

interface Props {
  onStart: (subject: string, task_type: TaskType, lesson_name: string) => void;
  loading?: boolean;
}

export default function SessionForm({ onStart, loading }: Props) {
  const [subject,     setSubject]     = useState('');
  const [taskType,    setTaskType]    = useState<TaskType | ''>('');
  const [lessonName,  setLessonName]  = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !taskType) return;
    onStart(subject, taskType, lessonName);
  }

  const needsLesson = taskType === 'lesson' || taskType === 'exercise';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Subject */}
      <div>
        <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
          Subject
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SUBJECTS.map(s => (
            <button
              type="button"
              key={s}
              onClick={() => setSubject(s)}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all ${
                subject === s
                  ? 'bg-sage text-paper border-sage shadow-md shadow-sage/20'
                  : 'bg-white/50 border-ink/8 text-ink/60 hover:border-sage/50 hover:text-sage'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Task Type */}
      <div>
        <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
          Task Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TASK_TYPES.map(t => (
            <button
              type="button"
              key={t.value}
              onClick={() => setTaskType(t.value)}
              className={`py-3 px-3 rounded-xl text-sm font-semibold border transition-all text-left ${
                taskType === t.value
                  ? 'bg-sage text-paper border-sage shadow-md shadow-sage/20'
                  : 'bg-white/50 border-ink/8 text-ink/60 hover:border-sage/50 hover:text-sage'
              }`}
            >
              <span className="block text-base mb-0.5">{t.icon}</span>
              <span className="block">{t.label}</span>
              <span className={`block text-xs mt-0.5 font-normal ${taskType === t.value ? 'text-paper/70' : 'text-ink/30'}`}>
                {t.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lesson name — shown for lesson or exercise */}
      {needsLesson && (
        <div>
          <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
            {taskType === 'lesson' ? 'Lesson Name' : 'Exercise / Topic'}
            <span className="normal-case font-normal ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={lessonName}
            onChange={e => setLessonName(e.target.value)}
            placeholder={taskType === 'lesson' ? 'e.g. Chapter 4 – Vectors' : 'e.g. BEM 2021 Series'}
            className="w-full px-4 py-3 rounded-xl border border-ink/10 bg-paper/50 text-ink placeholder:text-ink/30 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition text-sm"
          />
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={!subject || !taskType || loading}
        className="w-full"
      >
        {loading ? 'Starting…' : '▶  Start Session'}
      </Button>
    </form>
  );
}