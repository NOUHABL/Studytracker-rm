import { supabase } from './supabase';
import type { StudySession, TodayStats, WeekStats, SubjectStat } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...headers, ...options?.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

// ── Sessions ─────────────────────────────────────────────────

export async function startSession(payload: {
  subject: string;
  difficulty?: string;
  notes?: string;
}): Promise<{ session_id: string; session: StudySession }> {
  return request('/sessions/start', { method: 'POST', body: JSON.stringify(payload) });
}

export async function endSession(payload: {
  session_id: string;
  notes?: string;
  difficulty?: string;
}): Promise<{ session: StudySession }> {
  return request('/sessions/end', { method: 'POST', body: JSON.stringify(payload) });
}

export async function listSessions(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ sessions: StudySession[]; total: number }> {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return request(`/sessions${qs ? `?${qs}` : ''}`);
}

// ── Stats ─────────────────────────────────────────────────────

export async function getTodayStats(): Promise<TodayStats> {
  return request('/stats/today');
}

export async function getWeekStats(): Promise<WeekStats> {
  return request('/stats/week');
}

export async function getSubjectStats(): Promise<{ subjects: SubjectStat[] }> {
  return request('/stats/subjects');
}

export async function getActiveSession(): Promise<{ session: StudySession | null }> {
  return request('/stats/active');
}

// ── Activity ──────────────────────────────────────────────────

export async function logActivity(payload: {
  session_id: string;
  url: string;
  time_spent: number;
}): Promise<void> {
  return request('/activity', { method: 'POST', body: JSON.stringify(payload) });
}
