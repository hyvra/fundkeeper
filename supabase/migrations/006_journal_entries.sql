-- Migration 006: Journal Entries (GL Export staging)

CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id),
  entry_date date NOT NULL,
  description text NOT NULL,
  debit_account text NOT NULL,
  credit_account text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  reference text, -- external reference (e.g. QB/Xero journal entry ID)
  export_status text NOT NULL DEFAULT 'pending' CHECK (export_status IN ('pending', 'exported', 'failed', 'skipped')),
  exported_at timestamptz,
  export_target text CHECK (export_target IN ('quickbooks', 'xero')),
  export_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_je_org ON journal_entries(org_id);
CREATE INDEX idx_je_status ON journal_entries(org_id, export_status);
CREATE INDEX idx_je_date ON journal_entries(org_id, entry_date);
CREATE INDEX idx_je_tx ON journal_entries(transaction_id);

CREATE TRIGGER set_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view journal entries"
  ON journal_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM org_members WHERE org_members.org_id = journal_entries.org_id AND org_members.user_id = auth.uid()));

CREATE POLICY "Owners and admins can manage journal entries"
  ON journal_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM org_members WHERE org_members.org_id = journal_entries.org_id AND org_members.user_id = auth.uid() AND org_members.role IN ('owner', 'admin')));
