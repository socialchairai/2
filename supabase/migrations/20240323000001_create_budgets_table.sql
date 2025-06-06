CREATE TYPE budget_period AS ENUM ('monthly', 'semester');

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  period budget_period NOT NULL,
  period_label TEXT NOT NULL,
  total_budget NUMERIC(10,2) NOT NULL CHECK (total_budget >= 0),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budgets_chapter_id ON budgets(chapter_id);
CREATE INDEX idx_budgets_created_by ON budgets(created_by);
CREATE INDEX idx_budgets_period ON budgets(period);

alter publication supabase_realtime add table budgets;