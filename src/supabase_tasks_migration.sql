-- ============================================================================
-- Supabase Tasks and Task Completions Migration
-- ============================================================================

-- 1. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 5,
    category TEXT NOT NULL DEFAULT 'individual' CHECK (category IN ('individual', 'team')),
    task_type TEXT NOT NULL DEFAULT 'daily' CHECK (task_type IN ('daily', 'weekly', 'special')),
    type TEXT DEFAULT 'daily',
    is_leetcode BOOLEAN NOT NULL DEFAULT false,
    task_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;

-- Tasks are readable by everyone
CREATE POLICY "Tasks are viewable by everyone" ON public.tasks
    FOR SELECT USING (true);

-- Authenticated users can insert tasks
CREATE POLICY "Authenticated users can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- 2. Create Task Completions Table
CREATE TABLE IF NOT EXISTS public.task_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_earned INTEGER NOT NULL DEFAULT 5,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, student_id)
);

-- Enable RLS for task_completions
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Students can insert own completions" ON public.task_completions;

-- Completions viewable by all authenticated users (needed for mentors to monitor team tasks)
CREATE POLICY "Anyone can view task completions" ON public.task_completions
    FOR SELECT USING (true);

-- Students can insert their own completions
CREATE POLICY "Students can insert own completions" ON public.task_completions
    FOR INSERT WITH CHECK (auth.uid() = student_id);


-- 3. Compatibility Table: daily_task_completions
CREATE TABLE IF NOT EXISTS public.daily_task_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id TEXT,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN DEFAULT true,
    points_earned INTEGER DEFAULT 5,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, task_id, task_date)
);

ALTER TABLE public.daily_task_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read daily completions" ON public.daily_task_completions;
DROP POLICY IF EXISTS "Students can insert own daily completions" ON public.daily_task_completions;

CREATE POLICY "Anyone can read daily completions" ON public.daily_task_completions
    FOR SELECT USING (true);

CREATE POLICY "Students can insert own daily completions" ON public.daily_task_completions
    FOR INSERT WITH CHECK (auth.uid() = student_id);

