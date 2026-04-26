---
title: "feat: UI Overhaul — Match Reference Design System"
type: feat
status: active
date: 2026-04-26
origin: docs/brainstorms/2026-04-26-ui-overhaul-brainstorm.md
---

# feat: UI Overhaul — Match Reference Design System

## Overview

Complete UI refresh of the Wealth Redemption app to match the reference design system in `ui_kits/redemption_app/`. This is a **UI-only** overhaul — zero changes to hooks, stores, API client, providers, schemas, or any business logic. All work is confined to:

- `src/app/globals.css` — design token replacement
- `src/components/**/*.tsx` — component styling/markup changes
- `src/app/**/page.tsx` — page layout/styling changes
- New component files in `src/components/` — purely presentational

(see brainstorm: `docs/brainstorms/2026-04-26-ui-overhaul-brainstorm.md`)

## Problem Statement / Motivation

The current app uses a "Digital Concierge" cream/pink palette (`#fff8f7`, `#fef0f0`, `#f9e8e8` surfaces) that feels less professional for a financial/wallet application. The reference design provides a cleaner neutral gray/sand aesthetic with more polished component patterns (hover effects, shadows, typography scale). Several UI components are also missing from the current implementation (onboarding flow, category filters, action chips).

## Proposed Solution

A phased UI overhaul in **6 phases**, each independently committable and verifiable:

1. **Phase 1**: Design System Foundation (tokens in `globals.css`)
2. **Phase 2**: Layout & Navigation (Sidebar, BottomNav, MobileHeader)
3. **Phase 3**: Shared & New Components (CategoryTile, StockProgressBar, FilterTabs, ActionChips)
4. **Phase 4**: Feature Components (BalanceCard, VoucherCard, MerchantCard, etc.)
5. **Phase 5**: Screen Pages (all 8 screens)
6. **Phase 6**: Polish & QA (error pages, responsive edge cases, visual verification)

## Resolved Design Decisions

These decisions were surfaced by SpecFlow analysis and resolved based on the brainstorm constraint of "UI only, no backend/logic changes":

| #   | Question                                 | Decision                                                                          | Rationale                                                              |
| --- | ---------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Q1  | Home 3 voucher sections need more data   | Change `limit: 6` to `limit: 20` in page component, filter client-side            | Modifying a prop value in the page TSX is allowed; no hook/API changes |
| Q2  | Onboarding: route vs. modal overlay      | Keep route-based `/onboarding/deposit`, restyle to match bottom-sheet visual      | Converting to modal requires state logic changes (out of scope)        |
| Q3  | `global-error.tsx` uses inline styles    | Update hardcoded color values to match new palette                                | File renders outside root layout, so tokens don't apply                |
| Q4  | Missing color tokens in current `@theme` | Define ALL referenced tokens in new `@theme` block                                | Full token audit included in Phase 1                                   |
| Q5  | Border radius values                     | `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-xl: 24px` | Match UI kit pixel values                                              |
| Q6  | Login page structural change             | Full restructure: split two-column + 6-box OTP                                    | Allowed under "page TSX modification"                                  |
| Q7  | CategoryTile color derivation            | Deterministic hash of `merchant.name` → curated pastel palette                    | No schema/API changes needed                                           |
| Q8  | BottomNav missing icons                  | Reuse Sidebar's `iconMap` SVG paths                                               | Quick win, fixes existing deficiency                                   |
| Q9  | MobileHeader avatar → network indicator  | Replace with chain name + green dot                                               | Matches UI kit reference                                               |
| Q10 | BaseScan hardcoded URL                   | Out of scope — file separate issue                                                | Logic fix, not UI                                                      |
| Q11 | VoucherCard CTA text                     | Use "Tukar" pill-button style from UI kit                                         | Visual change only                                                     |
| Q12 | Home greeting name                       | Use email prefix (before @)                                                       | Available from Privy auth, no new data needed                          |
| Q13 | `error.tsx` styling                      | Include in Phase 6 polish                                                         | Low risk, quick update                                                 |
| Q14 | Login Terms & Privacy                    | Add as static text links (href="#")                                               | Visual only, legal review separate                                     |
| Q15 | Quick Action "QR Saya" target            | Link to `/history`                                                                | No index `/qr` route exists                                            |

## Technical Approach

### Architecture

No architectural changes. The Tailwind CSS v4 `@theme` system remains the single source of truth for design tokens. All styling continues to use utility classes in JSX — no `@apply`, no CSS modules, no style objects (except `global-error.tsx`).

**Files never touched by this plan:**

- `src/hooks/**` — no hook changes
- `src/stores/**` — no store changes
- `src/lib/api/**` — no API changes
- `src/lib/schemas/**` — no schema changes
- `src/providers.tsx` — no provider changes
- `src/lib/wagmi.ts` — no chain config changes
- `src/lib/env.ts` — no env changes
- `vitest.config.ts` — no test config changes

### Implementation Phases

---

#### Phase 1: Design System Foundation

**Goal**: Replace all design tokens in `globals.css` so every existing component automatically inherits the new palette.

**Files modified:**

- `src/app/globals.css`

##### Tasks

- [x] **1.1** Audit all color tokens referenced in TSX files
  - Grep for `bg-`, `text-`, `border-`, `from-`, `to-` classes that reference custom tokens
  - Ensure every referenced token will be defined in the new `@theme`
  - **File**: `src/app/globals.css`

- [x] **1.2** Replace surface/background color tokens
  - `--color-surface`: `#fff8f7` → `#fafaf9`
  - `--color-surface-container-lowest`: → `#ffffff`
  - `--color-surface-container-low`: → `#f5f5f4`
  - `--color-surface-container`: → `#ececec`
  - `--color-surface-container-high`: → `#e5e5e5`
  - `--color-surface-container-highest`: → `#dcdcdc`
  - `--color-background`: → `#fafaf9`
  - **File**: `src/app/globals.css`

- [x] **1.3** Replace text/on-surface color tokens
  - `--color-on-surface`: → `#171717`
  - `--color-on-surface-variant`: → `#525252`
  - `--color-outline`: → `#737373`
  - `--color-outline-variant`: → `#a3a3a3`
  - **File**: `src/app/globals.css`

- [x] **1.4** Add missing semantic tokens
  - `--color-error-container`: `#fee2e2`
  - `--color-on-error-container`: `#b91c1c`
  - `--color-tertiary-container`: `#fef3c7` (warning/pending)
  - `--color-on-tertiary-container`: `#854d0e`
  - `--color-primary-container`: `#2de19d` (already exists, verify)
  - `--color-on-primary-container`: `#003a26`
  - `--color-success-container`: `#dcfce7`
  - `--color-on-success-container`: `#15803d`
  - **File**: `src/app/globals.css`

- [x] **1.5** Update border/input tokens
  - `--color-border`: → `#ececec`
  - `--color-input`: → `#ececec`
  - `--color-ring`: → `#006c48`
  - **File**: `src/app/globals.css`

- [x] **1.6** Update shadow definitions
  - `--shadow-ambient`: → `0 1px 2px rgba(16,16,16,.04), 0 12px 32px -12px rgba(0,108,72,.35)`
  - `--shadow-ambient-lg`: → `0 8px 24px -8px rgba(16,16,16,.12)`
  - `--shadow-elevated`: → `0 30px 80px -20px rgba(23,23,23,.20)`
  - Add `--shadow-modal`: `0 20px 60px rgba(23,23,23,.25)`
  - **File**: `src/app/globals.css`

- [x] **1.7** Update border radius scale
  - Add `--radius-sm`: `8px` (new)
  - `--radius-md`: `1rem` → `12px`
  - `--radius-lg`: `2rem` → `16px`
  - `--radius-xl`: `3rem` → `24px`
  - **File**: `src/app/globals.css`

- [x] **1.8** Update shadcn-compatible color mappings
  - Update `--color-card`, `--color-muted`, `--color-accent`, `--color-destructive` to align with new palette
  - Note: shadcn/ui is not installed, but these tokens are already defined — update them for consistency, do not add new ones
  - **File**: `src/app/globals.css`

##### Phase 1 Verification

- [ ] Run `npm run build` — no Tailwind compilation errors
- [ ] Open app in browser — all existing pages render with new colors (automatic cascade)
- [ ] Verify no broken/invisible text (contrast check)
- [ ] Verify no missing backgrounds (tokens that were removed but still referenced)

---

#### Phase 2: Layout & Navigation

**Goal**: Update the app shell — Sidebar, BottomNav, MobileHeader — to match the reference design.

**Files modified:**

- `src/components/layout/sidebar.tsx`
- `src/components/layout/bottom-nav.tsx`
- `src/components/layout/mobile-header.tsx`
- `src/app/(main)/layout.tsx`

##### Tasks

- [ ] **2.1** Restyle Sidebar
  - Width: 256px → 248px
  - Add active indicator: 6px green dot on right edge
  - Active state: `bg-[#e8f5ee]` background, `text-primary` text, `font-bold`
  - Hover (inactive): `bg-[#f6f6f6]`
  - Add network status at bottom: chain name + green dot
  - **File**: `src/components/layout/sidebar.tsx`

- [ ] **2.2** Add icons to BottomNav
  - Import/reuse `iconMap` SVG paths from Sidebar
  - Stack icon + label vertically per nav item
  - Active text: `text-primary` (#006c48)
  - Inactive text: `text-[#737373]`
  - Update backdrop blur: `backdrop-blur-[16px]`
  - **File**: `src/components/layout/bottom-nav.tsx`

- [ ] **2.3** Restyle MobileHeader
  - Replace empty avatar circle with network status indicator
  - Chain name + green dot (same as Sidebar bottom)
  - Keep logo on left
  - Ensure `sticky top-0` with backdrop blur
  - **File**: `src/components/layout/mobile-header.tsx`

- [ ] **2.4** Adjust main layout spacing
  - Verify padding: `p-4 pb-20 md:p-6 md:pb-6` (should remain the same)
  - Confirm Sidebar width change doesn't break flex layout
  - **File**: `src/app/(main)/layout.tsx`

##### Phase 2 Verification

- [ ] Desktop: Sidebar visible at 248px, active state with green dot, network status at bottom
- [ ] Mobile: BottomNav with icons + labels, MobileHeader with network indicator
- [ ] Navigation between all 5 routes highlights correct nav item
- [ ] Sub-routes (e.g., `/merchants/[id]`) highlight parent nav item

---

#### Phase 3: Shared & New Components

**Goal**: Build new presentational components and update shared components.

**Files created:**

- `src/components/shared/category-tile.tsx` (new)
- `src/components/shared/stock-progress-bar.tsx` (new)
- `src/components/shared/category-filter-tabs.tsx` (new)
- `src/components/shared/quick-action-chips.tsx` (new)

**Files modified:**

- `src/components/shared/modal.tsx`
- `src/components/shared/copyable-address.tsx`

##### Tasks

- [ ] **3.1** Create `CategoryTile` component
  - 56×56px square, rounded `--radius-sm` (8px)
  - Pastel background color derived from `merchant.name` hash
  - Display font, weight 800, merchant initial letter
  - Color palette: array of 8-10 curated pastels (mint, pink, yellow, lavender, etc.)
  - Hash function: simple char-code sum modulo palette length
  - Props: `{ name: string; size?: number }`
  - **File**: `src/components/shared/category-tile.tsx`

```tsx
// Curated pastel palette (from UI kit fixtures)
const TILE_COLORS = [
  "#8ee6c8",
  "#fdcfd9",
  "#a7f3d0",
  "#f9ffc4",
  "#c4b5fd",
  "#fde68a",
  "#bae6fd",
  "#fecaca",
];

interface CategoryTileProps {
  name: string;
  size?: number; // default 56
}

export function CategoryTile({ name, size = 56 }: CategoryTileProps) {
  const colorIndex =
    name.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) %
    TILE_COLORS.length;
  const initial = name.charAt(0).toUpperCase();
  // renders colored square with initial
}
```

- [ ] **3.2** Create `StockProgressBar` component
  - Full-width bar, height 6px, rounded-full
  - Background: `#ececec`
  - Fill: green (`#15803d`) if stock > 20%, red (`#b91c1c`) if ≤ 20%
  - Width: `(remaining / total) * 100%`
  - Props: `{ remaining: number; total: number }`
  - **File**: `src/components/shared/stock-progress-bar.tsx`

- [ ] **3.3** Create `CategoryFilterTabs` component
  - Horizontal scrollable container with `overflow-x-auto`
  - Pill-shaped buttons: `rounded-full px-4 py-1.5`
  - Active: `bg-primary text-white`
  - Inactive: `bg-white border border-[#ececec] text-[#525252]`
  - "Semua" always first
  - Props: `{ categories: string[]; active: string; onSelect: (cat: string) => void }`
  - **File**: `src/components/shared/category-filter-tabs.tsx`

- [ ] **3.4** Create `QuickActionChips` component
  - Grid of 4 chips in a row: `grid grid-cols-4 gap-3`
  - Each chip: inline SVG icon + label, rounded `--radius-lg` (16px), border `#ececec`, hover lift
  - Icons: simple inline SVGs (compass for Jelajah, wallet for Deposit, clock for Riwayat, qr-code for QR Saya) — reference `ui_kits/redemption_app/Icons.jsx` for SVG paths
  - Items: Jelajah → `/merchants`, Deposit → `/wallet`, Riwayat → `/history`, QR Saya → `/history`
  - Uses Next.js `<Link>`
  - Props: none (static navigation component)
  - **File**: `src/components/shared/quick-action-chips.tsx`

- [ ] **3.5** Restyle `Modal` component
  - Update backdrop: `bg-black/40` → `bg-black/50`
  - Add modal shadow: `shadow-[var(--shadow-modal)]`
  - Update border radius: use `--radius-lg` (16px)
  - Keep existing accessibility (role, aria, Escape key)
  - **File**: `src/components/shared/modal.tsx`

- [ ] **3.6** Restyle `CopyableAddress` component
  - Monospace font: `font-mono`
  - Update text color to `text-[#525252]`
  - Update copy button styling
  - **File**: `src/components/shared/copyable-address.tsx`

##### Phase 3 Verification

- [ ] `CategoryTile` renders with deterministic colors — same name always gets same color
- [ ] `StockProgressBar` shows correct width ratio, red under 20%
- [ ] `CategoryFilterTabs` scrolls horizontally, active pill highlighted
- [ ] `QuickActionChips` renders 4 items, links navigate correctly
- [ ] `Modal` has updated shadow and backdrop
- [ ] All new components work at mobile and desktop widths

---

#### Phase 4: Feature Components

**Goal**: Restyle all feature components to match the reference design.

**Files modified:**

- `src/components/features/balance-card.tsx`
- `src/components/features/voucher-card.tsx`
- `src/components/features/merchant-card.tsx`
- `src/components/features/redemption-card.tsx`
- `src/components/features/redemption-status-banner.tsx`
- `src/components/features/transaction-info.tsx`
- `src/components/features/wallet-deposit-panel.tsx`
- `src/components/features/qr-display.tsx`
- `src/components/features/signing-state-ui.tsx`

##### Tasks

- [ ] **4.1** Restyle `BalanceCard`
  - Gradient: `linear-gradient(140deg, #003a26 0%, #006c48 60%, #2de19d 130%)`
  - Add decorative blob circles (CSS pseudo-elements or absolute-positioned divs)
  - Balance text: 40px, weight 700, white, letter-spacing -0.02em
  - IDR equivalent: smaller text, white/80 opacity
  - Rounded: `--radius-lg` (16px)
  - Shadow: `--shadow-ambient`
  - Two sizes: compact (18px padding) and full (24px padding) — use prop
  - **File**: `src/components/features/balance-card.tsx`

- [ ] **4.2** Restyle `VoucherCard`
  - White bg, border `#ececec`, rounded 16px, padding 14px
  - Add `CategoryTile` (import from shared) for merchant visual
  - Merchant name: small, secondary color
  - Voucher title: bold, primary text
  - Add `StockProgressBar` (import from shared)
  - Stock text: "Tersisa X" or "Terbatas" if low
  - Price display: `formatWealth()` value
  - CTA pill: green "Tukar" if active, gray "Habis" if out of stock
  - Hover: `translateY(-1px)` + shadow lift, border darken
  - **File**: `src/components/features/voucher-card.tsx`

- [ ] **4.3** Restyle `MerchantCard`
  - Add `CategoryTile` for merchant visual
  - Keep existing `logoUrl` fallback: show `<img>` if `logoUrl` exists, `CategoryTile` otherwise
  - Name: bold, primary text
  - Category: secondary text
  - Hover: lift effect
  - Rounded: 16px, border `#ececec`
  - **File**: `src/components/features/merchant-card.tsx`

- [ ] **4.4** Restyle `RedemptionCard`
  - Merchant tile: 44×44px (use `CategoryTile` at smaller size)
  - Status pill: `rounded-full px-2 py-0.5 text-[10px] font-bold`
    - Confirmed: `bg-[#dcfce7] text-[#15803d]`
    - Pending: `bg-[#fef3c7] text-[#854d0e]`
    - Failed: `bg-[#fee2e2] text-[#b91c1c]`
  - Date + wealth amount on right
  - White bg, border, rounded 16px
  - **File**: `src/components/features/redemption-card.tsx`

- [ ] **4.5** Restyle `RedemptionStatusBanner`
  - Update status colors to match new tokens
  - Use semantic token classes: `bg-success-container`, `bg-tertiary-container`, `bg-error-container`
  - **File**: `src/components/features/redemption-status-banner.tsx`

- [ ] **4.6** Restyle `TransactionInfo`
  - Update text colors, borders, spacing
  - Monospace font for addresses/hashes
  - Keep existing logic unchanged
  - **File**: `src/components/features/transaction-info.tsx`

- [ ] **4.7** Restyle `WalletDepositPanel`
  - 3-step deposit guide with numbered circles (1, 2, 3)
  - Numbered circles: 24px, `bg-primary text-white rounded-full`
  - Copyable address rows with updated styling
  - Network info card with chain details
  - **File**: `src/components/features/wallet-deposit-panel.tsx`

- [ ] **4.8** Restyle `QrDisplay`
  - QR code container: white bg, shadow, centered
  - QR indicator text: "QR 1 dari N"
  - Carousel dots if multiple QRs (BOGO)
  - Transaction hash in monospace with copy button
  - **File**: `src/components/features/qr-display.tsx`

- [ ] **4.9** Restyle `SigningStateUI`
  - Modal overlay with updated backdrop
  - Spinner styling update
  - Step indicator text
  - Error state with retry button
  - Use `--shadow-modal` for the modal card
  - **File**: `src/components/features/signing-state-ui.tsx`

##### Phase 4 Verification

- [ ] All cards render correctly with new styles (no broken layouts)
- [ ] Status pills show correct colors for each state
- [ ] Hover effects work on VoucherCard and MerchantCard
- [ ] BalanceCard gradient renders correctly
- [ ] StockProgressBar shows in VoucherCard
- [ ] CategoryTile shows in VoucherCard and MerchantCard
- [ ] All components responsive at mobile and desktop widths

---

#### Phase 5: Screen Pages

**Goal**: Update all 8 screen pages to match reference layouts.

**Files modified:**

- `src/app/auth/login/page.tsx`
- `src/app/(main)/page.tsx`
- `src/app/(main)/merchants/page.tsx`
- `src/app/(main)/merchants/[id]/page.tsx`
- `src/app/(main)/vouchers/[id]/page.tsx`
- `src/app/(main)/qr/[redemptionId]/page.tsx`
- `src/app/(main)/history/page.tsx`
- `src/app/(main)/wallet/page.tsx`
- `src/app/(main)/profile/page.tsx`
- `src/app/(main)/onboarding/deposit/page.tsx`

##### Tasks

- [ ] **5.1** Restructure Login page
  - Two-column split layout: brand panel (left) + form panel (right)
  - Brand panel: gradient background `#003a26` → `#006c48`, logo, tagline, hidden on mobile
  - Form panel: white background, centered form
  - Replace single OTP `<input>` with 6-box OTP input (6 individual inputs, auto-advance)
  - Add resend countdown timer (UI only — "Kirim ulang dalam Xs")
  - Add Terms & Privacy static text
  - Responsive: single column below `md:`, two columns at `md:` and above
  - **File**: `src/app/auth/login/page.tsx`

- [ ] **5.2** Update Home page
  - Add greeting: "Halo, {emailPrefix}" using email from Privy auth context
  - BalanceCard at top (full variant)
  - Add `QuickActionChips` below balance
  - Change `limit: 6` → `limit: 20` in page component's voucher query param
  - Split vouchers into 3 sections:
    - "Voucher Populer" — first 6 vouchers
    - "Stok Terbatas" — filter by `remainingStock / totalStock < 0.3`, max 6
    - "Untuk Kamu" — remaining vouchers, max 6
  - Each section: heading + "Lihat semua" link + responsive grid
  - Grid: `grid-cols-1 md:grid-cols-3` with `gap-4`
  - **File**: `src/app/(main)/page.tsx`

- [ ] **5.3** Update Merchants page
  - Title + merchant count stats
  - Replace inline `CategoryChip` with imported `CategoryFilterTabs`
  - Merchant grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
  - **File**: `src/app/(main)/merchants/page.tsx`

- [ ] **5.4** Update Merchant Detail page
  - Merchant header with `CategoryTile` + name + category
  - Voucher grid below: `grid-cols-1 md:grid-cols-2` with `gap-4`
  - **File**: `src/app/(main)/merchants/[id]/page.tsx`

- [ ] **5.5** Update Voucher Detail page
  - Back button at top
  - Merchant tile + voucher title + BOGO badge (if applicable)
  - Description text section
  - Info card:
    - Price display (large, display font)
    - `StockProgressBar` with remaining count
    - Fee breakdown: base price, service fee, gas fee (from existing data)
    - Total price
    - Expiry date
  - Primary CTA button: "Tukar X $WEALTH" or disabled state
  - Max width: `max-w-2xl` centered
  - **File**: `src/app/(main)/vouchers/[id]/page.tsx`

- [ ] **5.6** Update QR page
  - Back button
  - Merchant header (small)
  - `RedemptionStatusBanner` at top
  - QR code display centered
  - QR indicator: "QR 1 dari N" with carousel dots (if BOGO)
  - Transaction hash in monospace, copyable
  - Link to history
  - **File**: `src/app/(main)/qr/[redemptionId]/page.tsx`

- [ ] **5.7** Update History page
  - Title
  - Status filter using `CategoryFilterTabs` variant: ["Semua", "Menunggu", "Berhasil", "Gagal"]
  - `RedemptionCard` list
  - Empty state for each filter
  - **File**: `src/app/(main)/history/page.tsx`

- [ ] **5.8** Update Wallet page
  - BalanceCard at top (compact variant)
  - `WalletDepositPanel` with 3-step guide
  - Recent transactions list with updated `TransactionInfo`
  - **File**: `src/app/(main)/wallet/page.tsx`

- [ ] **5.9** Update Profile page
  - Title
  - Email display row
  - Wallet address with `CopyableAddress`
  - Logout button: red text, `border-error`, `rounded-[--radius-md]`
  - **File**: `src/app/(main)/profile/page.tsx`

- [ ] **5.10** Restyle Onboarding Deposit page
  - Match bottom-sheet visual style (rounded top corners, shadow)
  - Keep as a full-page route (not modal overlay)
  - Content: wallet address, deposit instructions, CTA buttons
  - **File**: `src/app/(main)/onboarding/deposit/page.tsx`

##### Phase 5 Verification

- [ ] Login: two-column on desktop, single column on mobile, OTP 6-box works
- [ ] Home: greeting shows, 3 voucher sections populated, quick actions link correctly
- [ ] Merchants: filter tabs work, grid responsive
- [ ] Voucher Detail: info card shows all pricing, stock bar, CTA states
- [ ] QR: banner colors match status, QR centered, hash copyable
- [ ] History: filter tabs filter correctly, cards clickable
- [ ] Wallet: deposit guide numbered, addresses copyable
- [ ] Profile: logout button visible, address copyable
- [ ] All pages: loading skeleton, error with retry, empty state all render

---

#### Phase 6: Polish & QA

**Goal**: Fix edge cases, update error pages, verify responsive behavior across all screens.

**Files modified:**

- `src/app/global-error.tsx`
- `src/app/error.tsx`
- `src/components/layout/offline-banner.tsx`

##### Tasks

- [ ] **6.1** Update `global-error.tsx` inline styles
  - Replace hardcoded colors: `#fff` → `#fafaf9`, `#111` → `#171717`, `#555` → `#525252`
  - This file renders outside root layout, so must use inline styles
  - **File**: `src/app/global-error.tsx`

- [ ] **6.2** Update `error.tsx` styling
  - Use new token classes for error container
  - Update button styling
  - **File**: `src/app/error.tsx`

- [ ] **6.3** Update `OfflineBanner` styling
  - Update colors and positioning
  - Ensure correct z-index above bottom nav on mobile
  - **File**: `src/components/layout/offline-banner.tsx`

- [ ] **6.4** Fix Sidebar/BottomNav active state for sub-routes
  - Update pathname matching: use `pathname.startsWith(item.href)` for items with sub-routes
  - Ensure `/merchants/[id]` highlights "Merchant" nav item
  - Ensure `/vouchers/[id]` highlights "Beranda" nav item (or no highlight)
  - **File**: `src/components/layout/sidebar.tsx`, `src/components/layout/bottom-nav.tsx`

- [ ] **6.5** Responsive audit — mobile (375px, 414px)
  - All pages: no horizontal overflow
  - Bottom nav not overlapping content
  - Cards single-column on small screens
  - Login: single column, no brand panel
  - Voucher detail: info card readable
  - QR: QR code sized appropriately (min 200px)

- [ ] **6.6** Responsive audit — desktop (1024px, 1440px, 1920px)
  - Sidebar fixed, content scrolls independently
  - Grid columns expand correctly
  - Max-width constraints prevent ultra-wide content stretch
  - Home page sections don't look too sparse at wide viewports

- [ ] **6.7** State combination visual audit
  - Loading skeletons: all pages show pulse animation with new colors
  - Error states: all pages show error container with retry button
  - Empty states: all list pages show appropriate message
  - Status variants: pending/confirmed/failed render correct pill colors

##### Phase 6 Verification

- [ ] `global-error.tsx` colors match new palette (test by throwing in root layout)
- [ ] `error.tsx` renders with new styling
- [ ] Offline banner visible when network disconnected
- [ ] No horizontal scroll on any page at 375px width
- [ ] No excessive whitespace on any page at 1920px width
- [ ] All loading/error/empty states visually consistent

---

## System-Wide Impact

### Interaction Graph

- **No callbacks, middleware, or observers are affected.** All changes are to JSX markup and CSS tokens.
- The `AuthGuard` redirect logic is untouched.
- The Privy/Wagmi/React Query provider tree is untouched.
- The only "interaction" is the CSS cascade: changing a token in `globals.css` affects every component that references it.

### Error & Failure Propagation

- **No error handling changes.** All `try/catch`, error boundaries, and retry logic remain as-is.
- The only risk is visual: a missing or misnamed token could render invisible text or missing backgrounds. Phase 1 verification catches this.

### State Lifecycle Risks

- **No state changes.** No Zustand store modifications, no React Query cache changes, no localStorage changes (except potentially the onboarding dismissed key if Phase 5.10 touches it — but it won't).

### API Surface Parity

- **No API surface changes.** No new endpoints, no schema changes, no hook modifications.

### Integration Test Scenarios

Since this is UI-only with no DOM test infrastructure:

1. **Visual regression**: Side-by-side comparison of each screen before/after at mobile and desktop widths
2. **Token cascade**: After Phase 1, verify that every page renders without missing colors
3. **Navigation flow**: Click through the full redemption flow (Home → Merchants → Voucher → Redeem → QR → History) to verify no broken layouts
4. **State rendering**: Verify loading, error, and empty states on each page
5. **Responsive breakpoints**: Resize browser from 375px to 1920px and verify layout transitions

## Acceptance Criteria

### Functional Requirements

- [ ] All 8 screens match the reference design in `ui_kits/redemption_app/`
- [ ] Mobile layout (< 768px): MobileHeader + BottomNav with icons, single/dual column grids
- [ ] Desktop layout (≥ 768px): Sidebar (248px) with active indicators, multi-column grids
- [ ] Login: two-column split on desktop, 6-box OTP input
- [ ] Home: greeting, balance card, quick action chips, 3 voucher sections
- [ ] All status pills (pending/confirmed/failed) show correct colors
- [ ] CategoryTile renders with deterministic colors
- [ ] StockProgressBar shows in voucher cards and detail page

### Non-Functional Requirements

- [ ] No changes to any file in `src/hooks/`, `src/stores/`, `src/lib/api/`, `src/lib/schemas/`, `src/providers.tsx`
- [ ] Existing Vitest tests pass without modification (`npm run test:ci`)
- [ ] `npm run build` succeeds without errors
- [ ] No new dependencies added (all components built with Tailwind utilities)
- [ ] Text contrast meets WCAG AA (4.5:1 for body text, 3:1 for large text)

### Quality Gates

- [ ] Each phase produces a working, committable state
- [ ] `npm run build` passes after each phase
- [ ] Manual visual verification at 375px and 1440px after each phase
- [ ] Existing tests pass after each phase

## Dependencies & Risks

| Risk                                       | Likelihood | Impact | Mitigation                                                    |
| ------------------------------------------ | ---------- | ------ | ------------------------------------------------------------- |
| Token rename breaks a component            | Medium     | Low    | Phase 1 audit + grep for all token references                 |
| Login restructure breaks auth flow         | Medium     | High   | Test full login flow (email → OTP → redirect) after Phase 5.1 |
| 6-box OTP input has accessibility issues   | Low        | Medium | Test with keyboard navigation, screen reader                  |
| Home page 3 sections show too few vouchers | Low        | Low    | Graceful fallback: hide section if empty                      |
| Radius changes make existing UI look wrong | Medium     | Low    | Phase 1 applies globally, verify in Phase 1 verification      |

## Success Metrics

- All screens visually match the `ui_kits/redemption_app/` reference (verified by side-by-side comparison)
- Zero regressions in existing functionality (verified by passing test suite)
- Responsive behavior works from 375px to 1920px
- Each phase is independently deployable

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-04-26-ui-overhaul-brainstorm.md](docs/brainstorms/2026-04-26-ui-overhaul-brainstorm.md) — Key decisions carried forward: full color palette replacement, all 8 screens in scope, add new components, full-width responsive layout

### Internal References

- Reference design kit: `ui_kits/redemption_app/` (all JSX + HTML prototype)
- Current design tokens: `src/app/globals.css`
- Main layout: `src/app/(main)/layout.tsx`
- Component directory: `src/components/`

### Related Work

- Existing thin-client rework plan: `docs/plans/2026-04-17-001-refactor-app-thin-client-rework-plan.md`
