-- Comprehensive RLS Audit and Fix
-- This migration addresses all RLS policy gaps and ensures proper chapter-based data isolation

-- First, ensure all required tables exist before applying RLS policies

-- Create sponsorships table if it doesn't exist (from original migration)
CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  sponsor_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  contact_email TEXT,
  logo_url TEXT,
  status TEXT CHECK (status IN ('active', 'pending', 'expired')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsorships_chapter_id ON sponsorships(chapter_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON sponsorships(status);

-- Create notifications table if it doesn't exist (ensure it exists with proper structure)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('event', 'budget', 'sponsor', 'general', 'reminder')) DEFAULT 'general',
  related_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_chapter_id ON notifications(chapter_id);

-- Enable realtime for tables if not already enabled
DO $$
BEGIN
  -- Add sponsorships to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'sponsorships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sponsorships;
  END IF;
  
  -- Add notifications to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- Now enable RLS on all tables that don't have it enabled yet
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_join_requests ENABLE ROW LEVEL SECURITY;

-- EVENTS TABLE POLICIES
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Chapter members can view events" ON public.events;
DROP POLICY IF EXISTS "Social chairs can manage events" ON public.events;

-- Events: Chapter members can view events from their chapter
CREATE POLICY "Chapter members can view events"
ON public.events FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = events.chapter_id 
    AND ucl.is_active = true
  )
);

-- Events: Social chairs and presidents can create events for their chapter
CREATE POLICY "Social chairs can create events"
ON public.events FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = events.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('Social Chair', 'President')
  )
);

-- Events: Social chairs and presidents can update events in their chapter
CREATE POLICY "Social chairs can update events"
ON public.events FOR UPDATE
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = events.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('Social Chair', 'President')
  )
);

-- Events: Social chairs and presidents can delete events in their chapter
CREATE POLICY "Social chairs can delete events"
ON public.events FOR DELETE
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = events.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('Social Chair', 'President')
  )
);

-- EVENT TASKS TABLE POLICIES
DROP POLICY IF EXISTS "Chapter members can view event tasks" ON public.event_tasks;
DROP POLICY IF EXISTS "Event creators can manage event tasks" ON public.event_tasks;

-- Event tasks: Chapter members can view tasks for events in their chapter
CREATE POLICY "Chapter members can view event tasks"
ON public.event_tasks FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.events e ON ucl.chapter_id = e.chapter_id
    WHERE e.id = event_tasks.event_id 
    AND ucl.is_active = true
  )
);

-- Event tasks: Social chairs can manage event tasks for their chapter's events
CREATE POLICY "Social chairs can manage event tasks"
ON public.event_tasks FOR ALL
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    JOIN public.events e ON ucl.chapter_id = e.chapter_id
    WHERE e.id = event_tasks.event_id 
    AND ucl.is_active = true 
    AND r.name IN ('Social Chair', 'President')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    JOIN public.events e ON ucl.chapter_id = e.chapter_id
    WHERE e.id = event_tasks.event_id 
    AND ucl.is_active = true 
    AND r.name IN ('Social Chair', 'President')
  )
);

-- EVENT CHECKLISTS TABLE POLICIES
DROP POLICY IF EXISTS "Chapter members can view event checklists" ON public.event_checklists;
DROP POLICY IF EXISTS "Event creators can manage event checklists" ON public.event_checklists;

-- Event checklists: Chapter members can view checklists for events in their chapter
CREATE POLICY "Chapter members can view event checklists"
ON public.event_checklists FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.events e ON ucl.chapter_id = e.chapter_id
    WHERE e.id = event_checklists.event_id 
    AND ucl.is_active = true
  )
);

-- Event checklists: Social chairs can manage event checklists for their chapter's events
CREATE POLICY "Social chairs can manage event checklists"
ON public.event_checklists FOR ALL
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    JOIN public.events e ON ucl.chapter_id = e.chapter_id
    WHERE e.id = event_checklists.event_id 
    AND ucl.is_active = true 
    AND r.name IN ('Social Chair', 'President')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    JOIN public.events e ON ucl.chapter_id = e.chapter_id
    WHERE e.id = event_checklists.event_id 
    AND ucl.is_active = true 
    AND r.name IN ('Social Chair', 'President')
  )
);

-- TASKS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage their tasks" ON public.tasks;

-- Tasks: Users can view tasks they created or are assigned to (within their chapter context)
CREATE POLICY "Users can view their tasks"
ON public.tasks FOR SELECT
USING (
  auth.uid() = assigned_to OR 
  auth.uid() = created_by OR
  (event_id IS NOT NULL AND auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.events e ON ucl.chapter_id = e.chapter_id
    WHERE e.id = tasks.event_id 
    AND ucl.is_active = true
  ))
);

-- Tasks: Users can create tasks (must be chapter member if event-related)
CREATE POLICY "Users can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  (event_id IS NULL OR auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.events e ON ucl.chapter_id = e.chapter_id
    WHERE e.id = tasks.event_id 
    AND ucl.is_active = true
  ))
);

-- Tasks: Users can update tasks they created or are assigned to
CREATE POLICY "Users can update their tasks"
ON public.tasks FOR UPDATE
USING (
  auth.uid() = created_by OR auth.uid() = assigned_to
);

-- Tasks: Users can delete tasks they created
CREATE POLICY "Users can delete their tasks"
ON public.tasks FOR DELETE
USING (
  auth.uid() = created_by
);

-- BUDGETS TABLE POLICIES
DROP POLICY IF EXISTS "Chapter members can view budgets" ON public.budgets;
DROP POLICY IF EXISTS "Treasurers can manage budgets" ON public.budgets;

-- Budgets: Chapter members can view their chapter's budgets
CREATE POLICY "Chapter members can view budgets"
ON public.budgets FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = budgets.chapter_id 
    AND ucl.is_active = true
  )
);

-- Budgets: Treasurers and presidents can create budgets for their chapter
CREATE POLICY "Treasurers can create budgets"
ON public.budgets FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = budgets.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('Treasurer', 'President')
  )
);

-- Budgets: Treasurers and presidents can update budgets for their chapter
CREATE POLICY "Treasurers can update budgets"
ON public.budgets FOR UPDATE
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = budgets.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('Treasurer', 'President')
  )
);

-- Budgets: Treasurers and presidents can delete budgets for their chapter
CREATE POLICY "Treasurers can delete budgets"
ON public.budgets FOR DELETE
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = budgets.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('Treasurer', 'President')
  )
);

-- EXPENSES TABLE POLICIES
DROP POLICY IF EXISTS "Chapter members can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can submit expenses" ON public.expenses;
DROP POLICY IF EXISTS "Treasurers can manage expenses" ON public.expenses;

-- Expenses: Chapter members can view expenses for their chapter
CREATE POLICY "Chapter members can view expenses"
ON public.expenses FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = expenses.chapter_id 
    AND ucl.is_active = true
  )
);

-- Expenses: Chapter members can submit expenses for their chapter
CREATE POLICY "Chapter members can submit expenses"
ON public.expenses FOR INSERT
WITH CHECK (
  auth.uid() = submitted_by AND
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = expenses.chapter_id 
    AND ucl.is_active = true
  )
);

-- Expenses: Users can update their own submitted expenses (if not yet reviewed)
CREATE POLICY "Users can update their expenses"
ON public.expenses FOR UPDATE
USING (
  auth.uid() = submitted_by AND status = 'pending'
);

-- Expenses: Treasurers and presidents can review/approve expenses for their chapter
CREATE POLICY "Treasurers can review expenses"
ON public.expenses FOR UPDATE
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = expenses.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('Treasurer', 'President')
  )
);

-- NOTIFICATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Notifications: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Notifications: System can create notifications for users
CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- SPONSORSHIPS TABLE POLICIES
DROP POLICY IF EXISTS "Chapter members can view sponsorships" ON public.sponsorships;
DROP POLICY IF EXISTS "Officers can manage sponsorships" ON public.sponsorships;

-- Sponsorships: Chapter members can view their chapter's sponsorships
CREATE POLICY "Chapter members can view sponsorships"
ON public.sponsorships FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = sponsorships.chapter_id 
    AND ucl.is_active = true
  )
);

-- Sponsorships: Officers can manage sponsorships for their chapter
CREATE POLICY "Officers can manage sponsorships"
ON public.sponsorships FOR ALL
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = sponsorships.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('President', 'Vice President', 'Treasurer')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = sponsorships.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('President', 'Vice President', 'Treasurer')
  )
);

-- CHAPTER INVITES TABLE POLICIES
DROP POLICY IF EXISTS "Chapter officers can manage invites" ON public.chapter_invites;
DROP POLICY IF EXISTS "Anyone can view invites by token" ON public.chapter_invites;

-- Chapter invites: Officers can manage invites for their chapter
CREATE POLICY "Officers can manage chapter invites"
ON public.chapter_invites FOR ALL
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = chapter_invites.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('President', 'Vice President')
  )
)
WITH CHECK (
  auth.uid() = invited_by AND
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = chapter_invites.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('President', 'Vice President')
  )
);

-- Chapter invites: Anyone can view invites by token (for accepting invites)
CREATE POLICY "Public can view invites by token"
ON public.chapter_invites FOR SELECT
USING (auth.uid() IS NOT NULL);

-- CHAPTER JOIN REQUESTS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their join requests" ON public.chapter_join_requests;
DROP POLICY IF EXISTS "Users can create join requests" ON public.chapter_join_requests;
DROP POLICY IF EXISTS "Chapter officers can manage join requests" ON public.chapter_join_requests;

-- Chapter join requests: Users can view their own join requests
CREATE POLICY "Users can view their join requests"
ON public.chapter_join_requests FOR SELECT
USING (auth.uid() = user_id);

-- Chapter join requests: Users can create join requests
CREATE POLICY "Users can create join requests"
ON public.chapter_join_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Chapter join requests: Officers can view and manage join requests for their chapter
CREATE POLICY "Officers can manage join requests"
ON public.chapter_join_requests FOR ALL
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = chapter_join_requests.chapter_id 
    AND ucl.is_active = true 
    AND r.name IN ('President', 'Vice President')
  )
);

-- SHARED/PUBLIC DATA ACCESS
-- Roles table: All authenticated users can view roles (shared/public data)
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
CREATE POLICY "Authenticated users can view roles"
ON public.roles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Chapters table: Update policies to allow viewing chapters for join requests
DROP POLICY IF EXISTS "Anyone can create chapters" ON public.chapters;
CREATE POLICY "Authenticated users can create chapters"
ON public.chapters FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view all chapters (for join requests and discovery)
CREATE POLICY "Authenticated users can view all chapters"
ON public.chapters FOR SELECT
USING (auth.uid() IS NOT NULL);