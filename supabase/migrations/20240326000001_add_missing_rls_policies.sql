-- Add RLS policies for tables missing them

-- Events policies
DROP POLICY IF EXISTS "Chapter members can view events" ON public.events;
CREATE POLICY "Chapter members can view events"
ON public.events FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = events.chapter_id AND ucl.is_active = true
  )
);

DROP POLICY IF EXISTS "Social chairs can manage events" ON public.events;
CREATE POLICY "Social chairs can manage events"
ON public.events FOR ALL
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

-- Tasks policies
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
CREATE POLICY "Users can view assigned tasks"
ON public.tasks FOR SELECT
USING (
  auth.uid() = assigned_to OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "Users can manage their tasks" ON public.tasks;
CREATE POLICY "Users can manage their tasks"
ON public.tasks FOR ALL
USING (
  auth.uid() = created_by OR auth.uid() = assigned_to
);

-- Event tasks policies
DROP POLICY IF EXISTS "Chapter members can view event tasks" ON public.event_tasks;
CREATE POLICY "Chapter members can view event tasks"
ON public.event_tasks FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.events e ON ucl.chapter_id = e.chapter_id
    WHERE e.id = event_tasks.event_id AND ucl.is_active = true
  )
);

DROP POLICY IF EXISTS "Event creators can manage event tasks" ON public.event_tasks;
CREATE POLICY "Event creators can manage event tasks"
ON public.event_tasks FOR ALL
USING (
  auth.uid() IN (
    SELECT e.created_by 
    FROM public.events e 
    WHERE e.id = event_tasks.event_id
  )
);

-- Event checklists policies
DROP POLICY IF EXISTS "Chapter members can view event checklists" ON public.event_checklists;
CREATE POLICY "Chapter members can view event checklists"
ON public.event_checklists FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.events e ON ucl.chapter_id = e.chapter_id
    WHERE e.id = event_checklists.event_id AND ucl.is_active = true
  )
);

DROP POLICY IF EXISTS "Event creators can manage event checklists" ON public.event_checklists;
CREATE POLICY "Event creators can manage event checklists"
ON public.event_checklists FOR ALL
USING (
  auth.uid() IN (
    SELECT e.created_by 
    FROM public.events e 
    WHERE e.id = event_checklists.event_id
  )
);

-- Budgets policies
DROP POLICY IF EXISTS "Chapter members can view budgets" ON public.budgets;
CREATE POLICY "Chapter members can view budgets"
ON public.budgets FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = budgets.chapter_id AND ucl.is_active = true
  )
);

DROP POLICY IF EXISTS "Treasurers can manage budgets" ON public.budgets;
CREATE POLICY "Treasurers can manage budgets"
ON public.budgets FOR ALL
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

-- Expenses policies
DROP POLICY IF EXISTS "Chapter members can view expenses" ON public.expenses;
CREATE POLICY "Chapter members can view expenses"
ON public.expenses FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = expenses.chapter_id AND ucl.is_active = true
  )
);

DROP POLICY IF EXISTS "Users can submit expenses" ON public.expenses;
CREATE POLICY "Users can submit expenses"
ON public.expenses FOR INSERT
WITH CHECK (
  auth.uid() = submitted_by AND
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = expenses.chapter_id AND ucl.is_active = true
  )
);

DROP POLICY IF EXISTS "Treasurers can manage expenses" ON public.expenses;
CREATE POLICY "Treasurers can manage expenses"
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

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Sponsorships policies
DROP POLICY IF EXISTS "Chapter members can view sponsorships" ON public.sponsorships;
CREATE POLICY "Chapter members can view sponsorships"
ON public.sponsorships FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = sponsorships.chapter_id AND ucl.is_active = true
  )
);

DROP POLICY IF EXISTS "Officers can manage sponsorships" ON public.sponsorships;
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
);

-- Chapter invites policies
DROP POLICY IF EXISTS "Chapter officers can manage invites" ON public.chapter_invites;
CREATE POLICY "Chapter officers can manage invites"
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
);

DROP POLICY IF EXISTS "Anyone can view invites by token" ON public.chapter_invites;
CREATE POLICY "Anyone can view invites by token"
ON public.chapter_invites FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Chapter join requests policies
DROP POLICY IF EXISTS "Users can view their join requests" ON public.chapter_join_requests;
CREATE POLICY "Users can view their join requests"
ON public.chapter_join_requests FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create join requests" ON public.chapter_join_requests;
CREATE POLICY "Users can create join requests"
ON public.chapter_join_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Chapter officers can manage join requests" ON public.chapter_join_requests;
CREATE POLICY "Chapter officers can manage join requests"
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
