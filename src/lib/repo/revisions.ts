import "server-only";
import { prisma } from "@/lib/db";
import type { SignedInEditor } from "@/lib/auth/editor";

/**
 * The edit history. Append-only: revisions are never updated or deleted, and
 * the editor's email is copied in so a row still says who did it even if the
 * account is later removed.
 */

export const NO_CHANGES = "変更なし";

export type RevisionAction = "create" | "update" | "publish" | "unpublish" | "delete";

export interface PlaceSnapshot {
  scalars: Record<string, unknown>;
  /** locale → the three translated fields. */
  translations: Record<string, { name: string; description: string; area: string }>;
  tags: string[];
}

const FIELD_LABELS: Record<string, string> = {
  slug: "スラッグ",
  category: "種別",
  areaKey: "エリア",
  prefecture: "都道府県",
  famous: "有名スポット",
  lat: "緯度",
  lng: "経度",
  stayMinutes: "滞在時間",
  crowd: "混雑",
  indoor: "屋内",
  accessible: "バリアフリー",
  openHour: "開始時刻",
  closeHour: "終了時刻",
  priceFrom: "料金",
  bookable: "予約可",
  externalBookingUrl: "外部予約URL",
  mealSlot: "食事枠",
  imageEmoji: "絵文字",
  imageFrom: "色（開始）",
  imageTo: "色（終了）",
  seasonSpring: "春スコア",
  seasonSummer: "夏スコア",
  seasonAutumn: "秋スコア",
  seasonWinter: "冬スコア",
  status: "公開状態",
};

const show = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "はい" : "いいえ";
  return String(value);
};

/**
 * A readable list of what actually changed. Values are included for the short
 * scalars, where "料金 3800→4200" is the whole story; the free-text fields are
 * named only, because a description diff belongs in a diff view, not a log line.
 */
export function describeChanges(before: PlaceSnapshot | null, after: PlaceSnapshot): string {
  if (!before) {
    const langs = Object.entries(after.translations)
      .filter(([, t]) => t.name.trim())
      .map(([locale]) => locale);
    return `新規作成（${langs.join("・") || "翻訳なし"}）`;
  }

  const parts: string[] = [];

  for (const [key, value] of Object.entries(after.scalars)) {
    const old = before.scalars[key];
    if (old === value) continue;
    parts.push(`${FIELD_LABELS[key] ?? key} ${show(old)}→${show(value)}`);
  }

  const textChanges = Object.entries(after.translations)
    .filter(([locale, t]) => {
      const old = before.translations[locale];
      return (
        !old || old.name !== t.name || old.description !== t.description || old.area !== t.area
      );
    })
    .map(([locale]) => locale);
  if (textChanges.length > 0) parts.push(`本文（${textChanges.join("・")}）`);

  const added = after.tags.filter((t) => !before.tags.includes(t));
  const removed = before.tags.filter((t) => !after.tags.includes(t));
  if (added.length > 0 || removed.length > 0) {
    parts.push(
      `タグ ${[...added.map((t) => `+${t}`), ...removed.map((t) => `-${t}`)].join(" ")}`,
    );
  }

  return parts.length > 0 ? parts.join(" / ") : NO_CHANGES;
}

export async function recordRevision(input: {
  placeSlug: string;
  action: RevisionAction;
  summary: string;
  editor: SignedInEditor;
}): Promise<void> {
  await prisma.placeRevision.create({
    data: {
      placeSlug: input.placeSlug,
      action: input.action,
      summary: input.summary,
      editorId: input.editor.id,
      editorEmail: input.editor.email,
    },
  });
}

export function listRevisions(limit = 100) {
  return prisma.placeRevision.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

export function listRevisionsForPlace(placeSlug: string, limit = 20) {
  return prisma.placeRevision.findMany({
    where: { placeSlug },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
