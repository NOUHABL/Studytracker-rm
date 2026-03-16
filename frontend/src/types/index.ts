// ── Shared TypeScript types ───────────────────────────────────

export type Role = 'student' | 'viewer';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject: string;
  start_time: string;
  end_time: string | null;
  duration: number | null; // minutes
  difficulty: Difficulty | null;
  notes: string | null;
  created_at: string;
}

export interface BrowsingActivity {
  id: string;
  session_id: string;
  url: string;
  domain: string;
  time_spent: number; // seconds
  timestamp: string;
}

export interface TodayStats {
  date: string;
  total_minutes: number;
  sessions: number;
  by_subject: Record<string, number>;
}

export interface WeekStats {
  week_start: string;
  total_minutes: number;
  sessions: number;
  by_day: Record<string, number>;
}

export interface SubjectStat {
  subject: string;
  minutes: number;
}
