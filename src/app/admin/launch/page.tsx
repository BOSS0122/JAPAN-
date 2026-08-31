import { requireAdmin } from "@/lib/auth/editor";
import { preflight, type Check } from "@/lib/preflight";

/**
 * The launch screen. One list, one verdict, and the exact command to run.
 */

const STYLE: Record<Check["severity"], { chip: string; label: string }> = {
  blocker: { chip: "bg-berry-soft text-berry", label: "未完了" },
  warning: { chip: "bg-sunshine-soft text-[#8a5b00]", label: "要確認" },
  ok: { chip: "bg-matcha-soft text-matcha", label: "OK" },
};

export default async function LaunchPage() {
  await requireAdmin();
  const report = await preflight();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">公開前チェック</h1>
        <p className="text-sm text-ink-soft">
          「未完了」が残っている間は、公開すると誰かに実害が出ます。「要確認」は
          サービスとしては動きますが、本来より劣る状態です。
        </p>
      </div>

      <div
        className={`jq-card border-2 p-5 ${
          report.launched
            ? "border-matcha"
            : report.readyToLaunch
              ? "border-matcha"
              : "border-berry"
        }`}
      >
        <p className="font-display text-xl font-extrabold text-ink">
          {report.launched
            ? "公開中"
            : report.readyToLaunch
              ? "公開できます"
              : `未完了 ${report.blockers}件`}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {report.launched
            ? "旅行者向けサイトは一般公開されています。"
            : "旅行者向けサイトは非公開です。一般には準備中ページが表示され、編集者だけが実サイトを見られます。"}
        </p>
        {!report.launched && report.readyToLaunch && (
          <div className="mt-3">
            <p className="text-sm font-bold text-ink">公開するには:</p>
            <pre className="mt-1 overflow-x-auto rounded-lg bg-ink px-3 py-2 font-mono text-xs text-white">
              LAUNCHED=&quot;true&quot;
            </pre>
            <p className="mt-1 text-xs text-ink-soft">
              環境変数を設定して再デプロイしてください。
            </p>
          </div>
        )}
      </div>

      <ol className="space-y-2">
        {report.checks.map((check) => {
          const style = STYLE[check.severity];
          return (
            <li key={check.id} className="jq-card flex flex-wrap items-start gap-3 p-4">
              <span className={`jq-chip shrink-0 ${style.chip}`}>{style.label}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-extrabold text-ink">{check.label}</p>
                <p className="text-sm text-ink-soft">{check.detail}</p>
                {check.fix && check.severity !== "ok" && (
                  <p className="mt-1 text-xs text-ink-mute">{check.fix}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
