-- Login attempt tracking for basic rate limiting
-- 5 failed attempts within 15 minutes locks an email out temporarily.
-- This table is public-writable via a security-definer RPC so the
-- anon key can record attempts without exposing the table directly.

CREATE TABLE IF NOT EXISTS login_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  succeeded   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by email + time window
CREATE INDEX IF NOT EXISTS login_attempts_email_time
  ON login_attempts (email, created_at DESC);

-- No RLS needed — this table is only touched via security-definer functions below.
-- Direct access is blocked by not granting SELECT/INSERT to anon/authenticated roles.
REVOKE ALL ON login_attempts FROM anon, authenticated;

-- Function: record one attempt and return whether the email is currently locked out.
-- Returns true if locked (too many recent failures), false if allowed.
CREATE OR REPLACE FUNCTION check_login_rate_limit(p_email text, p_succeeded boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_failures int;
BEGIN
  -- Insert this attempt
  INSERT INTO login_attempts (email, succeeded) VALUES (p_email, p_succeeded);

  -- Count failures in the last 15 minutes (only matters for failed attempts)
  SELECT COUNT(*) INTO v_recent_failures
  FROM login_attempts
  WHERE email = p_email
    AND succeeded = false
    AND created_at > now() - interval '15 minutes';

  -- Locked if 5 or more recent failures
  RETURN v_recent_failures >= 5;
END;
$$;

-- Grant execute to authenticated and anon so server actions can call it
GRANT EXECUTE ON FUNCTION check_login_rate_limit(text, boolean) TO anon, authenticated;

-- Clean up old attempts daily (keep last 24h only) to prevent table bloat
CREATE OR REPLACE FUNCTION cleanup_login_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM login_attempts WHERE created_at < now() - interval '24 hours';
$$;
