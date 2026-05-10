import { OfflineBanner } from "@/components/layout/offline-banner";
import { TopNav } from "@/components/layout/top-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1">{children}</main>
      <OfflineBanner />
    </div>
  );
}
