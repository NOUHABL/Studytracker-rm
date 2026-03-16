'use client';

import { useEffect, useState } from 'react';
import { formatTimer } from '@/lib/utils';
import type { StudySession } from '@/types';

interface Props {
  session: StudySession;
  onEnd: () => void;
  ending?: boolean;
}

export default function SessionTimer({ session, onEnd, ending }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(session.start_time).getTime();
    const tick  = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.start_time]);

  return (
    <div className="text-center py-6">
      {/* Pulsing indicator */}
      <div className="inline-flex items-center gap-2 text-sage text-sm font-semibold mb-4 bg-sage/10 px-4 py-1.5 rounded-full">
        <span className="w-2 h-2 rounded-full bg-sage pulse-ring" />
        Active Session
      </div>

      {/* Subject */}
      <h2 className="font-display text-2xl text-ink mb-1">{session.subject}</h2>
      {session.difficulty && (
        <p className="text-ink/40 text-sm capitalize mb-6">{session.difficulty}</p>
      )}

      {/* Timer */}
      <div className="font-display text-6xl text-ink tracking-tight mb-2">
        {formatTimer(elapsed)}
      </div>
      <p className="text-ink/40 text-xs mb-8">hh : mm : ss</p>

      <button
        onClick={onEnd}
        disabled={ending}
        className="px-10 py-4 bg-ink text-paper rounded-2xl font-semibold text-lg hover:bg-ink/80 active:scale-95 transition-all disabled:opacity-50 shadow-xl"
      >
        {ending ? 'Stopping…' : 'Stop Session'}
      </button>
    </div>
  );
}
