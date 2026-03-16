-- Migration 003: Transactions

-- Transaction category enum
CREATE TYPE tx_category AS ENUM (
  'buy', 'sell', 'transfer_in', 'transfer_out',
  'staking_reward', 'interest', 'income', 'fee',
  'chain_split', 'gift_in', 'gift_out',
  'fiat_deposit', 'fiat_withdrawal', 'unknown'
);

-- Raw transactions — immutable exchange/chain data as received
CREATE TABLE raw_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('exchange', 'wallet')),
  source_id uuid NOT NULL, -- exchange_connections.id or wallet_connections.id
  external_id text NOT NULL, -- exchange/chain tx ID
  raw_data jsonb NOT NULL, -- full response from exchange/chain
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX idx_raw_tx_dedup ON raw_transactions(org_id, source_type, source_id, external_id);
CREATE INDEX idx_raw_tx_org ON raw_transactions(org_id);

-- Normalized transactions — the subledger
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  raw_transaction_id uuid REFERENCES raw_transactions(id),
  source_type text NOT NULL CHECK (source_type IN ('exchange', 'wallet')),
  source_id uuid NOT NULL,
  external_id text NOT NULL,
  timestamp timestamptz NOT NULL,
  asset text NOT NULL, -- e.g. 'BTC', 'ETH', 'SOL', 'USDC'
  amount numeric NOT NULL,
  amount_usd numeric, -- USD value at time of transaction (from price feed)
  fee_amount numeric DEFAULT 0,
  fee_asset text,
  fee_usd numeric,
  counter_asset text, -- for trades: the other side
  counter_amount numeric,
  category tx_category NOT NULL DEFAULT 'unknown',
  category_confidence numeric DEFAULT 0 CHECK (category_confidence >= 0 AND category_confidence <= 1),
  category_source text DEFAULT 'unset' CHECK (category_source IN ('unset', 'rule', 'user')),
  from_address text,
  to_address text,
  tx_hash text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_tx_org_timestamp ON transactions(org_id, timestamp DESC);
CREATE INDEX idx_tx_org_asset ON transactions(org_id, asset);
CREATE INDEX idx_tx_org_category ON transactions(org_id, category);
CREATE INDEX idx_tx_source ON transactions(source_type, source_id);
CREATE UNIQUE INDEX idx_tx_dedup ON transactions(org_id, source_type, source_id, external_id);

-- Updated_at trigger
CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE raw_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Raw transactions: org members can view
CREATE POLICY "Members can view raw transactions"
  ON raw_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = raw_transactions.org_id AND org_members.user_id = auth.uid()
  ));

CREATE POLICY "System can insert raw transactions"
  ON raw_transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = raw_transactions.org_id AND org_members.user_id = auth.uid()
  ));

-- Transactions: members can view, owners/admins can manage
CREATE POLICY "Members can view transactions"
  ON transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = transactions.org_id AND org_members.user_id = auth.uid()
  ));

CREATE POLICY "Owners and admins can manage transactions"
  ON transactions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = transactions.org_id AND org_members.user_id = auth.uid() AND org_members.role IN ('owner', 'admin')
  ));
