-- RLS Test Scenarios
-- This file contains test queries to validate RLS policies
-- Run these queries as different users to ensure proper data isolation

-- Test 1: Verify chapter isolation for events
-- User from Chapter A should only see events from Chapter A
-- SELECT * FROM events; -- Should only return events where user's chapter_id matches

-- Test 2: Verify cross-chapter data blocking
-- User from Chapter A should NOT be able to insert events for Chapter B
-- INSERT INTO events (chapter_id, title, start_time, created_by) 
-- VALUES ('chapter-b-uuid', 'Test Event', NOW(), auth.uid()); -- Should fail

-- Test 3: Verify role-based permissions
-- Only Social Chairs and Presidents should be able to create events
-- Regular members should be able to view but not create

-- Test 4: Verify shared data access
-- All authenticated users should be able to view roles
-- SELECT * FROM roles; -- Should work for all authenticated users

-- Test 5: Verify budget isolation
-- Users should only see budgets for their chapter
-- SELECT * FROM budgets; -- Should only return budgets for user's chapter

-- Test 6: Verify expense submission
-- Users should only be able to submit expenses for their own chapter
-- INSERT INTO expenses (budget_id, chapter_id, submitted_by, title, amount, category, date_incurred)
-- VALUES ('budget-uuid', 'other-chapter-uuid', auth.uid(), 'Test', 100, 'misc', NOW()); -- Should fail

-- Test 7: Verify notification privacy
-- Users should only see their own notifications
-- SELECT * FROM notifications; -- Should only return notifications for current user

-- Test 8: Verify task visibility
-- Users should only see tasks they created, are assigned to, or are related to their chapter's events
-- SELECT * FROM tasks; -- Should follow task visibility rules

-- Test 9: Verify sponsorship isolation
-- Users should only see sponsorships for their chapter
-- SELECT * FROM sponsorships; -- Should only return sponsorships for user's chapter

-- Test 10: Verify chapter invite management
-- Only officers should be able to create invites for their chapter
-- INSERT INTO chapter_invites (chapter_id, invited_email, token, expires_at, invited_by)
-- VALUES ('other-chapter-uuid', 'test@example.com', 'token', NOW() + INTERVAL '7 days', auth.uid()); -- Should fail for non-officers or wrong chapter

-- VALIDATION QUERIES
-- These queries help validate that RLS is working correctly

-- Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'chapters', 'users', 'user_chapter_links', 'roles',
    'events', 'event_tasks', 'event_checklists', 'tasks',
    'budgets', 'expenses', 'notifications', 'sponsorships',
    'chapter_invites', 'chapter_join_requests'
)
ORDER BY tablename;

-- List all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
