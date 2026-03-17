'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/sessions',  label: 'Sessions',  icon: '◉' },
  { href: '/tasks',     label: 'Tasks',     icon: '◎' },
  { href: '/bem',       label: 'BEM',       icon: '🎯' },
  { href: '/profile',   label: 'Profile',   icon: '◐' },
];

export default function Navbar() {
  const path   = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) setUser({
        email: u.email || '',
        name:  u.user_metadata?.name || u.email?.split('@')[0] || 'Student',
      });
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u) {
        setUser({
          email: u.email || '',
          name:  u.user_metadata?.name || u.email?.split('@')[0] || 'Student',
        });
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  }

  // Get initials for avatar
  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
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
          {user && NAV.map(n => (
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

          {user ? (
            /* Logged in: avatar + name + sign out */
            <div className="flex items-center gap-2 ml-2">
              {/* Avatar circle with initials */}
              <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center shadow-sm">
                <span className="text-paper text-xs font-bold">{getInitials(user.name)}</span>
              </div>
              {/* Name (hidden on small screens) */}
              <span className="hidden sm:block text-sm font-semibold text-ink/70 max-w-[120px] truncate">
                {user.name}
              </span>
              {/* Sign out */}
              <button
                onClick={signOut}
                className="ml-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-ink/40 hover:text-ink hover:bg-ink/5 border border-ink/8 transition-all"
              >
                Sign out
              </button>
            </div>
          ) : (
            /* Not logged in: login button */
            <Link
              href="/login"
              className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-sage text-paper hover:bg-sage-dark transition-all shadow-md shadow-sage/20"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              <span>Log in</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}