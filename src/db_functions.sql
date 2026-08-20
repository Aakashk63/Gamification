-- ============================================================================
-- CampusXP: Database-Level Mentor Assignment
-- This creates two SECURITY DEFINER functions:
--   1. get_mentor_list()      — lets anon signup page read mentors safely
--   2. create_student_profile() — atomic profile insert + mentor students sync
--
-- Run this in Supabase SQL Editor FIRST, before testing signup.
-- ============================================================================

-- ============================================================================
-- FUNCTION 1: get_mentor_list
-- Called by the signup form (unauthenticated / anon role).
-- Returns only the columns needed for mentor selection — no sensitive data.
-- SECURITY DEFINER means it runs as the function owner (bypasses RLS safely).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_mentor_list()
RETURNS TABLE (
  id         UUID,
  full_name  TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.avatar_url
    FROM public.profiles p
    WHERE p.role = 'mentor'
    ORDER BY p.full_name;
END;
$$;

-- Grant execute to unauthenticated (anon) and authenticated users
GRANT EXECUTE ON FUNCTION public.get_mentor_list() TO anon;
GRANT EXECUTE ON FUNCTION public.get_mentor_list() TO authenticated;

-- ============================================================================
-- FUNCTION 2: create_student_profile
-- Called immediately after supabase.auth.signUp() succeeds.
-- Atomically:
--   a) Inserts (or updates) the student profile with mentor_id
--   b) Syncs the mentor's students[] JSONB array
-- SECURITY DEFINER bypasses RLS so the insert always succeeds.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_student_profile(
  p_user_id      UUID,
  p_full_name    TEXT,
  p_avatar_url   TEXT,
  p_mentor_id    UUID,
  p_department   TEXT DEFAULT NULL,
  p_college      TEXT DEFAULT NULL,
  p_register_no  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mentor_name     TEXT;
  v_mentor_students JSONB;
  v_student_name    TEXT;
  v_result          JSONB;
BEGIN
  -- Validate the mentor exists and is actually a mentor
  SELECT full_name, students
  INTO v_mentor_name, v_mentor_students
  FROM public.profiles
  WHERE id = p_mentor_id
    AND role = 'mentor';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Mentor not found. Please select a valid mentor.'
    );
  END IF;

  v_student_name := trim(p_full_name);

  -- Upsert the student profile with all fields including mentor_id
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
    p_user_id,
    v_student_name,
    'student',
    p_avatar_url,
    p_mentor_id,
    v_mentor_name,
    p_department,
    p_college,
    p_register_no,
    '[]'::jsonb
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name   = EXCLUDED.full_name,
        role        = EXCLUDED.role,
        avatar_url  = EXCLUDED.avatar_url,
        mentor_id   = EXCLUDED.mentor_id,
        mentor_name = EXCLUDED.mentor_name,
        department  = EXCLUDED.department,
        college     = EXCLUDED.college,
        register_no = EXCLUDED.register_no;

  -- Sync mentor's students[] JSONB array
  -- Build clean array of all students whose mentor_id = p_mentor_id
  SELECT COALESCE(jsonb_agg(sub.full_name ORDER BY sub.full_name), '[]'::jsonb)
  INTO v_mentor_students
  FROM (
    SELECT full_name
    FROM public.profiles
    WHERE mentor_id = p_mentor_id
      AND role = 'student'
  ) sub;

  UPDATE public.profiles
  SET students = v_mentor_students
  WHERE id = p_mentor_id;

  v_result := jsonb_build_object(
    'success',      true,
    'student_id',   p_user_id,
    'mentor_id',    p_mentor_id,
    'mentor_name',  v_mentor_name,
    'full_name',    v_student_name
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error',   SQLERRM
  );
END;
$$;

-- Grant execute only to authenticated users (user must be logged in after signUp)
GRANT EXECUTE ON FUNCTION public.create_student_profile(UUID, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- FUNCTION 3: create_mentor_profile
-- Called after mentor supabase.auth.signUp().
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_mentor_profile(
  p_user_id    UUID,
  p_full_name  TEXT,
  p_avatar_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    avatar_url,
    students
  )
  VALUES (
    p_user_id,
    trim(p_full_name),
    'mentor',
    p_avatar_url,
    '[]'::jsonb
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        role       = EXCLUDED.role,
        avatar_url = EXCLUDED.avatar_url;

  RETURN jsonb_build_object('success', true, 'mentor_id', p_user_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_mentor_profile(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- Also ensure the existing RLS policies allow these functions to work.
-- The SECURITY DEFINER functions bypass RLS for their own writes,
-- but we still need the anon SELECT policy for get_mentor_list fallback.
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read mentor profiles" ON public.profiles;
CREATE POLICY "Public can read mentor profiles" ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (role = 'mentor');

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated can read student profiles" ON public.profiles;
CREATE POLICY "Authenticated can read student profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated can update mentor students list" ON public.profiles;
CREATE POLICY "Authenticated can update mentor students list" ON public.profiles
  FOR UPDATE TO authenticated
  USING (role = 'mentor');

-- ============================================================================
-- Verification: after running, test with:
--   SELECT * FROM public.get_mentor_list();
--   SELECT proname, prosecdef FROM pg_proc WHERE proname IN (
--     'get_mentor_list', 'create_student_profile', 'create_mentor_profile'
--   );
-- ============================================================================
