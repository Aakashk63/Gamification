-- ============================================================================
-- CampusXP: Complete Backend Fix Migration
-- Run this in your Supabase SQL Editor → https://supabase.com/dashboard
-- ============================================================================

-- ============================================================================
-- PART 1: Add `status` column to public.team_members
-- Fixes: "Could not find the 'status' column of 'team_members' in the schema cache"
-- ============================================================================

ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Add the check constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_members_status_check' 
      AND table_name = 'team_members'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.team_members
    ADD CONSTRAINT team_members_status_check
    CHECK (status IN ('pending', 'accepted', 'declined'));
  END IF;
END $$;

-- Add joined_at column in case it is missing too
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================================
-- PART 2: Fix the UNIQUE constraint on team_members
-- The old UNIQUE(student_id) prevents re-invitations after decline.
-- Change to UNIQUE(team_id, student_id) to allow per-team membership tracking.
-- ============================================================================

ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_student_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'team_members_team_id_student_id_key'
      AND table_name = 'team_members'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.team_members
    ADD CONSTRAINT team_members_team_id_student_id_key 
    UNIQUE (team_id, student_id);
  END IF;
END $$;

-- ============================================================================
-- PART 3: Fix RLS on public.profiles
-- Allows the signup page to read mentor profiles BEFORE user is authenticated.
-- Without this, the mentor dropdown shows "No mentors found" during registration.
-- ============================================================================

-- Ensure RLS is still enabled (DO NOT disable it globally)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old/duplicate policies that may conflict
DROP POLICY IF EXISTS "Public can read mentor profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read mentor profiles" ON public.profiles;
DROP POLICY IF EXISTS "Mentors are publicly readable" ON public.profiles;

-- Create the safe, minimal SELECT policy for mentor discovery on signup
-- Only exposes mentor rows to anon and authenticated roles
CREATE POLICY "Public can read mentor profiles" ON public.profiles
    FOR SELECT
    TO anon, authenticated
    USING (role = 'mentor');

-- Authenticated users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Authenticated users can read all student profiles (needed for mentor portal)
DROP POLICY IF EXISTS "Authenticated can read student profiles" ON public.profiles;
CREATE POLICY "Authenticated can read student profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to INSERT their own profile (needed during signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to UPDATE their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Allow any authenticated user to update a mentor profile's students[] array
-- (needed when a student signs up and we add them to the mentor's roster)
DROP POLICY IF EXISTS "Authenticated can update mentor students list" ON public.profiles;
CREATE POLICY "Authenticated can update mentor students list" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (role = 'mentor');

-- ============================================================================
-- PART 4: RLS for public.team_members
-- ============================================================================

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read team members
DROP POLICY IF EXISTS "Anyone can read team members" ON public.team_members;
CREATE POLICY "Anyone can read team members" ON public.team_members
    FOR SELECT
    TO authenticated
    USING (true);

-- Mentors can insert team members for their own teams
DROP POLICY IF EXISTS "Mentors can insert team members" ON public.team_members;
CREATE POLICY "Mentors can insert team members" ON public.team_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id
              AND t.mentor_id = auth.uid()
        )
    );

-- Mentors can update and delete team members in their own teams
DROP POLICY IF EXISTS "Mentors can manage their team members" ON public.team_members;
CREATE POLICY "Mentors can manage their team members" ON public.team_members
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id
              AND t.mentor_id = auth.uid()
        )
    );

-- Students can update their own team membership status (accept or decline)
DROP POLICY IF EXISTS "Students can update own team membership" ON public.team_members;
CREATE POLICY "Students can update own team membership" ON public.team_members
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = student_id);

-- Students can delete their own team membership record (when they decline)
DROP POLICY IF EXISTS "Students can delete own team membership" ON public.team_members;
CREATE POLICY "Students can delete own team membership" ON public.team_members
    FOR DELETE
    TO authenticated
    USING (auth.uid() = student_id);

-- ============================================================================
-- PART 5: Auto-sync trigger for mentor students[] JSONB column
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_mentor_students_on_student_profile()
RETURNS TRIGGER AS $$
DECLARE
  student_display_name TEXT;
  old_mentor_students  JSONB;
  new_mentor_students  JSONB;
BEGIN
  IF NEW.role <> 'student' THEN
    RETURN NEW;
  END IF;

  student_display_name := NEW.full_name;

  -- Remove from OLD mentor when mentor changes
  IF TG_OP = 'UPDATE' AND OLD.mentor_id IS NOT NULL AND 
     COALESCE(OLD.mentor_id::TEXT, '') <> COALESCE(NEW.mentor_id::TEXT, '') THEN

    SELECT students INTO old_mentor_students
    FROM public.profiles WHERE id = OLD.mentor_id;

    IF old_mentor_students IS NOT NULL THEN
      SELECT COALESCE(jsonb_agg(v), '[]'::jsonb)
      INTO old_mentor_students
      FROM jsonb_array_elements_text(old_mentor_students) AS v
      WHERE v <> student_display_name;

      UPDATE public.profiles
      SET students = old_mentor_students
      WHERE id = OLD.mentor_id;
    END IF;
  END IF;

  -- Add to new mentor's students array
  IF NEW.mentor_id IS NOT NULL THEN
    SELECT students INTO new_mentor_students
    FROM public.profiles WHERE id = NEW.mentor_id;

    IF new_mentor_students IS NULL OR jsonb_typeof(new_mentor_students) <> 'array' THEN
      new_mentor_students := '[]'::jsonb;
    END IF;

    IF NOT (new_mentor_students @> jsonb_build_array(student_display_name)) THEN
      new_mentor_students := new_mentor_students || jsonb_build_array(student_display_name);
      UPDATE public.profiles
      SET students = new_mentor_students
      WHERE id = NEW.mentor_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_mentor_students ON public.profiles;
CREATE TRIGGER trg_sync_mentor_students
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_mentor_students_on_student_profile();

-- ============================================================================
-- PART 6: One-time migration — fix existing students with NULL mentor_id
-- Only assigns when mentor_name matches a real mentor profile (safe).
-- ============================================================================

DO $$
DECLARE
  s      RECORD;
  m_rec  RECORD;
BEGIN
  FOR s IN
    SELECT id, full_name, mentor_name
    FROM public.profiles
    WHERE role = 'student' AND mentor_id IS NULL AND mentor_name IS NOT NULL AND mentor_name <> ''
  LOOP
    SELECT id, full_name INTO m_rec
    FROM public.profiles
    WHERE role = 'mentor' AND lower(trim(full_name)) = lower(trim(s.mentor_name))
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.profiles
      SET mentor_id = m_rec.id,
          mentor_name = m_rec.full_name
      WHERE id = s.id;

      RAISE NOTICE 'Fixed: student "%" -> mentor "%" (%)', s.full_name, m_rec.full_name, m_rec.id;
    ELSE
      RAISE NOTICE 'No mentor match for student "%" with mentor_name="%"', s.full_name, s.mentor_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Verify results:
-- SELECT id, full_name, role, mentor_id, mentor_name FROM public.profiles ORDER BY role;
-- SELECT id, team_id, student_id, status, joined_at FROM public.team_members;
-- ============================================================================
