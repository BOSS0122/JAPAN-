import Link from "next/link";

/** Shared by the per-place history and the console-wide log. */

const ACTION_LABEL: Record<string, string> = {
  create: "作成",
  update: "更新",
  publish: "公開",
  unpublish: "下書き",
  delete: "削除",
};

const ACTION_STYLE: Record<string, string> = {
  create: "bg-grape-soft text-grape",
  update: "bg-cream text-ink-soft",
  publish: "bg-matcha-soft text-matcha",
  unpublish: "bg-sunshine-soft text-[#8a5b00]",
  delete: "bg-berry-soft text-berry",
};

export interface RevisionRow {
  id: string;
  placeSlug: string;
  action: string;
  summary: string;
  editorEmail: string;
  createdAt: Date;
}

export function RevisionList({
  revisions,
  showSlug = true,
}: {
  revisions: RevisionRow[];
  showSlug?: boolean;
}) {
  if (revisions.length === 0) {
    return <p className="text-sm text-ink-soft">まだ履歴がありません。</p>;
  }

  return (
    <ol className="divide-y divide-line">
      {revisions.map((r) => (
        <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 text-sm">
          <span className={`jq-chip ${ACTION_STYLE[r.action] ?? "bg-cream text-ink-soft"}`}>
            {ACTION_LABEL[r.action] ?? r.action}
          </span>
          {showSlug && (
            <Link
              href={`/admin/places/${r.placeSlug}`}
              className="font-mono text-xs font-bold text-grape hover:underline"
            >
              {r.placeSlug}
            </Link>
          )}
          <span className="min-w-0 flex-1 break-words text-ink">{r.summary}</span>
          <span className="text-xs text-ink-soft">{r.editorEmail}</span>
          <time
            dateTime={r.createdAt.toISOString()}
            className="font-mono text-xs text-ink-soft"
          >
            {r.createdAt.toISOString().slice(0, 16).replace("T", " ")}
          </time>
        </li>
      ))}
    </ol>
  );
}
