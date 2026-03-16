-- ============================================================
-- StudyTracker – PostgreSQL Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  ('History'),
  ('English'),
  ('Philosophy')
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

-- Subjects: public read
CREATE POLICY "subjects_select_all" ON public.subjects FOR SELECT USING (true);
