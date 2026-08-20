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

-- 3. Automatic synchronization trigger for mentor's students JSONB list
CREATE OR REPLACE FUNCTION public.sync_mentor_students_trigger()
RETURNS TRIGGER AS $$
DECLARE
  old_mentor_students JSONB;
  new_mentor_students JSONB;
  student_name TEXT;
BEGIN
  -- We only care about student profiles (role = 'student')
  IF NEW.role = 'student' THEN
    student_name := NEW.full_name;

    -- Case 1: Student changed mentor or is newly assigned a mentor
    IF (TG_OP = 'INSERT' AND NEW.mentor_id IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND COALESCE(OLD.mentor_id, '00000000-0000-0000-0000-000000000000'::uuid) <> COALESCE(NEW.mentor_id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
       
      -- Remove student from old mentor's students list
      IF TG_OP = 'UPDATE' AND OLD.mentor_id IS NOT NULL THEN
        SELECT students INTO old_mentor_students FROM public.profiles WHERE id = OLD.mentor_id;
        IF old_mentor_students IS NOT NULL THEN
          SELECT jsonb_agg(value) INTO old_mentor_students
          FROM jsonb_array_elements_text(old_mentor_students) AS value
          WHERE value <> student_name;
          
          UPDATE public.profiles 
          SET students = COALESCE(old_mentor_students, '[]'::jsonb)
          WHERE id = OLD.mentor_id;
        END IF;
      END IF;

      -- Add student to new mentor's students list
      IF NEW.mentor_id IS NOT NULL THEN
        SELECT students INTO new_mentor_students FROM public.profiles WHERE id = NEW.mentor_id;
        IF new_mentor_students IS NULL THEN
          new_mentor_students := '[]'::jsonb;
        END IF;
        
        IF NOT (new_mentor_students ? student_name) THEN
          new_mentor_students := new_mentor_students || jsonb_build_array(student_name);
        END IF;

        UPDATE public.profiles 
        SET students = new_mentor_students
        WHERE id = NEW.mentor_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_mentor_students ON public.profiles;
CREATE TRIGGER trg_sync_mentor_students
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_mentor_students_trigger();
