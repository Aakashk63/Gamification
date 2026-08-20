-- ============================================================================
-- CampusXP: Auto Assign Mentor on Signup Trigger
-- Run this in your Supabase SQL Editor → https://supabase.com/dashboard
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEAN UP ANY OLD TRIGGERS AND FUNCTIONS
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================================
-- STEP 2: CREATE THE AFTER-INSERT TRIGGER FUNCTION ON AUTH.USERS
-- SECURITY DEFINER allows this trigger to bypass all RLS policies.
-- search_path is set to empty to follow Supabase security best practices.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role            TEXT;
  v_full_name       TEXT;
  v_mentor_id_text  TEXT;
  v_mentor_id       UUID;
  v_mentor_name     TEXT;
  v_mentor_students JSONB;
BEGIN
  -- 1. Read role and full name from user metadata
  v_role := NEW.raw_user_meta_data->>'role';
  v_full_name := NEW.raw_user_meta_data->>'name';
  IF v_full_name IS NULL THEN
    v_full_name := NEW.raw_user_meta_data->>'full_name';
  END IF;

  -- Default fallbacks
  IF v_role IS NULL THEN
    v_role := 'student';
  END IF;
  IF v_full_name IS NULL THEN
    v_full_name := SPLIT_PART(NEW.email, '@', 1);
  END IF;

  v_full_name := TRIM(v_full_name);

  -- 2. Process student role
  IF v_role = 'student' THEN
    -- Get mentor ID (checking both camelCase and snake_case keys)
    v_mentor_id_text := COALESCE(
      NEW.raw_user_meta_data->>'mentorId',
      NEW.raw_user_meta_data->>'mentor_id'
    );

    IF v_mentor_id_text IS NULL OR v_mentor_id_text = '' THEN
      RAISE EXCEPTION 'Please select a mentor before creating your account.';
    END IF;

    -- Safely convert to UUID
    BEGIN
      v_mentor_id := v_mentor_id_text::UUID;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Invalid mentor ID format: %', v_mentor_id_text;
    END;

    -- Query public.profiles to verify the mentor exists
    SELECT full_name, students
    INTO v_mentor_name, v_mentor_students
    FROM public.profiles
    WHERE id = v_mentor_id AND role = 'mentor';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected mentor could not be found. Please select a valid mentor.';
    END IF;

    -- Insert student profile record
    INSERT INTO public.profiles (
      id,
      full_name,
      role,
      avatar_url,
      mentor_id,
      mentor_name,
      department,
      college,
      register_no,
      students
    )
    VALUES (
      NEW.id,
      v_full_name,
      'student',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      v_mentor_id,
      v_mentor_name,
      NEW.raw_user_meta_data->>'department',
      COALESCE(NEW.raw_user_meta_data->>'collegeName', NEW.raw_user_meta_data->>'college'),
      COALESCE(NEW.raw_user_meta_data->>'registerNo', NEW.raw_user_meta_data->>'register_no'),
      '[]'::jsonb
    );

    -- Sync mentor's students JSONB list (append student's name if not present)
    IF v_mentor_students IS NULL OR jsonb_typeof(v_mentor_students) <> 'array' THEN
      v_mentor_students := '[]'::jsonb;
    END IF;

    IF NOT (v_mentor_students @> jsonb_build_array(v_full_name)) THEN
      v_mentor_students := v_mentor_students || jsonb_build_array(v_full_name);
      
      UPDATE public.profiles
      SET students = v_mentor_students
      WHERE id = v_mentor_id;
    END IF;

  -- 3. Process mentor role
  ELSIF v_role = 'mentor' THEN
    INSERT INTO public.profiles (
      id,
      full_name,
      role,
      avatar_url,
      students
    )
    VALUES (
      NEW.id,
      v_full_name,
      'mentor',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      '[]'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 3: BIND TRIGGER TO AUTH.USERS
-- ============================================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 4: VERIFICATION COMMANDS
-- Run these after creating a new student account to verify:
--
-- SELECT id, full_name, role, mentor_id, mentor_name 
-- FROM public.profiles 
-- WHERE role = 'student' 
-- ORDER BY created_at DESC LIMIT 5;
--
-- SELECT id, full_name, students 
-- FROM public.profiles 
-- WHERE role = 'mentor';
-- ============================================================================
