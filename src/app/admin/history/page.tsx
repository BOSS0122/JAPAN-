import { requireEditor } from "@/lib/auth/editor";
import { listRevisions } from "@/lib/repo/revisions";
import { RevisionList } from "@/components/admin/RevisionList";

export default async function HistoryPage() {
  await requireEditor();
  const revisions = await listRevisions(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">編集履歴</h1>
        <p className="text-sm text-ink-soft">
          直近{revisions.length}件。履歴は追記のみで、削除されたスポットの分も残ります。
        </p>
      </div>
      <div className="jq-card p-5">
        <RevisionList revisions={revisions} />
      </div>
    </div>
  );
}
