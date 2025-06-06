CREATE TYPE join_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS chapter_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  reason TEXT,
  status join_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX idx_chapter_join_requests_chapter_id ON chapter_join_requests(chapter_id);
CREATE INDEX idx_chapter_join_requests_user_id ON chapter_join_requests(user_id);
CREATE INDEX idx_chapter_join_requests_status ON chapter_join_requests(status);

alter publication supabase_realtime add table chapter_join_requests;