# CLAUDE.md — Fundkeeper

Crypto fund back-office MVP. Self-serve platform for small crypto funds ($5-50M AUM).

## Stack
- Next.js 16 (App Router), React 19, TypeScript (strict)
- Supabase (Postgres + Auth + RLS + Vault for API key encryption)
- Tailwind v4, shadcn/ui (base-nova style, neutral base color)
- Vercel deployment

## Commands
- `npm run dev` — start dev server (turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx supabase db push` — push migrations to Supabase
- `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts` — generate types

## Architecture
- `src/app/(app)/` — authenticated app shell (sidebar layout, auth guard via middleware)
- `src/app/api/` — API routes for sync, categorization, cost-basis, reports, exports
- `src/lib/exchanges/` — adapter pattern per exchange (Coinbase, Binance, Kraken, Gemini)
- `src/lib/blockchain/` — chain adapters (ETH, BTC, SOL)
- `src/lib/sync/` — sync engine with deduplication + normalization
- `src/lib/categorization/` — 6 deterministic rules for transaction classification
- `src/lib/cost-basis/` — per-wallet FIFO calculator
- `src/lib/reconciliation/` — 1099-DA CSV parser + matcher
- `src/lib/gl-export/` — journal entry mapper for QuickBooks/Xero

## Conventions
- All tables have `org_id` with RLS policies — never query without org context
- Exchange API keys encrypted via Supabase Vault — never store plaintext
- Supabase client: use `createClient()` from `@/lib/supabase/server` in Server Components/Route Handlers
- Supabase client: use `createBrowserClient()` from `@/lib/supabase/client` in Client Components
- Transaction categories enum: buy, sell, transfer_in, transfer_out, staking_reward, interest, income, fee, chain_split, gift_in, gift_out, fiat_deposit, fiat_withdrawal, unknown

## RLS Pattern
Every query goes through Supabase client with user's JWT. RLS policies filter by org_id via org_members join. No admin bypass in app code.

## Build Log
Keep running build log at docs/build-log.md.
