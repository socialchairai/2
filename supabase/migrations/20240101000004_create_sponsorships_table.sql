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

CREATE INDEX idx_sponsorships_chapter_id ON sponsorships(chapter_id);
CREATE INDEX idx_sponsorships_status ON sponsorships(status);

alter publication supabase_realtime add table sponsorships;