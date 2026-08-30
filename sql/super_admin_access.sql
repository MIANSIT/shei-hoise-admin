-- Run this in Supabase Studio → SQL Editor before deploying the super-admin
-- login restriction.
--
-- Two things happen here:
--   1. miansofficial@gmail.com is promoted to user_type = 'super_admin'.
--   2. A row-level policy lets any signed-in user read their OWN users row.
--
-- Step 2 is not optional. Both the middleware gate
-- (src/lib/supabase/middleware.ts) and the login check
-- (src/app/component/auth/LoginForm.tsx) resolve the caller's role with the
-- anon key under the caller's own session. Those checks fail CLOSED, so if
-- RLS blocks the self-select, nobody can reach the dashboard — including the
-- super admin. Reading your own row exposes nothing you didn't already own.
--
-- Re-running this script is safe.

-- 1. Promote the super admin ------------------------------------------------

UPDATE public.users
SET user_type = 'super_admin'
WHERE email = 'miansofficial@gmail.com';

-- Fail loudly rather than silently deploying a panel nobody can enter.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE email = 'miansofficial@gmail.com'
      AND user_type = 'super_admin'
  ) THEN
    RAISE EXCEPTION
      'No public.users row for miansofficial@gmail.com. Create the account first (Supabase Auth + a matching public.users row), then re-run this script.';
  END IF;
END $$;

-- 2. Let a signed-in user read their own row --------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_row" ON public.users;
CREATE POLICY "users_select_own_row"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
