"use server";

import { assertEditor } from "@/lib/auth/editor";
import { enforce, LIMITS } from "@/lib/rate-limit";
import { getDraftProvider } from "@/lib/providers";
import { locales } from "@/i18n/routing";
import type { PlaceDraft } from "@/lib/providers/types";

/**
 * Drafts a place's copy from an editor's notes.
 *
 * Returns the draft rather than saving it. Nothing written by a model reaches
 * the catalogue without an editor reading it and pressing save — which is also
 * what makes the "only the editor's facts" rule enforceable, since the person
 * who supplied the facts is the one who checks them.
 */

export interface DraftResult {
  ok: boolean;
  draft?: PlaceDraft;
  error?: string;
}

export async function draftPlaceAction(input: {
  notes: string;
  targetLocales: string[];
  existing: { locale: string; name: string; area: string; description: string }[];
  category: string;
  prefecture: string;
  areaKey: string;
}): Promise<DraftResult> {
  const editor = await assertEditor();

  const notes = input.notes.trim();
  if (notes.length < 15) {
    return { ok: false, error: "メモが短すぎます。場所の様子が分かる程度に書いてください。" };
  }

  try {
    await enforce("placeDraft", LIMITS.placeDraft, editor.id);
  } catch {
    return { ok: false, error: "下書きの生成が多すぎます。しばらく待ってからお試しください。" };
  }

  const provider = await getDraftProvider();
  if (!provider) {
    return {
      ok: false,
      error: "下書き生成は未設定です。DRAFT_PROVIDER と ANTHROPIC_API_KEY を設定してください。",
    };
  }

  const targetLocales = input.targetLocales.filter((code) =>
    (locales as readonly string[]).includes(code),
  );
  if (targetLocales.length === 0) {
    return { ok: false, error: "対象の言語がありません。" };
  }

  try {
    const draft = await provider.draft({
      notes: notes.slice(0, 4000),
      targetLocales,
      existing: input.existing.filter((t) => t.name.trim() || t.description.trim()),
      category: input.category,
      prefecture: input.prefecture,
      areaKey: input.areaKey,
    });
    return { ok: true, draft };
  } catch (error) {
    console.error("[draft] failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "下書きを生成できませんでした。もう一度お試しください。" };
  }
}
