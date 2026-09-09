-- ==============================================================================
-- College Club Website - Full Supabase Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Create the `profiles` table linked to `auth.users`
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- In case profiles table already existed, ensure `details`, `failed_login_count`, and `locked_until` columns are added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'details'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN details JSONB DEFAULT '{}'::jsonb NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'failed_login_count'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN failed_login_count INT DEFAULT 0 NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'locked_until'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Indexes on profiles for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Enable Row Level Security (RLS) on `profiles`
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Profiles RLS Policies:
-- Users can only SELECT their own profile row
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can only UPDATE their own profile row
-- Note: Column-level restrictions are not enforced by standard RLS in Postgres.
-- The backend must strip the `role` and `id` fields on update routes to prevent privilege escalation.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Note on Profiles INSERT:
-- We intentionally DO NOT create a public INSERT policy for public.profiles.
-- Profile rows must ONLY be inserted server-side by the backend application
-- using the Supabase Service Role key (which bypasses RLS).


-- ==============================================================================
-- 5. Events Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Authenticated users (students & admins) can view events (read-only for students)
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
CREATE POLICY "Authenticated users can view events"
    ON public.events
    FOR SELECT
    TO authenticated
    USING (true);


-- ==============================================================================
-- 6. Forms Table (per event)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    schema JSONB DEFAULT '{}'::jsonb NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    submission_limit INTEGER,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure expires_at and submission_limit columns are added if table already existed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'forms' 
          AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE public.forms ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'forms' 
          AND column_name = 'submission_limit'
    ) THEN
        ALTER TABLE public.forms ADD COLUMN submission_limit INTEGER;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_forms_event_id ON public.forms(event_id);

-- Enable RLS on forms
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view forms
DROP POLICY IF EXISTS "Authenticated users can view forms" ON public.forms;
CREATE POLICY "Authenticated users can view forms"
    ON public.forms
    FOR SELECT
    TO authenticated
    USING (true);


-- ==============================================================================
-- 7. Form Submissions Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answers JSONB DEFAULT '{}'::jsonb NOT NULL,
    attended BOOLEAN DEFAULT false NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure attended, ticket_id, and email_sent columns are added if table already existed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'form_submissions' 
          AND column_name = 'attended'
    ) THEN
        ALTER TABLE public.form_submissions ADD COLUMN attended BOOLEAN DEFAULT false NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'form_submissions' 
          AND column_name = 'ticket_id'
    ) THEN
        ALTER TABLE public.form_submissions ADD COLUMN ticket_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'form_submissions' 
          AND column_name = 'email_sent'
    ) THEN
        ALTER TABLE public.form_submissions ADD COLUMN email_sent BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Unique constraint to prevent duplicate submissions per user per form
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_form_submissions_form_user'
    ) THEN
        ALTER TABLE public.form_submissions
        ADD CONSTRAINT uq_form_submissions_form_user UNIQUE (form_id, user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.form_submissions(user_id);

-- Enable RLS on form submissions
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Students can insert their own submissions
DROP POLICY IF EXISTS "Users can insert own submissions" ON public.form_submissions;
CREATE POLICY "Users can insert own submissions"
    ON public.form_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON public.form_submissions;
CREATE POLICY "Users can view own submissions"
    ON public.form_submissions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);


-- ==============================================================================
-- 8. User Google Tokens Table (for Google Calendar Integration & Reminders)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_google_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on user_google_tokens
ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read their own Google tokens
DROP POLICY IF EXISTS "Users can read own google tokens" ON public.user_google_tokens;
CREATE POLICY "Users can read own google tokens"
    ON public.user_google_tokens
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can only update their own Google tokens
DROP POLICY IF EXISTS "Users can update own google tokens" ON public.user_google_tokens;
CREATE POLICY "Users can update own google tokens"
    ON public.user_google_tokens
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);


-- ==============================================================================
-- 9. Activity Logs Table (Audit Trail with Geolocation & IP)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    location JSONB DEFAULT '{}'::jsonb,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes on activity_logs for audit querying and filtering
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins can view activity logs
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view activity logs"
    ON public.activity_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Note: No client-side INSERT policy exists on activity_logs.
-- All logs are written server-side exclusively via the Supabase Service Role client.


-- ==============================================================================
-- 10. User Calendar Events Table (Server-Side Persistence for Added to Calendar)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    calendar_event_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique constraint to prevent duplicate calendar additions per user per event
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_calendar_events_user_event'
    ) THEN
        ALTER TABLE public.user_calendar_events
        ADD CONSTRAINT uq_user_calendar_events_user_event UNIQUE (user_id, event_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON public.user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_event_id ON public.user_calendar_events(event_id);

-- Enable RLS on user_calendar_events
ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own calendar additions
DROP POLICY IF EXISTS "Users can view own calendar additions" ON public.user_calendar_events;
CREATE POLICY "Users can view own calendar additions"
    ON public.user_calendar_events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own calendar additions
DROP POLICY IF EXISTS "Users can insert own calendar additions" ON public.user_calendar_events;
CREATE POLICY "Users can insert own calendar additions"
    ON public.user_calendar_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 11. Gmail Service Tokens Table (System-wide OAuth2 Refresh Token for Gmail API)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gmail_service_tokens (
    id TEXT PRIMARY KEY DEFAULT 'default',
    refresh_token TEXT NOT NULL,
    email TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on gmail_service_tokens (Server-side service role only)
ALTER TABLE public.gmail_service_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view gmail service tokens" ON public.gmail_service_tokens;
CREATE POLICY "Admins can view gmail service tokens"
    ON public.gmail_service_tokens
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );


-- ==============================================================================
-- 12. Email Queue Table (Fault-tolerant Async Staging for Registration Emails)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT NOT NULL,
    attendee_name TEXT,
    subject TEXT NOT NULL,
    html TEXT NOT NULL,
    text TEXT,
    ticket_id TEXT,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.form_submissions(id) ON DELETE CASCADE,
    attachments JSONB DEFAULT '[]'::jsonb,
    headers JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    attempts INT DEFAULT 0 NOT NULL,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_event_id ON public.email_queue(event_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_submission_id ON public.email_queue(submission_id);

-- Enable RLS on email_queue
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Admins can view and monitor email queue
DROP POLICY IF EXISTS "Admins can view email queue" ON public.email_queue;
CREATE POLICY "Admins can view email queue"
    ON public.email_queue
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );


