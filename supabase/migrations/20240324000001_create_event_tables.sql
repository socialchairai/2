CREATE TABLE IF NOT EXISTS event_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to UUID REFERENCES users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'party';
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS budget_estimate DECIMAL(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'chapter-only';

alter publication supabase_realtime add table event_tasks;
alter publication supabase_realtime add table event_checklists;