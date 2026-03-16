-- Migration 002: Exchange & Wallet Connections

-- Exchange connections (Coinbase, Binance, Kraken, Gemini)
CREATE TABLE exchange_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  exchange text NOT NULL CHECK (exchange IN ('coinbase', 'binance', 'kraken', 'gemini')),
  label text NOT NULL DEFAULT '',
  api_key_id uuid, -- reference to Supabase Vault secret
  api_secret_id uuid, -- reference to Supabase Vault secret
  passphrase_id uuid, -- reference to Supabase Vault secret (Coinbase Pro)
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disabled')),
  last_sync_at timestamptz,
  sync_cursor jsonb DEFAULT '{}',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Wallet connections (ETH, BTC, SOL addresses)
CREATE TABLE wallet_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chain text NOT NULL CHECK (chain IN ('ethereum', 'bitcoin', 'solana')),
  address text NOT NULL,
  label text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disabled')),
  last_sync_at timestamptz,
  sync_cursor jsonb DEFAULT '{}',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_exchange_connections_org ON exchange_connections(org_id);
CREATE INDEX idx_wallet_connections_org ON wallet_connections(org_id);
CREATE UNIQUE INDEX idx_wallet_connections_unique ON wallet_connections(org_id, chain, address);

-- Updated_at triggers
CREATE TRIGGER set_exchange_connections_updated_at
  BEFORE UPDATE ON exchange_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_wallet_connections_updated_at
  BEFORE UPDATE ON wallet_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE exchange_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;

-- Exchange connections: org members can view, owners/admins can manage
CREATE POLICY "Members can view exchange connections"
  ON exchange_connections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = exchange_connections.org_id AND org_members.user_id = auth.uid()
  ));

CREATE POLICY "Owners and admins can manage exchange connections"
  ON exchange_connections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = exchange_connections.org_id AND org_members.user_id = auth.uid() AND org_members.role IN ('owner', 'admin')
  ));

-- Wallet connections: same pattern
CREATE POLICY "Members can view wallet connections"
  ON wallet_connections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = wallet_connections.org_id AND org_members.user_id = auth.uid()
  ));

CREATE POLICY "Owners and admins can manage wallet connections"
  ON wallet_connections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM org_members WHERE org_members.org_id = wallet_connections.org_id AND org_members.user_id = auth.uid() AND org_members.role IN ('owner', 'admin')
  ));
