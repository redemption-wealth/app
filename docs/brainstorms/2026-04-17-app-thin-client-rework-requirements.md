# App Thin-Client Rework: Align Next.js App with Hono Backend

**Status:** Draft — Requirements
**Date:** 2026-04-17
**Scope:** `app/` (Next.js end-user app) only. Adjustments in `backend/` and `back-office/` are noted as **dependencies**, not in-scope deliverables.

---

## 1. Problem Statement

`app/` di-scaffold sebagai Next.js app yang punya **Prisma schema sendiri** dan **API routes sendiri** di bawah `app/src/app/api/`, padahal backend Hono di `backend/` sudah meng-expose API public untuk end-user dan sudah menjadi canonical data layer bersama `back-office/`.

Akibatnya:

- **Schema drift.** `app/prisma/schema.prisma` **tidak kompatibel** dengan `backend/prisma/schema.prisma` — tidak ada `RedemptionSlot`, tidak ada fee snapshot (`basePrice`, `appFeeRate`, `gasFeeAmount`, `totalPrice`), tidak ada soft-delete (`deletedAt`), `AdminRole` beda (app: `admin|owner`, backend: `owner|manager|admin`), `MerchantCategory` di-hardcode enum (app) vs FK ke `Category` table (backend), `QrStatus` beda (app: `available|assigned|used`, backend: `available|redeemed|used`), field naming beda (`endDate` vs `expiryDate`, `priceIdr` int vs `totalPrice` Decimal), `AppSettings` app kehilangan `alchemyRpcUrl` dan `coingeckoApiKey`.
- **Duplikasi logic.** Tujuh folder API routes di `app/src/app/api/` (auth, merchants, price, redemptions, transactions, vouchers, webhook) mem-duplikasi endpoint yang sudah ada di `backend/src/routes/`.
- **Migration ownership ambigu.** `app/README.md:110` bilang migrations dimanage dari `back-office`, tapi sebenarnya `back-office/` adalah Vite frontend tanpa Prisma — migrations actually owned oleh `backend/`. Kalau `app` jalanin `prisma migrate`, risiko bentrok.
- **User experience tidak bisa match brief.** Tanpa slot + fee snapshot, app tidak bisa menampilkan breakdown harga (base + 3% + gas), dan tidak bisa handle voucher `qrPerSlot=2` (Buy-1-Get-1) yang diminta di `docs/1-project-brief.md`.

## 2. Goals & Non-Goals

### Goals

- App menjadi **thin client**: UI + client-side signing + Privy auth. Semua data flow via HTTP call ke backend Hono.
- End-to-end user flow jalan: **login (Privy OTP) → browse merchant/voucher → lihat detail + harga $WEALTH real-time → redeem (sign ERC-20 transfer) → receive QR**.
- **Fee breakdown visible**: user lihat base + app fee (3%) + gas + total IDR + konversi $WEALTH sebelum tap Redeem (sesuai `docs/1-project-brief.md`).
- **BOGO voucher works end-to-end**: voucher `qrPerSlot=2` render badge di detail + 2 QR di post-redeem screen.
- **Resilient redemption flow**: rejection recovery, offline resilience, stuck-but-paid reconciliation, two-tab protection — user tidak pernah stuck tanpa jalan keluar.
- **Production-grade codebase**: clean & rapi (consistent structure, TS strict, no dead code), efisien (bundle-aware, RSC-default), aman (CSP, env validation, no client secrets), observable (error boundary + telemetry hook). Detail di §4.8 & §9.4.
- Single source of truth untuk data: backend DB & schema.
- Minimize carrying cost: satu schema, satu set API implementation, satu tempat untuk domain logic.

### Non-Goals

- Fix divergence antara `backend/` dan `docs/` (e.g. soft-delete pada tabel yang masih hard-delete, permission matrix owner-vs-manager). Dicatat sebagai dependency di §7, tapi di-brainstorm terpisah.
- Fix 3 endpoint 404 di `back-office/` (assign-merchant, upload-qr, reset-password). Dicatat sebagai dependency.
- Ubah model bisnis, pricing, atau UX design language. Design di `app/README.md:19-27` ("Digital Concierge", no borders, mobile-first) tetap dipakai.
- Implementasi fitur Phase 2 yang belum didefinisikan di brief (deposit/withdrawal eksekusi, notifikasi, dsb). UI placeholder OK.

## 3. Target Architecture

```
app/ (Next.js 16, thin client)
├── src/app/(main)/*           UI pages — Server Components by default, Client where needed
├── src/app/auth/login         Privy OTP flow
├── src/lib/api/               HTTP client (fetch wrapper) → backend Hono
├── src/lib/auth/              Privy React client + token accessor (no server verify)
├── src/hooks/                 React Query hooks per-resource
├── src/lib/wagmi.ts           Wagmi config + ERC-20 ABI (client-side signing)
├── src/types/                 Type mirrors / Zod schemas of backend DTOs
└── [REMOVED] src/app/api/*    All API routes deleted
└── [REMOVED] prisma/          Prisma schema + client deleted
└── [REMOVED] src/lib/db.ts    Prisma singleton deleted
└── [REMOVED] src/lib/services/ Server-side services deleted (moved to backend if not already there)

backend/ (Hono) — canonical API + Prisma
back-office/ (Vite) — admin UI → backend
```

**Auth model**

- App login: Privy OTP email → Privy embedded wallet. Client dapat Privy access token via `getAccessToken()`.
- Setiap call ke backend user-endpoints: `Authorization: Bearer <privy-token>`. Backend `requireUser` middleware sudah ada di `backend/src/middleware/auth.ts:89-122` — verify token via `@privy-io/server-auth`, lookup `User` by `privyUserId`.
- First-time user: app call `POST /api/auth/user-sync` untuk upsert `User` row (sudah ada di `backend/src/routes/auth.ts:143-180`).
- Admin auth (Better-Auth-ish JWT) **tidak relevan untuk app** — itu domain `back-office`.

**Transaction flow (redeem)**

1. User tap Redeem di voucher detail.
2. App `POST /api/vouchers/:id/redeem` dengan `{ idempotencyKey, wealthPriceIdr }` (fresh dari `/api/price/wealth`). **Note:** backend harus re-verify price server-side (lihat §7-E item 1).
3. Backend (`vouchers.ts:80-124`) return `{ redemption, txDetails: { tokenContractAddress, treasuryWalletAddress, wealthAmount } }`.
4. App sign ERC-20 `transfer(treasuryWalletAddress, wealthAmount)` via wagmi + Privy embedded wallet. **MUST** pakai `treasuryWalletAddress` dari response, bukan env var.
5. App `PATCH /api/redemptions/:id/submit-tx` dengan `txHash`.
6. On-chain settle → Alchemy webhook hit `POST /api/webhook/alchemy` di backend → backend verify signature + on-chain amount invariant (§7-D/E) → `confirmRedemption(txHash)` → set status `confirmed`.
7. App React Query polling/invalidate `/api/redemptions/:id` → render QR begitu status `confirmed`.

**Note:** QR codes sudah di-assign ke user di step 2 (saat `initiateRedemption`), bukan step 6. Slot status flip `available → redeemed` saat redeem init; `confirmed` hanya update redemption status, bukan assign QR baru.

## 4. Work Breakdown

Urut berdasarkan dependency:

### 4.1 Delete divergent code (thin-client migration)

Hapus semua yang sekarang di-duplikasi dengan `backend/`. Jalankan dengan checklist — tiap item harus di-verify via `grep` / file-tree inspection sebelum merge.

**Server-side / data-layer (harus hilang sepenuhnya dari app):**

- `app/prisma/` — seluruh folder (schema, migrations kalau ada, generated client di `node_modules/.prisma`).
- `app/prisma.config.ts`.
- `app/src/app/api/` — seluruh subtree. Delete folder-by-folder:
  - `api/auth/` (user-sync — pindah ke client call ke backend)
  - `api/merchants/`, `api/vouchers/`, `api/redemptions/`, `api/transactions/`
  - `api/price/wealth/`
  - `api/webhook/alchemy/` (webhook HANYA di backend; domain redeem-app tidak boleh handle webhook)
- `app/src/lib/db.ts` (Prisma singleton).
- `app/src/lib/services/` — full folder, termasuk `redemption.service.ts` (logic canonical di `backend/src/services/redemption.ts`).
- `app/src/lib/auth/protect-api.ts` & `privy-server.ts` — tidak perlu server verify di app (client guard via AuthGuard + backend `requireUser`).
- Any server-only utility yang referenced by deleted API routes (trace via IDE "find references").

**Dependency cleanup:**

- Remove dari `app/package.json` dependencies: `@prisma/client`, `prisma`, `@privy-io/server-auth` (server verify), dan package server-only lain kalau ada (e.g., `hono` kalau ter-install, ORM helper packages).
- Keep: `@privy-io/react-auth`, `@privy-io/wagmi` (tambah), `wagmi`, `viem`, `@tanstack/react-query`, `zustand`, `zod` (untuk validate API responses client-side), `clsx`, `next`, `react`, `tailwindcss`.
- Post-delete: `pnpm install` dari root → verify lockfile diff hanya berisi removal, bukan surprise upgrade.
- Run `pnpm dlx depcheck` (one-shot, dev-only) untuk detect unused deps yang ter-miss.

**Config & env cleanup:**

- `app/.env.example` — hapus: `DATABASE_URL`, `PRIVY_APP_SECRET`, `ALCHEMY_WEBHOOK_SIGNING_KEY`, `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS` (lihat §7-E item 3).
- `app/README.md` — update: sections "Environment Variables" + "Database" (line 110 salah). Koreksi: _migrations owned by `backend/`; app is a thin HTTP client, tidak punya DB connection._
- `app/pnpm-workspace.yaml` — review: confirm app masih valid anggota workspace setelah prisma removal. Kalau workspace-level prisma config ada, decouple.
- `app/src/middleware.ts` — strip ke no-op (atau delete); middleware tidak bisa verify Privy token di edge runtime tanpa server auth.

**Verification checklist (harus green sebelum PR merge):**

- [ ] `grep -r "from ['\"].*prisma" app/src` → 0 hits.
- [ ] `grep -r "@prisma/client" app/` → 0 hits (selain `node_modules`).
- [ ] `grep -r "fetch(['\"]/api/" app/src` → 0 hits (semua fetch via `NEXT_PUBLIC_API_BASE_URL`).
- [ ] `grep -rn "DATABASE_URL" app/` → 0 hits.
- [ ] `grep -rn "server-auth" app/` → 0 hits.
- [ ] `ls app/src/app/api/` → "No such file or directory".
- [ ] `ls app/prisma/` → "No such file or directory".
- [ ] `pnpm --filter app build` → zero warnings terkait missing env or dead imports.
- [ ] `pnpm --filter app typecheck` → zero errors (termasuk no `any` yang baru di-introduce untuk patch type issues).
- [ ] Bundle analyzer (`next build --analyze`, one-shot) → tidak ada server-only deps yang ter-bundle ke client.

### 4.2 Build API client layer

- `app/src/lib/api/client.ts` — fetch wrapper dengan:
  - Base URL dari `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:8787/api` dev, prod URL prod).
  - Auto-inject `Authorization: Bearer <privyAccessToken>` untuk protected calls.
  - Uniform error envelope handling (backend returns `{ error, details? }` on non-2xx).
  - Typed response via shared DTO types.
- `app/src/lib/api/endpoints.ts` — typed functions per-endpoint:
  - `getMerchants(params)`, `getMerchant(id)`
  - `getVouchers(params)`, `getVoucher(id)`, `redeemVoucher(id, body)`
  - `getRedemptions(params)`, `getRedemption(id)`, `submitTx(id, txHash)`
  - `getTransactions(params)`
  - `getWealthPrice()`
  - `getCategories()`
  - `syncUser()` (POST `/auth/user-sync`)
- `app/src/types/api.ts` — DTO types mirror dari backend response shape. Mulai dari minimal yang dipakai UI; tambah saat diperlukan.

### 4.3 Wire React Query hooks

Per-resource hooks di `app/src/hooks/`:

- `use-merchants.ts`, `use-merchant.ts`
- `use-vouchers.ts`, `use-voucher.ts`, `use-redeem-voucher.ts` (mutation)
- `use-redemptions.ts`, `use-redemption.ts`, `use-submit-tx.ts` (mutation)
- `use-transactions.ts`
- `use-wealth-price.ts` (polling tiap 30-60s untuk display live)
- `use-wealth-balance.ts` (sudah ada — via wagmi, read `balanceOf` on-chain)
- `use-send-wealth.ts` (sudah ada — pakai `useWriteContract` dari wagmi untuk `transfer(treasury, amount)`; active connector adalah Privy embedded wallet via `@privy-io/wagmi`)

Query keys konsisten dengan path backend (`['vouchers', { merchantId, category }]`, `['redemption', id]`, dsb). Invalidate `['redemption', id]` setelah `submitTx` untuk trigger refetch & detect confirmation.

### 4.4 Refactor pages to consume client

`(main)/` pages jadi Server Components minimum, Client Components untuk interactive parts:

- `page.tsx` (home) — featured vouchers list (SSR OK), balance card (client, wagmi).
- `merchants/page.tsx`, `merchants/[id]/page.tsx` — list + detail (SSR or client via RQ).
- `vouchers/[id]/page.tsx` — voucher detail + harga IDR → $WEALTH conversion (client, karena butuh live price) + Redeem button (client mutation).
- `qr/[redemptionId]/page.tsx` — client polling redemption status. Render QR image once `status === 'confirmed'` dari `redemption.qrCodes[0].imageUrl`.
- `wallet/page.tsx` — balance (wagmi) + transactions list (RQ).
- `history/page.tsx` — redemptions list (RQ).
- `profile/page.tsx` — Privy user info, logout.

### 4.5 Fix Privy & providers wiring

**Signing approach (decided):** Embedded wallet only — no external wallet support. Pakai `@privy-io/wagmi` connector package supaya Privy embedded wallet ter-expose sebagai wagmi connector. `use-send-wealth.ts` tetap pakai `useWriteContract` dari wagmi; `use-wealth-balance.ts` tetap pakai `useReadContract`.

- Tambah dependency: `@privy-io/wagmi` (connector) + keep existing `wagmi`, `viem`, `@privy-io/react-auth`.
- `app/src/providers.tsx` — urutan provider: `PrivyProvider` → `QueryClientProvider` → `WagmiProvider` (dari `@privy-io/wagmi` yang aware Privy). Embedded wallet otomatis jadi active connector setelah user login.
- `app/src/lib/wagmi.ts` — config pakai `createConfig` dari `@privy-io/wagmi`, single chain (Base mainnet), satu transport via Alchemy RPC.
- `app/src/lib/auth/` — client-only hook `useAuthToken()` yang expose Privy access token untuk dipakai api client.
- `app/src/components/layout/AuthGuard` — redirect to `/auth/login` kalau `!authenticated`. **Sync gate:** begitu `authenticated && embeddedWallet.ready`, call `syncUser()` once per session; **block protected render sampai sync resolve sukses** (handle `requireUser` 404 race — lihat §7-G). Retry with exponential backoff (1s, 2s, 4s, max 3x) kalau network error; fatal error → sign-out + toast.
- `app/src/middleware.ts` — sementara boleh hapus atau sederhanakan jadi no-op. Protection via client guard; middleware tidak bisa verify Privy di edge tanpa server auth.

### 4.6 Environment vars cleanup

New `app/.env.example`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787/api
NEXT_PUBLIC_PRIVY_APP_ID=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Wagmi / ERC-20 client-side (preferred: fetch dari backend /api/settings/public
# bila sudah ada — lihat §7-C)
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=...
# NEXT_PUBLIC_TREASURY_WALLET_ADDRESS — jangan pakai dari env; gunakan response dari
# POST /vouchers/:id/redeem (§7-E item 3)
NEXT_PUBLIC_ALCHEMY_API_KEY=...  # MUST be a domain-restricted, client-only key;
                                  # NOT the same key used for webhook registration
```

Hapus: `DATABASE_URL`, `PRIVY_APP_SECRET`, `ALCHEMY_WEBHOOK_SIGNING_KEY` (semua pindah / tetap di backend). **Jangan** tambahkan `NEXT_PUBLIC_COINGECKO_API_KEY` atau `NEXT_PUBLIC_ALCHEMY_RPC_URL` — keduanya secrets server-side.

### 4.7 CORS

- `backend/src/app.ts:32-41` sudah configure CORS via env `CORS_ORIGINS`. Pastikan prod URL app (`redeem.wealthcrypto.fund`) di-include di list.

### 4.8 Production-grade cleanup & hardening

Setelah §4.1 selesai (app jadi pure frontend), lakukan sweep berikut supaya project clean, efisien, rapi, dan production-grade. Tidak semua wajib untuk MVP, tapi minimal tiap item di-evaluasi + decision terdokumentasi.

**Folder structure & naming conventions**

- Unify naming: kebab-case untuk file komponen (`voucher-card.tsx`), PascalCase hanya untuk exported component name. No mixed.
- `src/hooks/` flat per-resource (`use-voucher.ts`, `use-vouchers.ts`, `use-redeem-voucher.ts`). No nested folder kecuali >10 file.
- `src/lib/api/` → `client.ts` + `endpoints.ts` + `errors.ts`. Tidak ada logic lain di sini.
- `src/types/api.ts` — single file selama <300 baris; split jadi `api/{merchants,vouchers,redemptions}.ts` kalau overflow.
- `src/components/` split: `layout/` (Sidebar, BottomNav, AuthGuard), `shared/` (primitives: Button, Card, Skeleton, Toast, Modal), `features/` (domain components: VoucherCard, RedemptionStatus, QrDisplay). Tidak ada "misc" / "common" folder.
- Delete empty placeholder folders dari initial scaffold yang tidak dipakai.

**TypeScript strictness**

- `tsconfig.json`: enable `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noImplicitOverride: true`. Fix errors; **no `@ts-ignore` / `@ts-expect-error` kecuali di-comment dengan ticket ID**.
- Zero `any` di src tree. Pakai `unknown` + type-narrowing atau define DTO. CI gate: `grep -rn ": any" src/ | wc -l` → 0.
- DTO types di `src/types/api.ts` di-derive via `z.infer` dari Zod schemas (lihat "Runtime validation" di bawah) — single source of truth.

**Runtime validation at the network edge**

- Zod schema untuk tiap backend response shape. API client `client.ts` parse response via schema; fail-fast dengan uniform error kalau shape mismatch. Ini detect breaking backend changes sebelum jadi runtime crash di dalam komponen.
- Envelope uniformer: karena backend return shape beda-beda (§5.1 note), `endpoints.ts` per-endpoint unwrap + normalize ke shape internal app (e.g., selalu return `{ data, pagination? }` ke hook layer).

**Lint, format, hooks**

- ESLint: extend `eslint-config-next` + `@typescript-eslint/strict` + `eslint-plugin-react-hooks`. Rule wajib: `no-console` (warn, error di prod build), `no-unused-vars` (error), `react-hooks/exhaustive-deps` (error), `import/order` (auto-fix).
- Prettier dengan `plugin-tailwindcss` untuk auto-sort class. Single config di root workspace.
- Husky + lint-staged: pre-commit run `eslint --fix` + `prettier --write` + `tsc --noEmit` pada staged files only.
- CI pipeline: `pnpm --filter app lint && pnpm --filter app typecheck && pnpm --filter app build` harus green sebelum merge.

**Performance & bundle hygiene**

- Next.js: prefer Server Components default. Client Components only untuk state/effect/interaction (yang nyatanya butuh wagmi/Privy). Audit: `grep -rn "'use client'" app/src/app | wc -l` — minimize.
- Dynamic import untuk route-level code-splitting (Privy modal, QR render component kalau berat). Target: initial JS <200KB gzip.
- Image optimization: `next/image` untuk semua merchant logo / QR. Configure `images.remotePatterns` untuk R2 domain.
- `@tanstack/react-query` default: `staleTime: 30s`, `gcTime: 5m`. Per-query override untuk price (`staleTime: 30s`) vs listings (`staleTime: 60s`).
- Remove `console.log` debug di production build. Use `logger` util yang no-op di prod.

**Accessibility & i18n polish**

- Semantic HTML: `<main>`, `<nav>`, `<button>` (bukan `<div onClick>`). Focus states visible, keyboard-navigable.
- `aria-live` untuk state machine transitions (redeem states).
- Copy Bahasa Indonesia konsisten — sentence case, no Title Case. Extract ke `src/lib/copy.ts` untuk single source (easier to proofread + future i18n).

**Observability (production-ready hooks, lightweight)**

- Client error boundary (`error.tsx` per route segment) + global fallback.
- Sentry SDK (or equivalent) — capture unhandled errors, signing flow failures (state machine error transitions), API 5xx with request ID. Source maps uploaded at build.
- Lightweight analytics event on key moments: `redeem_initiated`, `signing_cancelled`, `signing_failed`, `redeem_confirmed`, `qr_viewed`. No PII.
- Request ID propagation: app generate `x-request-id` per API call, backend echo back; surface di error toast copy-text untuk support handoff.

**Security hygiene**

- CSP header via `next.config.ts` — restrict script sources ke Privy + self + Alchemy RPC. Frame-ancestors deny (embedded wallet iframe is OK via Privy's own CSP allowances).
- No secrets di `NEXT_PUBLIC_*` (already §4.6, re-verify via `grep 'NEXT_PUBLIC_.*SECRET\|KEY'` scan — kecuali yang documented client-safe).
- Audit npm deps: `pnpm audit --audit-level=high` as CI gate. `pnpm outdated` reviewed monthly.
- Subresource integrity untuk external scripts kalau ada.

**Dead code & unused-export sweep**

- One-time run: `knip` atau `ts-prune` untuk find unused exports/files. Delete zero-hit code.
- Remove scaffolded Next.js default pages that tidak dipakai (e.g., `app/favicon.ico` placeholder, stock `app/page.tsx` boilerplate).
- `public/` folder: audit — hanya simpan asset yang actually referenced.

**Docs & DX**

- `app/README.md` rewrite setelah migration: reflect thin-client architecture, dev setup (`pnpm dev` + backend di port 8787), troubleshooting umum (Privy modal tidak muncul, CORS error, dsb).
- `app/AGENTS.md` atau `app/.github/copilot-instructions.md` — single-page panduan untuk kontributor / AI coder (layering rule: UI component **never** import from `lib/api/client.ts` langsung, selalu via hook).
- Type-only import (`import type { ... }`) dipakai di mana eligible — clearer intent, safer tree-shake.

**Deployment-readiness**

- `next.config.ts`: `output: 'standalone'` kalau deploy Docker; verify compatible dengan Privy iframe (test di staging sebelum switch).
- Health-check page `GET /healthz` (simple RSC page return "ok") — untuk load balancer / uptime monitor.
- Environment validation at boot: `src/env.ts` pakai Zod — app fail-fast di build/dev kalau required env missing, bukan surprise di runtime.
- `.env.local` never committed; `.env.example` always up-to-date (CI check: `diff <(grep -E '^\w+=' .env.example | cut -d= -f1) <(grep -E '^\w+=' .env.local | cut -d= -f1)` should be empty kalau `.env.local` ada).

**Cleanup acceptance gate** (tie back to §9.3 hygiene): semua checklist di atas di-review + Done atau di-ticket eksplisit sebagai "deferred, tracked in issue #X". Tidak ada item yang silently skipped.

## 5. Backend Endpoint Contract (what app needs)

### 5.1 Essential endpoints (all expected ready)

Mayoritas endpoint yang app butuh **sudah ada** di backend:

| Endpoint                                                       | Auth        | Source                                     | Status                                 |
| -------------------------------------------------------------- | ----------- | ------------------------------------------ | -------------------------------------- |
| `POST /api/auth/user-sync`                                     | Privy token | `backend/src/routes/auth.ts:143-180`       | ✅ Ready                               |
| `GET /api/merchants?categoryId=&search=&page=&limit=`          | Public      | `backend/src/routes/merchants.ts:8-42`     | ✅ Ready                               |
| `GET /api/merchants/:id`                                       | Public      | `backend/src/routes/merchants.ts:45-58`    | ✅ Ready                               |
| `GET /api/vouchers?merchantId=&category=&search=&page=&limit=` | Public      | `backend/src/routes/vouchers.ts:10-61`     | ✅ Ready                               |
| `GET /api/vouchers/:id`                                        | Public      | `backend/src/routes/vouchers.ts:64-77`     | ✅ Ready                               |
| `POST /api/vouchers/:id/redeem`                                | Privy       | `backend/src/routes/vouchers.ts:80-124`    | ✅ Ready                               |
| `GET /api/redemptions`                                         | Privy       | `backend/src/routes/redemptions.ts:8-42`   | ✅ Ready                               |
| `GET /api/redemptions/:id`                                     | Privy       | `backend/src/routes/redemptions.ts:45-63`  | ✅ Ready                               |
| `PATCH /api/redemptions/:id/submit-tx`                         | Privy       | `backend/src/routes/redemptions.ts:66-106` | ✅ Ready                               |
| `GET /api/transactions`                                        | Privy       | `backend/src/routes/transactions.ts:8-38`  | ✅ Ready                               |
| `GET /api/price/wealth`                                        | Public      | `backend/src/routes/price.ts:7-14`         | ✅ Ready                               |
| `POST /api/webhook/alchemy`                                    | Alchemy sig | `backend/src/routes/webhook.ts:10-49`      | ⚠️ Sig verify is TODO                  |
| `GET /api/categories`                                          | Public      | `backend/src/routes/categories.ts`         | ✅ Assumed ready (file exists, verify) |

**Response envelope note:** Backend tidak punya envelope yang uniform — `merchants/vouchers/redemptions/transactions` return `{ <resource>, pagination }`, `vouchers/:id/redeem` return `{ redemption, txDetails }`, `categories` return `{ data: ... }`. API client harus punya per-endpoint unwrapper atau DTO shape yang eksplisit di §4.2 (bukan generic `{ data }`).

### 5.2 Backend improvements (tracked, not in this scope)

Dicatat di §7 sebagai dependency — bukan deliverable doc ini:

- `GET /api/settings/public` — return **only** non-secret fields (`tokenContractAddress`, `devWalletAddress`). **Jangan expose `coingeckoApiKey` atau `alchemyRpcUrl` yang sifatnya server-side secret.** Pointer: §7-C.
- Signed Alchemy webhook verification (`webhook.ts:17-19` TODO). Pointer: §7-D.

## 6. User Flows (happy paths)

**Login & sync**

1. User buka `/auth/login` → input email → Privy kirim OTP → user submit OTP.
2. Privy frontend return `authenticated=true` + embedded wallet created.
3. App call `POST /api/auth/user-sync` sekali (guarded dengan flag session-scoped).
4. **First-time check**: fetch `GET /api/transactions?limit=1` + wagmi `balanceOf`. Kalau **keduanya zero** (no history + 0 balance) → redirect ke `/onboarding/deposit`. Else → redirect ke `/`.

**First-time onboarding (`/onboarding/deposit`)**

Layar satu halaman khusus user baru, tujuannya biar user nggak mendarat di home + tap voucher + frustrated karena "Saldo tidak cukup" tanpa tahu cara isi.

- **Header copy**: "Selamat datang! Isi saldo $WEALTH untuk mulai redeem."
- **Step 1 — Dompet kamu**: render embedded wallet address (short form `0x1234…abcd`) + **Copy** button + QR code (wallet address). Label: "Alamat dompet Base network".
- **Step 2 — Kirim $WEALTH**:
  - Network badge: **"Base mainnet"** (prominent). Warning: "Kirim di jaringan lain = dana hilang."
  - Token badge: **"$WEALTH"** dengan contract address (dari `/api/settings/public`, lihat §7-C) + copy button. Warning: "Token lain tidak diterima."
  - Recommended amount hint (optional): kalau `/api/vouchers` top-voucher `totalPrice` known, show "Minimum ~IDR X ≈ Y $WEALTH untuk voucher termurah".
- **Step 3 — Status balance**: live balance display (wagmi `useBalance` refetch tiap 10s). Begitu balance > 0, CTA primary aktif: **"Lanjut jelajahi voucher"** → `/`. Auto-redirect optional (user bisa tap manual).
- **Skip link** (small, bottom): "Saya sudah punya $WEALTH di tempat lain — lewati" → `/`. Untuk user yang mau deposit nanti atau sudah paham.
- **Re-entry**: onboarding bukan one-shot permanent; user bisa ke sini lagi via `/wallet` → "Cara deposit" link. State-check yang redirect dari login cukup session-scoped (flag di localStorage `onboardingSeen`).
- **Error handling**: kalau `/api/settings/public` belum ready (dependency §7-C) saat Phase A, fallback ke `NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS` env + TODO comment untuk switch setelah endpoint live.

**Browse & select**

1. Home (`/`) menampilkan merchants grid + featured vouchers, data dari `GET /api/merchants` dan `GET /api/vouchers`.
2. Tap merchant → `/merchants/[id]` → list voucher merchant.
3. Tap voucher → `/vouchers/[id]` → lihat title, deskripsi, `totalPrice` (IDR) di-convert ke $WEALTH via `getWealthPrice()` realtime.

**Voucher detail — price & fee breakdown**

Sebelum user tap Redeem, `/vouchers/[id]` harus render breakdown yang jelas:

- **Base price (IDR)** — `voucher.basePrice`
- **App fee** — `voucher.appFeeRate * basePrice` (e.g., 3%)
- **Gas fee (IDR)** — `voucher.gasFeeAmount`
- **Total (IDR)** — `voucher.totalPrice`
- **→ Converted to $WEALTH** — `totalPrice / wealthPriceIdr` (live, refresh tiap 30s)
- **Wallet balance check** — bandingkan dengan balance wagmi; disable Redeem + show "Saldo tidak cukup, deposit dulu" kalau balance < required. **Chain guard**: wagmi `useAccount().chainId` harus = Base mainnet (8453); kalau user wallet di-connect ke chain lain (mis. browser extension wallet di-switch manual — edge case karena embedded wallet default Base), render banner "Switch ke Base untuk redeem" + disable Redeem. Balance reading di chain lain **tidak dianggap valid** (prevent false "cukup balance" padahal token ada di chain lain dan user deposit salah chain = lost funds).
- **Voucher type badge** — kalau `qrPerSlot === 2` (BOGO), render badge "Buy 1 Get 1" dan note bahwa user akan terima 2 QR code setelah redeem. QR display page (§ di bawah) harus handle both 1 and 2 QRs. Backend schema sudah punya `qrPerSlot` field dan DTO `GET /vouchers/:id` expose — app consume langsung.

**Redeem (critical path) + signing state machine**

Redeem mengalir lewat 6 sub-state. Satu state-machine tunggal di `use-redeem-voucher.ts` (atau store zustand):

```
idle
  ↓ user tap Redeem
price-quote         — fetching /api/price/wealth
  ↓ success
initiating          — POST /vouchers/:id/redeem (backend reserve slot + assign QR)
  ↓ 200 + txDetails
opening-wallet      — Privy embedded wallet modal opening
  ↓ modal open                   ↑
awaiting-signature  — user reviewing tx in Privy modal
  ↓ signed                       ↑ (iframe evicted → wallet-recovering → back to opening-wallet)
broadcasting        — wagmi sending to RPC
  ↓ txHash received
submitting-hash     — PATCH /redemptions/:id/submit-tx
  ↓ 200
polling-confirmation — /qr/[id], polling /redemptions/:id
  ↓ status=confirmed
done                — render QR

[side-state] wallet-recovering — re-bootstrap embedded wallet; resume ke opening-wallet atau fallback reload
```

**UI copy per state** (di `/qr/[id]` atau modal overlay):

| State                  | Screen / copy                                                   | User action                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `price-quote`          | Spinner + "Mengambil kurs $WEALTH…"                             | wait (≤2s)                                                                                                                                       |
| `initiating`           | Spinner + "Menyiapkan voucher…"                                 | wait                                                                                                                                             |
| `opening-wallet`       | Dim + "Buka dompet untuk tanda tangan…"                         | wait                                                                                                                                             |
| `awaiting-signature`   | Dim + "Periksa transaksi di dompet kamu" + **Cancel** button    | sign → `broadcasting`; cancel → back to `idle` (redemption row di-TTL cleanup backend; user tetap di `/vouchers/[id]` dengan toast "Dibatalkan") |
| `broadcasting`         | Spinner + "Mengirim transaksi…" + last-4 of txHash saat didapat | wait                                                                                                                                             |
| `submitting-hash`      | Spinner + "Mencatat transaksi…"                                 | wait                                                                                                                                             |
| `polling-confirmation` | See "QR polling screen" below                                   | wait or backgrounded                                                                                                                             |
| `done`                 | QR image + voucher info                                         | save / screenshot                                                                                                                                |

**Rejection & retry recovery**

- **User reject signing** (`awaiting-signature` → error: user rejected):
  - Redemption row di DB tetap `pending`, `qrCodeId` sudah assigned. Backend TTL cleanup (§7-E item 4) akan release slot + QR setelah expiry (e.g., 10 menit).
  - UI: redirect back ke `/vouchers/[id]` dengan toast "Transaksi dibatalkan. Stok akan dikembalikan dalam beberapa menit." + CTA **"Coba lagi"** yang re-initiate (generate idempotencyKey baru — **bukan** reuse, karena row lama di-cleanup async).
  - Jangan blokir user dari redeem voucher lain sementara itu.
- **Wallet error / gas insufficient** (`broadcasting` → error):
  - Show modal: "Transaksi gagal: {error.shortMessage}". CTA "Coba lagi" → kembali ke `opening-wallet` (reuse same redemption + txDetails, tidak re-POST `/redeem`). Idempotent.
  - Untuk gas: note "Pastikan ada sedikit ETH untuk gas" + link ke help doc (P2).
- **`submit-tx` API error** (tx sudah broadcast tapi backend tidak dapat hash):
  - Redemption di-DB tetap `pending`, tapi tx sudah on-chain. Webhook-before-submit-tx race (§7-G) yang handle.
  - UI: auto-retry submit-tx 3x (exponential backoff), lalu "Transaksi terkirim tapi pencatatan lambat. Kami akan konfirmasi otomatis — cek halaman ini lagi 1 menit." + polling tetap jalan.
- **Session/token expiry mid-flow**: Privy `getAccessToken()` throw → restart signing flow, prompt re-login; jangan discard redemption state (recover via redemption ID dari URL).
- **Embedded wallet iframe eviction recovery**: Privy embedded wallet lives di iframe dari privy.io. Browser (iOS Safari aggressive memory policy, Chrome background-tab eviction, atau OOM) bisa evict iframe saat tab background lama. Gejala: `useWallets()` return empty / `sendTransaction` throw "wallet not ready".
  - **Detect**: state machine saat masuk `opening-wallet` atau `awaiting-signature`, cek `embeddedWallet?.address` + `wallet.connectorType === 'embedded'`. Kalau hilang → transition ke new state `wallet-recovering`.
  - **Recover**: UI show "Menghubungkan ulang dompet…" + auto-trigger `privy.createWallet()` / re-initialize connector via `@privy-io/wagmi`. Timeout 10s.
  - **Re-entry**: redemption record di DB masih `pending` dengan `txDetails` ter-persist (§7-E item 7 membuat ini replayable). Setelah iframe ready, app call `GET /api/redemptions/:id` untuk re-fetch `txDetails`, lalu resume ke `opening-wallet` dan prompt signing ulang. Idempotency key reused — backend harus return existing row (§6 "Double-submit" rule).
  - **Fallback kalau recover fail >10s**: full-page reload dengan URL `/qr/[redemptionId]` — bootstrap fresh Privy + wagmi, resume flow dari redemption state.
  - **Tab-visibility hook**: `document.visibilityState` listener + re-validate wallet saat tab visible kembali.

**Price lock during signing**

`wealthPriceIdr` yang dikirim ke `/redeem` di-freeze untuk flow ini. Polling live price **di-pause** selama state ∈ {`initiating`, `opening-wallet`, `awaiting-signature`, `broadcasting`, `submitting-hash`}. Resume polling di `/vouchers/[id]` setelah done atau reject. Ini mencegah UI flicker + user confusion.

**QR polling screen (`/qr/[redemptionId]`)**

Screen harus jelas status dan tidak bikin user ragu. Konten:

- **Voucher header**: merchant logo + title (biar user tahu lagi nunggu yang mana).
- **Status banner** (tergantung state):
  - `pending` + txHash ada: "Menunggu konfirmasi blockchain" + progress indicator + **elapsed timer** (mm:ss, start dari `redemption.redeemedAt`).
  - `pending` + txHash ada + elapsed > 60s: append "Biasanya 30-60 detik. Kalau lebih dari 5 menit, hubungi support." + CTA WhatsApp/email.
  - `pending` + txHash ada + elapsed > 300s (5 menit): banner berubah warna warning + show CTA **"Refresh status"** yang panggil `/redemptions/:id/reconcile` (lihat §7-H) untuk force on-chain re-check.
  - `pending` + txHash ada + elapsed > 900s (15 menit): banner error + CTA "Hubungi support" + copy txHash + explorer link.
  - `confirmed`: QR image(s) + voucher info + "Tunjukkan ke merchant".
  - `failed`: error message + refund CTA + support contact.
- **Transaction info** (always visible kalau ada txHash): short hash (`0x1234…abcd`) + copy button + **link ke BaseScan** (`https://basescan.org/tx/{hash}`).
- **BOGO handling**: kalau `redemption.qrCodes.length === 2`, render 2 QR di carousel/stacked dengan label "QR 1 dari 2" / "QR 2 dari 2".
- **Safe-to-leave notice**: "Kamu boleh tutup halaman — kami kirim notifikasi saat siap." (Notifikasi = history badge update; push notif out-of-scope Phase 1.)
- **Polling cadence**: 3s untuk first 30s, 5s untuk 30-300s, 10s setelah 5 menit (hindari RPC storm). Setelah 15 menit, **polling switch ke on-demand only** — banner "Konfirmasi masih berjalan. Tap untuk cek terbaru." (manual refresh + reconcile CTA). Polling tidak di-stop hard; backend reconcile/webhook tetap bisa flip state, dan app re-poll saat user focus tab atau tap CTA. Ini hindari kasus confirmation yang arrive di T+16m tapi UI stuck di "error".

**History**

- `/history` — list `GET /api/redemptions`, filter by status (`pending`, `confirmed`, `failed`). **Empty state**: illustration + "Belum ada redemption" + CTA "Lihat voucher".
- `/wallet` — balance (wagmi `balanceOf`) + deposit address (embedded wallet address, copy button) + transactions list (`GET /api/transactions`). **Empty state** tiap section.

**Edge cases (konsolidasi)**

| Case                                                                | Behavior                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Double-submit redeem (same idempotencyKey)                          | Backend return `{ redemption, alreadyExists: true }` (`vouchers.ts:103-105`). App skip sign step kalau `redemption.txHash` sudah ada; kalau belum, lanjut signing dengan existing `redemption.id` + `txDetails`.                                                         |
| Two-tab double-redeem (different idempotencyKey, same user+voucher) | Backend enforce: **one pending redemption per (userId, voucherId)**. Second request return 409 "Redemption sedang diproses" + reference existing `redemption.id`. App redirect ke `/qr/[existingId]`. (Lihat §7-F.)                                                      |
| Voucher out of stock between browse & redeem                        | Backend return 400 from `initiateRedemption`. App toast "Voucher sold out" + invalidate voucher query + kembali ke listing.                                                                                                                                              |
| Price drift (quote vs actual)                                       | Backend re-verify dengan tolerance (§7-E item 1); tolak kalau di luar threshold + return 409 "Harga berubah, coba lagi". App auto-refresh quote + re-prompt.                                                                                                             |
| User reject signing                                                 | Lihat "Rejection & retry recovery" di atas.                                                                                                                                                                                                                              |
| Webhook arrives before submit-tx                                    | Backend buffer unmatched confirmations (§7-G). App polling tetap lihat `confirmed` saat match.                                                                                                                                                                           |
| Offline / network loss mid-flow                                     | React Query retries dengan backoff; app show persistent banner "Offline — akan sinkron kembali saat online" (deteksi via `navigator.onLine` + RQ online manager). Signing flow pause di state saat disconnect, resume kalau reconnect dalam 30s, else error + retry CTA. |
| OTP failure (wrong / expired / too many attempts)                   | Privy sudah handle, tapi app harus surface error cleanly — tidak generic "Something went wrong". Map Privy error codes ke copy Bahasa Indonesia.                                                                                                                         |
| Stuck-but-paid (tx confirmed on-chain, backend still `pending`)     | QR polling timeout (§6 polling screen > 5 menit) trigger "Refresh status" CTA → `POST /api/redemptions/:id/reconcile` (§7-H) → backend re-verify via `eth_getTransactionReceipt` + confirm.                                                                              |

## 7. Dependencies (tidak di-solve di doc ini, tapi relevan)

### A. Backend vs docs divergence

Dari `docs/4-comparison.md`, backend sudah punya schema yang cukup match docs (slot, fee snapshot, soft-delete, status enum). **Verifikasi field-by-field perlu dilakukan saat planning** untuk memastikan `wealthAmount` calculation, fee breakdown, dan slot assignment sesuai brief. Tapi ini **tidak blokir app rework** — app consume via API response, bukan via schema langsung.

### B. Back-office 404 endpoints

Dari `docs/5-comparison-backoffice.md`: `PUT /admin/admins/:id/assign-merchant`, `POST /admin/vouchers/:id/upload-qr`, dan reset-password. Tidak relevan untuk user-app (semua admin-only), tapi perlu di-track di brainstorm terpisah.

### C. Config source of truth

Public-safe config (`tokenContractAddress`, `devWalletAddress`) adalah kandidat untuk move dari app env vars ke `GET /api/settings/public` supaya bisa di-rotate owner tanpa redeploy app. **Alchemy RPC URL dan CoinGecko API key adalah server-side secrets — TIDAK boleh di-expose via public endpoint maupun `NEXT_PUBLIC_*` env var.** App hanya butuh `NEXT_PUBLIC_ALCHEMY_API_KEY` kalau butuh RPC langsung dari browser (untuk itu pakai Alchemy key terpisah yang di-domain-restrict; jangan reuse server key).

### D. Webhook signature verification + on-chain amount invariant

Dua hal yang backend harus fix sebelum production live (bukan blokir rework app, tapi block production):

1. `backend/src/routes/webhook.ts:17-19` masih TODO untuk verify Alchemy signature via HMAC-SHA256 dengan `ALCHEMY_WEBHOOK_SIGNING_KEY`. Tanpa ini, attacker bisa POST dummy `txHash` dan meng-confirm redemption palsu.
2. `confirmRedemption(txHash)` saat ini **tidak verify on-chain transfer amount**. Backend harus parse Transfer log dari Alchemy payload dan assert: `to == treasuryWalletAddress`, `from == user.walletAddress`, `value >= redemption.wealthAmount`, `token == tokenContractAddress`. Tanpa ini user bisa sign `transfer(treasury, 1 wei)` dan dapat QR gratis.

### E. Money-moving invariants (backend requirements, block production)

Harus ada sebelum app masuk live production, tapi tidak blokir rework app (app consume via API):

1. **Server-side price verification.** `wealthPriceIdr` yang client kirim di `POST /vouchers/:id/redeem` **jangan di-trust buta** — backend harus re-fetch authoritative price dari CoinGecko di saat redeem dan reject jika delta > threshold (e.g., ±2%), atau backend issue signed quote token yang di-redeem di POST.
2. **Rate limiting** pada money-moving endpoints: `POST /vouchers/:id/redeem` (≤5/min/user), `PATCH /redemptions/:id/submit-tx` (≤10/min/user), `POST /auth/user-sync` (≤3/min/IP).
3. **Treasury address invariant**: app **MUST** gunakan `treasuryWalletAddress` dari response `POST /vouchers/:id/redeem` saat signing — bukan dari `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS` env var. Env var dihapus dari app (konsisten dengan §7-C endpoint migration).
4. **Pending redemption TTL + slot release.** Slot + QR di-assign pada step 2 (`initiateRedemption`) dan **di-hold sampai** `status=confirmed` ATAU TTL expire (e.g., 10 menit dari `redeemedAt`). Cron cleanup job setiap 1 menit: `UPDATE redemptions SET status='failed' WHERE status='pending' AND redeemedAt < NOW() - INTERVAL '10 minutes' AND txHash IS NULL`, lalu release slot (`QrCode.status = available`, `assignedToUserId = NULL`, `voucher.remainingStock += 1`). Tanpa ini, user yang abort signing meng-lock stock permanen. **Note:** User reject UX (§6 "Rejection & retry recovery") harus konsisten dengan timing ini — toast "stok kembali dalam beberapa menit" match TTL window.
5. **submit-tx on-chain verification.** Setelah store `txHash`, backend lakukan `eth_getTransactionByHash` verify on-chain fallback jika webhook telat/drop.
6. **submit-tx idempotent retry.** Saat app retry `PATCH /submit-tx` dengan **same `redemptionId` + same `txHash`** (karena network error on first call), backend jangan return 409 — harus accept sebagai no-op (`redemption.txHash === incoming` → 200). Current implementation di `redemptions.ts:66-106` pakai `findUnique where { txHash }` yang throw unique-constraint kalau row sudah set. Ganti ke: check current row, if `txHash == incoming` return current state, else kalau `txHash` sudah beda → 409 conflict.
7. **`GET /api/redemptions/:id` return `txDetails` untuk replay.** Saat user refresh `/qr/[id]` atau re-enter flow setelah session expiry, app butuh `tokenContractAddress`, `treasuryWalletAddress`, `wealthAmount` untuk re-sign (jika belum submit-tx). Backend response `GET /redemptions/:id` harus include `txDetails` kalau `status === 'pending' && !txHash`. Tanpa ini, recovery dari "session expired mid-signing" impossible tanpa re-initiate (yang akan conflict dengan pending row).

### F. Privy SDK version coordination

`@privy-io/react-auth@3.21.2` (app client) dan `@privy-io/server-auth@1.32.5` (backend verifier — deprecated, migrate ke `@privy-io/node`) harus tetap kompatibel. Pin versi di kedua project selama rework; upgrade jointly. Tambah `@privy-io/wagmi` di app untuk connector — pin versi yang kompatibel dengan `react-auth@3.21.2`.

**Peer-dep coordination:** `app/package.json` saat ini punya `wagmi ^3.6.1`. `@privy-io/wagmi` (latest, 2026-era) expects `wagmi@^2.x` sebagai peer. **Saat install `@privy-io/wagmi`**: verify peer range di node_modules, align `wagmi` ke versi yang disupport (kemungkinan downgrade atau upgrade), dan re-test `use-wealth-balance.ts` / `use-send-wealth.ts`. Kalau mismatch, `useWriteContract` akan fail at runtime karena connector tidak ter-register. M4 (§10) include this verification; block M5 sampai signing test end-to-end green.

### G. Race conditions on redemption lifecycle

Tiga race yang backend harus handle supaya app tidak butuh hack di client:

1. **Webhook-before-submit-tx.** Alchemy webhook bisa arrive sebelum app sempat `PATCH /submit-tx` (network latency). Backend harus: di webhook handler, kalau txHash tidak match redemption existing, **buffer unmatched confirmations** (e.g., `PendingConfirmation` table keyed by txHash, TTL 30 menit). Saat `submit-tx` masuk, lookup buffer dan auto-confirm kalau ada match.
2. **Two-tab / parallel redeem same user+voucher.** Backend harus enforce: satu `pending` redemption per `(userId, voucherId)`. Second `POST /redeem` dengan different idempotencyKey → return 409 + existing `redemption.id`. Implementasi **MUST** pakai Postgres partial unique index (`UNIQUE (user_id, voucher_id) WHERE status = 'pending'`) — transactional check di app-level (find → insert) race-able. Verify idx ada di backend migration sebelum mark B8 done.
3. **`requireUser` 404 race (first-time user).** User selesai Privy OTP → app redirect ke home → `GET /vouchers` belum butuh user, tapi `POST /user-sync` mungkin belum finish. Kalau user tap Redeem sebelum sync selesai, `requireUser` return 404 "Please sync first" (`middleware/auth.ts:89-122`). **App mitigation:** AuthGuard block render sampai `syncUser()` resolved (§4.5). **Backend mitigation (nice-to-have):** `requireUser` auto-create user dari Privy token kalau row belum ada (avoid round-trip).

### H. Stuck-but-paid reconciliation endpoint

Tambahkan `POST /api/redemptions/:id/reconcile` (Privy auth, owner-only per redemption):

- Server-side: `eth_getTransactionReceipt(redemption.txHash)` via Alchemy RPC.
- Verify semua invariant (§7-E item 5 + §7-D item 2): `to`, `from`, `value`, `token`, block confirmation depth.
- Kalau valid dan status 1 → call `confirmRedemption` (idempotent). Kalau not-yet-mined → return current state. Kalau reverted → mark `failed`.
- Rate limit ≤1/10s/user untuk hindari RPC abuse.

Tanpa endpoint ini, stuck-but-paid cases (webhook drop, signature verify bug) jadi support ticket manual.

### I. Backend `?category=` filter bug

`backend/src/routes/vouchers.ts:31-36` filter by `merchant.category` string, tapi schema backend sudah migrasi ke `Category` table dengan FK (`categoryId`). String filter ini **akan tidak match** setelah data populated via back-office. **App workaround:** pakai `?categoryId=<uuid>` filter (via `merchant.categoryId`) — konfirmasi backend support ini atau request patch. Alternatif: filter client-side setelah fetch (tidak ideal untuk pagination).

## 8. Open Questions

1. **Migration owner.** `app/README.md:110` bilang back-office, backend punya prisma folder. Konfirmasi: **backend owns all migrations**, app dan back-office tidak punya prisma di source code mereka (app kita hapus di §4.1, back-office tidak punya). Perlu update README.
2. **Deployment topology.** Backend Hono akan di-deploy di mana (Vercel serverless via `backend/vercel.json`? Standalone?) dan URL production-nya apa? Mempengaruhi `NEXT_PUBLIC_API_BASE_URL` dan CORS config.
3. **Pending redemption TTL.** Redemption `pending` tanpa `txHash` (user cancel signing) — apakah ada cleanup job untuk release slot? Atau slot di-assign baru saat `submit-tx`? Perlu trace `initiateRedemption` service di backend.
4. **QR image URL source.** `QrCode.imageUrl` di backend — apakah sudah di-upload admin via ZIP di back-office dan disimpan di R2 (ada `backend/src/services/r2`)? Asumsi: ya. Perlu verify end-to-end sebelum UAT.
5. **Live price polling cadence.** 30s, 60s, atau on-focus? Saya usulkan 30s di `/vouchers/[id]` (karena quote-sensitive), 5 menit di listing pages.
6. **Balance polling vs event-based.** wagmi default refetch tiap block, tapi Base network block time 2s. Mungkin override ke interval 10-15s untuk irit RPC.

## 9. Success Criteria

Fokus: **user-observable outcome**, bukan cuma kode bersih. Code-cleanup checklist dipertahankan sebagai hygiene, tapi bukan alat ukur sukses utama.

### 9.1 User outcome (primary)

- [ ] **Login-to-redeem journey**: new user sign-up via email OTP → sync user berhasil tanpa 404 race → pilih voucher → redeem → QR muncul, status `confirmed`, dalam **≤90 detik p50** dari "tap Redeem" sampai QR render (asumsi network & chain normal). Di-measure manual via stopwatch pada UAT, minimum 5 run.
- [ ] **Fee breakdown renders**: `/vouchers/[id]` menampilkan base + app fee + gas + total IDR + konversi $WEALTH; breakdown cocok dengan `totalPrice` dari API response (not calculated client-side from basePrice).
- [ ] **BOGO voucher works**: voucher dengan `qrPerSlot=2` → setelah confirm, 2 QR ter-render di `/qr/[id]` dengan label jelas.
- [ ] **QR image loads**: `redemption.qrCodes[*].imageUrl` dari R2 tampil di `/qr/[id]` tanpa broken image, ter-save via screenshot OK.
- [ ] **Stuck redemption recovers**: simulasi (matikan webhook sementara, trigger redemption) → setelah >5 menit, "Refresh status" CTA muncul → tap → redemption resolve `confirmed` tanpa support intervention.
- [ ] **Rejection recovery works**: user reject signing di Privy modal → redirect balik ke `/vouchers/[id]` dengan toast + CTA retry → retry berhasil.
- [ ] **Two-tab guard**: buka voucher sama di 2 tab, tap Redeem berbarengan → satu sukses, satunya redirect ke `/qr/[existingId]` (tidak create duplicate redemption atau double-charge).
- [ ] **Offline resilience**: matikan network mid-flow (sebelum `submit-tx`) → banner "Offline" muncul → nyalakan network → flow resume ke polling `confirmed` tanpa user restart.
- [ ] **First-time onboarding**: new user login → 0 balance + 0 history → mendarat di `/onboarding/deposit` (bukan `/`) dengan wallet address, network badge, contract address, + live balance listener. Deposit test → balance update → CTA aktif → `/`.
- [ ] **Wallet iframe eviction recovery**: background tab >5 menit saat di `awaiting-signature`, kembali → app detect wallet gone → transition ke `wallet-recovering` → re-bootstrap → resume signing tanpa kehilangan redemption state.

### 9.2 Contract tests (pre-integration)

- [ ] Tiap endpoint di §5.1 ada smoke test (Vitest / Playwright) yang verify response shape match DTO types di `app/src/types/api.ts`. Run di CI, fail kalau backend break contract.
- [ ] Price feed polling + stale-quote rejection path ter-test.
- [ ] Idempotency behavior ter-test: 2x POST redeem dengan key sama → return `alreadyExists: true`.

### 9.3 Code hygiene (secondary — evidence of migration, not goal)

- [ ] `app/prisma/`, `app/src/app/api/`, `app/src/lib/db.ts`, `app/src/lib/services/` hilang dari repo.
- [ ] `app/package.json` tidak punya `@prisma/client` / `prisma` / `@privy-io/server-auth`.
- [ ] `grep -r "prisma\." app/src` returns 0 hit.
- [ ] `grep -r "fetch(.*api/" app/src` hanya ke `NEXT_PUBLIC_API_BASE_URL`, tidak ke `/api/` internal.
- [ ] Back-office tetap jalan (tidak di-touch).
- [ ] Backend tidak perlu breaking change untuk rework ini (hanya tambahan optional/opt-in di §7-C/G/H/I).

### 9.4 Production-grade gate (pre-launch)

Semua §4.8 item di-acknowledge (Done atau explicitly-deferred-with-ticket). Minimum-must-have untuk go-live:

- [ ] TypeScript `strict: true` + 0 `any` di `src/`.
- [ ] Zod validation untuk tiap API response (fail-fast on shape drift).
- [ ] ESLint + Prettier + Husky pre-commit hook aktif; CI enforce lint/typecheck/build.
- [ ] `knip` atau `ts-prune` sweep passed; no dead exports.
- [ ] Env validation at boot via `src/env.ts` (Zod); app fail-fast kalau missing.
- [ ] CSP header configured; no `NEXT_PUBLIC_*SECRET`.
- [ ] Error boundary per route + Sentry capture untuk signing-flow errors.
- [ ] Bundle initial JS <200KB gzip; Lighthouse performance ≥85 di mobile.
- [ ] `pnpm audit --audit-level=high` = 0 vulnerabilities.
- [ ] `app/README.md` reflect thin-client architecture (no stale Prisma/DB references).

## 10. Proposed Sequencing

Rework app terbagi dua fase besar: **Phase A (app refactor)** — 1 engineer di app/; **Phase B (production gates)** — butuh backend collab. Phase A bisa mulai paralel, tapi **Phase B must close before live launch**.

### Phase A — App refactor (in-scope deliverable)

1. **M1: API client foundation** — §4.2, §4.3 (client + hooks, tanpa delete dulu). ~0.5 day.
2. **M2: Voucher detail + fee breakdown + BOGO rendering** — `/vouchers/[id]` dengan breakdown (base + fee + gas + total), konversi live $WEALTH, BOGO badge handling. ~0.5 day.
3. **M3: Refactor remaining pages ke RQ hooks** — §4.4 (home, merchants, history, wallet, profile). ~1 day.
4. **M4: Privy + wagmi embedded-wallet wiring + onboarding** — §4.5 (`@privy-io/wagmi` connector, sync gate) + `/onboarding/deposit` screen untuk zero-balance first-time user. ~1 day.
5. **M5: Redeem state machine + QR polling UX** — §6 sub-states, rejection/retry, iframe-eviction recovery (`wallet-recovering` side-state), reconcile hook, offline banner. ~1.5 day.
6. **M6: Delete old code + verification sweep** — §4.1 (full checklist, grep-based verify). ~0.5 day.
7. **M7: Env cleanup + CORS verify + README rewrite** — §4.6, §4.7, rewrite README ke thin-client architecture. ~0.5 day.
8. **M8: Production-grade hardening** — §4.8 (TS strict, Zod validation at API edge, ESLint/Prettier/Husky, CSP + error boundary + Sentry hooks, knip dead-code sweep, env validation via Zod at boot, bundle audit). ~1 day.
9. **M9: Contract tests + manual UAT** — §9.2 smoke tests in CI + §9.1 outcome checklist + §9.4 production-grade gate. ~1 day.

**Estimasi Phase A**: **~7.5-8 dev-days** untuk 1 engineer, assuming backend endpoints behave as documented.

**Caveat: UAT dependence on Phase B.** Beberapa §9.1 criteria (stuck recovery, two-tab guard, rejection retry konsisten dengan TTL timing) secara fungsional **depend on Phase B items** (B5, B7, B8, B9). Phase A UAT di staging hanya bisa fully-pass kalau staging backend sudah punya B5+B7+B8+B9. Jika belum, mark criteria sebagai "partial — pending backend" dan re-run post-Phase-B, sebelum go-live.

### Phase B — Production gates (block live launch, not app rework)

Tidak in-scope deliverable doc ini, tapi harus ter-coordinate dengan backend tim sebelum production:

- **B1: Webhook signature verification** — §7-D item 1.
- **B2: On-chain amount invariant in `confirmRedemption`** — §7-D item 2.
- **B3: Server-side price re-verify** — §7-E item 1.
- **B4: Rate limiting money-moving endpoints** — §7-E item 2.
- **B5: Pending redemption TTL + slot release** — §7-E item 4.
- **B6: submit-tx on-chain fallback verify** — §7-E item 5.
- **B7: Webhook-before-submit-tx buffer** — §7-G item 1.
- **B8: One-pending-redemption-per-voucher lock** — §7-G item 2.
- **B9: Reconcile endpoint** — §7-H.
- **B10: Category filter bug fix** — §7-I.

Phase A bisa merge dan dipakai di staging. **Go-live ke redeem.wealthcrypto.fund di-block sampai B1-B9 selesai** (B10 bisa ditangani via app workaround kalau perlu).

---

**Next step:** `/ce:plan` dengan doc ini sebagai input untuk breakdown implementasi detail (file-level tasks, test approach, migration strategy untuk delete code).
