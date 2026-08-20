-- ============================================================================
-- Supabase Notifications and Team Invitations Migration
-- ============================================================================

-- 1. Add status column to public.team_members
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Update existing records to 'accepted'
UPDATE public.team_members 
SET status = 'accepted' 
WHERE status IS NULL;

-- 2. Create public.notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'announcement', 'team_invitation', 'team_invitation_accepted', 'team_invitation_declined'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    team_name TEXT,
    announcement_id UUID,
    status TEXT DEFAULT 'unread', -- 'unread', 'read', 'accepted', 'declined'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;

-- Create Policies
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Anyone can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);
