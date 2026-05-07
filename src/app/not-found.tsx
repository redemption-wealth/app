import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-display text-on-surface text-2xl font-bold">
        Halaman tidak ditemukan
      </h1>
      <p className="text-on-surface-variant text-sm">
        URL yang kamu buka sudah tidak tersedia.
      </p>
      <Link
        href="/"
        className="bg-primary inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
