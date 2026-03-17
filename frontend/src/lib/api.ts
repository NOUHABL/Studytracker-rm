import { supabase } from './supabase';
import type { StudySession, TodayStats, WeekStats, SubjectStat, TaskStat, Task, SubjectProgress } from '@/types';

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

// ── Sessions ──────────────────────────────────────────────────
export async function startSession(payload: {
  subject: string;
  task_type: string;
  lesson_name?: string;
}): Promise<{ session_id: string; session: StudySession }> {
  return request('/sessions/start', { method: 'POST', body: JSON.stringify(payload) });
}

export async function endSession(payload: {
  session_id: string;
  lesson_name?: string;
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

export async function getTaskStats(): Promise<{ tasks: TaskStat[] }> {
  return request('/stats/tasks');
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

// ── Tasks ─────────────────────────────────────────────────────
export async function getTasks(subject?: string): Promise<{ tasks: Task[] }> {
  const qs = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return request(`/tasks${qs}`);
}

export async function createTask(payload: {
  subject: string;
  title: string;
  task_type: string;
}): Promise<{ task: Task }> {
  return request('/tasks', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateTask(id: string, payload: {
  completed?: boolean;
  title?: string;
}): Promise<{ task: Task }> {
  return request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function deleteTask(id: string): Promise<void> {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}

export async function getTaskProgress(): Promise<{ progress: SubjectProgress[] }> {
  return request('/tasks/progress');
}

export async function getStreak(): Promise<{
  streak: number;
  longest: number;
  last_active: string | null;
  active_days: string[];
}> {
  return request('/tasks/streak');
}

// ── BEM ───────────────────────────────────────────────────────
export async function getBEMProgress(): Promise<{
  progress: Record<number, Record<string, string>>;
  stats: { total: number; solved: number; ongoing: number; not_yet: number };
}> {
  return request('/bem');
}

export async function updateBEMStatus(payload: {
  year: number;
  subject: string;
  status: 'not_yet' | 'ongoing' | 'solved';
}): Promise<void> {
  return request('/bem', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Profile ───────────────────────────────────────────────────
export interface WeekHistory {
  week_start:    string;
  total_minutes: number;
  sessions:      number;
  by_subject:    Record<string, number>;
  by_task_type:  Record<string, number>;
  by_day:        Record<string, number>;
}

export async function getProfileData(): Promise<{
  user: { name: string; email: string; created_at: string };
  stats: {
    total_minutes: number;
    total_sessions: number;
    best_subject: string | null;
    best_subject_minutes: number;
    member_since: string;
  };
}> {
  return request('/profile/me');
}

export async function getWeeklyHistory(weeks?: number): Promise<{
  history: WeekHistory[];
  total_weeks: number;
}> {
  return request(`/profile/history${weeks ? `?weeks=${weeks}` : ''}`);
}