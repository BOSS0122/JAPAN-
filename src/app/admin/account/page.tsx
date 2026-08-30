import { changeOwnPasswordAction } from "@/actions/admin";
import { requireEditor } from "@/lib/auth/editor";

const ERRORS: Record<string, string> = {
  current: "現在のパスワードが違います。",
  weak: "新しいパスワードは10文字以上で、数字だけにしないでください。",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const me = await requireEditor();
  const { error, saved } = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">アカウント</h1>
        <p className="text-sm text-ink-soft">
          {me.name}（{me.email}） · {me.role === "admin" ? "管理者" : "編集者"}
        </p>
      </div>

      {error && ERRORS[error] && (
        <p className="jq-card border-2 border-berry/40 p-4 text-sm font-bold text-berry">
          {ERRORS[error]}
        </p>
      )}
      {saved && (
        <p className="jq-card p-4 text-sm font-bold text-matcha">
          パスワードを変更し、他の端末のログインを終了しました。
        </p>
      )}

      <form action={changeOwnPasswordAction} className="jq-card space-y-3 p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">パスワードの変更</h2>
        <div>
          <label className="jq-label" htmlFor="currentPassword">
            現在のパスワード
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="jq-field"
          />
        </div>
        <div>
          <label className="jq-label" htmlFor="newPassword">
            新しいパスワード（10文字以上）
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="jq-field"
          />
        </div>
        <button type="submit" className="jq-btn jq-btn-accent">
          変更する
        </button>
      </form>
    </div>
  );
}
