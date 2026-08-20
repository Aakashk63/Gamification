-- Mentor Teams and Daily Tasks Migration

-- 1. Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Mentors can manage their own teams
CREATE POLICY "Mentors can manage their own teams" ON public.teams
    FOR ALL USING (auth.uid() = mentor_id);

-- Students can read teams
CREATE POLICY "Anyone can read teams" ON public.teams
    FOR SELECT USING (true);


-- 2. Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id) -- A student can only be in one team
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Mentors can manage team members for their own teams
CREATE POLICY "Mentors can manage their team members" ON public.team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_members.team_id 
            AND t.mentor_id = auth.uid()
        )
    );

-- Anyone can read team members
CREATE POLICY "Anyone can read team members" ON public.team_members
    FOR SELECT USING (true);


-- 3. Create daily_task_completions table
CREATE TABLE IF NOT EXISTS public.daily_task_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN DEFAULT true,
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, task_id, task_date) -- Enforce single daily completion
);

-- Enable RLS
ALTER TABLE public.daily_task_completions ENABLE ROW LEVEL SECURITY;

-- Students can insert their own completions
CREATE POLICY "Students can insert own daily completions" ON public.daily_task_completions
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can read their own completions
CREATE POLICY "Students can read own daily completions" ON public.daily_task_completions
    FOR SELECT USING (auth.uid() = student_id);

-- Mentors can read their assigned students' completions
CREATE POLICY "Mentors can read assigned student daily completions" ON public.daily_task_completions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = daily_task_completions.student_id
            AND p.mentor_id = auth.uid()
        )
    );
