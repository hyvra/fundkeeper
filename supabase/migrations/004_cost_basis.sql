-- Migration 004: Cost Basis (Per-Wallet FIFO)

-- Cost basis lots — each acquisition creates a lot
CREATE TABLE cost_basis_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES transactions(id),
  wallet_id uuid, -- exchange_connections.id or wallet_connections.id (null = exchange-level)
  wallet_type text CHECK (wallet_type IN ('exchange', 'wallet')),
  asset text NOT NULL,
  acquired_at timestamptz NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  remaining_quantity numeric NOT NULL CHECK (remaining_quantity >= 0),
  cost_per_unit numeric NOT NULL,
  total_cost numeric NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'depleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Disposals — each sale/transfer consumes lots via FIFO
CREATE TABLE disposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES transactions(id),
  lot_id uuid NOT NULL REFERENCES cost_basis_lots(id),
  asset text NOT NULL,
  disposed_at timestamptz NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  proceeds_per_unit numeric NOT NULL,
  total_proceeds numeric NOT NULL,
  cost_basis numeric NOT NULL,
  gain_loss numeric NOT NULL,
  holding_period text NOT NULL CHECK (holding_period IN ('short_term', 'long_term')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_lots_org_asset ON cost_basis_lots(org_id, asset);
CREATE INDEX idx_lots_wallet ON cost_basis_lots(wallet_id, wallet_type);
CREATE INDEX idx_lots_status ON cost_basis_lots(org_id, status) WHERE status = 'open';
CREATE INDEX idx_lots_acquired ON cost_basis_lots(org_id, asset, acquired_at);
CREATE INDEX idx_disposals_org ON disposals(org_id);
CREATE INDEX idx_disposals_lot ON disposals(lot_id);
CREATE INDEX idx_disposals_tx ON disposals(transaction_id);

-- Updated_at trigger for lots
CREATE TRIGGER set_cost_basis_lots_updated_at
  BEFORE UPDATE ON cost_basis_lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE cost_basis_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view cost basis lots"
  ON cost_basis_lots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = cost_basis_lots.org_id AND org_members.user_id = auth.uid()
  ));

CREATE POLICY "Owners and admins can manage cost basis lots"
  ON cost_basis_lots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = cost_basis_lots.org_id AND org_members.user_id = auth.uid() AND org_members.role IN ('owner', 'admin')
  ));

CREATE POLICY "Members can view disposals"
  ON disposals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = disposals.org_id AND org_members.user_id = auth.uid()
  ));

CREATE POLICY "Owners and admins can manage disposals"
  ON disposals FOR ALL
  USING (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = disposals.org_id AND org_members.user_id = auth.uid() AND org_members.role IN ('owner', 'admin')
  ));
