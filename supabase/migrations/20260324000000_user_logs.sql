-- ─── user_logs table ─────────────────────────────────────────────────────────
-- Tracks Microsoft O365 user logins.
-- On first login: inserts a new row.
-- On subsequent logins: only last_login_at is updated (first_login_at preserved).

CREATE TABLE IF NOT EXISTS public.user_logs (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email           TEXT        NOT NULL UNIQUE,
  display_name    TEXT        NOT NULL,
  first_login_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon/authenticated key to read, insert, and update (needed by the frontend)
CREATE POLICY "user_logs_all" ON public.user_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups by email
CREATE INDEX IF NOT EXISTS idx_user_logs_email ON public.user_logs (email);
