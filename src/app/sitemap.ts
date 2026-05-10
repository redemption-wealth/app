import type { MetadataRoute } from "next";
import { endpoints } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { isVoucherSitemapEligible } from "@/lib/sitemap-filter";

export const revalidate = 3600;

const PAGE_LIMIT = 100;

async function listAllMerchants() {
  const all = [];
  let page = 1;
  // Defensive cap so a runaway BE doesn't loop forever.
  while (page <= 50) {
    const res = await endpoints.listMerchants({ page, limit: PAGE_LIMIT });
    all.push(...res.merchants);
    if (res.merchants.length < PAGE_LIMIT) break;
    page += 1;
  }
  return all;
}

async function listAllVouchers() {
  const all = [];
  let page = 1;
  while (page <= 50) {
    const res = await endpoints.listVouchers({ page, limit: PAGE_LIMIT });
    all.push(...res.vouchers);
    if (res.vouchers.length < PAGE_LIMIT) break;
    page += 1;
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const baseRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
  ];

  let merchantEntries: MetadataRoute.Sitemap = [];
  let voucherEntries: MetadataRoute.Sitemap = [];

  try {
    const merchants = await listAllMerchants();
    merchantEntries = merchants.map((m) => ({
      url: `${base}/merchants/${m.id}`,
      lastModified: new Date(m.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // BE error — return base routes only rather than serving an invalid sitemap.
  }

  try {
    const vouchers = await listAllVouchers();
    const now = new Date();
    voucherEntries = vouchers
      .filter((v) => isVoucherSitemapEligible(v, now))
      .map((v) => ({
        url: `${base}/vouchers/${v.id}`,
        lastModified: new Date(v.updatedAt),
        changeFrequency: "daily",
        priority: 0.6,
      }));
  } catch {
    // BE error — return base routes only.
  }

  return [...baseRoutes, ...merchantEntries, ...voucherEntries];
}
