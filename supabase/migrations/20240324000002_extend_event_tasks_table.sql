-- Add new columns to event_tasks table
ALTER TABLE event_tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
ALTER TABLE event_tasks ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'general' CHECK (type IN ('general', 'venue', 'catering', 'entertainment', 'logistics', 'promotion'));
ALTER TABLE event_tasks ADD COLUMN IF NOT EXISTS notes TEXT;

-- Enable realtime for event_tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE event_tasks;