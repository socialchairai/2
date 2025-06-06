-- Update notifications table to match new requirements

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('event', 'budget', 'sponsor', 'general', 'reminder')),
    related_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add chapter_id column if table exists but column doesn't
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE;

-- Rename timestamp column to created_at (if it doesn't already exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'timestamp') THEN
        ALTER TABLE notifications RENAME COLUMN timestamp TO created_at_temp;
        UPDATE notifications SET created_at = created_at_temp WHERE created_at IS NULL;
        ALTER TABLE notifications DROP COLUMN created_at_temp;
    END IF;
END $$;

-- Rename read column to is_read
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
        ALTER TABLE notifications RENAME COLUMN read TO is_read;
    END IF;
END $$;

-- Update type column constraint to allow more types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('event', 'budget', 'sponsor', 'general', 'reminder'));

-- Drop old indexes
DROP INDEX IF EXISTS idx_notifications_timestamp;
DROP INDEX IF EXISTS idx_notifications_read;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_notifications_chapter_id ON notifications(chapter_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Ensure user_id index exists
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
