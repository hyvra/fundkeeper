# Fundkeeper Build Log

## 2026-03-15 — Phase 1: Skeleton

### What was built
- Next.js 16 scaffold with React 19, TypeScript strict, Tailwind v4
- shadcn/ui initialized (base-nova style, neutral colors)
- Supabase initialized with auth + RLS
- Migration 001: organizations + org_members tables
- Auth flow: login, signup, OAuth callback, middleware protection
- App shell: sidebar navigation, authenticated layout
- Dashboard page (empty state)
- Page stubs for all V1 routes

### Stack versions
- next@16.1.6, react@19.2.3
- @supabase/supabase-js, @supabase/ssr
- shadcn/ui (base-nova), lucide-react

## 2026-03-16 — Phase 2: Connections

### What was built
- Migration 002: exchange_connections + wallet_connections tables (RLS, indexes, Vault refs)
- Migration 003: raw_transactions (immutable) + transactions (normalized subledger) with tx_category enum
- Exchange adapter interface + Coinbase implementation (HMAC-signed requests, trades/transfers/balances)
- Rate limiter (sliding window, per-exchange configs)
- Sync engine: orchestrator, normalizer, deduplication via upsert on unique indexes
- Connection UI: exchange cards, wallet cards, add-exchange dialog, add-wallet dialog
- Transaction list page with table, badges, date/amount/category columns
- API routes: POST /api/connections/exchange, POST /api/connections/wallet, POST /api/sync

### Supabase project created
- Project: fundkeeper (tdyhdyylnlheevztxsxv, us-west-1)
- All 3 migrations applied to hosted DB
- .env.local configured with URL + anon key
- Paused agenthesis-dev to free project slot

### Notes
- Migration 002 referenced `update_updated_at()` but 001 had `handle_updated_at()` — fixed in both local file and remote DB
- Sync route returns 501 until Supabase Vault is configured for API key storage
- shadcn base-ui uses `render` prop pattern instead of `asChild` — UI agent adapted

## 2026-03-16 — Phase 3: Categorization

### What was built
- 6 deterministic categorization rules: fiat, fee, staking reward, interest, trade, transfer
- Rules return {category, confidence} — auto-apply >0.9, suggest 0.5-0.9, unknown <0.5
- Batch categorizer: fetches unknown/unset transactions, applies rules, updates DB
- API route: POST /api/transactions/categorize
- Inline category editor component (select dropdown per transaction row)
- Auto-categorize button with result feedback

## 2026-03-16 — Phase 4: Cost Basis

### What was built
- Migration 004: cost_basis_lots + disposals tables with RLS
- Per-wallet FIFO calculator (idempotent rebuild, IRS Rev. Proc. 2024-28 compliant)
- Holding period classification (>365 days = long-term)
- Transfers between own wallets skip taxable event logic
- Cost basis page: summary cards (open lots, gains, losses, net), open lots table, disposals table
- Recalculate button triggers full rebuild via API
- API route: POST /api/cost-basis/calculate (single asset or all)

## 2026-03-16 — Phase 5: More Exchanges + Wallet Adapters

### What was built
- Binance adapter (HMAC-SHA256, trades via /api/v3/myTrades, deposits/withdrawals via /sapi/v1/capital)
- Kraken adapter (HMAC-SHA512 with nonce, trades via /0/private/TradesHistory, ledger entries)
- Gemini adapter (HMAC-SHA384 with base64 payload, trades + transfers + balances)
- Exchange registry updated — all 4 adapters registered
- Ethereum wallet adapter (Etherscan public API — txlist, balance)
- Bitcoin wallet adapter (Blockstream public API — address txs, UTXO balance)
- Solana wallet adapter (public RPC — getSignaturesForAddress, getTransaction, getBalance)
- Blockchain adapter registry with getChainAdapter() factory

### Notes
- ChainName type exists in both types/exchange.ts and types/blockchain.ts (identical, no conflict)
- Wallet adapters use free public APIs (no keys needed)

## 2026-03-16 — Phase 6: Reports + Reconciliation

### What was built
- Migration 005: reconciliations + reports tables with RLS
- Position report generator (aggregates open lots by asset)
- P&L report generator (short-term/long-term gain/loss by asset)
- Report generation API: POST /api/reports/generate (position or pnl with date range)
- Reports page: report type selector, date range picker, report history table
- 1099-DA CSV parser (flexible header matching)
- Reconciliation matcher (date + asset + quantity matching, 0.01% tolerance, $0.01 amount tolerance)
- Reconciliation API: POST /api/reconciliation
- Reconciliation page: CSV upload, tax year input, reconciliation history with match/discrepancy counts

## 2026-03-16 — Phase 7: GL Export

### What was built
- Migration 006: journal_entries table with export status tracking, RLS
- GL mapper: maps categorized transactions to double-entry journal entries using chart of accounts
- QuickBooks export stub + CSV generator (JE format with debit/credit lines)
- Xero export stub + CSV generator
- Export API routes: POST + GET for both /api/export/quickbooks and /api/export/xero
- Exports page: summary cards (pending/exported/total), journal entries table, export + download buttons

### Notes
- QB/Xero OAuth not implemented — V1 uses CSV download for manual import
- Export POST maps new transactions then marks entries as exported
- Export GET returns downloadable CSV

### Status
- **All 6 migrations applied to Supabase** (tdyhdyylnlheevztxsxv)
- **24 routes, 0 build errors**
- **Phases 1-7 complete**

### Next up
- Phase 8: Polish — dashboard data, cron sync, error handling, landing page

## 2026-03-16 — Onboarding Flow

### What was built
- Migration 007: `onboarding_completed_at` column on organizations table
- API route: POST /api/onboarding/complete (marks org onboarding done)
- Multi-step onboarding wizard at /onboarding (Welcome > Connect > Sync > Done)
  - Reuses existing exchange/wallet API routes
  - Step indicator with progress visualization
  - Skip links on connect and sync steps
  - Calls POST /api/onboarding/complete on finish
- Middleware redirect: authenticated users with null `onboarding_completed_at` are redirected to /onboarding (avoids loop by skipping redirect when already on /onboarding)

### Files created
- `supabase/migrations/007_onboarding.sql`
- `src/app/api/onboarding/complete/route.ts`
- `src/app/(app)/onboarding/page.tsx`

### Files modified
- `src/middleware.ts` (onboarding redirect + /onboarding in protected routes)

## 2026-03-17 — Polish Pass

### What was built

**GitHub remote**
- Repo created and pushed: `hyvra/fundkeeper`

**Dark mode**
- ThemeProvider wrapper component (`src/components/theme-provider.tsx`)
- Root layout wrapped with ThemeProvider (attribute="class", defaultTheme="system")
- Sun/Moon toggle in sidebar footer
- `suppressHydrationWarning` on html element

**Landing page copy rewrite**
- Rewrote all copy to remove AI slop
- Hero: "Your fund's books. Done."
- Problem statement: conversational tone ("You know the drill...")
- Feature descriptions: specific, plain-language ("Pulls trades from...", "No CSV uploads")
- Pricing: honest beta framing ("You help us find rough edges, we give you the product free")

**Settings page**
- 4-tab settings page (Organization, Team, Appearance, Connections)
- Organization: edit org name, view creation date and role
- Team: member list with emails, roles, join dates (uses admin client for auth.users)
- Appearance: light/dark/system theme cards
- Connections: summary stats with link to /connections
- API routes: GET/PATCH /api/settings/organization, GET /api/settings/team, GET /api/settings/connections

**Supabase Vault integration**
- Vault helper (`src/lib/supabase/vault.ts`) with storeSecret, getSecret, deleteSecret
- Exchange connection route stores API keys in Vault, sets status to 'active'
- Sync route retrieves keys from Vault, passes to exchange adapters
- Wallet sync implemented (public APIs, no Vault needed)
- Removed all 501 stubs

### Status
- **30 routes, 0 build errors**
- **All 5 backlog items resolved**
- **GitHub remote configured**
