CREATE TYPE invite_role AS ENUM ('member', 'officer', 'social_chair');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');

CREATE TABLE IF NOT EXISTS chapter_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role invite_role NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  status invite_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chapter_invites_chapter_id ON chapter_invites(chapter_id);
CREATE INDEX idx_chapter_invites_token ON chapter_invites(token);
CREATE INDEX idx_chapter_invites_email ON chapter_invites(invited_email);

alter publication supabase_realtime add table chapter_invites;