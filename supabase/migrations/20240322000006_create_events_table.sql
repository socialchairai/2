CREATE TYPE event_visibility AS ENUM ('public', 'chapter-only', 'officers-only');
CREATE TYPE event_status AS ENUM ('planned', 'active', 'cancelled', 'completed');
CREATE TYPE event_type AS ENUM ('social', 'mixer', 'meeting', 'philanthropy', 'rush', 'formal', 'other');

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL DEFAULT 'other',
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  visibility event_visibility NOT NULL DEFAULT 'chapter-only',
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status event_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_chapter_id ON events(chapter_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_visibility ON events(visibility);

ALTER PUBLICATION supabase_realtime ADD TABLE events;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();