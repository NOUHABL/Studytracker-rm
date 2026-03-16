'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/sessions',  label: 'Sessions',  icon: '◉' },
];

export default function Navbar() {
  const path   = usePathname();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="sticky top-0 z-30 backdrop-blur-md bg-paper/80 border-b border-ink/8">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sage flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-display font-bold text-ink">StudyTracker</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                path === n.href
                  ? 'bg-sage/10 text-sage'
                  : 'text-ink/50 hover:text-ink hover:bg-ink/5'
              }`}
            >
              <span>{n.icon}</span>
              <span className="hidden sm:inline">{n.label}</span>
            </Link>
          ))}

          <button
            onClick={signOut}
            className="ml-2 px-3 py-2 rounded-xl text-sm font-semibold text-ink/40 hover:text-ink hover:bg-ink/5 transition-all"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
