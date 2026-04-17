# WEALTH Redemption App

User-facing web application for the WEALTH Token Redemption platform. End users log in, browse merchant vouchers, and redeem them by sending `$WEALTH` tokens from their embedded wallet.

## Project Brief

**Domain**: `redeem.wealthcrypto.fund`

This app serves exclusively **end users** (crypto wallet holders). Users authenticate via email OTP through Privy, which automatically creates an MPC embedded wallet. They browse merchant vouchers priced in IDR, converted to `$WEALTH` at runtime, and redeem by signing an ERC-20 transfer from their embedded wallet to the platform treasury. After on-chain confirmation, a QR code voucher is issued.

### Core User Flows

1. **Login** — Email OTP via Privy (no password, no social login)
2. **Browse** — View merchants by category, explore vouchers
3. **Redeem** — Select voucher → sign token transfer via wagmi → receive QR code
4. **History** — View past redemptions with status tracking
5. **Wallet** — Check $WEALTH balance, transaction history

## Architecture

This app is a **thin client**. All data reads and writes go through the Hono backend (`wealth-redemption/backend`) at `NEXT_PUBLIC_API_BASE_URL`. The app holds no database connection, no Prisma, no server-side services, and no custody of secrets. The only on-chain action the app performs is the ERC-20 `transfer` signed by the user's embedded wallet during redemption.

```
[User Browser]                           [Backend]                          [On-chain]
  Next.js App  ─── REST (Hono) ──▶   Hono + Prisma + PG  ◀── Alchemy ──▶   Base Mainnet
       │                                    │                                   │
       │  wagmi + viem (ERC-20 transfer)    │                                   │
       └────────────────────────────────────┼───────────────────────────────────┘
                                            │
                                    Webhook confirms tx
```

- **Auth**: Privy email OTP → embedded MPC wallet. `privy:token` in cookies is used as a bearer token to call the backend.
- **Writes**: `POST /vouchers/:id/redeem` → user signs → `POST /redemptions/:id/submit-tx` → adaptive polling on `/redemptions/:id`.
- **Migrations**: The backend owns the Prisma schema and migrations. This app never runs migrations.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Privy v3 (email OTP, embedded wallet) |
| Blockchain | wagmi v3 + viem (ERC-20 transfer on Base) |
| Data Fetching | @tanstack/react-query v5 |
| Flow State | Zustand (redemption flow state machine) |
| Package Manager | pnpm |

## Directory Layout

```
src/
├── app/
│   ├── (main)/              # Authenticated user pages
│   │   ├── page.tsx           # Home: balance + featured vouchers
│   │   ├── merchants/         # Merchant listing & detail
│   │   ├── vouchers/[id]/     # Voucher detail + redeem CTA
│   │   ├── qr/[redemptionId]  # Redemption polling + QR display
│   │   ├── wallet/            # Balance + deposit panel + tx list
│   │   ├── history/           # Redemption history
│   │   ├── profile/           # Account info + logout
│   │   └── onboarding/deposit # First-time deposit guide
│   └── auth/login/            # Email OTP login
├── components/
│   ├── features/              # Domain components (voucher-card, qr-display, ...)
│   ├── layout/                # Sidebar, BottomNav, MobileHeader, AuthGuard, OfflineBanner
│   └── shared/                # Generic UI primitives (modal, copyable-address)
├── hooks/                     # React-query wrappers over endpoints.* + wallet hooks
├── lib/
│   ├── api/                   # client.ts (fetch), endpoints.ts (typed calls), errors.ts
│   ├── schemas/               # Zod response schemas matching backend contracts
│   ├── auth-errors.ts         # Privy error → Indonesian copy mapping
│   ├── env.ts                 # Zod-validated public env
│   ├── erc20-abi.ts           # Minimal transfer ABI
│   ├── utils.ts               # Format helpers (IDR, WEALTH, date)
│   └── wagmi.ts               # Single-chain Base wagmi config via Privy connector
├── stores/
│   └── redemption-flow.ts     # Zustand state machine (idle → signing → polling → done)
└── providers.tsx              # PrivyProvider + WagmiProvider + QueryClient
```

## Environment Variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | yes | Privy app ID for email OTP + embedded wallets |
| `NEXT_PUBLIC_API_BASE_URL` | yes | Hono backend base URL (e.g. `http://localhost:3001`) |
| `NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS` | yes | `$WEALTH` ERC-20 address on Base mainnet |
| `NEXT_PUBLIC_APP_URL` | yes | Public app URL (used in metadata) |
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | no | Optional custom Base RPC; defaults to the public Base RPC |

The treasury wallet address is returned by the backend in the redeem response (`txDetails.treasuryWalletAddress`) and is intentionally **not** an environment variable — the backend is the authoritative source.

## Development

Start the backend first (see `../backend`), then:

```bash
pnpm install
pnpm dev        # dev server on http://localhost:3000
pnpm lint       # eslint
pnpm build      # production build (Next.js + Turbopack)
```

By default the app expects the backend at `http://localhost:3001`. Override via `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.

## Troubleshooting

- **401 Unauthorized from backend** — Privy session expired. Clear cookies and log back in.
- **CORS errors in the browser** — Backend `CORS_ORIGINS` must include your app origin. Add `http://localhost:3000` in dev, your deployed URL in prod.
- **"Wallet belum siap"** — Privy iframe evicted. The app will attempt recovery via `useWalletHealth`; otherwise log out and back in.
- **Transaction stuck in pending** — After 5 minutes the QR page surfaces a Refresh CTA; after 15 minutes it routes to support with the tx hash.

## Where to look for more

- Backend contracts: `wealth-redemption/backend/src/routes/**`
- Plan + brainstorm: `docs/plans/*`, `docs/brainstorms/*`
