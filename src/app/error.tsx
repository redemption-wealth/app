"use client";

import Link from "next/link";
import { useEffect } from "react";
import { telemetry } from "@/lib/telemetry";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    telemetry.capture(error, { scope: "route", digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-on-surface text-2xl font-semibold">
          Terjadi kesalahan
        </h1>
        <p className="text-on-surface-variant max-w-sm text-sm">
          Kami tidak dapat memuat halaman ini. Coba muat ulang, atau hubungi
          dukungan jika masalah berlanjut.
        </p>
        {error.digest ? (
          <p className="text-outline font-mono text-xs">ID: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-primary rounded-full px-5 py-2 text-sm font-semibold text-white"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="border-border text-on-surface rounded-full border px-5 py-2 text-sm font-semibold"
        >
          Ke beranda
        </Link>
      </div>
    </main>
  );
}
