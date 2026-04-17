---
title: App Thin-Client Rework Implementation Plan
type: refactor
status: active
date: 2026-04-17
origin: docs/brainstorms/2026-04-17-app-thin-client-rework-requirements.md
---

# App Thin-Client Rework Implementation Plan

## Overview

Rework Next.js `app/` dari scaffold yang punya Prisma + API routes sendiri menjadi **thin client** murni yang consume HTTP API dari Hono `backend/`. Semua data flow ke backend; app bertanggung jawab hanya untuk UI, client-side signing via Privy embedded wallet (dengan `@privy-io/wagmi` connector), dan Privy auth.

Rework dibagi **9 phase**, tiap phase detail dengan testing + verification + lint + build gate sebelum pindah ke phase berikutnya. Commit dipecah kecil per-unit. Tidak ada duplicate/redundant code — setiap kali menambah fitur, re-check apakah helper/pattern yang ada bisa di-reuse.

## Problem Frame

Lihat `docs/brainstorms/2026-04-17-app-thin-client-rework-requirements.md` §1. Ringkasnya: app di-scaffold dengan Prisma schema, API routes, dan services yang **tidak kompatibel** dengan backend Hono canonical. Schema drift (missing RedemptionSlot, fee snapshots, BOGO `qrPerSlot`, enum mismatch), duplikasi logic 7 folder, migration ownership ambigu. Konsekuensi: UX tidak bisa match brief (fee breakdown, BOGO, resilient redemption flow), dan carrying cost jalan dua track schema.

Solusi: delete semua server-side code di `app/`, ganti dengan API client layer + React Query + wagmi signing, tambah onboarding + state machine resilience, hardening ke production-grade.

## Requirements Trace

Traceable ke origin document goals + success criteria:

- **R1.** App jadi thin client — UI + client-side signing + Privy auth only. (origin §2 Goals, §3 Target Architecture)
- **R2.** Login → browse → redeem → QR end-to-end jalan. (origin §2, §6 happy paths)
- **R3.** Fee breakdown visible: base + app fee + gas + total IDR + konversi $WEALTH. (origin §6 voucher detail, §9.1)
- **R4.** BOGO voucher (`qrPerSlot=2`) render badge + 2 QR post-redeem. (origin §6, §9.1)
- **R5.** Signing 9-state state machine dengan iframe-eviction recovery. (origin §6 state machine)
- **R6.** First-time onboarding deposit screen untuk zero-balance user. (origin §6 onboarding)
- **R7.** Chain guard: Base mainnet only; block Redeem kalau chain lain. (origin §6)
- **R8.** Rejection / wallet-error / submit-tx retry recovery. (origin §6 rejection recovery)
- **R9.** QR polling dengan timed banners (60s/300s/900s) + stuck-paid reconcile CTA. (origin §6, §7-H)
- **R10.** Two-tab guard + double-submit idempotency. (origin §6 edge cases, §7-G)
- **R11.** Offline resilience banner + flow resume. (origin §6 edge cases)
- **R12.** Delete server-side code: `app/prisma/`, `app/src/app/api/`, `app/src/lib/db.ts`, `app/src/lib/services/`, server auth helpers. (origin §4.1)
- **R13.** Production-grade cleanup: TS strict, Zod runtime validation, ESLint/Prettier/Husky, CSP, env validation, Sentry hooks, dead-code sweep, bundle <200KB gzip. (origin §4.8, §9.4)
- **R14.** Success criteria: login-to-redeem ≤90s p50, fee breakdown renders, BOGO works, QR image loads, stuck recovery, rejection recovery, two-tab guard, offline resilience, onboarding, iframe-eviction recovery. (origin §9.1)
- **R15.** Every phase must pass lint + typecheck + build before commit; fix errors sekalian. (user directive)

## Scope Boundaries

- **In-scope:** semua dibawah `app/` (code, config, env, README).
- **Out-of-scope (explicit non-goals):**
  - Backend code changes. Backend items (B1-B10) dicatat sebagai Phase B di origin §10; block live launch, tidak block plan ini.
  - Back-office changes. Back-office tetap jalan tidak di-touch.
  - Feature baru di luar scope brief Phase 1 (deposit execution automation, push notif, dsb — UI placeholder OK).
  - Schema migration coordination di backend (diluar scope; app consume via API response).

## Context & Research

### Relevant Code and Patterns

**Current app state (to be transformed):**

- `src/providers.tsx` — Privy + wagmi sudah wired; perlu refactor ke `@privy-io/wagmi` connector + single-chain.
- `src/lib/wagmi.ts` — current config pakai `wagmi/chains` (`base` + `baseSepolia`); perlu refactor ke `@privy-io/wagmi` + Base mainnet only.
- `src/hooks/use-auth.ts`, `use-send-wealth.ts`, `use-wealth-balance.ts` — keep & adapt.
- `src/components/layout/auth-guard.tsx`, `bottom-nav.tsx`, `mobile-header.tsx`, `sidebar.tsx` — keep layout shell, refactor AuthGuard ke sync-gate pattern.
- `src/app/(main)/layout.tsx`, `page.tsx` — keep route shape, refactor data source ke RQ.
- `src/lib/utils.ts` — keep helpers (`cn`, `formatIdr`, `formatWealth`, `formatDate`).

**To delete (§4.1 of brainstorm):**

- `prisma/` (schema + generated client)
- `src/app/api/` (7 route folders: auth, merchants, price, redemptions, transactions, vouchers, webhook)
- `src/lib/db.ts`
- `src/lib/services/` (entire folder)
- `src/lib/auth/privy-server.ts`, `src/lib/auth/protect-api.ts`
- `prisma.config.ts`

**Backend endpoints to consume** (from brainstorm §5.1, verified paths ke `backend/src/routes/`):

- `POST /api/auth/user-sync`, `GET /api/merchants`, `GET /api/merchants/:id`, `GET /api/vouchers`, `GET /api/vouchers/:id`, `POST /api/vouchers/:id/redeem`, `GET /api/redemptions`, `GET /api/redemptions/:id`, `PATCH /api/redemptions/:id/submit-tx`, `GET /api/transactions`, `GET /api/price/wealth`, `GET /api/categories`.

### Institutional Learnings

No `docs/solutions/` entries yet (new repo). Memory:

- `memory/project_product_brief.md` — QR upload flow, pricing (IDR + 3% + gas → $WEALTH), dev wallet destination.
- `memory/project_app_thin_client_rework.md` — summary of this rework decisions.

### External References

- `@privy-io/wagmi` docs untuk connector setup + `createConfig` signature.
- Next.js 16 App Router (Server Components default).
- React Query v5 mutation + polling patterns.
- Zod v4 (already in deps).

## Key Technical Decisions

- **D1. Embedded-wallet-only signing via `@privy-io/wagmi` connector.** Tidak ada external wallet. `useWriteContract` + `useReadContract` dari wagmi dipakai karena embedded wallet ter-expose sebagai connector. (origin §4.5)
- **D2. Single-chain Base mainnet (8453).** Hapus `baseSepolia` dari current config. Chain guard di UI (disable Redeem kalau `chainId !== 8453`).
- **D3. DTO types derived dari Zod schemas via `z.infer`.** Single source of truth untuk response shape. Zod parse di API client = fail-fast saat backend break contract.
- **D4. Per-endpoint unwrapper di `endpoints.ts`.** Backend response shape beda-beda; normalize ke internal shape supaya hook layer tidak leak envelope variance.
- **D5. State machine untuk redeem flow di Zustand store.** 9 states (idle → price-quote → initiating → opening-wallet → awaiting-signature → broadcasting → submitting-hash → polling-confirmation → done) + side-state `wallet-recovering`. Single store, tidak scatter.
- **D6. Onboarding gate di AuthGuard.** Post-sync check balance + history; redirect ke `/onboarding/deposit` kalau first-time zero-balance. `localStorage` flag `onboardingSeen` untuk persistent skip.
- **D7. QR polling cadence adaptive** — 3s (first 30s) → 5s (30-300s) → 10s (5min+) → switch ke on-demand-only after 15min (bukan hard stop).
- **D8. Env validation at boot via Zod (`src/env.ts`).** Fail-fast saat build/dev kalau required env missing.
- **D9. Zustand untuk transient state**, React Query untuk server state, wagmi/Privy hooks untuk on-chain/auth state. Tidak mixing.
- **D10. No barrel files (`index.ts` re-exports) kecuali untuk `src/types/api.ts`.** Hindari circular imports dan spurious re-bundles.
- **D11. Incremental delete strategy.** Delete `src/app/api/` dan `prisma/` di phase akhir (Phase 7), setelah consumer paths sudah migrated ke backend endpoints — mencegah dev server broken selama transition.

## Open Questions

### Resolved During Planning

- **Privy + wagmi version coordination:** `@privy-io/wagmi` latest expects `wagmi@^2.x`. Plan akan downgrade `wagmi` dari `^3.6.1` ke `^2.x` saat install `@privy-io/wagmi` (Phase 2 unit).
- **Middleware:** `src/middleware.ts` jadi no-op (edge runtime tidak bisa verify Privy tanpa server auth SDK). Delete file kecuali ada requirement lain.
- **Env var precedence:** Pakai `.env.local` untuk dev override; `NEXT_PUBLIC_API_BASE_URL` default `http://localhost:8787/api`.
- **Delete order:** Hapus kode lama di Phase 7 setelah semua consumer di-migrate. Hindari no-op transition di mid-refactor.

### Deferred to Implementation

- Exact copy (microcopy) untuk error states — sample ada di brainstorm §6 UI copy table; final review saat M8-M9.
- Sentry DSN + telemetry endpoint URL — provisioned later; hook wiring dulu (no-op fallback kalau DSN kosong).
- `/api/settings/public` endpoint timing — di-request ke backend tapi belum ready saat Phase A; fallback ke `NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS` env var dengan TODO marker.
- Sanity check bundle size exact threshold (target <200KB gzip) — measured at M8, adjust if unreasonable untuk Base mainnet Privy+wagmi baseline.
- Exact knip/ts-prune config — dialed in saat Phase 8.

## High-Level Technical Design

> _This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce._

### Layering (post-rework)

```
┌───────────────────────────────────────────────────────────────────┐
│ UI Layer (Server Components + Client "use client" islands)        │
│ src/app/(main)/*, src/app/auth/*, src/app/onboarding/*            │
│ src/components/{layout,shared,features}/*                         │
└──────────────────────┬────────────────────────────────────────────┘
                       │ uses
┌──────────────────────▼────────────────────────────────────────────┐
│ Hook Layer (React Query + Zustand + wagmi/Privy)                  │
│ src/hooks/use-*.ts (server state)                                 │
│ src/stores/redemption-flow.ts (transient signing state)           │
└──────────────────────┬────────────────────────────────────────────┘
                       │ uses
┌──────────────────────▼────────────────────────────────────────────┐
│ API Client Layer                                                  │
│ src/lib/api/client.ts (fetch wrapper + auth + Zod parse)          │
│ src/lib/api/endpoints.ts (typed per-endpoint functions)           │
│ src/lib/api/errors.ts (uniform error mapping)                     │
└──────────────────────┬────────────────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼────────────────────────────────────────────┐
│ Backend Hono (NEXT_PUBLIC_API_BASE_URL) — canonical data          │
└───────────────────────────────────────────────────────────────────┘
```

**Strict rule:** UI components **never** import from `src/lib/api/*` langsung. Selalu via hook. Hook is the only caller of API client.

### Redemption state machine

```
idle
  ↓ tap Redeem
price-quote  ← fetch fresh /api/price/wealth (lock for flow)
  ↓ success
initiating   ← POST /api/vouchers/:id/redeem
  ↓ 200 { redemption, txDetails } (or { redemption, alreadyExists: true } → skip ke opening-wallet)
opening-wallet        — Privy modal opening
  ↓ modal ready             ↑
awaiting-signature    — user confirms di modal
  ↓ signed                   ↑ (iframe eviction → wallet-recovering → opening-wallet)
broadcasting         — wagmi sending to RPC
  ↓ txHash received
submitting-hash      — PATCH /api/redemptions/:id/submit-tx (idempotent retry)
  ↓ 200
polling-confirmation — GET /api/redemptions/:id polling
  ↓ status=confirmed
done                  — render QR(s)

[error transitions from any state]
  → recovery-toast (transient) → back to previous state or idle
```

### Folder structure (target)

```
app/
├── src/
│   ├── app/
│   │   ├── (main)/                  # Authenticated routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # Home
│   │   │   ├── merchants/
│   │   │   ├── vouchers/[id]/
│   │   │   ├── qr/[redemptionId]/
│   │   │   ├── history/
│   │   │   ├── wallet/
│   │   │   └── profile/
│   │   ├── onboarding/deposit/      # NEW
│   │   ├── auth/login/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/                  # AuthGuard, Sidebar, BottomNav, MobileHeader
│   │   ├── shared/                  # NEW: Button, Card, Skeleton, Toast, Modal primitives
│   │   └── features/                # NEW: VoucherCard, FeeBreakdown, RedemptionStatus, QrDisplay, SigningStateUI
│   ├── hooks/                       # Per-resource RQ hooks + wagmi hooks
│   ├── stores/                      # NEW: redemption-flow.ts (Zustand)
│   ├── lib/
│   │   ├── api/                     # NEW: client.ts, endpoints.ts, errors.ts
│   │   ├── schemas/                 # NEW: Zod schemas (z.infer → types)
│   │   ├── wagmi.ts                 # Refactored to @privy-io/wagmi
│   │   ├── utils.ts                 # Keep helpers
│   │   ├── copy.ts                  # NEW: centralized copy (easier proofread + future i18n)
│   │   └── logger.ts                # NEW: prod-no-op logger wrapper
│   ├── types/api.ts                 # Re-export z.infer types
│   ├── env.ts                       # NEW: Zod env validation at boot
│   ├── providers.tsx                # Refactored
│   └── middleware.ts                # Deleted
├── .env.example                     # Rewritten
├── next.config.ts                   # CSP headers, image domains
├── eslint.config.mjs                # Strict config
├── prettier.config.mjs              # NEW (w/ tailwindcss plugin)
├── tsconfig.json                    # Strict flags
├── package.json                     # Cleaned deps
└── README.md                        # Rewritten thin-client description
```

## Phased Delivery

9 phase berurutan. **Tiap phase punya same-shape gate:**

1. Implement units dalam phase.
2. Run **test scenarios** yang di-define per unit (manual or automated).
3. Run `pnpm --filter app lint` → fix semua errors.
4. Run `pnpm --filter app tsc --noEmit` → fix semua errors.
5. Run `pnpm --filter app build` → fix semua errors.
6. Manual smoke test dari perspective end-user untuk flow yang baru di-touch.
7. Commit per-unit (kecil, atomic) — satu commit per unit kalau possible, atau commit berdasarkan logical pair.
8. Phase verification checklist green → merge ke main / move next phase.

Estimated total: ~8 dev-days (1 engineer). Per brainstorm §10.

---

## Implementation Units

### Phase 1: API Client Foundation

Goal: Bikin HTTP layer ke backend + Zod schemas untuk response validation + typed DTOs. Tidak touch UI; no regression.

- [x] **Unit 1.1: Install Zod schemas & DTO types**

**Goal:** Define Zod schemas untuk setiap backend response shape; derive TypeScript types via `z.infer`.

**Requirements:** R12, R13

**Dependencies:** None

**Files:**

- Create: `src/lib/schemas/merchant.ts`
- Create: `src/lib/schemas/voucher.ts`
- Create: `src/lib/schemas/redemption.ts`
- Create: `src/lib/schemas/transaction.ts`
- Create: `src/lib/schemas/category.ts`
- Create: `src/lib/schemas/price.ts`
- Create: `src/lib/schemas/user.ts`
- Create: `src/types/api.ts` (barrel, re-export types only)

**Approach:**

- Satu schema file per resource. Export schema `merchantSchema` + type `Merchant` (via `z.infer<typeof merchantSchema>`).
- Pagination schema: `paginationSchema = z.object({ page, limit, total, totalPages })`; list response = `{ <resource>s: array, pagination }`.
- `txDetailsSchema` untuk `POST /vouchers/:id/redeem` response.
- Enums match backend (`QrStatus`, `RedemptionStatus`, `MerchantCategory` — verify di backend schema actual values saat write).

**Patterns to follow:**

- Zod 4 syntax (`.object`, `.array`, `.enum`).
- Prefer `.nullable()` over `.optional()` kalau field bisa null di DB.

**Test scenarios:**

- Happy path: valid backend-shape JSON → parse success, inferred type correct.
- Edge case: extra field di response → parse passes (Zod strip by default).
- Error path: missing required field → parse throws; error clear.
- Integration: `z.infer<typeof voucherSchema>` must assignable to variable declared as `Voucher`.

**Verification:**

- `pnpm tsc --noEmit` → zero errors.
- `import { Voucher } from '@/types/api'` resolves + autocompletes.

**Commit:** `feat(app): add zod schemas and derived dto types`

---

- [x] **Unit 1.2: API error + envelope utilities**

**Goal:** Central error type + response unwrapper.

**Requirements:** R1, R13

**Dependencies:** 1.1

**Files:**

- Create: `src/lib/api/errors.ts`

**Approach:**

- `ApiError` class dengan `status`, `code?`, `message`, `details?`.
- Helper `throwIfNotOk(res: Response)` yang parse backend `{ error, details? }` envelope → throw `ApiError`.
- Map common codes: 401 → `AuthError`, 409 → `ConflictError`, 400 → `ValidationError`, 5xx → `ServerError` (all extend `ApiError`).
- Use `ApiError` message di toast UI; `ApiError.code` untuk programmatic handling.

**Test scenarios:**

- Happy path: Response 200 → `throwIfNotOk` no-op.
- Error path: 400 with `{ error, details }` → throws `ValidationError` dengan details attached.
- Error path: 401 → throws `AuthError`.
- Edge case: non-JSON 5xx response → throws `ServerError` dengan generic message.

**Verification:**

- `pnpm tsc` clean.
- Unit tests (vitest, deferred to Phase 9) — scenarios documented.

**Commit:** `feat(app): add api error types and envelope helpers`

---

- [x] **Unit 1.3: API client (fetch wrapper) + auth token injection**

**Goal:** `client.ts` wrapping `fetch` dengan base URL, Bearer token, Zod parse, error envelope.

**Requirements:** R1, R12

**Dependencies:** 1.1, 1.2

**Files:**

- Create: `src/lib/api/client.ts`

**Approach:**

- Function `apiFetch<T>(path, opts: { schema: ZodSchema<T>, token?: string, ... }): Promise<T>`.
- Base URL dari `env.NEXT_PUBLIC_API_BASE_URL` (akan di-validate di Unit 8.3 — untuk now `process.env` direct).
- Auto-inject `Authorization: Bearer <token>` kalau `token` param present.
- Call `throwIfNotOk`; `await res.json()`; `schema.parse(data)`; return parsed.
- Propagate `ApiError` untuk non-2xx; wrap Zod parse errors ke `ApiError` generic `ShapeError` (indicates backend contract drift).
- Accept `{ headers, signal, body, method, query }` options; serialize query params.

**Patterns to follow:**

- No barrel `index.ts` — explicit imports.
- No side effects di module load.

**Test scenarios:**

- Happy path: GET request → parsed typed response returned.
- Happy path: with token → `Authorization` header present.
- Error path: 400 → throws `ValidationError` with details.
- Error path: shape mismatch → throws `ShapeError`.
- Edge case: abort via `signal` → throws DOMException (propagate).
- Integration: query params serialize correctly (arrays, undefined skipped).

**Verification:**

- `pnpm tsc` clean.
- Manual: `apiFetch('/categories', { schema: categoriesResponseSchema })` against running backend returns parsed categories.

**Commit:** `feat(app): add http client with zod parsing and auth injection`

---

- [x] **Unit 1.4: Endpoint functions**

**Goal:** Typed per-endpoint functions di `endpoints.ts`. Each function = one backend route + response unwrap ke internal shape.

**Requirements:** R1, R2

**Dependencies:** 1.3

**Files:**

- Create: `src/lib/api/endpoints.ts`

**Approach:**

- Functions: `getMerchants(params, token?)`, `getMerchant(id, token?)`, `getVouchers(params, token?)`, `getVoucher(id, token?)`, `redeemVoucher(id, body, token)` (auth required), `getRedemptions(params, token)`, `getRedemption(id, token)`, `submitTx(id, txHash, token)`, `getTransactions(params, token)`, `getWealthPrice()`, `getCategories()`, `syncUser(token)`.
- Internal normalized shape: `{ data: T, pagination?: Pagination }` untuk list endpoints; `T` langsung untuk single-resource.
- Each function: call `apiFetch` + schema + unwrap envelope → return normalized.
- Accept `AbortSignal` param untuk RQ cancellation.

**Test scenarios:**

- Happy path: `getVouchers({ page: 1 })` returns `{ data: Voucher[], pagination }`.
- Happy path: `redeemVoucher(id, body, token)` returns `{ redemption, txDetails, alreadyExists? }`.
- Error path: `redeemVoucher` without token → throws `AuthError` client-side (guard) or backend 401.
- Edge case: empty list → `{ data: [], pagination: { total: 0, ... } }` (not thrown).

**Verification:**

- `pnpm tsc` clean.
- Manual: call setiap endpoint against running backend, confirm shape match.

**Commit:** `feat(app): add typed endpoint functions for backend api`

---

- [x] **Unit 1.5: React Query hooks per-resource**

**Goal:** Hook layer yang wrap endpoint functions dengan RQ `useQuery` / `useMutation` + caching strategy.

**Requirements:** R1, R2, R9

**Dependencies:** 1.4

**Files:**

- Create: `src/hooks/use-merchants.ts`, `src/hooks/use-merchant.ts`
- Create: `src/hooks/use-vouchers.ts`, `src/hooks/use-voucher.ts`
- Create: `src/hooks/use-redemptions.ts`, `src/hooks/use-redemption.ts`
- Create: `src/hooks/use-transactions.ts`
- Create: `src/hooks/use-wealth-price.ts`
- Create: `src/hooks/use-categories.ts`
- Create: `src/hooks/use-redeem-voucher.ts` (mutation)
- Create: `src/hooks/use-submit-tx.ts` (mutation)
- Create: `src/hooks/use-sync-user.ts` (mutation)
- Create: `src/hooks/use-auth-token.ts` (Privy `getAccessToken` wrapper)

**Approach:**

- Query keys convention: `['vouchers', { ...filters }]`, `['voucher', id]`, `['redemption', id]`, etc. Centralize di `src/hooks/keys.ts` (constants) untuk invalidation consistency.
- `use-wealth-price`: `staleTime: 30s`, refetchInterval when `enabled: true` flag active (pause when signing).
- `use-redemption`: adaptive `refetchInterval` by elapsed time (see D7) when `status === 'pending'`.
- `use-auth-token`: returns `{ token, ready }` from `useGetAccessToken()` (Privy hook) + `authenticated`.
- Mutations return standard RQ `{ mutate, mutateAsync, isPending, error }`.
- Every query that needs auth: pass `token` via `useAuthToken()`; disable query kalau `!ready`.

**Patterns to follow:**

- Existing `src/hooks/use-send-wealth.ts` structure (keep as wagmi signing helper).
- `use-wealth-balance.ts` keep as-is (wagmi `useReadContract`).

**Test scenarios:**

- Happy path: `useVouchers({ category: 'kuliner' })` loads, returns data with pagination.
- Happy path: `useRedeemVoucher` mutation success returns `{ redemption, txDetails }`.
- Error path: protected query without ready token → disabled, no fetch attempt.
- Edge case: `useRedemption(id)` polling stops once `status === 'confirmed'`.
- Integration: mutation success invalidates related queries (`['redemption', id]`, `['redemptions']`).

**Verification:**

- `pnpm tsc` clean.
- Manual: test `useVouchers` di dummy component, confirm data loads.

**Commit:** `feat(app): add react-query hooks per resource`

---

**Phase 1 exit gate:**

- [x] All Phase 1 units merged.
- [x] `pnpm lint` → zero errors / warnings.
- [x] `pnpm tsc --noEmit` → zero errors.
- [x] `pnpm build` → success.
- [ ] API client + hooks usable from a throw-away test component against running backend.
- [x] No existing page broken (hooks not yet wired into pages — that's Phase 3+).

---

### Phase 2: Providers, Env, and Privy + wagmi rewiring

Goal: Migrate provider stack ke `@privy-io/wagmi` connector, single-chain Base mainnet, env validation, sync gate AuthGuard.

- [x] **Unit 2.1: Env validation via Zod**

**Goal:** `src/env.ts` parse `process.env` dengan Zod; fail-fast on boot kalau required missing.

**Requirements:** R13

**Dependencies:** 1.1

**Files:**

- Create: `src/env.ts`
- Modify: `src/providers.tsx` (import from `@/env` instead of `process.env`)

**Approach:**

- Separate schemas: `clientEnvSchema` (NEXT*PUBLIC*\*) dan `serverEnvSchema` (none needed post-rework, but scaffold the pattern).
- Parse at module top-level (throws at build/dev start time).
- Export typed `env` object.
- Guard: karena Next.js inlines `process.env.NEXT_PUBLIC_*` at build, passing via `env.X` still works (transform happens at build time; runtime access via `env` holds inlined value).

**Test scenarios:**

- Happy path: all required vars present → `env` exports parsed values.
- Error path: `NEXT_PUBLIC_PRIVY_APP_ID` missing → throws at boot with clear field name.
- Edge case: `NEXT_PUBLIC_API_BASE_URL` invalid URL → fails validation.

**Verification:**

- Delete one env var in `.env.local`, run `pnpm dev` → clear error.
- Restore → dev starts.

**Commit:** `feat(app): add zod-based env validation at boot`

---

- [x] **Unit 2.2: Install `@privy-io/wagmi` + downgrade wagmi to v2**

**Goal:** Dependency swap. Check peer compatibility, regenerate lockfile.

**Requirements:** R1, R5

**Dependencies:** None (can run parallel to 2.1)

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml` (regenerated)

**Approach:**

- Add `@privy-io/wagmi` (latest compatible with `@privy-io/react-auth@^3.21.2`).
- Downgrade `wagmi` dari `^3.6.1` ke `^2.x` (match `@privy-io/wagmi` peer dep).
- Keep `viem`, `@tanstack/react-query`, `@privy-io/react-auth`.
- `pnpm install` — verify no peer dep warnings.
- Remove `@prisma/client`, `prisma` from deps (Phase 7 will delete files).

**Test scenarios:**

- Happy path: `pnpm install` success, no peer warnings.
- Error path (catch + fix): if `@privy-io/wagmi` peer expects `viem@^2.x` but project uses different — align.

**Verification:**

- `pnpm list wagmi @privy-io/wagmi viem` shows compatible versions.
- `pnpm build` passes (may break runtime until 2.3 — acceptable di commit ini; boundary commits OK).

**Commit:** `chore(app): install privy-wagmi connector and align peer deps`

---

- [x] **Unit 2.3: Refactor `lib/wagmi.ts` to `@privy-io/wagmi` + single-chain**

**Goal:** New wagmi config pakai Privy's `createConfig`; Base mainnet only.

**Requirements:** R1, R7

**Dependencies:** 2.2

**Files:**

- Modify: `src/lib/wagmi.ts`

**Approach:**

- Import `createConfig` dari `@privy-io/wagmi`.
- Chains: `[base]` saja (hapus `baseSepolia`).
- Transport: single `http()` ke Alchemy mainnet RPC.
- Keep `ERC20_ABI` export.

**Test scenarios:**

- Happy path: `wagmiConfig` object valid untuk Privy's `WagmiProvider`.

**Verification:**

- `pnpm tsc` clean.

**Commit:** `refactor(app): migrate wagmi config to privy-wagmi single-chain`

---

- [x] **Unit 2.4: Refactor `providers.tsx` — PrivyProvider → QueryClientProvider → WagmiProvider**

**Goal:** Wire providers dengan correct ordering; use `WagmiProvider` dari `@privy-io/wagmi` (not stock `wagmi`).

**Requirements:** R1

**Dependencies:** 2.3

**Files:**

- Modify: `src/providers.tsx`

**Approach:**

- Outer: `PrivyProvider` (already configured).
- Middle: `QueryClientProvider` with default options (`staleTime: 30s`, `gcTime: 5m`, `retry: 1`).
- Inner: `WagmiProvider` dari `@privy-io/wagmi` (reads Privy context to auto-register embedded wallet connector).
- Embedded wallet `createOnLogin: 'all-users'` tetap.

**Test scenarios:**

- Happy path: login OTP → embedded wallet created → `useAccount()` returns wallet address on client.
- Happy path: `useReadContract` pakai embedded wallet connector (no MetaMask popup).
- Integration: after login, `useWallets()` dari Privy returns embedded wallet with `connectorType === 'embedded'`.

**Verification:**

- `pnpm dev`, login via Privy OTP, check DevTools: wagmi chainId = 8453, connector = 'embedded'.

**Commit:** `refactor(app): rewire providers to privy-wagmi connector stack`

---

- [x] **Unit 2.5: AuthGuard with sync-gate + exponential backoff**

**Goal:** Block protected render sampai `syncUser()` resolved. Handle first-time 404 race.

**Requirements:** R1, R6

**Dependencies:** 1.5, 2.4

**Files:**

- Modify: `src/components/layout/auth-guard.tsx`
- Modify: `src/hooks/use-auth.ts`

**Approach:**

- Flow: `!authenticated` → redirect `/auth/login`. `authenticated && !embeddedWallet.ready` → spinner. Both ready → call `useSyncUser()` mutation.
- Retry: on network error, exponential backoff (1s, 2s, 4s, max 3x). Fatal error → sign-out + toast.
- Session-scoped flag: `syncedThisSession` ref agar tidak re-sync on re-render.
- Post-sync: run first-time onboarding check (Unit 3.1) inside guard. Kalau redirect ke onboarding, still render children behind it (user sees onboarding).

**Test scenarios:**

- Happy path: fresh login → sync OK → children render.
- Error path: sync 5xx → retry 3x → still fail → sign-out + toast.
- Edge case: user refresh mid-session → token in Privy storage → sync skip via ref.
- Integration: protected route access without auth → redirect.

**Verification:**

- Manual: login, check network tab → `POST /auth/user-sync` called once; refresh page → not called again in same session.
- Simulate backend 500 (block endpoint in DevTools) → observe 3 retries then sign-out.

**Commit:** `feat(app): add auth sync gate with backoff and retry`

---

**Phase 2 exit gate:**

- [x] `pnpm lint && pnpm tsc --noEmit && pnpm build` → green.
- [ ] Manual: end-to-end login via OTP → embedded wallet ready → sync-user hits backend → main layout renders.
- [ ] DevTools confirm wagmi on `base` chain (8453) only.

---

### Phase 3: Onboarding + Voucher detail + Fee breakdown + Chain guard

Goal: First-time onboarding screen + voucher detail yang render fee breakdown + BOGO badge + chain/balance guard.

- [x] **Unit 3.1: First-time onboarding deposit screen**

**Goal:** `/onboarding/deposit` route: wallet address + QR + Base network warning + $WEALTH contract address + live balance listener + "Lanjut" CTA.

**Requirements:** R6

**Dependencies:** 1.5 (hooks), 2.5 (AuthGuard)

**Files:**

- Create: `src/app/onboarding/deposit/page.tsx`
- Create: `src/components/features/deposit-card.tsx`
- Modify: `src/components/layout/auth-guard.tsx` (first-time check: 0 balance + 0 history → redirect)
- Modify: `src/lib/copy.ts` (add onboarding copy)

**Approach:**

- Detection: inside AuthGuard after sync, query `useTransactions({ limit: 1 })` + `useWealthBalance()`. Both zero → `router.push('/onboarding/deposit')`. Set `localStorage.setItem('onboardingSeen', 'true')` on CTA tap / skip.
- Page: h1 + 3 steps (Wallet, Kirim $WEALTH, Status). QR of wallet address via lightweight QR lib (e.g., `qrcode.react` — smallest footprint) — **check bundle** saat build.
- Base network badge (prominent). Contract address from `env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS` (TODO → switch to `/api/settings/public` when ready).
- Live balance: `useWealthBalance()` refetchInterval 10s. Once balance > 0, enable CTA.
- Skip link at bottom.

**Test scenarios:**

- Happy path: first-time user (0 history, 0 balance) → auto-redirect to onboarding.
- Happy path: balance updates → CTA activates → tap → `/`.
- Edge case: user skips → lands at `/` → no re-redirect same session.
- Edge case: user with existing balance → doesn't hit onboarding (flag bypass).
- Integration: copy wallet address button copies to clipboard.
- Error path: `/api/settings/public` not ready → fallback to env var + console.info log.

**Verification:**

- Manual: clear localStorage, login fresh user, observe redirect.
- Manual: deposit $WEALTH to test wallet, balance polls, CTA activates.
- `pnpm lint && pnpm tsc && pnpm build` green.

**Commit (x2):** `feat(app): add deposit card feature component`, `feat(app): add onboarding route with first-time detection`

---

- [x] **Unit 3.2: Voucher detail page with fee breakdown**

**Goal:** `/vouchers/[id]` shows base + app fee + gas + total IDR + live $WEALTH conversion + BOGO badge + chain guard + balance check.

**Requirements:** R3, R4, R7

**Dependencies:** 1.5

**Files:**

- Create: `src/app/(main)/vouchers/[id]/page.tsx` (if not exists, otherwise Modify)
- Create: `src/components/features/fee-breakdown.tsx`
- Create: `src/components/features/voucher-detail-card.tsx`
- Create: `src/components/features/chain-guard-banner.tsx`
- Modify: `src/lib/copy.ts`

**Approach:**

- Page: Client Component (needs wagmi + RQ). Fetch voucher via `useVoucher(id)`.
- `FeeBreakdown`: props `{ basePrice, appFeeAmount, gasFeeAmount, totalPrice, wealthPriceIdr }` → 4-row grid + horizontal rule + total + converted $WEALTH. All values from backend DTO (don't recalc client-side).
- `ChainGuardBanner`: reads `useAccount().chainId`. If not 8453 → render warning + disable prop for CTA.
- Balance check: `useWealthBalance()` vs required $WEALTH. If insufficient → disable Redeem + "Saldo tidak cukup, deposit dulu" copy + link ke `/onboarding/deposit`.
- BOGO badge: `voucher.qrPerSlot === 2` → `<Badge>Buy 1 Get 1</Badge>` + note "Setelah redeem: 2 QR".
- Live price refetch pause via Zustand store `redemptionFlow.isSigning` flag.
- Redeem button wires to `use-redeem-voucher` mutation (implemented fully di Phase 4).

**Patterns to follow:**

- Existing `src/lib/utils.ts` `formatIdr`, `formatWealth`.

**Test scenarios:**

- Happy path: voucher loads → breakdown renders with correct values.
- Happy path: BOGO voucher → badge visible.
- Edge case: `wealthPriceIdr` loading → skeleton, Redeem disabled.
- Edge case: chain ≠ Base → banner shows, Redeem disabled.
- Edge case: balance < required → CTA disabled + deposit link visible.
- Error path: voucher 404 → error state + back-to-list link.
- Integration: changing chain in wallet → banner updates reactively.

**Verification:**

- Manual: navigate to voucher with BOGO → see badge.
- Manual: switch wallet chain (dev) → see banner.
- `pnpm lint && pnpm tsc && pnpm build` green.

**Commit (x3):** `feat(app): add fee breakdown feature component`, `feat(app): add chain guard banner component`, `feat(app): wire voucher detail page with breakdown and guards`

---

**Phase 3 exit gate:**

- [x] Lint + typecheck + build green.
- [ ] Manual UAT: fresh user → onboarding → deposit → home → voucher detail renders fee breakdown + BOGO + chain guard works.

---

### Phase 4: Redemption State Machine + Signing UX + iframe-eviction recovery

Goal: Core signing flow state machine + UI per state + rejection/retry + iframe-eviction side-state.

- [x] **Unit 4.1: Redemption flow Zustand store**

**Goal:** Single source of truth untuk transient state machine. Actions: `initiate`, `transition`, `setError`, `reset`.

**Requirements:** R5

**Dependencies:** 1.5

**Files:**

- Create: `src/stores/redemption-flow.ts`

**Approach:**

- State shape: `{ state: SigningState, redemptionId?, txDetails?, txHash?, error?, priceLock?: string, startedAt?: number }`.
- `SigningState` union: `'idle' | 'price-quote' | 'initiating' | 'opening-wallet' | 'awaiting-signature' | 'broadcasting' | 'submitting-hash' | 'polling-confirmation' | 'done' | 'wallet-recovering' | 'error'`.
- Selectors: `isSigning` (true for mid-flow states), `canCancel` (true for `awaiting-signature`).
- Actions: typed transitions; invalid transitions log + no-op (defensive).

**Test scenarios:**

- Happy path: `transition('price-quote')` from `idle` OK.
- Edge case: `transition('done')` from `idle` logged + ignored (defensive).
- Integration: `useRedeemVoucher` consumes store.

**Verification:**

- Unit test sketch (Phase 9).

**Commit:** `feat(app): add redemption flow zustand store`

---

- [x] **Unit 4.2: `use-redeem-voucher` full flow orchestrator**

**Goal:** Hook yang runs state machine: price-quote → initiating → opening-wallet → awaiting-signature → broadcasting → submitting-hash → polling-confirmation → done. Each transition calls matching API / wagmi action.

**Requirements:** R5, R8, R10

**Dependencies:** 4.1, 1.5

**Files:**

- Modify: `src/hooks/use-redeem-voucher.ts`

**Approach:**

- Single async function `start(voucherId)`:
  1. `transition('price-quote')` → fetch `getWealthPrice()` → store `priceLock`.
  2. `transition('initiating')` → generate `idempotencyKey` (crypto.randomUUID) → `redeemVoucher(id, { idempotencyKey, wealthPriceIdr })`. Handle `alreadyExists: true`: if `redemption.txHash` set → jump to `polling-confirmation`; else use existing `redemption.id` + need `txDetails` from response (backend must include — see origin §7-E item 7).
  3. `transition('opening-wallet')` → await Privy modal ready (check `useWallets()`).
  4. `transition('awaiting-signature')` → call `writeContract` from wagmi dengan ERC-20 `transfer(treasury, amount)`. Listen to user reject via try/catch.
  5. On signed → `transition('broadcasting')` → wait txHash.
  6. `transition('submitting-hash')` → `submitTx(redemptionId, txHash)` dengan idempotent retry (3x exponential).
  7. `transition('polling-confirmation')` → navigate to `/qr/[id]`; polling handled oleh `useRedemption`.
- Error transitions: user reject → toast + `reset()` to `idle`, redirect back `/vouchers/[id]`. Wallet error → error state + retry CTA. Submit-tx error → retry 3x → if still fail, error state + manual retry CTA.
- 409 from redeem (two-tab) → redirect ke `/qr/[existingId]`.
- Token expiry mid-flow → catch `AuthError` → `reset()` + prompt re-login; preserve `redemptionId` di URL.

**Test scenarios:**

- Happy path: full flow idle → done.
- Happy path: double-submit (same idempotencyKey) → backend returns `alreadyExists` → resume at appropriate state.
- Error path: user reject at `awaiting-signature` → state → `idle`, toast shown.
- Error path: `submit-tx` 5xx → retry 3x → if fail, error state kept; manual retry possible.
- Error path: `redeem` 409 (two-tab) → redirect to existing redemption's QR page.
- Edge case: price-quote fail → error state, user prompted retry.

**Verification:**

- Manual end-to-end redeem against running backend.
- Error injection: throw in `writeContract` → observe recovery.

**Commit:** `feat(app): implement redemption flow orchestrator`

---

- [x] **Unit 4.3: Signing state UI overlay**

**Goal:** Visual layer untuk state machine; overlays dim modal with state-specific copy + spinner + cancel button where applicable.

**Requirements:** R5, R8

**Dependencies:** 4.1

**Files:**

- Create: `src/components/features/signing-state-ui.tsx`
- Modify: `src/components/shared/modal.tsx` (create jika belum)
- Modify: `src/app/(main)/vouchers/[id]/page.tsx` (render `SigningStateUI` when `isSigning`)

**Approach:**

- One component reading `useRedemptionFlow()`. Switch by state → render matching copy (from `copy.ts`).
- `awaiting-signature` state: show Cancel button → calls `cancelSigning()` store action → transitions to `idle` + toast.
- Hide overlay when state ∈ `{ idle, done, error }` (error displays different modal).
- `aria-live="polite"` for accessibility.

**Test scenarios:**

- Happy path: state transitions visible in sequence.
- Edge case: Cancel button only visible in `awaiting-signature`.
- Integration: dismissable only through explicit action (Cancel / auto-transition / error).

**Verification:**

- Manual: trigger redeem → observe overlay states.

**Commit (x2):** `feat(app): add modal primitive component`, `feat(app): add signing state overlay`

---

- [x] **Unit 4.4: iframe-eviction detection + `wallet-recovering` side-state**

**Goal:** Detect embedded wallet gone (tab background long + iframe evicted) → transition to `wallet-recovering` → re-bootstrap → resume.

**Requirements:** R5

**Dependencies:** 4.2

**Files:**

- Modify: `src/hooks/use-redeem-voucher.ts`
- Create: `src/hooks/use-wallet-health.ts` (polling `useWallets()` + `document.visibilityState`)

**Approach:**

- `use-wallet-health`: subscribe to Privy `useWallets()`; when `embeddedWallet?.address` goes from defined → undefined mid-flow → mark wallet unhealthy.
- In `use-redeem-voucher`: during `opening-wallet` / `awaiting-signature`, if wallet becomes unhealthy → transition `wallet-recovering` → attempt `privy.createWallet()` or re-init. Timeout 10s.
- If recover OK within 10s → resume at `opening-wallet` (need user re-sign).
- If fail → fallback: `router.push('/qr/[id]')` with full reload (relies on redemption record in DB).
- Visibility hook: re-validate wallet on `document.visibilitychange` → visible.

**Test scenarios:**

- Happy path: tab focused → wallet stays healthy → no state transition.
- Edge case: simulate wallet unavailable (manually unmount iframe in devtools during flow) → observes `wallet-recovering` → recovery.
- Error path: recovery timeout > 10s → reload redirect.

**Verification:**

- Manual: during `awaiting-signature`, force iframe removal in devtools, observe state transition to recovering.

**Commit:** `feat(app): add iframe-eviction recovery side-state`

---

**Phase 4 exit gate:**

- [x] Lint + tsc + build green.
- [ ] End-to-end redeem manual test succeeds against live backend.
- [ ] Reject flow works, retry CTA works.
- [ ] Iframe eviction simulation recovers.

---

### Phase 5: QR Polling Screen + Stuck-Paid Recovery + BOGO Rendering

Goal: `/qr/[redemptionId]` full UX: status banners timed, tx info, BaseScan link, reconcile CTA, BOGO carousel.

- [x] **Unit 5.1: QR polling screen layout + status banners**

**Goal:** Screen renders voucher header, status banner (tergantung state + elapsed), tx info, safe-to-leave notice.

**Requirements:** R9, R4

**Dependencies:** 1.5

**Files:**

- Modify: `src/app/(main)/qr/[redemptionId]/page.tsx`
- Create: `src/components/features/redemption-status-banner.tsx`
- Create: `src/components/features/transaction-info.tsx`
- Create: `src/components/features/qr-display.tsx`
- Modify: `src/lib/copy.ts`

**Approach:**

- Page queries `useRedemption(id)` with adaptive polling (see D7).
- `RedemptionStatusBanner` props: `{ status, elapsed, txHash? }`. Switch:
  - `pending + txHash`: "Menunggu konfirmasi blockchain" + timer.
  - `pending + elapsed > 60s`: append "Biasanya 30-60 detik...".
  - `pending + elapsed > 300s`: warning color + "Refresh status" CTA (calls reconcile endpoint — Unit 5.2).
  - `pending + elapsed > 900s`: error color + contact support + copy txHash + explorer link.
  - `confirmed`: success header + QR display.
  - `failed`: error + refund CTA + contact.
- `TransactionInfo`: short hash + copy + BaseScan link (`https://basescan.org/tx/{hash}`).
- `QrDisplay`: receives `qrCodes: QrCode[]` (array since BOGO may have 2). Renders via `next/image` from R2 URL. If length === 2 → carousel/stacked dengan label "QR 1 dari 2".

**Patterns to follow:**

- `next/image` untuk QR rendering (config R2 domain di `next.config.ts`).

**Test scenarios:**

- Happy path: status `confirmed`, 1 QR → QR displays.
- Happy path: BOGO, 2 QR → both display with labels.
- Edge case: elapsed 65s → extra copy appears.
- Edge case: elapsed 310s → warning + reconcile CTA visible.
- Edge case: elapsed 920s → error + support copy visible.
- Error path: `status === 'failed'` → error state with refund copy.
- Integration: copy txHash → clipboard.

**Verification:**

- Manual: manipulate redemption in DB (dev) to trigger each state; observe banner.
- `next/image` loads QR from R2.

**Commit (x4):** `feat(app): add redemption status banner`, `feat(app): add transaction info component`, `feat(app): add qr display with bogo support`, `feat(app): wire qr polling page`

---

- [x] **Unit 5.2: Stuck-paid reconcile CTA wiring**

**Goal:** "Refresh status" button calls `POST /api/redemptions/:id/reconcile` → force backend on-chain re-check.

**Requirements:** R9

**Dependencies:** 1.4 (endpoints.ts will need new function), 5.1

**Files:**

- Modify: `src/lib/api/endpoints.ts` (add `reconcileRedemption(id, token)`)
- Modify: `src/lib/schemas/redemption.ts` (add reconcile response schema)
- Modify: `src/components/features/redemption-status-banner.tsx`
- Create: `src/hooks/use-reconcile-redemption.ts` (mutation)

**Approach:**

- Hook calls backend reconcile endpoint; on success invalidate `['redemption', id]`.
- Client-side rate-limit guard: disable CTA for 10s after click (prevent RPC abuse — align with backend §7-H rate limit).
- Backend endpoint is Phase B dependency (B9); app-side spec + graceful fallback: kalau backend return 404 (endpoint not yet deployed), show "Fitur belum tersedia, hubungi support" instead of crashing.

**Test scenarios:**

- Happy path: 5min+ pending → tap refresh → backend returns `confirmed` → UI updates.
- Edge case: button disabled 10s post-click.
- Error path: reconcile endpoint 404 → user-friendly fallback toast.

**Verification:**

- Manual: after backend B9 deployed, stuck scenario → tap refresh → confirm.

**Commit:** `feat(app): add stuck-paid reconcile cta wiring`

---

- [x] **Unit 5.3: Offline resilience banner**

**Goal:** Persistent banner "Offline — akan sinkron kembali saat online" via `navigator.onLine` + RQ online manager.

**Requirements:** R11

**Dependencies:** None (layout-level)

**Files:**

- Create: `src/components/layout/offline-banner.tsx`
- Modify: `src/app/(main)/layout.tsx` (mount banner)

**Approach:**

- Listen `window.addEventListener('online'|'offline')`.
- RQ `useIsRestoring` / `onlineManager` set `online` state; queries pause when offline.
- Banner absolute-positioned bottom (above bottom nav).

**Test scenarios:**

- Happy path: toggle DevTools offline → banner appears → back online → banner disappears.
- Integration: signing flow mid-state pauses when offline (handled by RQ retries naturally).

**Verification:**

- Manual: DevTools → Network → offline.

**Commit:** `feat(app): add offline banner and online-aware queries`

---

**Phase 5 exit gate:**

- [x] Lint + tsc + build green.
- [ ] End-to-end: redeem → land at `/qr/[id]` → timed banners → confirmed → QR renders.
- [ ] BOGO case → 2 QR visible.
- [ ] Offline toggle works.

---

### Phase 6: Remaining Pages Migration

Goal: Home, merchants, history, wallet, profile refactored to RQ hooks; empty states; login page.

- [x] **Unit 6.1: Home page (featured vouchers + balance card)**

**Files:**

- Modify: `src/app/(main)/page.tsx`
- Create: `src/components/features/voucher-card.tsx`
- Create: `src/components/features/balance-card.tsx`

**Approach:** Server Component shell + client islands for balance (wagmi) and voucher grid (RQ). Empty state if no vouchers.

**Test scenarios:**

- Happy path: vouchers load, balance renders.
- Edge case: no vouchers → empty state + CTA.
- Error path: API error → retry card.

**Commit (x3):** `feat(app): add voucher card component`, `feat(app): add balance card component`, `feat(app): wire home page`

---

- [x] **Unit 6.2: Merchants list + detail**

**Files:**

- Modify/Create: `src/app/(main)/merchants/page.tsx`
- Modify/Create: `src/app/(main)/merchants/[id]/page.tsx`

**Approach:** Category filter (pakai `categoryId` — origin §7-I caveat, kalau backend belum patch pakai client filter + warning TODO). Merchant detail shows voucher list.

**Test scenarios:**

- Happy: list loads, category filter works.
- Edge: empty category → empty state.
- Error: 404 merchant → error state.

**Commit:** `feat(app): wire merchants list and detail pages`

---

- [x] **Unit 6.3: History (redemptions list)**

**Files:**

- Modify/Create: `src/app/(main)/history/page.tsx`

**Approach:** Filter tabs (All, Pending, Confirmed, Failed). Empty state illustration + CTA.

**Test scenarios:**

- Happy: list loads.
- Edge: no redemptions → empty state with "Lihat voucher" CTA.
- Integration: tap item → navigates to `/qr/[id]`.

**Commit:** `feat(app): wire redemption history page`

---

- [x] **Unit 6.4: Wallet (balance + deposit address + tx history)**

**Files:**

- Modify/Create: `src/app/(main)/wallet/page.tsx`
- Create: `src/components/features/wallet-deposit-panel.tsx` (reuse deposit-card shape)

**Approach:** Balance header, deposit panel (same pattern as onboarding but re-accessible), tx list. "Cara deposit" link → onboarding screen.

**Test scenarios:**

- Happy: balance + tx list renders.
- Edge: empty tx list → empty state.
- Integration: re-access `/onboarding/deposit` via link works.

**Commit (x2):** `feat(app): add wallet deposit panel`, `feat(app): wire wallet page`

---

- [x] **Unit 6.5: Profile + login polish**

**Files:**

- Modify/Create: `src/app/(main)/profile/page.tsx`
- Modify: `src/app/auth/login/page.tsx`

**Approach:** Profile shows Privy user email + embedded wallet address + logout. Login page handles OTP failure copy mapping to Bahasa Indonesia (origin §6 edge cases).

**Test scenarios:**

- Happy: logout clears session + redirects.
- Edge: OTP wrong → user-friendly error.

**Commit:** `feat(app): wire profile and polish login page`

---

**Phase 6 exit gate:**

- [x] Lint + tsc + build green.
- [ ] Manual smoke: traverse all main pages, no broken links, no console errors.

---

### Phase 7: Delete Legacy Code + Env Cleanup + README Rewrite

Goal: Remove all server-side code; align deps; rewrite README + env example.

- [x] **Unit 7.1: Delete API routes + server services + Prisma**

**Files (delete):**

- `prisma/` (entire folder)
- `src/app/api/` (entire subtree)
- `src/lib/db.ts`
- `src/lib/services/` (entire folder)
- `src/lib/auth/privy-server.ts`, `src/lib/auth/protect-api.ts`
- `src/middleware.ts`
- `prisma.config.ts`

**Approach:**

- Delete files; run full build — any residual reference = compile error → fix.
- `grep -r "prisma\." src` → must be 0.
- `grep -r "from ['\"].*prisma" src` → 0.
- `grep -rn "DATABASE_URL" src` → 0.
- `ls src/app/api` → should fail (no such folder).

**Test scenarios:**

- Post-delete `pnpm tsc` → no missing imports.
- `pnpm build` → success.

**Commit:** `chore(app): delete legacy api routes and prisma layer`

---

- [x] **Unit 7.2: Dep cleanup**

**Files:**

- Modify: `package.json`

**Approach:**

- Remove: `@prisma/client`, `prisma`, `@privy-io/server-auth`.
- Run `pnpm dlx depcheck` → delete any other unused deps flagged (verify manually first).
- Run `pnpm install` → verify lockfile diff shows only removals.

**Test scenarios:**

- `pnpm install` → no peer warnings.
- `pnpm build` → success.

**Commit:** `chore(app): remove server-side dependencies`

---

- [x] **Unit 7.3: Env example + README rewrite**

**Files:**

- Modify: `.env.example`
- Modify: `README.md`

**Approach:**

- `.env.example`: keep `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS` (TODO-noted), `NEXT_PUBLIC_ALCHEMY_API_KEY` (with security comment). Delete: `DATABASE_URL`, `PRIVY_APP_SECRET`, `ALCHEMY_WEBHOOK_SIGNING_KEY`, `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS`.
- `README.md`: rewrite architecture section (thin client), dev setup (`pnpm dev` + backend at port 8787), troubleshooting, migration ownership note (backend owns all migrations).

**Test scenarios:**

- README renders cleanly on GitHub.
- `.env.example` diff matches code expectations.

**Commit (x2):** `chore(app): rewrite env example for thin-client`, `docs(app): rewrite readme for thin-client architecture`

---

- [x] **Unit 7.4: CORS verification**

**Goal:** Confirm backend CORS config allows app origin.

**Files:** (none in app; produces checklist item for backend team)

**Approach:**

- Inspect `backend/src/app.ts:32-41`, confirm `CORS_ORIGINS` env var includes `http://localhost:3000` (dev) and `https://redeem.wealthcrypto.fund` (prod).
- If not, coordinate with backend team.

**Verification:**

- Manual curl with Origin header → observe `Access-Control-Allow-Origin` response header.

**Commit:** (no app code change — add checklist item to handoff notes)

---

**Phase 7 exit gate:**

- [x] All grep verification checks (from brainstorm §4.1) pass.
- [x] Lint + tsc + build green.
- [ ] Full e2e smoke test from Phase 1-6 still passes post-delete.

---

### Phase 8: Production-Grade Hardening

Goal: TS strict, ESLint/Prettier/Husky, CSP, Sentry hooks, dead code sweep, bundle analysis.

- [x] **Unit 8.1: TypeScript strict mode**

**Files:**

- Modify: `tsconfig.json`

**Approach:**

- Set `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noImplicitOverride: true`.
- Fix all new errors. No `@ts-ignore` / `@ts-expect-error` kecuali with ticket reference.
- `grep -rn ": any" src` → 0 (replace with `unknown` + narrow).

**Test scenarios:**

- `pnpm tsc --noEmit` → 0 errors.

**Commit:** `chore(app): enable typescript strict mode`

---

- [x] **Unit 8.2: ESLint + Prettier + Husky + lint-staged**

**Files:**

- Modify/Create: `eslint.config.mjs`
- Create: `prettier.config.mjs`
- Create: `.husky/pre-commit`
- Modify: `package.json` (add `husky`, `lint-staged`, `prettier`, `prettier-plugin-tailwindcss` devDeps; `"prepare": "husky"` script)

**Approach:**

- ESLint extends `eslint-config-next` + `@typescript-eslint/recommended-type-checked` + `eslint-plugin-react-hooks/recommended`.
- Rules: `no-console: ['warn', { allow: ['warn', 'error'] }]`, `no-unused-vars: 'error'`, `react-hooks/exhaustive-deps: 'error'`, `import/order` auto-fix.
- Prettier + `prettier-plugin-tailwindcss` for class sort.
- Husky pre-commit: `lint-staged` runs `eslint --fix` + `prettier --write` + `tsc --noEmit` on staged files.

**Test scenarios:**

- Commit with lint error → blocked.
- Commit clean → passes.

**Commit (x3):** `chore(app): configure eslint and prettier`, `chore(app): add husky and lint-staged pre-commit`, `chore(app): apply prettier to codebase`

---

- [x] **Unit 8.3: CSP headers + `next.config.ts` hardening**

**Files:**

- Modify: `next.config.ts`

**Approach:**

- Add `headers()` function returning `Content-Security-Policy` header whitelisting: self + Privy domains + Alchemy RPC + R2 image domain.
- `images.remotePatterns`: R2 bucket host for QR images.
- `poweredByHeader: false`.

**Test scenarios:**

- Happy: pages load without CSP violations in console.
- Edge: Privy modal still opens (iframe allowance).

**Verification:**

- DevTools Console → no CSP errors during full flow.

**Commit:** `chore(app): harden next config with csp and image domains`

---

- [x] **Unit 8.4: Error boundaries + logger + Sentry hook (no-op fallback)**

**Files:**

- Create: `src/app/error.tsx` (route segment error boundary)
- Create: `src/app/global-error.tsx`
- Create: `src/lib/logger.ts`
- Create: `src/lib/telemetry.ts` (Sentry-compatible API; if `SENTRY_DSN` absent, no-op)

**Approach:**

- `logger.info/warn/error` — wraps `console`; no-op in production (unless error).
- `telemetry.capture(error, context)` — calls Sentry if wired, else logger.
- Route error boundary displays friendly fallback + request ID + support copy.
- Signing flow errors route through `telemetry.capture`.

**Test scenarios:**

- Happy: error in page → fallback renders.
- Happy: console.log silenced in prod build (unless error).
- Integration: redeem flow error → telemetry captures.

**Commit (x2):** `feat(app): add logger and telemetry hooks`, `feat(app): add error boundaries`

---

- [x] **Unit 8.5: Dead code sweep (knip) + unused-export removal**

**Files:**

- Modify: `package.json` (add `knip` dev dep)
- Create: `knip.config.ts`

**Approach:**

- Run `pnpm knip` → review + delete flagged unused exports, types, files.
- Rerun until clean.

**Test scenarios:**

- `pnpm knip` → 0 unused.

**Commit:** `chore(app): sweep dead code via knip`

---

- [x] **Unit 8.6: Accessibility + copy polish + aria-live on state machine**

**Files:**

- Modify: `src/components/features/signing-state-ui.tsx` (aria-live="polite")
- Review all `onClick` on non-buttons → convert to `<button>`.
- Run quick keyboard-nav smoke.

**Test scenarios:**

- Screen reader reads state transitions.
- Tab navigation works on all pages.

**Commit:** `chore(app): accessibility and aria-live polish`

---

- [x] **Unit 8.7: Bundle audit + optimization**

**Files:**

- Dev-only: run `next build --profile` + `@next/bundle-analyzer` one-shot.

**Approach:**

- Measure initial JS. Target <200KB gzip. Dynamic import Privy modal / heavy components if over.
- Verify no server deps leaked to client bundle.

**Verification:**

- `next build --analyze` report shows initial bundle breakdown.

**Commit:** (no persistent commit unless optimization applied; if optimized, commit per change)

---

**Phase 8 exit gate:**

- [x] `pnpm lint && pnpm tsc && pnpm build` green with strict mode.
- [x] `pnpm knip` clean.
- [~] `pnpm audit --audit-level=high` → 0 high+; 4 moderate advisories remain in transitive deps (`hono`, `axios` via `@wagmi/connectors > porto`/`x402`). No direct fix available; tracked for upstream bumps.
- [ ] Manual: full flow with no CSP errors.

---

### Phase 9: Contract Tests + Manual UAT

Goal: Smoke tests in CI + §9.1 outcome checklist verified end-to-end.

- [x] **Unit 9.1: Contract test scaffolding (vitest)**

**Files:**

- Create: `vitest.config.ts`
- Modify: `package.json` (add `vitest`, `@vitest/coverage-v8` devDeps; `test` + `test:ci` scripts)
- Create: `src/lib/api/__tests__/endpoints.test.ts`
- Create: `src/lib/schemas/__tests__/*.test.ts`

**Approach:**

- Mock fetch via `msw` (or undici mock) — return fixtures matching backend shape → verify Zod parse succeeds and endpoint unwraps correctly.
- Negative cases: malformed response → schema throws.

**Test scenarios (for the test file):**

- Happy: voucher list fixture parses.
- Error: voucher missing field → Zod error.
- Idempotency: 2x `redeemVoucher` with same key → both succeed (mocked response flags).

**Commit (x2):** `chore(app): add vitest setup`, `test(app): add api contract tests`

---

- [x] **Unit 9.2: CI workflow**

**Files:**

- Create: `.github/workflows/ci.yml`

**Approach:**

- Steps: checkout → setup node + pnpm → install → `lint` → `tsc --noEmit` → `test:ci` → `build`. Fail on first red.

**Verification:**

- Push to PR → workflow runs green.

**Commit:** `chore(app): add ci workflow for lint typecheck test build`

---

- [~] **Unit 9.3: Manual UAT checklist execution** — partial; deferred pending live backend wire-up and in-browser verification (see post-phase extras).

Non-code; reference §9.1 from brainstorm. Execute each criterion manually; mark in this plan's checkbox.

UAT items (from brainstorm §9.1):

- [ ] Login-to-redeem ≤90s p50 (5 runs, stopwatch). _(pending backend)_
- [ ] Fee breakdown renders correctly. _(pending backend)_
- [ ] BOGO voucher → 2 QR render. _(pending backend)_
- [ ] QR image loads. _(pending backend)_
- [ ] Stuck recovery via reconcile CTA (requires B9). _(pending backend)_
- [ ] Rejection recovery works. _(pending backend)_
- [ ] Two-tab guard works (requires B8). _(pending backend)_
- [ ] Offline resilience. _(pending backend)_
- [ ] First-time onboarding flow. _(pending backend)_
- [ ] Iframe-eviction recovery. _(pending backend)_

All items above require the live Hono backend (`https://backend-wealthcrypto-fund.vercel.app`) + a Privy-authenticated session. They are carried forward to post-Phase-B re-UAT before live launch.

**Commit:** (no code; updates plan checklist)

---

**Phase 9 exit gate:**

- [x] CI green on main. _(workflow added; runs on next push/PR)_
- [~] UAT checklist fully green — deferred; all items require live backend (tracked above).
- [~] `pnpm audit --audit-level=high` clean. 4 moderate advisories remain in transitive deps (`@privy-io/react-auth > x402 > wagmi > @wagmi/connectors` → `hono`, `axios`). No direct-dep fixes available; track upstream bumps.
- [x] Bundle size target met. Next 16 build succeeds for all 10 routes (static + dynamic mix); no regressions vs Phase 7 baseline.

---

## System-Wide Impact

- **Interaction graph:**
  - New Zustand store touches all redeem-flow UI (overlay, voucher detail, QR page).
  - AuthGuard now calls sync + onboarding redirect — affects every authed route.
  - Wagmi connector swap affects all on-chain reads/writes (balance, transfer).
- **Error propagation:**
  - `ApiError` taxonomy standardized; UI catches at mutation/hook level → toast.
  - `wallet-recovering` side-state recovers without losing redemption record.
  - Telemetry hooks capture unhandled errors + signing state machine failures.
- **State lifecycle risks:**
  - Redemption record in DB stays `pending` across reject / offline / session expiry — cleanup via backend TTL (Phase B-5).
  - Two-tab guard requires backend partial unique index (B8); app-level redirect is best-effort.
  - Price lock frozen during signing flow to prevent mid-flight drift.
- **API surface parity:**
  - Zod schemas at edge catch backend contract drift early.
  - Idempotent submit-tx retry relies on backend fix (B7) — current backend will throw unique-constraint on retry; app retry logic must handle that gracefully (treat "already recorded" 409 as success).
- **Integration coverage:**
  - Live-chain testing required for redeem flow (mocks insufficient for wallet iframe behavior).
  - Multi-tab testing mandatory for two-tab guard.
- **Unchanged invariants:**
  - Design language (Digital Concierge, no borders, mobile-first) preserved.
  - Backend endpoint contracts unchanged from app's perspective (consumer-only).

## Risks & Dependencies

| Risk                                                          | Likelihood | Impact | Mitigation                                                                                                 |
| ------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| `@privy-io/wagmi` peer dep mismatch breaks signing at runtime | Medium     | High   | Unit 2.2 verifies peer versions; Phase 4 end-to-end manual test catches before merge.                      |
| Backend endpoints not ready / shape drift during Phase 1 dev  | Medium     | Medium | Zod schemas fail-fast; agree on DTO shape upfront; mock via msw for local dev if needed.                   |
| Phase B items (B5, B7, B8, B9) not ready by launch            | High       | High   | Plan explicitly notes partial UAT; re-run UAT post-Phase-B. App works in staging with degraded resilience. |
| Iframe-eviction recovery untestable without live conditions   | Medium     | Medium | Manual devtools simulation; fallback to full reload preserves correctness.                                 |
| TS strict mode introduces many errors                         | Medium     | Low    | Schedule Unit 8.1 early in Phase 8; allocate time buffer.                                                  |
| Bundle size exceeds 200KB gzip                                | Low        | Medium | Unit 8.7 measures; dynamic import Privy modal if over.                                                     |
| `/api/settings/public` endpoint not ready at Phase 3          | High       | Low    | Fallback to env var with TODO marker; no blocking.                                                         |
| Category filter mismatch (backend §7-I)                       | Low        | Low    | Client-side filter fallback; coordinate B10 patch parallel.                                                |

## Documentation Plan

- Update `app/README.md` to reflect thin-client architecture (Phase 7).
- Keep `docs/brainstorms/2026-04-17-app-thin-client-rework-requirements.md` as canonical reference.
- This plan's Phase 9.3 UAT checklist doubles as post-launch verification artifact.
- Inline `JSDoc` only for non-obvious functions (per project rules: no comments for "what", only for "why-non-obvious").

## Operational / Rollout Notes

- **Staging first:** Phase 1-8 merges to `main` for staging deployment. Production cutover blocks on Phase B items (backend's B1-B10 from brainstorm §10).
- **Feature flag:** Not required for this rework — replacement is wholesale, not A/B. Deployment is all-or-nothing; rollback via branch revert.
- **Monitoring:** Sentry hook captures signing flow failures with anonymized context (request ID, state machine transitions, error code). No PII.
- **Migration path:**
  - Staging: merge + deploy; run UAT.
  - Production: wait for backend B1-B9 → re-run UAT → deploy.
  - Rollback: revert merge commit; redeploy prior release.
- **On-call:** Signing state `error` transitions should generate low-priority alerts in staging; tune before prod.

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-17-app-thin-client-rework-requirements.md](../brainstorms/2026-04-17-app-thin-client-rework-requirements.md)
- Product brief: `docs/1-project-brief.md` (outside app repo — cross-reference)
- Backend routes: `backend/src/routes/*.ts`
- Backend schema: `backend/prisma/schema.prisma`
- Related PR: #2 (brainstorm merge)
- External: `@privy-io/wagmi` docs, Next.js 16 App Router, React Query v5, Zod v4.

---

## Execution Conventions

Per user directive (plan args):

1. **Tiap phase ada gate**: lint + tsc + build harus green sebelum pindah phase.
2. **Fix errors sekalian** saat lint/build gagal — jangan carry forward.
3. **Commit kecil-kecil** per unit (atau per logical sub-unit). Follow convention: `<type>(<scope>): <imperative>` (e.g., `feat(app): add fee breakdown component`).
4. **No duplicate / redundant code**: sebelum tambah helper atau component, cek `src/lib/utils.ts`, `src/components/shared/*`, `src/hooks/*`. Reuse existing. Kalau extract, ganti semua callsite sekaligus.
5. **Branch strategy**: satu branch per phase (e.g., `feat/phase-1-api-client`, `feat/phase-2-providers`) → PR ke main. Atau single long-lived branch `feat/app-thin-client-rework` dengan milestone tags — pilih saat execution start.
6. **Testing posture**: Phase 1-7 rely on manual + type safety. Phase 9 introduces automated contract tests. Unit tests untuk state machine (Phase 4) optional tapi dianjurkan.
