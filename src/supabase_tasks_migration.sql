-- Create the Tasks table
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 5,
    category TEXT NOT NULL CHECK (category IN ('individual', 'team')),
    type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'special')),
    is_leetcode BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read tasks
CREATE POLICY "Tasks are viewable by everyone" ON public.tasks FOR SELECT USING (true);

-- Create Task Completions table
CREATE TABLE public.task_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for task_completions
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own completions
CREATE POLICY "Users can view their own completions" ON public.task_completions FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own completions
CREATE POLICY "Users can insert their own completions" ON public.task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert dummy data for tasks
INSERT INTO public.tasks (title, description, points, category, type, is_leetcode) VALUES
('Complete LeetCode Sum', 'Solve any problem on LeetCode today to earn points!', 5, 'individual', 'daily', true),
('Complete 3 LeetCode Sums', 'Solve 3 problems on LeetCode this week.', 20, 'individual', 'weekly', false),
('Build a Side Project', 'Create a small side project to show off.', 5, 'individual', 'special', false),
('Complete Team LeetCode Sum', 'Solve any problem on LeetCode today to earn points for your team!', 20, 'team', 'daily', true),
('Team Open Source Contribution', 'Contribute to any open source repository this week.', 50, 'team', 'weekly', false),
('Hackathon Participation', 'Participate in a special team hackathon.', 5, 'team', 'special', false);
