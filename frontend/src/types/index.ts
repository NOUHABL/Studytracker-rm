export type Role       = 'student' | 'viewer';
export type TaskType   = 'lesson' | 'exercise' | 'subject' | 'bem';

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
  duration: number | null;
  task_type: TaskType | null;
  lesson_name: string | null;
  created_at: string;
}

export interface BrowsingActivity {
  id: string;
  session_id: string;
  url: string;
  domain: string;
  time_spent: number;
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

export interface TaskStat {
  task_type: TaskType;
  minutes: number;
  sessions: number;
}

export interface Task {
  id: string;
  user_id: string;
  subject: string;
  title: string;
  task_type: TaskType;
  completed: boolean;
  created_at: string;
}

export interface SubjectProgress {
  subject: string;
  total: number;
  completed: number;
  percent: number;
}