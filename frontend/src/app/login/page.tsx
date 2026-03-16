'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode]       = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push('/dashboard');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      setMessage('Check your email to confirm your account.');
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-sage/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sage text-paper mb-5 shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl text-ink">StudyTracker</h1>
          <p className="text-ink/50 text-sm mt-1 font-light">Track your progress, master your subjects</p>
        </div>

        {/* Card */}
        <div className="bg-white/70 backdrop-blur-sm border border-ink/8 rounded-3xl p-8 shadow-xl shadow-ink/5">
          {/* Toggle */}
          <div className="flex bg-ink/5 rounded-2xl p-1 mb-7">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setMessage(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  mode === m ? 'bg-white text-sage shadow-sm' : 'text-ink/40'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-ink/10 bg-paper/50 text-ink placeholder:text-ink/30 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-ink/10 bg-paper/50 text-ink placeholder:text-ink/30 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition"
              />
            </div>

            {error   && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}
            {message && <p className="text-sage  text-sm bg-sage/10 rounded-xl px-4 py-2">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sage hover:bg-sage-dark text-paper font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-sage/20 mt-2"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
