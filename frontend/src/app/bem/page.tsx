'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import { supabase } from '@/lib/supabase';
import { getBEMProgress, updateBEMStatus } from '@/lib/api';

const YEARS    = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const SUBJECTS = ['Math', 'Physics', 'French', 'Arabic', 'Science', 'Hist_Geo', 'English', 'Islam_Edu', 'Civil_Edu'];

type Status = 'not_yet' | 'ongoing' | 'solved';

const STATUS_CONFIG: Record<Status, { label: string; icon: string; bg: string; text: string; border: string }> = {
  not_yet: { label: 'Not yet',  icon: '○', bg: 'bg-ink/4',        text: 'text-ink/30',  border: 'border-ink/8'  },
  ongoing: { label: 'Ongoing',  icon: '◑', bg: 'bg-amber/15',     text: 'text-amber',   border: 'border-amber/30' },
  solved:  { label: 'Solved',   icon: '●', bg: 'bg-sage/15',      text: 'text-sage',    border: 'border-sage/30'  },
};

const NEXT_STATUS: Record<Status, Status> = {
  not_yet: 'ongoing',
  ongoing: 'solved',
  solved:  'not_yet',
};

const SUBJECT_SHORT: Record<string, string> = {
  Math:      'Math',
  Physics:   'Phys',
  French:    'Fr',
  Arabic:    'Ar',
  Science:   'Sci',
  Hist_Geo:  'H/G',
  English:   'Eng',
  Islam_Edu: 'Isl',
  Civil_Edu: 'Civ',
};

export default function BEMPage() {
  const router = useRouter();
type BEMProgress = Record<number, Record<string, Status>>;
const [progress, setProgress] = useState<BEMProgress>({});
  const [stats,    setStats]    = useState<{ total: number; solved: number; ongoing: number; not_yet: number } | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState<string | null>(null); // "year-subject"

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { router.push('/login'); return; }
     getBEMProgress().then(d => {
  setProgress(d.progress as BEMProgress);
  setStats(d.stats);
  setLoading(false);
}).catch(console.error);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function handleClick(year: number, subject: string) {
    const key    = `${year}-${subject}`;
    const current: Status = progress[year]?.[subject] || 'not_yet';
    const next   = NEXT_STATUS[current];

    setUpdating(key);

    // Optimistic update
    setProgress(prev => ({
      ...prev,
      [year]: { ...prev[year], [subject]: next },
    }));

    try {
      await updateBEMStatus({ year, subject, status: next });
      // Refresh stats
      const d = await getBEMProgress();
      setStats(d.stats);
    } catch (e) {
      // Revert on error
      setProgress(prev => ({
        ...prev,
        [year]: { ...prev[year], [subject]: current },
      }));
      console.error(e);
    }
    setUpdating(null);
  }

  const solvedPct = stats ? Math.round((stats.solved / stats.total) * 100) : 0;
  const ongoingPct = stats ? Math.round((stats.ongoing / stats.total) * 100) : 0;

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8 animate-fade-up">

        {/* Header */}
        <div>
          <h1 className="font-display text-3xl text-ink mb-1">BEM Practice Tracker</h1>
          <p className="text-ink/40 text-sm">Click a cell to cycle through: Not yet → Ongoing → Solved</p>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="bg-white/70 backdrop-blur-sm border border-ink/8 rounded-3xl p-6 shadow-lg">
            <div className="grid grid-cols-3 gap-6 mb-5">
              <div className="text-center">
                <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-1">Solved</p>
                <p className="font-display text-3xl font-bold text-sage">{stats.solved}</p>
                <p className="text-xs text-ink/30">{solvedPct}% of total</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-1">Ongoing</p>
                <p className="font-display text-3xl font-bold text-amber">{stats.ongoing}</p>
                <p className="text-xs text-ink/30">{ongoingPct}% of total</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-1">Not Yet</p>
                <p className="font-display text-3xl font-bold text-ink/40">{stats.not_yet}</p>
                <p className="text-xs text-ink/30">{100 - solvedPct - ongoingPct}% of total</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-3 bg-ink/8 rounded-full overflow-hidden flex">
              <div className="h-full bg-sage transition-all duration-700"    style={{ width: `${solvedPct}%` }} />
              <div className="h-full bg-amber transition-all duration-700"   style={{ width: `${ongoingPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-ink/30 mt-1.5">
              <span>{stats.solved} solved</span>
              <span>{stats.total} total papers</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                {cfg.icon}
              </span>
              <span className="text-ink/50 font-medium">{cfg.label}</span>
            </div>
          ))}
          <span className="text-ink/30 text-xs ml-2">— click to cycle</span>
        </div>

        {/* Table */}
        <div className="bg-white/70 backdrop-blur-sm border border-ink/8 rounded-3xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[...Array(9)].map((_, i) => <div key={i} className="h-10 rounded-xl bg-ink/5 animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink/8">
                    <th className="text-left px-5 py-4 text-xs font-bold text-ink/40 uppercase tracking-wider w-20">
                      Year
                    </th>
                    {SUBJECTS.map(sub => (
                      <th key={sub} className="px-2 py-4 text-center">
                        <div className="text-xs font-bold text-ink/50 uppercase tracking-wider">
                          {SUBJECT_SHORT[sub]}
                        </div>
                        <div className="text-xs text-ink/30 font-normal hidden sm:block">{sub}</div>
                      </th>
                    ))}
                    <th className="px-4 py-4 text-center text-xs font-bold text-ink/40 uppercase tracking-wider">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {YEARS.slice().reverse().map(year => {
                    const yearData  = progress[year] || {};
                    const solvedN   = SUBJECTS.filter(s => yearData[s] === 'solved').length;
                    const ongoingN  = SUBJECTS.filter(s => yearData[s] === 'ongoing').length;
                    const yearPct   = Math.round((solvedN / SUBJECTS.length) * 100);

                    return (
                      <tr key={year} className="hover:bg-ink/2 transition-colors group">
                        {/* Year */}
                        <td className="px-5 py-3">
                          <span className="font-display text-lg font-bold text-ink">{year}</span>
                        </td>

                        {/* Subject cells */}
                        {SUBJECTS.map(subject => {
                          const status: Status = yearData[subject] || 'not_yet';
                          const cfg    = STATUS_CONFIG[status];
                          const key    = `${year}-${subject}`;
                          const isUpdating = updating === key;

                          return (
                            <td key={subject} className="px-2 py-3 text-center">
                              <button
                                onClick={() => handleClick(year, subject)}
                                disabled={isUpdating}
                                title={`${year} ${subject} — ${cfg.label} (click to change)`}
                                className={`
                                  w-10 h-10 rounded-xl border font-bold text-sm
                                  transition-all duration-200 mx-auto flex items-center justify-center
                                  hover:scale-110 active:scale-95 disabled:opacity-50
                                  ${cfg.bg} ${cfg.text} ${cfg.border}
                                  ${isUpdating ? 'animate-pulse' : ''}
                                `}
                              >
                                {isUpdating ? '…' : cfg.icon}
                              </button>
                            </td>
                          );
                        })}

                        {/* Row progress */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <div className="flex-1 h-2 bg-ink/8 rounded-full overflow-hidden">
                              <div className="h-full bg-sage rounded-full transition-all duration-500"
                                style={{ width: `${yearPct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-ink/40 w-8 text-right">
                              {solvedN}/{SUBJECTS.length}
                            </span>
                          </div>
                          {ongoingN > 0 && (
                            <p className="text-xs text-amber font-semibold mt-0.5 text-center">
                              {ongoingN} ongoing
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Column totals */}
                <tfoot className="border-t-2 border-ink/10 bg-ink/3">
                  <tr>
                    <td className="px-5 py-3 text-xs font-bold text-ink/40 uppercase tracking-wider">Total</td>
                    {SUBJECTS.map(subject => {
                      const solvedCount  = YEARS.filter(y => progress[y]?.[subject] === 'solved').length;
                      const ongoingCount = YEARS.filter(y => progress[y]?.[subject] === 'ongoing').length;
                      const pct          = Math.round((solvedCount / YEARS.length) * 100);
                      return (
                        <td key={subject} className="px-2 py-3 text-center">
                          <div className={`text-sm font-bold ${solvedCount === YEARS.length ? 'text-sage' : 'text-ink/50'}`}>
                            {solvedCount}/{YEARS.length}
                          </div>
                          {ongoingCount > 0 && (
                            <div className="text-xs text-amber font-semibold">{ongoingCount}▶</div>
                          )}
                          <div className="w-8 h-1 bg-ink/8 rounded-full overflow-hidden mx-auto mt-1">
                            <div className="h-full bg-sage rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-sage">{solvedPct}%</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}