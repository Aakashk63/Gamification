-- ============================================================================
-- CampusXP: Fix RLS recursion on teams and team_members
-- Run this in your Supabase SQL Editor → https://supabase.com/dashboard
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE SECURITY DEFINER HELPER FUNCTIONS
-- Bypasses RLS during policy evaluation to avoid circular dependencies.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_team_mentor(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = p_team_id AND mentor_id = p_user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND student_id = p_user_id AND status = 'accepted'
  );
END;
$$;

-- Grant permissions to make them executable
GRANT EXECUTE ON FUNCTION public.is_team_mentor(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) TO authenticated;

-- ============================================================================
-- STEP 2: DROP OLD POLICIES TO PREVENT CONFLICTS
-- ============================================================================

DROP POLICY IF EXISTS "Mentors can manage their own teams" ON public.teams;
DROP POLICY IF EXISTS "Anyone can read teams" ON public.teams;
DROP POLICY IF EXISTS "Students can only see their own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can select teams they are part of" ON public.teams;
DROP POLICY IF EXISTS "Mentors can manage teams" ON public.teams;

DROP POLICY IF EXISTS "Mentors can manage their team members" ON public.team_members;
DROP POLICY IF EXISTS "Anyone can read team members" ON public.team_members;
DROP POLICY IF EXISTS "Students can update own team membership" ON public.team_members;
DROP POLICY IF EXISTS "Students can delete own team membership" ON public.team_members;
DROP POLICY IF EXISTS "Mentors can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view authorized team members" ON public.team_members;
DROP POLICY IF EXISTS "Authorized users can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Authorized users can delete team members" ON public.team_members;

-- ============================================================================
-- STEP 3: CREATE NON-RECURSIVE POLICIES ON PUBLIC.TEAMS
-- ============================================================================

-- SELECT: Mentor of the team OR student member of the team
CREATE POLICY "teams_select_policy" ON public.teams
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = mentor_id OR
        public.is_team_member(id, auth.uid())
    );

-- ALL OTHER OPERATIONS (INSERT, UPDATE, DELETE): restricted to the mentor
CREATE POLICY "teams_all_policy" ON public.teams
    FOR ALL
    TO authenticated
    USING (auth.uid() = mentor_id)
    WITH CHECK (auth.uid() = mentor_id);

-- ============================================================================
-- STEP 4: CREATE NON-RECURSIVE POLICIES ON PUBLIC.TEAM_MEMBERS
-- ============================================================================

-- SELECT: Student viewing their own record OR mentor viewing members of their team
CREATE POLICY "team_members_select_policy" ON public.team_members
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = student_id OR
        public.is_team_mentor(team_id, auth.uid())
    );

-- INSERT: Mentor adding a student to a team they own
CREATE POLICY "team_members_insert_policy" ON public.team_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_team_mentor(team_id, auth.uid())
    );

-- UPDATE: Student accepting/declining OR mentor updating membership in their team
CREATE POLICY "team_members_update_policy" ON public.team_members
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = student_id OR
        public.is_team_mentor(team_id, auth.uid())
    )
    WITH CHECK (
        auth.uid() = student_id OR
        public.is_team_mentor(team_id, auth.uid())
    );

-- DELETE: Student leaving/declining OR mentor removing a member from their team
CREATE POLICY "team_members_delete_policy" ON public.team_members
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = student_id OR
        public.is_team_mentor(team_id, auth.uid())
    );

-- ============================================================================
-- STEP 5: VERIFICATION QUERY
-- Run this to confirm changes are correctly applied.
-- ============================================================================
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('teams', 'team_members')
ORDER BY tablename, policyname;
