# StudyTracker

A full-stack study tracking platform with Chrome extension for monitoring study sessions and browsing activity.

## Architecture

```
Chrome Extension
      │
      │ sends browsing activity (POST /activity)
      ▼
Backend API (Node.js + Express)
      │
      │ stores sessions & activity
      ▼
Database (Supabase / PostgreSQL)
      │
      │ queried by
      ▼
Frontend Dashboard (Next.js)
```

## Project Structure

```
studytracker/
├── README.md
├── database/
│   └── schema.sql               # PostgreSQL schema + seed data
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js             # Entry point
│       ├── config/
│       │   └── supabase.js      # Supabase client
│       ├── middleware/
│       │   ├── auth.js          # JWT verification
│       │   └── rateLimit.js     # Rate limiting
│       ├── controllers/
│       │   ├── sessions.js      # Session CRUD logic
│       │   ├── activity.js      # Browsing activity logic
│       │   └── stats.js         # Dashboard stats logic
│       └── routes/
│           ├── sessions.js      # /sessions routes
│           ├── activity.js      # /activity routes
│           └── stats.js         # /stats routes
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       # Root layout
│       │   ├── page.tsx         # Redirect to dashboard
│       │   ├── login/
│       │   │   └── page.tsx     # Login page
│       │   ├── dashboard/
│       │   │   └── page.tsx     # Stats dashboard
│       │   └── sessions/
│       │       └── page.tsx     # Active session + history
│       ├── components/
│       │   ├── ui/
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   └── Badge.tsx
│       │   ├── charts/
│       │   │   ├── DailyChart.tsx
│       │   │   ├── WeeklyChart.tsx
│       │   │   └── SubjectPieChart.tsx
│       │   └── session/
│       │       ├── SessionTimer.tsx
│       │       ├── SessionForm.tsx
│       │       └── SessionHistory.tsx
│       ├── lib/
│       │   ├── api.ts           # API client helpers
│       │   ├── supabase.ts      # Supabase browser client
│       │   └── utils.ts         # Formatters, helpers
│       └── types/
│           └── index.ts         # Shared TypeScript types
└── extension/
    ├── manifest.json            # MV3 manifest
    ├── popup.html               # Extension popup UI
    └── src/
        ├── background.js        # Service worker
        ├── content.js           # Content script
        └── popup.js             # Popup logic
```

## Quick Start

### 1. Database Setup
```bash
# Create a project at supabase.com
# Run database/schema.sql in the SQL editor
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # fill in your Supabase credentials
npm install
npm run dev                  # starts on http://localhost:3001
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local  # fill in API URL + Supabase credentials
npm install
npm run dev                  # starts on http://localhost:3000
```

### 4. Chrome Extension
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `extension/` folder
4. Click the extension icon to open the popup

## Environment Variables

### Backend `.env`
```
PORT=3001
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend  | Vercel   | `vercel --prod` in `/frontend` |
| Backend   | Render / Railway | Set env vars in dashboard |
| Database  | Supabase | Managed PostgreSQL |

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions/start` | Start a study session |
| POST | `/sessions/end` | End a session |
| GET  | `/sessions` | List all sessions |
| POST | `/activity` | Log browsing activity (extension) |
| GET  | `/stats/today` | Today's stats |
| GET  | `/stats/week` | Weekly stats |
| GET  | `/stats/subjects` | Per-subject breakdown |



























-- ============================================================
-- StudyTracker – PostgreSQL Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DROP POLICY IF EXISTS "users_select_own"  ON public.users;
DROP POLICY IF EXISTS "users_update_own"  ON public.users;
DROP POLICY IF EXISTS "sessions_select_own" ON public.study_sessions;
DROP POLICY IF EXISTS "sessions_insert_own" ON public.study_sessions;
DROP POLICY IF EXISTS "sessions_update_own" ON public.study_sessions;
DROP POLICY IF EXISTS "sessions_delete_own" ON public.study_sessions;
DROP POLICY IF EXISTS "activity_select_own" ON public.browsing_activity;
DROP POLICY IF EXISTS "activity_insert_own" ON public.browsing_activity;
DROP POLICY IF EXISTS "subjects_select_all" ON public.subjects;

-- ─────────────────────────────────────────────
-- USERS  (managed by Supabase Auth, extended here)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a public.users row when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- SUBJECTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subjects (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

INSERT INTO public.subjects (name) VALUES
  ('Math'),
  ('Physics'),
  ('French'),
  ('Arabic'),
  ('Science'),
  ('History/Geo'),
  ('English'),
  ('Islam Edu'),
  ('Civil Edu')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────
-- STUDY SESSIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  start_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time    TIMESTAMPTZ,
  duration    INTEGER,                          -- minutes
  difficulty  TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id   ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON public.study_sessions(start_time);

-- ─────────────────────────────────────────────
-- BROWSING ACTIVITY  (sent by Chrome extension)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.browsing_activity (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  domain      TEXT NOT NULL,
  time_spent  INTEGER NOT NULL,               -- seconds
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_session_id ON public.browsing_activity(session_id);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.browsing_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects          ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own row
CREATE POLICY "users_select_own"  ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own"  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Sessions: full CRUD on own sessions
CREATE POLICY "sessions_select_own" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON public.study_sessions FOR DELETE USING (auth.uid() = user_id);

-- Activity: access via session ownership
CREATE POLICY "activity_select_own" ON public.browsing_activity FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.study_sessions s
    WHERE s.id = session_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "activity_insert_own" ON public.browsing_activity FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.study_sessions s
    WHERE s.id = session_id AND s.user_id = auth.uid()

  ));
  -- Tasks progress table
CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  title       TEXT NOT NULL,
  task_type   TEXT NOT NULL CHECK (task_type IN ('lesson', 'exercise', 'subject', 'bem')),
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id  ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_subject  ON public.tasks(subject);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON public.tasks FOR DELETE USING (auth.uid() = user_id);
-- Add completed_at column to tasks to track when tasks were completed
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Auto-set completed_at when task is marked complete
CREATE OR REPLACE FUNCTION public.handle_task_completed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    NEW.completed_at = NOW();
  END IF;
  IF NEW.completed = FALSE THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_completed ON public.tasks;
CREATE TRIGGER on_task_completed
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_task_completed();
  -- Migration: replace difficulty/notes with task_type/lesson_name
ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS task_type   TEXT CHECK (task_type IN ('lesson', 'exercise', 'subject', 'bem')),
  ADD COLUMN IF NOT EXISTS lesson_name TEXT;
  -- BEM practice tracking table
CREATE TABLE IF NOT EXISTS public.bem_progress (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year       INTEGER NOT NULL CHECK (year BETWEEN 2017 AND 2025),
  subject    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'not_yet' CHECK (status IN ('not_yet', 'ongoing', 'solved')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, subject)
);

ALTER TABLE public.bem_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bem_select_own" ON public.bem_progress;
DROP POLICY IF EXISTS "bem_insert_own" ON public.bem_progress;
DROP POLICY IF EXISTS "bem_update_own" ON public.bem_progress;
DROP POLICY IF EXISTS "bem_delete_own" ON public.bem_progress;

CREATE POLICY "bem_select_own" ON public.bem_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bem_insert_own" ON public.bem_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bem_update_own" ON public.bem_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bem_delete_own" ON public.bem_progress FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.bem_progress (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year       INTEGER NOT NULL CHECK (year BETWEEN 2017 AND 2025),
  subject    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'not_yet' CHECK (status IN ('not_yet', 'ongoing', 'solved')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, subject)
);
-- Optionally keep old columns for backwards compat, or drop them:
-- ALTER TABLE public.study_sessions DROP COLUMN difficulty;
-- ALTER TABLE public.study_sessions DROP COLUMN notes;

-- Subjects: public read
CREATE POLICY "subjects_select_all" ON public.subjects FOR SELECT USING (true);
