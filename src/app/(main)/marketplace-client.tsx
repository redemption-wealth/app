"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CategoryChips,
  type CategoryChip,
} from "@/components/features/marketplace/category-chips";
import { FilterCard } from "@/components/features/marketplace/filter-card";
import { FilterSheet } from "@/components/features/marketplace/filter-sheet";
import { MobileControls } from "@/components/features/marketplace/mobile-controls";
import { VoucherGrid } from "@/components/features/marketplace/voucher-grid";
import { DepositModal } from "@/components/features/deposit-modal";
import { HomeDepositCta } from "@/components/features/home-deposit-cta";
import { WelcomeOnboardingSheet } from "@/components/features/welcome-onboarding-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useInfiniteVouchers } from "@/hooks/use-infinite-vouchers";
import { useMerchants } from "@/hooks/use-merchants";
import { usePrice } from "@/hooks/use-price";
import { useRedemptions } from "@/hooks/use-redemptions";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import type { Merchant } from "@/lib/schemas/merchant";
import type { Voucher } from "@/lib/schemas/voucher";
import { isVoucherValid } from "@/lib/utils";
import { shouldShowWelcomeSheet, welcomeFlagKey } from "@/lib/welcome-trigger";
import { useMarketplaceFilter } from "@/stores/marketplace-filter";

const ALL_CATEGORIES: CategoryChip = { id: null, label: "Semua" };

function normalizeCategoryName(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

function voucherWealthPrice(
  voucher: Voucher,
  priceIdr: number | null,
): number | null {
  if (priceIdr === null || priceIdr <= 0) return null;
  const totalIdr = Number(voucher.totalPrice);
  if (!Number.isFinite(totalIdr)) return null;
  return totalIdr / priceIdr;
}

export function MarketplaceInteractive() {
  const filter = useMarketplaceFilter();

  const { authenticated, ready, user, walletAddress } = useAuth();
  const userId = user?.id ?? null;
  const balance = useWealthBalance(walletAddress);
  const redemptions = useRedemptions({ limit: 1, enabled: authenticated });

  const merchantsQuery = useMerchants({ limit: 100 });
  const { data: priceData } = usePrice();
  const {
    vouchers,
    isLoading: vouchersLoading,
    isFetching: vouchersFetching,
    hasNextPage: vouchersHasNextPage,
    fetchNextPage: fetchNextVouchers,
  } = useInfiniteVouchers();

  const priceIdr = priceData?.priceIdr ?? null;

  // ── Merchants list (for filter card) ──────────────────────────────────────
  const allMerchants = useMemo<Merchant[]>(
    () => merchantsQuery.data?.merchants ?? [],
    [merchantsQuery.data],
  );

  // ── Category chips (derived from merchant.category strings) ───────────────
  // Backend `/api/categories` is not available; merchants embed their category
  // as a free-form string (e.g. "kuliner"). Derive the chip list from the
  // unique set of those strings so the marketplace stays responsive without
  // needing a dedicated endpoint.
  const categoryChips = useMemo<CategoryChip[]>(() => {
    const seen = new Map<string, string>();
    for (const m of allMerchants) {
      const key = normalizeCategoryName(m.category);
      if (!key) continue;
      if (!seen.has(key)) seen.set(key, m.category);
    }
    const dynamic = Array.from(seen, ([id, label]) => ({ id, label })).sort(
      (a, b) => a.label.localeCompare(b.label, "id"),
    );
    return [ALL_CATEGORIES, ...dynamic];
  }, [allMerchants]);

  // The chip id IS the normalized category string, so filtering and lookup
  // just compare normalized strings throughout.
  const activeCategoryKey = filter.activeCategoryId;

  const merchantOptions = useMemo<Merchant[]>(() => {
    if (!activeCategoryKey) return allMerchants;
    return allMerchants.filter(
      (m) => normalizeCategoryName(m.category) === activeCategoryKey,
    );
  }, [allMerchants, activeCategoryKey]);

  // ── Price range bounds (derived from loaded vouchers) ─────────────────────
  const priceBounds = useMemo<[number, number] | null>(() => {
    if (priceIdr === null) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const v of vouchers) {
      const wealth = voucherWealthPrice(v, priceIdr);
      if (wealth === null) continue;
      if (wealth < min) min = wealth;
      if (wealth > max) max = wealth;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    if (min === max) return [min, max];
    return [min, max];
  }, [vouchers, priceIdr]);

  const [priceMin, priceMax] = priceBounds ?? [0, 0];
  const priceValue = filter.priceRange ?? [priceMin, priceMax];
  const priceIsDirty = filter.priceRange !== null;

  // Reset slider drag value if bounds change in a way that puts it out of range.
  useEffect(() => {
    if (!filter.priceRange || !priceBounds) return;
    const [low, high] = filter.priceRange;
    const [bMin, bMax] = priceBounds;
    if (low < bMin || high > bMax) {
      filter.setPriceRange(null);
    }
  }, [priceBounds, filter]);

  // ── Filter pipeline ───────────────────────────────────────────────────────
  const visibleVouchers = useMemo<Voucher[]>(() => {
    const query = filter.searchQuery.trim().toLowerCase();

    return vouchers.filter((v) => {
      // Hide expired / inactive / sold-out vouchers
      if (!isVoucherValid(v)) return false;
      // Category filter via merchant.category
      if (activeCategoryKey) {
        const vCat = normalizeCategoryName(v.merchant?.category);
        if (vCat !== activeCategoryKey) return false;
      }
      // Merchant filter
      if (filter.selectedMerchantIds.length > 0) {
        if (!filter.selectedMerchantIds.includes(v.merchantId)) return false;
      }
      // Price filter
      if (filter.priceRange) {
        const wealth = voucherWealthPrice(v, priceIdr);
        if (wealth === null) return false;
        const [lo, hi] = filter.priceRange;
        if (wealth < lo || wealth > hi) return false;
      }
      // Search filter (title + merchant name)
      if (query) {
        const title = v.title.toLowerCase();
        const merchantName = (v.merchant?.name ?? "").toLowerCase();
        if (!title.includes(query) && !merchantName.includes(query))
          return false;
      }
      return true;
    });
  }, [
    vouchers,
    activeCategoryKey,
    filter.selectedMerchantIds,
    filter.priceRange,
    filter.searchQuery,
    priceIdr,
  ]);

  // ── Welcome sheet + home deposit CTA ──────────────────────────────────────
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [welcomeFlagPresent, setWelcomeFlagPresent] = useState(true);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    if (!authenticated || !userId || typeof window === "undefined") {
      setWelcomeFlagPresent(true);
      return;
    }
    const stored =
      window.localStorage.getItem(welcomeFlagKey(userId)) === "true";
    setWelcomeFlagPresent(stored);
  }, [authenticated, userId]);

  const triggerWelcome = shouldShowWelcomeSheet({
    ready,
    authenticated,
    balanceIsSuccess: balance.isSuccess,
    rawBalance: balance.rawBalance,
    redemptionsIsSuccess: redemptions.isSuccess,
    redemptionTotal: redemptions.data?.pagination.total,
    flagSet: welcomeFlagPresent,
  });

  useEffect(() => {
    if (triggerWelcome) setWelcomeOpen(true);
  }, [triggerWelcome]);

  const handleWelcomeClose = (next: boolean) => {
    setWelcomeOpen(next);
    if (!next && userId && typeof window !== "undefined") {
      window.localStorage.setItem(welcomeFlagKey(userId), "true");
      setWelcomeFlagPresent(true);
    }
  };

  const showHomeDepositCta =
    authenticated &&
    welcomeFlagPresent &&
    balance.isSuccess &&
    balance.rawBalance !== undefined &&
    balance.rawBalance === 0n;

  // ── Selectors ─────────────────────────────────────────────────────────────
  const selectAllMerchants = () => {
    filter.setSelectedMerchantIds(merchantOptions.map((m) => m.id));
  };

  const isFiltered =
    filter.activeCategoryId !== null ||
    filter.selectedMerchantIds.length > 0 ||
    filter.priceRange !== null ||
    filter.searchQuery.trim().length > 0;

  const activeFilterCount =
    (filter.priceRange ? 1 : 0) +
    (filter.selectedMerchantIds.length > 0 ? 1 : 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-4 md:gap-6">
        <CategoryChips
          chips={categoryChips}
          activeId={filter.activeCategoryId}
          onSelect={filter.setActiveCategoryId}
        />

        <MobileControls
          searchValue={filter.searchQuery}
          onSearchChange={filter.setSearchQuery}
          onOpenFilter={() => setFilterSheetOpen(true)}
          activeFilterCount={activeFilterCount}
        />

        {showHomeDepositCta ? (
          <HomeDepositCta onDeposit={() => setDepositOpen(true)} />
        ) : null}

        <div className="grid gap-6 md:grid-cols-[280px_1fr] md:gap-8">
          <div className="hidden md:block">
            <div className="sticky top-20">
              {priceBounds ? (
                <FilterCard
                  priceMin={priceMin}
                  priceMax={priceMax}
                  priceValue={priceValue}
                  priceIsDirty={priceIsDirty}
                  onPriceChange={(next) => filter.setPriceRange(next)}
                  onPriceReset={() => filter.setPriceRange(null)}
                  merchants={merchantOptions}
                  selectedMerchantIds={filter.selectedMerchantIds}
                  onToggleMerchant={filter.toggleMerchant}
                  onSelectAllMerchants={selectAllMerchants}
                  onResetMerchants={filter.resetMerchants}
                />
              ) : (
                <div className="border-border bg-surface-container-low h-96 animate-pulse rounded-[var(--radius-lg)] border" />
              )}
            </div>
          </div>

          <VoucherGrid
            vouchers={visibleVouchers}
            isLoading={vouchersLoading}
            isFetching={vouchersFetching}
            hasNextPage={vouchersHasNextPage}
            onFetchNextPage={fetchNextVouchers}
            isFiltered={isFiltered}
            onResetFilters={filter.resetAll}
          />
        </div>
      </div>

      {priceBounds ? (
        <FilterSheet
          open={filterSheetOpen}
          onOpenChange={setFilterSheetOpen}
          priceMin={priceMin}
          priceMax={priceMax}
          priceValue={priceValue}
          priceIsDirty={priceIsDirty}
          onPriceChange={(next) => filter.setPriceRange(next)}
          onPriceReset={() => filter.setPriceRange(null)}
          merchants={merchantOptions}
          selectedMerchantIds={filter.selectedMerchantIds}
          onToggleMerchant={filter.toggleMerchant}
          onSelectAllMerchants={selectAllMerchants}
          onResetMerchants={filter.resetMerchants}
          onResetAll={filter.resetAll}
          resultCount={visibleVouchers.length}
          isAnyFilterActive={isFiltered}
        />
      ) : null}

      <WelcomeOnboardingSheet
        open={welcomeOpen}
        onOpenChange={handleWelcomeClose}
        onDeposit={() => setDepositOpen(true)}
      />
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
    </div>
  );
}
