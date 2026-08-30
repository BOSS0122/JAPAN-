import { redirect } from "next/navigation";
import { adminLoginAction } from "@/actions/admin";
import { countEditors, currentEditor } from "@/lib/auth/editor";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentEditor()) redirect("/admin/places");

  const { error } = await searchParams;
  const accounts = await countEditors();

  return (
    <div className="mx-auto max-w-sm">
      <div className="jq-card space-y-4 p-6">
        <h1 className="font-display text-2xl font-extrabold text-ink">編集者ログイン</h1>

        {accounts === 0 ? (
          <div className="space-y-2 rounded-xl bg-sunshine-soft px-4 py-3 text-sm text-[#6b4700]">
            <p className="font-bold">まだアカウントがありません。</p>
            <p>最初の管理者をコマンドラインから作成してください。</p>
            <pre className="overflow-x-auto rounded-lg bg-ink px-3 py-2 font-mono text-xs text-white">
              npm run editor:create -- you@example.com &quot;お名前&quot; admin
            </pre>
          </div>
        ) : (
          <form action={adminLoginAction} className="space-y-3">
            <div>
              <label className="jq-label" htmlFor="email">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                className="jq-field"
              />
            </div>
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
              /* Deliberately does not say which half was wrong. */
              <p className="text-sm font-bold text-berry">
                メールアドレスまたはパスワードが違います。
              </p>
            )}
            <button type="submit" className="jq-btn jq-btn-accent w-full">
              ログイン
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
