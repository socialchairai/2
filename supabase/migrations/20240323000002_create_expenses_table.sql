CREATE TYPE expense_category AS ENUM ('alcohol', 'venue', 'decor', 'security', 'misc');
CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category expense_category NOT NULL,
  date_incurred DATE NOT NULL,
  receipt_url TEXT,
  status expense_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_expenses_budget_id ON expenses(budget_id);
CREATE INDEX idx_expenses_chapter_id ON expenses(chapter_id);
CREATE INDEX idx_expenses_submitted_by ON expenses(submitted_by);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date_incurred ON expenses(date_incurred);

alter publication supabase_realtime add table expenses;