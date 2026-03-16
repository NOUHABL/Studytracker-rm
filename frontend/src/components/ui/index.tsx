// ── Button ────────────────────────────────────────────────────
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-sage text-paper shadow-md shadow-sage/20 hover:bg-sage-dark',
    secondary: 'bg-ink/8 text-ink hover:bg-ink/12',
    danger:    'bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-600',
    ghost:     'text-ink/60 hover:text-ink hover:bg-ink/5',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3.5 text-base' };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; className?: string; }

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white/70 backdrop-blur-sm border border-ink/8 rounded-3xl p-6 shadow-lg shadow-ink/4 ${className}`}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
interface BadgeProps { label: string; color?: string; }

export function Badge({ label, color = '#4A7C59' }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold"
      style={{ background: `${color}18`, color }}
    >
      {label}
    </span>
  );
}
