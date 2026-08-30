import type { Metadata } from "next";
import Link from "next/link";
import { SERVICE_NAME } from "@/config/site";
import "../globals.css";

export const metadata: Metadata = {
  title: `${SERVICE_NAME} Partner Console`,
  description: "Referral analytics for municipalities and tourism boards",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh font-sans antialiased">
        <header className="border-b border-line bg-paper">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-lg text-white"
            >
              📊
            </span>
            <div>
              <p className="font-display text-lg font-extrabold text-ink">
                {SERVICE_NAME} Partner Console
              </p>
              <p className="text-xs text-ink-soft">自治体・観光協会向け送客データ</p>
            </div>
            <Link
              href="/en"
              className="ml-auto text-sm font-bold text-grape hover:underline"
            >
              ← Traveller app
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
