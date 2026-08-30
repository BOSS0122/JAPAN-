import { adminLoginAction, isAdmin } from "@/actions/admin";
import { redirect } from "next/navigation";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect("/admin/places");
  const { error } = await searchParams;
  const configured = Boolean(process.env.ADMIN_PASSWORD);

  return (
    <div className="mx-auto max-w-sm">
      <div className="jq-card space-y-4 p-6">
        <h1 className="font-display text-2xl font-extrabold text-ink">編集者ログイン</h1>

        {!configured ? (
          <p className="rounded-xl bg-berry-soft px-4 py-3 text-sm font-semibold text-berry">
            <code>ADMIN_PASSWORD</code> が設定されていません。<code>.env</code> に追加してから
            再読み込みしてください。
          </p>
        ) : (
          <form action={adminLoginAction} className="space-y-3">
            <div>
              <label className="jq-label" htmlFor="password">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="jq-field"
              />
            </div>
            {error && (
              <p className="text-sm font-bold text-berry">パスワードが違います。</p>
            )}
            <button type="submit" className="jq-btn jq-btn-accent w-full">
              ログイン
            </button>
          </form>
        )}

        <p className="border-t border-line pt-3 text-xs text-ink-soft">
          共有パスワードによる暫定的な保護です。本番では個別アカウント・権限・操作ログに
          置き換えてください。
        </p>
      </div>
    </div>
  );
}
