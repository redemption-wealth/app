# WEALTH Redemption App

User-facing web application for the WEALTH Token Redemption platform. End users log in, browse merchant vouchers, and redeem them by sending `$WEALTH` tokens from their embedded wallet.

## Project Brief

**Domain**: `redeem.wealthcrypto.fund`

This app serves exclusively **end users** (crypto wallet holders). Users authenticate via email OTP through Privy, which automatically creates an MPC embedded wallet. They browse merchant vouchers priced in IDR, converted to `$WEALTH` at runtime, and redeem by signing an ERC-20 transfer from their embedded wallet to the platform treasury. After on-chain confirmation via Alchemy webhook, a QR code voucher is issued.

### Core User Flows

1. **Login** — Email OTP via Privy (no password, no social login)
2. **Browse** — View merchants by category, explore vouchers
3. **Redeem** — Select voucher → sign token transfer via wagmi → receive QR code
4. **History** — View past redemptions with status tracking
5. **Wallet** — Check $WEALTH balance, transaction history

## Design Principles

1. **"The Digital Concierge"** — Premium, editorial-inspired experience. Feels like a luxury lifestyle magazine, not a clinical crypto dashboard.
2. **No Borders** — Define boundaries through background color shifts, not 1px solid lines. Surfaces layer like premium materials.
3. **Mobile-First** — Bottom nav on mobile, sidebar on desktop. `pb-20` compensates for fixed bottom nav.
4. **Dual Currency** — Prices stored in IDR, converted to $WEALTH at runtime using live price feed.
5. **String Token Amounts** — All `$WEALTH` amounts use string representation to preserve Decimal(36,18) ERC-20 precision.
6. **Client-Side Signing** — Users sign transactions via Privy embedded wallet + wagmi. Server never holds private keys.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Privy (email OTP, embedded wallet) |
| Blockchain | wagmi + viem (ERC-20 transfer) |
| Data Fetching | @tanstack/react-query |
| State | Zustand |
| Database | Prisma + PostgreSQL (Supabase) |
| Package Manager | pnpm |

## Architecture

```
src/
├── app/
│   ├── (main)/              # Authenticated user pages
│   │   ├── page.tsx          # Home: balance card, featured vouchers
│   │   ├── merchants/        # Merchant listing & detail
│   │   ├── vouchers/[id]/    # Voucher detail + redeem
│   │   ├── qr/[redemptionId] # QR display after redemption
│   │   ├── wallet/           # Balance & transaction history
│   │   ├── history/          # Redemption history
│   │   └── profile/          # Account info
│   ├── auth/login/           # Email OTP login
│   └── api/                  # API routes
│       ├── auth/user-sync    # Sync Privy user to DB
│       ├── merchants/        # Read-only merchant data
│       ├── vouchers/         # Read-only voucher data + redeem
│       ├── redemptions/      # User's redemptions
│       ├── transactions/     # User's transactions
│       ├── price/wealth      # $WEALTH/IDR price feed
│       └── webhook/alchemy   # On-chain tx confirmation
├── components/
│   ├── layout/               # Sidebar, BottomNav, MobileHeader, AuthGuard
│   └── shared/               # Reusable UI components
├── hooks/
│   ├── use-auth.ts           # Privy auth wrapper
│   ├── use-wealth-balance.ts # ERC-20 balance via wagmi
│   └── use-send-wealth.ts    # ERC-20 transfer via wagmi
├── lib/
│   ├── auth/                 # Privy server verification
│   ├── services/             # Redemption business logic
│   ├── db.ts                 # Prisma singleton
│   ├── utils.ts              # Format helpers
│   └── wagmi.ts              # Wagmi config + ERC-20 ABI
├── types/                    # TypeScript interfaces
├── providers.tsx             # Privy + QueryClient + Wagmi providers
└── middleware.ts             # Route middleware
```

## Environment Variables

```bash
# Copy .env.example to .env.local
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID |
| `PRIVY_APP_SECRET` | Privy server secret |
| `NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS` | $WEALTH ERC-20 contract |
| `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS` | Platform treasury address |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Alchemy API key (Base network) |
| `ALCHEMY_WEBHOOK_SIGNING_KEY` | Alchemy webhook signature key |
| `NEXT_PUBLIC_APP_URL` | App URL (default: http://localhost:3000) |

## Development

```bash
pnpm install
pnpm prisma generate
pnpm dev              # Start dev server on port 3000
```

## Database

Both `app` and `back-office` share the same PostgreSQL database. Migrations are managed from the `back-office` project.

```bash
pnpm prisma studio    # Browse database
```
