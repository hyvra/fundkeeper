-- Migration 005: Reconciliations and Reports

-- Reconciliations — 1099-DA matching results
CREATE TABLE reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tax_year integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'discrepancy', 'resolved')),
  uploaded_filename text,
  uploaded_data jsonb, -- parsed 1099-DA rows
  match_results jsonb, -- array of matched/unmatched items
  total_entries integer DEFAULT 0,
  matched_count integer DEFAULT 0,
  discrepancy_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reports — generated position + P&L reports
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('position', 'pnl', 'tax_summary')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  report_data jsonb NOT NULL, -- the full report payload
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reconciliations_org ON reconciliations(org_id);
CREATE INDEX idx_reconciliations_year ON reconciliations(org_id, tax_year);
CREATE INDEX idx_reports_org ON reports(org_id);
CREATE INDEX idx_reports_type ON reports(org_id, report_type);
CREATE INDEX idx_reports_period ON reports(org_id, period_start, period_end);

-- Updated_at trigger
CREATE TRIGGER set_reconciliations_updated_at
  BEFORE UPDATE ON reconciliations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view reconciliations"
  ON reconciliations FOR SELECT
  USING (EXISTS (SELECT 1 FROM org_members WHERE org_members.org_id = reconciliations.org_id AND org_members.user_id = auth.uid()));

CREATE POLICY "Owners and admins can manage reconciliations"
  ON reconciliations FOR ALL
  USING (EXISTS (SELECT 1 FROM org_members WHERE org_members.org_id = reconciliations.org_id AND org_members.user_id = auth.uid() AND org_members.role IN ('owner', 'admin')));

CREATE POLICY "Members can view reports"
  ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM org_members WHERE org_members.org_id = reports.org_id AND org_members.user_id = auth.uid()));

CREATE POLICY "Owners and admins can manage reports"
  ON reports FOR ALL
  USING (EXISTS (SELECT 1 FROM org_members WHERE org_members.org_id = reports.org_id AND org_members.user_id = auth.uid() AND org_members.role IN ('owner', 'admin')));
