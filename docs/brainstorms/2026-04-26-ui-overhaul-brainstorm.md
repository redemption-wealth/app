---
date: 2026-04-26
topic: ui-overhaul
---

# UI Overhaul — Match Reference Design System

## What We're Building

A complete UI refresh of the Wealth Redemption app to match the reference design system in `ui_kits/redemption_app/`. This is a **UI-only** overhaul — no backend/logic changes. The work covers:

1. Replacing the current color system (cream/pink → neutral gray/sand)
2. Updating all existing screens to match reference visuals
3. Adding missing UI components (onboarding modal, category filter tabs, quick action chips)
4. Ensuring full responsive support (mobile-first with desktop breakpoint)

## Why This Approach

The reference design provides a cleaner, more neutral aesthetic that's better suited for a financial/wallet app. The current cream/pink palette feels less professional. The reference also includes more polished component patterns (hover effects, shadows, typography scale) that will improve the overall UX.

## Key Decisions

- **Color System**: Full replacement with reference palette (#fafaf9 bg, #ffffff cards, #ececec borders, #171717/#525252/#737373 text hierarchy)
- **Scope**: All screens — Login, Home, Merchants, Voucher Detail, QR, History, Wallet, Profile
- **New Components**: Add onboarding bottom-sheet, category filter tabs, quick action chips
- **Desktop Layout**: Full-width responsive (not framed) — standard responsive layout with max-width constraints
- **Backend**: No changes to any logic, hooks, stores, API, or providers
- **Framework**: Continue using Tailwind CSS v4 `@theme` block in `globals.css`

## Design System Changes

### Colors (Reference Palette)

| Token             | Current       | New                    |
| ----------------- | ------------- | ---------------------- |
| Background        | #fff8f7       | #fafaf9                |
| Surface (cards)   | various pinks | #ffffff                |
| Border            | —             | #ececec                |
| Text Primary      | —             | #171717                |
| Text Secondary    | —             | #525252                |
| Text Tertiary     | —             | #737373                |
| Text Disabled     | —             | #a3a3a3                |
| Primary           | #006c48       | #006c48 (same)         |
| Primary Container | #2de19d       | #2de19d (same)         |
| Primary Dark      | —             | #003a26                |
| Secondary         | #b80049       | #b80049 (same)         |
| Success bg        | —             | #dcfce7 / text #15803d |
| Warning bg        | —             | #fef3c7 / text #854d0e |
| Error bg          | —             | #fee2e2 / text #b91c1c |

### Typography Scale

- Display: 40px / 700 / -0.02em (balance hero)
- H1: 24px / 700 / -0.02em
- H2: 22px / 700
- H3: 17px / 700
- H4: 14-16px / 600
- Body Large: 15px / 500-700
- Body: 13-14px / 500
- Caption: 11-12px / 600 / uppercase + tracking
- Micro: 10px / 500

### Shadows

- Subtle: `0 1px 2px rgba(16,16,16,.04), 0 12px 32px -12px rgba(0,108,72,.35)`
- Medium: `0 8px 24px -8px rgba(16,16,16,.12)`
- Large: `0 30px 80px -20px rgba(23,23,23,.20)`
- Modal: `0 20px 60px rgba(23,23,23,.25)`

### Border Radius

- Pill: 9999px (buttons, badges)
- Card: 16px
- Button/Input: 12px
- Small: 8px

## Screens to Update

1. **Login** — Two-column responsive, email → OTP flow
2. **Home** — Greeting, BalanceCard, quick action chips, 3 voucher sections (grid)
3. **Merchants** — Category filter tabs, merchant grid + voucher grid
4. **Voucher Detail** — Back nav, info card with fee breakdown, stock bar
5. **QR** — Success alert, QR carousel with dots, tx hash
6. **History** — Status filter tabs, redemption card list
7. **Wallet** — BalanceCard, 3-step deposit guide, copyable addresses, tx list
8. **Profile** — Email, wallet address, logout

## New Components to Build

1. **Onboarding Bottom Sheet** — 3-slide carousel (Welcome, Deposit, QR Info) with step dots
2. **Category Filter Tabs** — Horizontal scrollable pill-style filters
3. **Quick Action Chips** — 4 icon chips (Jelajah, Deposit, Riwayat, QR Saya)
4. **CategoryTile** — 56×56 colored square with merchant initial letter
5. **Stock Progress Bar** — Colored bar showing stock level (red when low)

## Open Questions

- None — all major decisions made. Ready for planning.

## Next Steps

→ `/ce:plan` for detailed implementation steps
