'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/ui/Navbar';
import { Card } from '@/components/ui';
import SessionForm    from '@/components/session/SessionForm';
import SessionTimer   from '@/components/session/SessionTimer';
import SessionHistory from '@/components/session/SessionHistory';
import { startSession, endSession, listSessions, getActiveSession } from '@/lib/api';
import type { StudySession } from '@/types';

export default function SessionsPage() {
  const [active,   setActive]   = useState<StudySession | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending,   setEnding]   = useState(false);
  const [error,    setError]    = useState('');

  const refresh = useCallback(async () => {
    const [activeRes, listRes] = await Promise.all([
      getActiveSession(),
      listSessions({ limit: 50 }),
    ]);
    setActive(activeRes.session);
    setSessions(listRes.sessions);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleStart(subject: string, difficulty: string, notes: string) {
    setStarting(true);
    setError('');
    try {
      const { session } = await startSession({ subject, difficulty, notes });
      setActive(session);
      setSessions(prev => [session, ...prev]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start session');
    }
    setStarting(false);
  }

  async function handleEnd() {
    if (!active) return;
    setEnding(true);
    setError('');
    try {
      const { session } = await endSession({ session_id: active.id });
      setActive(null);
      setSessions(prev => prev.map(s => s.id === session.id ? session : s));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to end session');
    }
    setEnding(false);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-fade-up">
        <div className="grid md:grid-cols-5 gap-6">
          {/* Left: start / active */}
          <div className="md:col-span-2">
            <Card>
              {active ? (
                <SessionTimer session={active} onEnd={handleEnd} ending={ending} />
              ) : (
                <>
                  <h2 className="font-display text-xl text-ink mb-6">Start a Session</h2>
                  {error && (
                    <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2 mb-4">{error}</p>
                  )}
                  <SessionForm onStart={handleStart} loading={starting} />
                </>
              )}
            </Card>

            {/* Quick tips */}
            <div className="mt-4 p-4 rounded-2xl border border-ink/8 bg-white/40 text-xs text-ink/40 space-y-1.5">
              <p className="font-semibold text-ink/50 text-xs uppercase tracking-wider mb-2">💡 Tips</p>
              <p>Install the Chrome extension to auto-track browsing activity during sessions.</p>
              <p>Use notes to record topics covered, e.g. "BEM 2021 exercises".</p>
            </div>
          </div>

          {/* Right: history */}
          <Card className="md:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-ink">Session History</h2>
              <span className="text-xs text-ink/40 font-semibold bg-ink/5 px-3 py-1 rounded-full">
                {sessions.length} total
              </span>
            </div>
            <SessionHistory sessions={sessions} loading={loading} />
          </Card>
        </div>
      </main>
    </>
  );
}
