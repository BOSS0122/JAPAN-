import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/editor";
import {
  createEditorAction,
  resetEditorPasswordAction,
  setEditorRoleAction,
  setEditorStatusAction,
} from "@/actions/admin";

const ROLE_LABEL: Record<string, string> = {
  admin: "管理者",
  editor: "編集者",
  partner: "加盟店",
};

const ERRORS: Record<string, string> = {
  email: "メールアドレスの形式が正しくありません。",
  name: "名前を入力してください。",
  weak: "パスワードは10文字以上で、数字だけにしないでください。",
  duplicate: "そのメールアドレスは既に登録されています。",
  self: "自分自身の権限・状態は変更できません。",
};

const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 16).replace("T", " ") : "—");

export default async function EditorsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; reset?: string }>;
}) {
  const me = await requireAdmin();
  const { error, created, reset } = await searchParams;

  const editors = await prisma.editor.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">編集者</h1>
        <p className="text-sm text-ink-soft">
          管理者はアカウントの管理とスポットの削除ができます。編集者はスポットの
          追加・編集・公開までです。
        </p>
      </div>

      {error && ERRORS[error] && (
        <p className="jq-card border-2 border-berry/40 p-4 text-sm font-bold text-berry">
          {ERRORS[error]}
        </p>
      )}
      {created && (
        <p className="jq-card p-4 text-sm font-bold text-matcha">アカウントを作成しました。</p>
      )}
      {reset && (
        <p className="jq-card p-4 text-sm font-bold text-matcha">
          パスワードを再設定し、その人のログインを全て終了しました。
        </p>
      )}

      <div className="jq-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">名前</th>
                <th className="px-4 py-3">権限</th>
                <th className="px-4 py-3">状態</th>
                <th className="px-4 py-3">最終ログイン</th>
                <th className="px-4 py-3">パスワード再設定</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {editors.map((editor) => {
                const isMe = editor.id === me.id;
                return (
                  <tr key={editor.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink">
                        {editor.name}
                        {isMe && <span className="ml-2 jq-chip bg-grape-soft text-grape">自分</span>}
                      </p>
                      <p className="font-mono text-xs text-ink-soft">{editor.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {isMe ? (
                        <span className="jq-chip bg-cream text-ink-soft">管理者</span>
                      ) : (
                        <form action={setEditorRoleAction} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={editor.id} />
                          <input
                            type="hidden"
                            name="role"
                            value={editor.role === "admin" ? "editor" : "admin"}
                          />
                          <span className="jq-chip bg-cream text-ink-soft">
                            {ROLE_LABEL[editor.role] ?? editor.role}
                          </span>
                          <button type="submit" className="text-xs font-bold text-grape hover:underline">
                            {editor.role === "admin" ? "編集者にする" : "管理者にする"}
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isMe ? (
                        <span className="jq-chip bg-matcha-soft text-matcha">有効</span>
                      ) : (
                        <form action={setEditorStatusAction} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={editor.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={editor.status === "active" ? "disabled" : "active"}
                          />
                          <span
                            className={`jq-chip ${
                              editor.status === "active"
                                ? "bg-matcha-soft text-matcha"
                                : "bg-berry-soft text-berry"
                            }`}
                          >
                            {editor.status === "active" ? "有効" : "停止中"}
                          </span>
                          <button type="submit" className="text-xs font-bold text-grape hover:underline">
                            {editor.status === "active" ? "停止する" : "再開する"}
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                      {fmt(editor.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3">
                      <form action={resetEditorPasswordAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={editor.id} />
                        <input
                          name="password"
                          type="password"
                          required
                          minLength={10}
                          placeholder="新しいパスワード"
                          aria-label={`${editor.name} の新しいパスワード`}
                          className="jq-field w-44 py-1.5 text-xs"
                        />
                        <button type="submit" className="jq-btn jq-btn-ghost jq-chip">
                          再設定
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <section className="jq-card space-y-4 p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">アカウントを追加</h2>
        <form action={createEditorAction} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="jq-label" htmlFor="new-name">
              名前
            </label>
            <input id="new-name" name="name" required className="jq-field" />
          </div>
          <div>
            <label className="jq-label" htmlFor="new-email">
              メールアドレス
            </label>
            <input id="new-email" name="email" type="email" required className="jq-field" />
          </div>
          <div>
            <label className="jq-label" htmlFor="new-password">
              初期パスワード（10文字以上）
            </label>
            <input
              id="new-password"
              name="password"
              type="password"
              required
              minLength={10}
              className="jq-field"
            />
          </div>
          <div>
            <label className="jq-label" htmlFor="new-role">
              権限
            </label>
            <select id="new-role" name="role" className="jq-field" defaultValue="editor">
              <option value="partner">加盟店（自分の掲載のみ・公開不可）</option>
              <option value="editor">編集者</option>
              <option value="admin">管理者</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="jq-btn jq-btn-accent">
              作成する
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
