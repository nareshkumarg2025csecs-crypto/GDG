-- ==============================================================================
-- Security Hardening Migration: Supabase RLS, Grants & Privilege Escalation Prevention
-- Migration: 20261016_security_hardening.sql
-- ==============================================================================

-- 1. Tighten public.profiles Security & Prevent Privilege Escalation
-- Revoke direct table updates from browser roles (anon & authenticated).
-- Profile role, lockout counters, and account credentials must strictly be modified
-- by authorized server-side operations via Supabase service_role.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;

-- Ensure users can only read their own profile row
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- If column-level updates are permitted for user details (full_name, details),
-- restrict strictly to non-privileged fields and prevent role modification:
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        -- Prevent changing the role or security lockout state
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Privilege Escalation Detected: Role cannot be modified directly.';
        END IF;
        IF NEW.locked_until IS DISTINCT FROM OLD.locked_until THEN
            RAISE EXCEPTION 'Security Policy Violation: Account lockout status is server-managed.';
        END IF;
        IF NEW.failed_login_count IS DISTINCT FROM OLD.failed_login_count THEN
            RAISE EXCEPTION 'Security Policy Violation: Login counters are server-managed.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_role_escalation();


-- 2. Secure public.form_submissions
-- Revoke direct INSERT, UPDATE, and DELETE from browser roles (anon & authenticated).
-- All submissions, attendance verification, ticket allocation, and certificate states
-- MUST be processed through Express backend APIs with server-side validation.
REVOKE INSERT, UPDATE, DELETE ON public.form_submissions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.form_submissions FROM authenticated;

-- Attendees can view ONLY their own submissions
DROP POLICY IF EXISTS "Users can insert own submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON public.form_submissions;
CREATE POLICY "Users can view own submissions"
    ON public.form_submissions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Enforce strict database uniqueness on ticket_id to eliminate collisions
CREATE UNIQUE INDEX IF NOT EXISTS idx_form_submissions_ticket_id 
    ON public.form_submissions(ticket_id) 
    WHERE ticket_id IS NOT NULL;


-- 3. Protect Google Shared Service Tokens
-- Remove ALL browser-role access to shared Gmail and Drive OAuth refresh tokens.
-- These tables must be accessible strictly by the backend service_role client.
REVOKE ALL ON public.gmail_service_tokens FROM anon;
REVOKE ALL ON public.gmail_service_tokens FROM authenticated;
DROP POLICY IF EXISTS "Admins can view gmail service tokens" ON public.gmail_service_tokens;

REVOKE ALL ON public.drive_service_tokens FROM anon;
REVOKE ALL ON public.drive_service_tokens FROM authenticated;
DROP POLICY IF EXISTS "Admins can view drive service tokens" ON public.drive_service_tokens;


-- 4. Secure the Email Queue
-- Email queue staging contains private attendee emails, confirmation HTML, and delivery errors.
-- Revoke browser role access completely; queue is managed exclusively by backend email services.
REVOKE ALL ON public.email_queue FROM anon;
REVOKE ALL ON public.email_queue FROM authenticated;
DROP POLICY IF EXISTS "Admins can view email queue" ON public.email_queue;


-- 5. Secure Event Certificate Configurations
-- Certificate Python scripts, output formats, and email templates must be controlled
-- exclusively by authorized admins via Express endpoints.
REVOKE ALL ON public.event_certificates FROM anon;
REVOKE ALL ON public.event_certificates FROM authenticated;
DROP POLICY IF EXISTS "Admins can manage event certificates" ON public.event_certificates;


-- 6. Secure Events & Forms
-- Read-only for authenticated and anonymous users; write operations restricted to backend service_role.
REVOKE INSERT, UPDATE, DELETE ON public.events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.events FROM authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.forms FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.forms FROM authenticated;

GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.events TO authenticated;

GRANT SELECT ON public.forms TO anon;
GRANT SELECT ON public.forms TO authenticated;

-- Ensure RLS is active on all public application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_service_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_service_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_certificates ENABLE ROW LEVEL SECURITY;
