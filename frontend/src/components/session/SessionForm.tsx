'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

const SUBJECTS = ['Math', 'Physics', 'French', 'Arabic', 'Science', 'His/geo', 'English', 'Islam Edu', 'Civil Edu'];
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

interface Props {
  onStart: (subject: string, difficulty: string, notes: string) => void;
  loading?: boolean;
}

export default function SessionForm({ onStart, loading }: Props) {
  const [subject,    setSubject]    = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [notes,      setNotes]      = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject) return;
    onStart(subject, difficulty, notes);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Subject */}
      <div>
        <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">Subject</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

      {/* Difficulty */}
      <div>
        <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">Difficulty</label>
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => {
            const colors: Record<string, string> = { easy: 'text-emerald-600 bg-emerald-50 border-emerald-200', medium: 'text-amber-600 bg-amber-50 border-amber-200', hard: 'text-red-600 bg-red-50 border-red-200' };
            return (
              <button
                type="button"
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border capitalize transition-all ${
                  difficulty === d ? colors[d] + ' shadow-sm' : 'bg-white/50 border-ink/8 text-ink/40'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">Notes <span className="normal-case font-normal">(optional)</span></label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. BEM 2021 exercises, chapter 4…"
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-ink/10 bg-paper/50 text-ink placeholder:text-ink/30 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 resize-none transition text-sm"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={!subject || loading}
        className="w-full"
      >
        {loading ? 'Starting…' : '▶  Start Session'}
      </Button>
    </form>
  );
}
