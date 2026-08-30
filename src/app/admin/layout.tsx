import type { Metadata } from "next";
import Link from "next/link";
import { SERVICE_NAME } from "@/config/site";
import "../globals.css";

export const metadata: Metadata = {
  title: `${SERVICE_NAME} Editor`,
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh font-sans antialiased">
        <header className="border-b border-line bg-paper">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-lg text-white"
            >
              ✎
            </span>
            <div>
              <p className="font-display text-lg font-extrabold text-ink">
                {SERVICE_NAME} Editor
              </p>
              <p className="text-xs text-ink-soft">スポット管理</p>
            </div>
            <nav className="ml-auto flex items-center gap-4 text-sm font-bold">
              <Link href="/admin/places" className="text-grape hover:underline">
                スポット一覧
              </Link>
              <Link href="/en" className="text-ink-soft hover:underline">
                ← 旅行者向け
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
