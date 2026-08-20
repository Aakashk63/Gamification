-- ============================================================================
-- FIX: Mentor Assignment RLS Policies
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix public.profiles RLS policies
-- ============================================================================

-- Allow anyone (including unauthenticated users on signup page) to read mentor profiles
-- This is needed so the signup form can populate the mentor dropdown
DROP POLICY IF EXISTS "Public can read mentor profiles" ON public.profiles;
CREATE POLICY "Public can read mentor profiles" ON public.profiles
    FOR SELECT USING (role = 'mentor');

-- Allow authenticated users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to read student profiles (needed for mentor portal)
DROP POLICY IF EXISTS "Authenticated can read student profiles" ON public.profiles;
CREATE POLICY "Authenticated can read student profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to INSERT their own profile (needed at signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to UPDATE their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow mentors to update their own students array (needed when student signs up)
DROP POLICY IF EXISTS "Mentors can update students list" ON public.profiles;
CREATE POLICY "Mentors can update students list" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 2: Fix team_members UNIQUE constraint
-- The existing UNIQUE(student_id) prevents a student from being in multiple 
-- pending invitations. Change it to UNIQUE(team_id, student_id) instead.
-- ============================================================================
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_student_id_key;
ALTER TABLE public.team_members ADD CONSTRAINT IF NOT EXISTS team_members_team_id_student_id_key UNIQUE (team_id, student_id);

-- ============================================================================
-- STEP 3: Allow team members insert by mentor
-- ============================================================================
DROP POLICY IF EXISTS "Mentors can insert team members" ON public.team_members;
CREATE POLICY "Mentors can insert team members" ON public.team_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_members.team_id 
            AND t.mentor_id = auth.uid()
        )
    );

-- Students can update their own team_member status (accept/decline)
DROP POLICY IF EXISTS "Students can update own team membership" ON public.team_members;
CREATE POLICY "Students can update own team membership" ON public.team_members
    FOR UPDATE USING (auth.uid() = student_id);

-- Students can delete their own team_member record (decline removes record)
DROP POLICY IF EXISTS "Students can delete own team membership" ON public.team_members;
CREATE POLICY "Students can delete own team membership" ON public.team_members
    FOR DELETE USING (auth.uid() = student_id);

-- ============================================================================
-- STEP 4: Sync trigger — auto-update mentor's students[] on profile insert/update
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_mentor_students_on_student_profile()
RETURNS TRIGGER AS $$
DECLARE
  student_display_name TEXT;
  old_mentor_students JSONB;
  new_mentor_students JSONB;
BEGIN
  IF NEW.role <> 'student' THEN
    RETURN NEW;
  END IF;

  student_display_name := NEW.full_name;

  -- On mentor change: remove from old mentor
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
    
    IF new_mentor_students IS NULL THEN
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
-- STEP 5: One-time migration — fix existing students with NULL mentor_id
-- where mentor_name is known and matches a real mentor profile
-- ============================================================================
DO $$
DECLARE
  s RECORD;
  mentor_record RECORD;
  mentor_students JSONB;
BEGIN
  FOR s IN 
    SELECT id, full_name, mentor_name 
    FROM public.profiles 
    WHERE role = 'student' AND mentor_id IS NULL AND mentor_name IS NOT NULL
  LOOP
    -- Try to find mentor by name
    SELECT id, full_name, students INTO mentor_record
    FROM public.profiles
    WHERE role = 'mentor' AND lower(full_name) = lower(s.mentor_name)
    LIMIT 1;
    
    IF FOUND THEN
      -- Update the student's mentor_id
      UPDATE public.profiles
      SET mentor_id = mentor_record.id,
          mentor_name = mentor_record.full_name
      WHERE id = s.id;
      
      RAISE NOTICE 'Fixed student % → mentor %', s.full_name, mentor_record.full_name;
    ELSE
      RAISE NOTICE 'Could not resolve mentor for student: % (mentor_name: %)', s.full_name, s.mentor_name;
    END IF;
  END LOOP;
END $$;
