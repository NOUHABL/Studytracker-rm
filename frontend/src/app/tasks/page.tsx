'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import { Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { getTasks, createTask, updateTask, deleteTask, getTaskProgress, getStreak } from '@/lib/api';
import type { Task, TaskType, SubjectProgress } from '@/types';

const SUBJECTS = ['Math', 'Physics', 'French', 'Arabic', 'Science', 'Hist_Geo', 'English', 'Islam_Edu', 'Civil_Edu'];

const TASK_TYPES: { value: TaskType; label: string; icon: string }[] = [
  { value: 'lesson',   label: 'Lesson',   icon: '📖' },
  { value: 'exercise', label: 'Exercise', icon: '✏️' },
  { value: 'subject',  label: 'Subject',  icon: '📚' },
  { value: 'bem',      label: 'BEM Prep', icon: '🎯' },
];

const SUBJECT_COLORS: Record<string, string> = {
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

// ── Confetti ──────────────────────────────────────────────────
function Confetti({ color }: { color: string }) {
  const particles = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 80,
    y: -(Math.random() * 60 + 20),
    rotate: Math.random() * 360,
    scale: Math.random() * 0.6 + 0.4,
    delay: Math.random() * 0.15,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 50 }}>
      <style>{`
        @keyframes confetti-fly {
          0%   { opacity:1; transform:translate(-50%,-50%) translateX(0) translateY(0) rotate(0deg) scale(1); }
          100% { opacity:0; transform:translate(-50%,-50%) translateX(var(--tx)) translateY(var(--ty)) rotate(var(--r)) scale(var(--s)); }
        }
        @keyframes check-pop {
          0%   { transform:scale(0.5); opacity:0; }
          60%  { transform:scale(1.25); opacity:1; }
          100% { transform:scale(1); opacity:1; }
        }
        @keyframes row-flash {
          0%,100% { opacity:1; }
          50%     { opacity:0.6; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} className="absolute w-2 h-2 rounded-sm" style={{
          left:'50%', top:'50%',
          background: p.id%3===0 ? color : p.id%3===1 ? '#D4A017' : '#F5F0E8',
          animation: `confetti-fly 0.6s ease-out ${p.delay}s forwards`,
          '--tx': `${p.x}px`, '--ty': `${p.y}px`, '--r': `${p.rotate}deg`, '--s': p.scale, opacity: 0,
        } as React.CSSProperties}/>
      ))}
    </div>
  );
}

// ── Task Row ──────────────────────────────────────────────────
function TaskRow({ task, color, justChecked, onToggle, onDelete }: {
  task: Task;
  color: string;
  justChecked: string | null;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const typeInfo = TASK_TYPES.find(t => t.value === task.task_type);
  const isJust   = justChecked === task.id;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all group mb-2 ${
        task.completed ? 'bg-ink/3 border-ink/5' : 'bg-white/60 border-ink/8 hover:border-ink/15'
      }`}
      style={{ animation: isJust ? 'row-flash 0.5s ease-out' : undefined }}
    >
      {/* Checkbox */}
      <div className="relative flex-shrink-0">
        {isJust && <Confetti color={color} />}
        <button
          onClick={() => onToggle(task)}
          className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all"
          style={{
            borderColor: task.completed ? color : '#D1D5DB',
            background:  task.completed ? color : 'transparent',
            animation:   isJust ? 'check-pop 0.35s cubic-bezier(.36,.07,.19,.97) forwards' : undefined,
          }}
        >
          {task.completed && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      <span className="text-base flex-shrink-0">{typeInfo?.icon}</span>

      <span className={`flex-1 text-sm font-semibold ${task.completed ? 'line-through text-ink/30' : 'text-ink'}`}>
        {task.title}
      </span>

      <span className="hidden sm:block text-xs font-semibold px-2 py-0.5 rounded-lg flex-shrink-0"
        style={{ background: `${color}15`, color }}>
        {typeInfo?.label}
      </span>

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg text-ink/30 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all flex-shrink-0"
      >×</button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function TasksPage() {
  const router = useRouter();
  const [selected,    setSelected]    = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('tasks_subject') || 'Math' : 'Math'
  );
  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [progress,    setProgress]    = useState<SubjectProgress[]>([]);
  const [streak,      setStreak]      = useState<{ streak: number; longest: number; active_days: string[] } | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [newTitle,    setNewTitle]    = useState('');
  const [newType,     setNewType]     = useState<TaskType>('lesson');
  const [adding,      setAdding]      = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [addError,    setAddError]    = useState('');
  const [authReady,   setAuthReady]   = useState(false);
  const [justChecked, setJustChecked] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.push('/login');
      else setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // Load when auth ready or subject changes
  useEffect(() => {
    if (!authReady) return;
    loadData();
  }, [authReady, selected]);

  async function loadData() {
    setLoading(true);
    try {
      const [t, p, s] = await Promise.all([
        getTasks(selected),
        getTaskProgress(),
        getStreak(),
      ]);
      setTasks(t.tasks);
      setProgress(p.progress);
      setStreak(s);
    } catch (e) { console.error('loadData error:', e); }
    setLoading(false);
  }

  function handleSelectSubject(sub: string) {
    setSelected(sub);
    localStorage.setItem('tasks_subject', sub);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      const { task } = await createTask({ subject: selected, title: newTitle.trim(), task_type: newType });
      setTasks(prev => [...prev, task]);
      const p = await getTaskProgress();
      setProgress(p.progress);
      setNewTitle('');
      setShowForm(false);
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Failed to save task');
    }
    setAdding(false);
  }

  async function handleToggle(task: Task) {
    try {
      const { task: updated } = await updateTask(task.id, { completed: !task.completed });
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (!task.completed) {
        setJustChecked(task.id);
        setTimeout(() => setJustChecked(null), 800);
      }
      const [p, s] = await Promise.all([getTaskProgress(), getStreak()]);
      setProgress(p.progress);
      setStreak(s);
    } catch (e) { console.error(e); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      const p = await getTaskProgress();
      setProgress(p.progress);
    } catch (e) { console.error(e); }
  }

  if (!authReady) {
    return (
      <>
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-10">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-ink/5 animate-pulse" />)}
          </div>
        </main>
      </>
    );
  }

  const pending   = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  const percent   = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
  const color     = SUBJECT_COLORS[selected] || '#4A7C59';

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-fade-up">

        {/* Streak banner */}
        {streak && (
          <div className={`rounded-3xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl ${
            streak.streak >= 7 ? 'bg-amber text-ink shadow-amber/20' :
            streak.streak >= 1 ? 'bg-sage text-paper shadow-sage/20' :
                                 'bg-ink/5 text-ink'
          }`}>
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {streak.streak === 0 ? '💤' : streak.streak >= 7 ? '🔥' : '✨'}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-0.5">Current Streak</p>
                <p className="font-display text-3xl font-bold leading-none">
                  {streak.streak} {streak.streak === 1 ? 'day' : 'days'}
                </p>
                <p className="text-xs mt-1 opacity-60">
                  {streak.streak === 0 ? 'Complete a task today to start!' :
                   streak.streak >= 7 ? "You're on fire! 🔥" : "Don't break the chain!"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">Best</p>
                <p className="font-display text-2xl font-bold">{streak.longest}</p>
                <p className="text-xs opacity-50">days</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">Last 7 days</p>
                <div className="flex gap-1.5">
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const day    = d.toISOString().slice(0, 10);
                    const active = streak.active_days.includes(day);
                    return (
                      <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{
                          background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)',
                          border: i === 6 ? '2px solid rgba(255,255,255,0.5)' : 'none',
                        }}>
                        {active ? '✓' : '·'}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subject progress grid */}
        <div>
          <h2 className="font-display text-2xl text-ink mb-4">Task Progress</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {SUBJECTS.map(sub => {
              const p   = progress.find(p => p.subject === sub);
              const pct = p?.percent || 0;
              const col = SUBJECT_COLORS[sub] || '#4A7C59';
              return (
                <button key={sub} onClick={() => handleSelectSubject(sub)}
                  className="text-left p-3 rounded-2xl border transition-all"
                  style={selected === sub
                    ? { borderColor: col, borderWidth: 2, background: `${col}08` }
                    : { background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(13,13,13,0.08)' }
                  }>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1 truncate">{sub}</p>
                  {p ? (
                    <>
                      <p className="font-display text-xl font-bold mb-1.5" style={{ color: col }}>{pct}%</p>
                      <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col }} />
                      </div>
                      <p className="text-xs text-ink/30 mt-1">{p.completed}/{p.total}</p>
                    </>
                  ) : (
                    <p className="text-xs text-ink/25 mt-1">No tasks</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task list card */}
        <Card>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-xl text-ink">{selected}</h3>
              {tasks.length > 0 && (
                <p className="text-sm text-ink/40 mt-0.5">
                  {completed.length} of {tasks.length} completed · {percent}%
                </p>
              )}
            </div>
            <button onClick={() => { setShowForm(!showForm); setAddError(''); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: `${color}15`, color }}>
              <span className="text-lg">{showForm ? '✕' : '+'}</span>
              {showForm ? 'Cancel' : 'Add Task'}
            </button>
          </div>

          {/* Progress bar */}
          {tasks.length > 0 && (
            <div className="h-3 bg-ink/8 rounded-full overflow-hidden mb-6">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, background: color }} />
            </div>
          )}

          {/* Add form */}
          {showForm && (
            <form onSubmit={handleAdd} className="mb-6 p-4 rounded-2xl border border-ink/8 bg-white/50 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">Task Name</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 – Quadratic equations" autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-ink/10 bg-paper/50 text-ink placeholder:text-ink/30 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">Type</label>
                <div className="flex gap-2">
                  {TASK_TYPES.map(t => (
                    <button type="button" key={t.value} onClick={() => setNewType(t.value)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        newType === t.value ? 'text-paper border-transparent' : 'bg-white/50 border-ink/8 text-ink/50'
                      }`}
                      style={newType === t.value ? { background: color } : {}}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={!newTitle.trim() || adding}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-paper transition-all disabled:opacity-50"
                style={{ background: color }}>
                {adding ? 'Adding…' : 'Add Task'}
              </button>
              {addError && <p className="text-red-600 text-xs bg-red-50 rounded-xl px-3 py-2">{addError}</p>}
            </form>
          )}

          {/* Tasks */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-2xl bg-ink/5 animate-pulse" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-ink/30">
              <p className="text-4xl mb-3">📝</p>
              <p className="font-medium">No tasks for {selected} yet</p>
              <p className="text-sm mt-1">Click "+ Add Task" to get started</p>
            </div>
          ) : (
            <div>
              {pending.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-ink/30 uppercase tracking-wider mb-2">
                    ◦ Pending ({pending.length})
                  </p>
                  {pending.map(task => (
                    <TaskRow key={task.id} task={task} color={color} justChecked={justChecked}
                      onToggle={handleToggle} onDelete={handleDelete} />
                  ))}
                </div>
              )}
              {completed.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-ink/30 uppercase tracking-wider mb-2">
                    ✓ Completed ({completed.length})
                  </p>
                  {completed.map(task => (
                    <TaskRow key={task.id} task={task} color={color} justChecked={justChecked}
                      onToggle={handleToggle} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}