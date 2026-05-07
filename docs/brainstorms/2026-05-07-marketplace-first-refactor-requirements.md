---
date: 2026-05-07
topic: marketplace-first-refactor
---

# Marketplace-First Refactor — Requirements

## Problem Frame

App existing adalah **login-first**: user wajib auth dulu sebelum bisa lihat voucher apapun. Pivot ke **marketplace-first**: siapa saja bisa browse marketplace publik, login on-demand pas mau redeem voucher atau buka profil.

Selain shift auth model, refactor ini juga konsolidasi kerja navigasi dan rapikan onboarding. Stack tetap Next.js 16 (App Router) — Vite migration plan di-defer ke phase berikutnya.

**Audiens utama:**

- Pengunjung anonim (calon user, social-share visitor) — sekarang bisa lihat marketplace tanpa friction
- User auth aktif — UX lebih ringkas (tanpa bottom nav, profil scrollable, history merged)
- Search engines — public pages indexable untuk pertama kalinya

## Auth State Matrix

| Surface                                                | Unauth                                | Auth                                           |
| ------------------------------------------------------ | ------------------------------------- | ---------------------------------------------- | --------------- | ----------- |
| Header (right)                                         | Tombol "Masuk" → `usePrivy().login()` | Avatar dropdown (Profile, Logout)              |
| `/`, `/merchants`, `/merchants/[id]`, `/vouchers/[id]` | Full akses, browse semua data         | Sama (no special personalization di scope ini) |
| `/profile`                                             | Silent redirect ke `/`                | Full page, scrollable                          |
| `/qr/[redemptionId]`                                   | Silent redirect ke `/`                | QR + status + polling                          |
| Voucher redeem CTA                                     | "Login untuk Redeem" → Privy modal    | Dual: balance ≥ price                          | balance < price | wrong chain |
| Mobile bottom nav                                      | (drop sepenuhnya)                     | (drop sepenuhnya)                              |

## Requirements

### Auth & Routing

- R1. Drop `AuthGuard` wrapper dari `src/app/(main)/layout.tsx`. Layout publik secara default.
- R2. Build hook `useRequireAuth()` yang ditaruh di `src/app/(main)/profile/page.tsx` dan `src/app/(main)/qr/[redemptionId]/page.tsx`. Behavior: tunggu `ready === true`; jika `!authenticated` → `router.replace('/')` silent (tanpa preserve intent atau modal). Selama `!ready`, render spinner. **Timeout fallback**: jika `!ready` masih true setelah 8 detik (Privy SDK init failure), spinner berubah jadi error state dengan copy "Gagal memuat autentikasi. Coba refresh halaman." + tombol reload.
- R3. Drop route `src/app/auth/login/` (login pakai Privy native modal saja).
- R4. Drop route `src/app/(main)/wallet/`. Konten masuk Profile balance card + deposit modal.
- R5. Drop route `src/app/(main)/onboarding/deposit/`. Replace dengan welcome sheet + home CTA card.
- R6. Drop route `src/app/(main)/history/`. Konten masuk Profile bottom section.
- R7. Pindah `useSyncUser` call dari dalam `AuthGuard` ke effect global (provider-level atau hook yang dipanggil di `(main)/layout.tsx`). Effect HARUS gated: fire hanya saat `ready === true && authenticated === true` transitions to true. Dedupe pakai key `userId` (Privy user id) — bukan generic ref — supaya logout→login dengan user yang sama atau beda tetap retrigger correctly. Reset dedupe saat `authenticated` flip false.

### Header & Navigation

- R8. `MobileHeader` mendukung dual state — unauth tampil tombol "Masuk" pojok kanan atas; auth tampil avatar dengan dropdown (Profile, Logout). Pattern konsisten desktop + mobile.
- R9. `Sidebar` (desktop) — buang menu History; jangan render link Profile saat unauth (karena route sudah redirect).
- R10. Drop `BottomNav` mobile sepenuhnya. Mobile = header + content area scrollable.
- R11. Build `HeaderAuthControls` sebagai komponen tunggal yang dipakai di mobile header dan desktop sidebar/topbar untuk konsistensi state rendering.

### Onboarding

- R12. Build `WelcomeOnboardingSheet`. Trigger condition (semua harus true setelah resolved): `ready === true && authenticated === true && balanceQuery.isSuccess && redemptionsQuery.isSuccess && rawBalance === 0n && (redemptionsQuery.data?.pagination.total ?? 0) === 0 && !localStorage['wealth.welcome-shown']`. **Treat unresolved/loading sebagai no-trigger** — jangan flicker sheet untuk user yang querynya masih loading. `useWealthBalance` returns `rawBalance: bigint | undefined`; kalau undefined, berarti masih loading dan trigger gak fire. Existing user yang sudah pernah deposit/redeem tidak akan kena karena salah satu invariant gagal.
- R13. Welcome sheet konten: judul, kalimat sambutan (draft "Wallet kamu udah siap. Sekarang tinggal deposit WEALTH dan mulai redeem voucher favorit kamu."), 2 CTA (primary "Deposit WEALTH" → buka deposit modal; secondary "Jelajahi Voucher" → navigate `/merchants`), tombol close. Copy dan visual final di-iterate saat polish phase (vibe wealthcrypto.fund).
- R14. Saat dismiss atau klik salah satu CTA, set `localStorage['wealth.welcome-shown'] = 'true'`. Sheet tidak muncul lagi di browser yang sama.
- R15. Build `HomeDepositCta` card. Trigger: `authenticated && balance === 0n` (tanpa cek welcome flag — terus tampil sampai ada saldo). Posisi: di home page antara hero dan featured vouchers. onClick → buka deposit modal.

### Profile Page

- R16. `/profile` adalah single page scrollable dengan tiga section: Balance Card, Transaction History, plus area sekunder untuk email/wallet info dan tombol logout (port dari profile saat ini).
- R17. **Balance Card**: tampilkan WEALTH balance (via `useWealthBalance`), IDR equivalent (via `usePrice`), dua tombol: "Deposit" (buka `DepositModal`), "Withdraw" (buka `WithdrawModal`).
- R18. **`DepositModal`**: port konten `WalletDepositPanel` (step-by-step guide, embedded wallet address copy, contract address copy, network reminder). Tidak perlu logic baru.
- R19. **`WithdrawModal`** baru, dengan `WithdrawForm`:
  - Field: amount (numeric, > 0, ≤ balance, max 6 desimal); target address (regex `^0x[a-fA-F0-9]{40}$`)
  - Tombol "Max" → set amount = current balance
  - **Pre-flight gas check sebelum confirm dialog**: estimate gas untuk `transfer()` call; jika native ETH balance di embedded wallet < estimated gas, tampilkan inline error "Saldo ETH tidak cukup untuk biaya gas. Top up gas dulu." dan disable Submit. Bedakan dari generic RPC error.
  - Tombol Submit (jika gas check pass) membuka confirm dialog dengan warning "Pastikan address bener — transaksi gak bisa di-revert"
  - Sign via `wagmi.writeContractAsync` → ERC-20 `transfer(targetAddress, parseUnits(amount, 18))`
  - Token contract address dari env `NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS`
  - Success state inline di modal: txHash + Etherscan link + tombol close. **Ini adalah satu-satunya bukti tx untuk user di v1**, karena withdraw rows belum muncul di history (lihat R23).
  - Error: user reject → silent close modal; gas-related error → inline message dengan recovery hint; generic RPC error → inline error message di form.
- R20. **`useWithdraw`**: hook yang wrap signing flow + state (`idle | signing | success | error`). Confirm dialog visibility dikelola sebagai local UI state di `WithdrawModal` (`useState` boolean), bukan di hook — biar hook stay scoped ke async on-chain operation. Pakai existing wagmi setup, tidak perlu store baru.
- R21. Wrong-chain handling di withdraw modal: kalau `chainId !== TARGET_CHAIN_ID`, tombol Submit disabled dengan label dinamis (`"Pindah ke ${targetChain.name}"`) — **gunakan `targetChain.name` dari `lib/wagmi.ts`, bukan hardcode "Ethereum"**, karena testnet env akan menampilkan "Sepolia".

### Transaction History (v1)

- R22. **Source v1**: `GET /api/redemptions` saja. Backend belum implement `/api/transactions` route, `transactions` table, atau indexer untuk deposit/withdraw events (lihat Dependencies). Maka history view = redemption history dengan presentation baru.
- R23. **Withdraw row v1**: tidak muncul di history list. User cuma dapat success state inline di modal (R19). Tracked sebagai tech-debt: ketika BE indexer ada, ganti source ke unified `/api/transactions` + lazy-enrich redemption metadata via `redemptionId`.
- R24. **Desktop view (`TxHistoryTable`)**: datatable kolom Type (= "Redeem"), Amount, Date, Status, Tx Hash (link Etherscan), Merchant. Filter: status (all/pending/confirmed/failed). Search: txHash atau merchant name. Sort: date default desc. Pagination standard. Tap row → `TxDetailModal`.
- R25. **Mobile view (`TxHistoryCardList`)**: card list, masing-masing card tampilkan judul "Redeem - {merchantName}", amount, tanggal, status badge. Filter: chip horizontal scroll dengan All + status filters (pending/confirmed/failed). Type filter chips ditambah ke v2 saat BE indexer ship. Search: collapsible icon. Sort hardcoded date desc. Tap card → `TxDetailModal`.
- R26. **`TxDetailModal`**: tampilkan full info, tx hash + Etherscan link, dan tombol "View QR" → `/qr/[redemptionId]` (karena semua row v1 adalah redemption).
- R27. **`useTxHistory` hook**: wrap `useRedemptions` dengan pagination ("Load more"), shape output ready untuk future merge dengan transactions endpoint (return `entries: HistoryEntry[]` dengan tipe normalized) supaya v2 swap-source jadi minor change.

### Voucher Detail Redeem Button

- R28. `/(main)/vouchers/[id]/page.tsx` redeem button menampilkan empat state:

  | State                            | Label                             | onClick                               |
  | -------------------------------- | --------------------------------- | ------------------------------------- |
  | Unauth                           | "Login untuk Redeem"              | `usePrivy().login()`                  |
  | Auth + balance ≥ price           | "Redeem Voucher"                  | `useRedeemVoucher().start(id)`        |
  | Auth + balance < price           | "Saldo Tidak Cukup, Deposit"      | open `DepositModal`                   |
  | Auth + wrong chain (any balance) | `"Pindah ke ${targetChain.name}"` | disabled, dengan warning text di atas |

  **Precedence**: evaluate state in order — unauth → wrong-chain → insufficient-balance → redeem. First match wins. Maka auth user dengan wrong chain + insufficient balance render "Pindah ke ${targetChain.name}", bukan "Saldo Tidak Cukup".

- R29. Setelah login modal Privy close (success), button rerender saat `authenticated === true && useSyncUser.isSuccess` (BE handshake done) — bukan langsung saat `authenticated` flip. Sebelum keduanya true, label tetap "Login untuk Redeem" — gak flip prematurely ke "Redeem Voucher" saat BE belum punya user record. **Tidak auto-trigger redeem** — user wajib klik lagi explicit untuk konfirmasi.
- R30. `useRedeemVoucher` internal **out of scope**; hanya tambah authenticated check di entry hook (defense-in-depth) yang return early kalau `!authenticated` — biar invariant button-level guard tetap tegak walau ada bug. Button-level guard (R28-R29) adalah primary; R30 adalah safety net, tidak duplikat logic.

### SEO (Public Pages)

- R31. Tambah `generateMetadata` async function di `/`, `/merchants/page.tsx`, `/merchants/[id]/page.tsx`, `/vouchers/[id]/page.tsx`. Fields: `title`, `description`, `openGraph.title`, `openGraph.description`, `openGraph.images` (pakai voucher/merchant cover image kalau ada, fallback ke generic OG asset di `/public/`).
- R32. Convert public route page-level files jadi server component shells. Data fetch (categories, merchants list, merchant detail, voucher detail) di-prefetch SSR via TanStack Query `HydrationBoundary` pattern. Interactive child (filters, redeem button, etc.) tetap `"use client"`.
- R33. Tambah `app/sitemap.ts` dan `app/robots.ts` dasar — index `/`, `/merchants`, `/merchants/[id]` untuk merchant aktif, `/vouchers/[id]` untuk voucher non-expired (skip `expiryDate < now` dan voucher inactive — hindari soft-404 churn yang merusak SEO score). Sertakan `lastmod` per entry untuk crawl freshness. Disallow `/profile`, `/qr/*`.

## Success Criteria

- Pengunjung anonim bisa membuka `/`, `/merchants`, `/merchants/[id]`, dan `/vouchers/[id]` tanpa login dan melihat data lengkap.
- Tombol "Masuk" di header memicu Privy native modal (bukan navigasi ke route login). Setelah login sukses, user tetap di halaman yang sama.
- Voucher detail page menampilkan label tombol redeem yang sesuai dengan kombinasi auth × balance × chain (4 state R28).
- User yang akses `/profile` atau `/qr/[id]` tanpa auth otomatis kembali ke `/` tanpa flash konten privat.
- User dengan saldo 0 dan belum pernah redeem melihat welcome sheet sekali per browser; setelah dismiss, tidak muncul lagi.
- User dengan saldo > 0 atau pernah redeem **tidak** pernah melihat welcome sheet, walaupun belum punya flag `localStorage`.
- Profile page menampilkan balance, tombol deposit/withdraw, dan history redemption dalam satu page scrollable di mobile dan desktop.
- Withdraw form mem-block submit ketika address invalid, amount > balance, atau chain salah; success state menampilkan txHash + Etherscan link.
- Bottom nav tidak ada di mobile; semua navigasi via header.
- Public pages punya metadata SSR (`view-source` menunjukkan title/description). Crawl sitemap valid.

## Scope Boundaries

**In scope:**

- Refactor in-place di Next.js 16 codebase; introduce shadcn/ui sebagai library komponen baru.
- Semua items R1–R33 di atas.
- Aesthetic polish (color tokens, font pairing, ke-vibe wealthcrypto.fund) dilakukan **sebagai bagian dari refactor ini**, post-functional pada milestone akhir.

**Out of scope (explicit non-goals):**

- Vite migration (defer ke phase berikutnya; brief original mention "Vite + shadcn", kita ambil shadcn-nya saja).
- `useRedeemVoucher` god hook split internal (separate ticket).
- QR display, polling, reconcile logic — preserve as-is.
- Backend perubahan apapun: tidak ada endpoint baru, tidak ada migrasi DB. Withdraw/deposit indexer adalah BE work yang **tidak** dikerjakan di sini.
- Privy / wagmi config edits.
- API client `lib/api/*` dan Zod schemas: preserve.
- Zustand `redemption-flow` store: preserve.
- ERC-20 ABI: preserve.
- Cross-device welcome state (localStorage only — accepted limitation).
- Preserve-intent flow untuk `/qr/[id]` shared link unauth (decided: silent redirect).
- ENS resolution / address book / contact list untuk withdraw.
- Dynamic OG image generation (pakai static fallback sampai ada appetite).

## Key Decisions

- **Tetap Next.js 16, drop Vite plan.** User decision; brief asal mention "Vite + shadcn" tapi project saat ini Next.js dan ingin pertahankan stack. shadcn tetap di-introduce.
- **Tx history v1 = redemption only.** BE belum punya `/api/transactions` route, `transactions` table, atau deposit/withdraw indexer (verified via codebase scan). Daripada delay refactor, ship struktur baru pakai data redemption yang ada; tx schema FE udah future-ready saat BE catch up.
- **Welcome sheet trigger = true new-user only.** `balance === 0n && redemptionsCount === 0 && !flag`. Existing user gak akan kena welcome.
- **`/qr/[id]` unauth = silent redirect ke `/`.** Sederhana, sesuai brief; preserve-intent pattern di-defer.
- **Wrong-chain message dinamis dari `targetChain.name`.** Brief hardcode "Ethereum" tapi config testnet pakai Sepolia — bug magnet kalau dihardcode.
- **SEO included sekarang.** Free win pakai Next.js metadata API + SSR shell pattern; momentum-nya pas saat marketplace go-public.

## Dependencies / Assumptions

**Verified dari codebase scan (2026-05-07):**

- `AuthGuard` dipakai di `src/app/(main)/layout.tsx` (R1 valid).
- `(main)/wallet/page.tsx` adalah satu-satunya consumer `useTransactions` saat ini; route ini di-drop di R4.
- `(main)/history/page.tsx` saat ini pakai `useRedemptions`, **bukan** `useTransactions` — jadi user existing belum pernah lihat deposit/withdraw rows.
- Backend (`backend/src/routes/`) **tidak** punya `transactions.ts` route file. Tabel `transactions` **tidak** ada di `prisma/schema.prisma`. Hanya Alchemy webhook untuk inbound transfer-ke-treasury (= confirm redemption payment) yang implemented.
- Target chain wagmi: Ethereum mainnet (atau Sepolia via env toggle `NEXT_PUBLIC_CHAIN`).
- `transactionTypeSchema` enum sudah punya `"deposit" | "withdrawal" | "redeem"` di FE Zod schema (siap saat BE catch up).
- shadcn/ui dan `@radix-ui/*` belum ada di `package.json` — perlu install + setup CSS variables baru sebagai bagian dari refactor.

**Assumptions (perlu konfirmasi saat planning):**

- Privy SDK 3.21.2 punya `usePrivy().login()` yang membuka native modal tanpa harus customize. (Lihat planning untuk verify.)
- `useWealthBalance` cukup cepat resolved untuk dipakai di trigger welcome sheet tanpa flicker — kalau lambat, tampilkan placeholder atau delay sheet sampai resolved.
- `NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS` env var sudah ada (verify di `.env.example`).
- BE endpoints `/api/categories`, `/api/merchants`, `/api/merchants/[id]`, `/api/vouchers`, `/api/vouchers/[id]`, `/api/price/wealth` accept unauthenticated requests dan return shape yang sama (atau superset) untuk auth user — required untuk R32 SSR prefetch. Verify via `lib/api/endpoints.ts` (hanya yang `requireAuth: true` butuh token). Kalau ternyata ada yang auth-gated di BE (Hono middleware), itu jadi BE prerequisite — konflik dengan non-goal "no BE changes".
- Embedded wallet user punya cukup native ETH untuk gas. Kalau tidak, R19 pre-flight gas check yang surface error. Saat refactor, verify apakah Privy embedded wallet onboarding sudah include initial gas allocation atau user harus deposit ETH manually.

## Outstanding Questions

### Resolve Before Planning

(empty — semua product decision sudah dijawab)

### Deferred to Planning

- [Affects R7][Technical] Lokasi terbaik untuk pindahkan `useSyncUser` call: di `providers.tsx` (top-level), di `(main)/layout.tsx` post-AuthGuard removal, atau hook khusus yang dipanggil di header? Trade-off seputar mounting timing dan SSR boundary.
- [Affects R12, R15][Technical] Order of resolution antara `useAuth.ready`, `useWealthBalance`, dan `useRedemptions(limit:1)` untuk menghindari welcome-sheet/deposit-CTA flicker. Pakai `Suspense` + loaders, atau gate via `data` checks?
- [Affects R20][Pattern resolved] Reuse user-reject detection pattern dari `src/hooks/use-redeem-voucher.ts` (`UserRejectedRequestError` import dari `viem` + name fallback). Pattern sudah established di codebase, gak perlu research.
- [Affects R23, R27][Technical] Shape `HistoryEntry` normalized type yang nampung redemption v1 dan transactions v2 tanpa breaking change. Diskusikan shape schema di planning.
- [Affects R31, R32][Technical] Server-component conversion strategy untuk page-level files yang saat ini `"use client"`: extract interactive bagian ke child component (`MerchantListInteractive`, `VoucherDetailInteractive`, dll), prefetch data di server. Detail di planning.
- [Affects R33][Needs research] OG image fallback asset yang sudah ada di `/public/` atau perlu generate baru.
- [Affects all UI][Technical] shadcn/ui setup: install via CLI, mapping CSS variables existing (Material-style `--color-on-surface`, dll) ke shadcn pattern (`--foreground`, `--background`), strategi koeksistensi atau full migration. Worth threshold-discussion di planning.

## Next Steps

→ `/ce:plan` untuk implementation planning. Plan harus address Deferred questions di atas + decompose implementation order:

1. shadcn introduction + design token mapping (foundation untuk semua UI)
2. Auth pattern overhaul — drop AuthGuard, build `useRequireAuth`, dual header
3. Routes cleanup — drop `/auth/login`, `/wallet`, `/onboarding/deposit`, `/history`
4. Profile page scaffold — single page dengan section placeholders
5. Profile balance card + DepositModal (port dari `WalletDepositPanel`)
6. Profile WithdrawModal + WithdrawForm + `useWithdraw`
7. Profile tx history v1 (redemption-only, normalized shape future-ready)
8. Voucher detail dual-state redeem button + chain handling fix
9. Welcome sheet + home deposit CTA (true new-user trigger logic)
10. SEO metadata + SSR shell conversion + sitemap/robots
11. Aesthetic polish (post-functional)
