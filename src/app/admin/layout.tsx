import type { Metadata } from "next";
import Link from "next/link";
import { SERVICE_NAME } from "@/config/site";
import { adminLogoutAction } from "@/actions/admin";
import { atLeast, currentEditor } from "@/lib/auth/editor";
import { countPendingSubmissions } from "@/lib/repo/places";
import "../globals.css";

export const metadata: Metadata = {
  title: `${SERVICE_NAME} Editor`,
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Null on the login screen, which is the only page under /admin without one.
  const me = await currentEditor();
  const staff = me ? atLeast(me.role, "editor") : false;
  const pending = staff ? await countPendingSubmissions() : 0;

  return (
    <html lang="ja">
      <body className="min-h-dvh font-sans antialiased">
        <header className="border-b border-line bg-paper">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
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

            {me && (
              <nav className="ml-auto flex flex-wrap items-center gap-4 text-sm font-bold">
                <Link href="/admin/places" className="text-grape hover:underline">
                  スポット一覧
                </Link>
                {staff && (
                  <>
                    <Link href="/admin/review" className="text-grape hover:underline">
                      審査待ち
                      {pending > 0 && (
                        <span className="ml-1.5 jq-chip bg-sunshine-soft text-[#8a5b00]">
                          {pending}
                        </span>
                      )}
                    </Link>
                    <Link href="/admin/history" className="text-grape hover:underline">
                      編集履歴
                    </Link>
                    <Link href="/admin/mail" className="text-grape hover:underline">
                      メール
                    </Link>
                  </>
                )}
                {me.role === "admin" && (
                  <>
                    <Link href="/admin/revenue" className="text-grape hover:underline">
                      収益
                    </Link>
                    <Link href="/admin/launch" className="text-grape hover:underline">
                      公開前チェック
                    </Link>
                    <Link href="/admin/editors" className="text-grape hover:underline">
                      編集者
                    </Link>
                  </>
                )}
                <Link href="/en" className="text-ink-soft hover:underline">
                  ← 旅行者向け
                </Link>
                <span className="flex items-center gap-2 border-l border-line pl-4">
                  <Link href="/admin/account" className="text-ink hover:underline">
                    {me.name}
                    <span className="ml-1.5 jq-chip bg-cream text-ink-soft">
                      {me.role === "admin" ? "管理者" : me.role === "partner" ? "加盟店" : "編集者"}
                    </span>
                  </Link>
                  <form action={adminLogoutAction}>
                    <button type="submit" className="text-ink-soft hover:underline">
                      ログアウト
                    </button>
                  </form>
                </span>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
