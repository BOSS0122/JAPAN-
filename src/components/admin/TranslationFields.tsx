"use client";

import { useState, useTransition } from "react";
import { locales, localeLabels, type Locale } from "@/i18n/routing";
import { draftPlaceAction } from "@/actions/draft";

/**
 * The three-language copy, plus the draft-from-notes panel.
 *
 * These fields are client-owned so a draft can fill them in place. Everything
 * still submits as ordinary named inputs in the surrounding form, so the save
 * path is unchanged and the form works with the panel unused.
 *
 * A draft is never saved for you. It lands in the fields, the editor reads it,
 * and the editor presses save — which is what makes "only the facts you gave
 * it" checkable by the one person who knows the facts.
 */

export interface LocaleCopy {
  name: string;
  area: string;
  description: string;
}

type CopyMap = Record<string, LocaleCopy>;

const blank = (): LocaleCopy => ({ name: "", area: "", description: "" });

export function TranslationFields({
  initial,
  available,
  /** Read from the form so a draft knows what it is describing. */
  formId,
}: {
  initial: Record<string, LocaleCopy>;
  available: boolean;
  formId: string;
}) {
  const [copy, setCopy] = useState<CopyMap>(() =>
    Object.fromEntries(locales.map((l) => [l, initial[l] ?? blank()])),
  );
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const missing = locales.filter((l) => !copy[l]?.name.trim());
  const filled = locales.filter((l) => copy[l]?.name.trim());

  function set(locale: string, field: keyof LocaleCopy, value: string) {
    setCopy((prev) => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }));
  }

  function runDraft(targets: readonly string[]) {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    const data = form ? new FormData(form) : new FormData();
    const field = (key: string) => String(data.get(key) ?? "");

    startTransition(async () => {
      setMessage(null);
      const result = await draftPlaceAction({
        notes,
        targetLocales: [...targets],
        existing: filled.map((l) => ({ locale: l, ...copy[l] })),
        category: field("category") || "spot",
        prefecture: field("prefecture"),
        areaKey: field("areaKey"),
      });

      if (!result.ok || !result.draft) {
        setMessage({ tone: "bad", text: result.error ?? "生成できませんでした。" });
        return;
      }

      setCopy((prev) => {
        const next = { ...prev };
        for (const t of result.draft!.translations) {
          next[t.locale] = { name: t.name, area: t.area, description: t.description };
        }
        return next;
      });

      // Tags are suggestions on the surrounding form, ticked but not saved.
      for (const tag of result.draft.tags) {
        const box = form?.elements.namedItem(`tag_${tag}`);
        if (box instanceof HTMLInputElement) box.checked = true;
      }

      setMessage({
        tone: "ok",
        text: [
          `${result.draft.translations.length}言語の下書きを入れました。保存する前に必ず読んでください。`,
          result.draft.tags.length ? `タグ候補: ${result.draft.tags.join(", ")}` : "",
          result.draft.notes,
        ]
          .filter(Boolean)
          .join(" / "),
      });
    });
  }

  return (
    <>
      <section className="jq-card space-y-4 p-5">
        <div>
          <h2 className="font-display text-lg font-extrabold text-ink">メモから下書き</h2>
          <p className="mt-1 text-sm text-ink-soft">
            見たまま・聞いたままを書いてください。言語は問いません。
            <strong className="text-ink">
              メモに書いた事実だけを使います
            </strong>
            — 創業年や名物など、書いていないことは補いません。
          </p>
        </div>

        {!available ? (
          <p className="rounded-xl bg-sunshine-soft px-4 py-3 text-sm text-[#6b4700]">
            下書き生成は未設定です。<code className="font-mono">DRAFT_PROVIDER=claude</code> と
            <code className="mx-1 font-mono">ANTHROPIC_API_KEY</code>
            を設定すると使えます。設定するまでは手入力してください。
          </p>
        ) : (
          <>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="例：谷中の路地にある小さな神社。朱の鳥居が七つ並んでいて、朝八時前ならほぼ無人。つつじが四月末に咲く。境内は砂利で、車椅子は少し大変。"
              className="jq-field"
              aria-label="メモ"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending || notes.trim().length < 15}
                onClick={() => runDraft(locales)}
                className="jq-btn jq-btn-accent"
              >
                {pending ? "生成中…" : "3言語ぶん下書きする"}
              </button>
              {missing.length > 0 && missing.length < locales.length && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runDraft(missing)}
                  className="jq-btn jq-btn-ghost"
                >
                  不足している{missing.map((l) => localeLabels[l].label).join("・")}だけ埋める
                </button>
              )}
            </div>
            <p className="text-xs text-ink-soft">
              下書きは自動保存されません。内容を確認・修正してから「保存」を押してください。
            </p>
          </>
        )}

        {message && (
          <p
            className={`rounded-xl px-4 py-3 text-sm ${
              message.tone === "ok"
                ? "bg-matcha-soft text-matcha"
                : "bg-berry-soft font-bold text-berry"
            }`}
            role="status"
          >
            {message.text}
          </p>
        )}
      </section>

      {locales.map((locale) => (
        <section key={locale} className="jq-card space-y-4 p-5">
          <h2 className="font-display text-lg font-extrabold text-ink">
            {localeLabels[locale as Locale].flag} {localeLabels[locale as Locale].label}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="jq-label" htmlFor={`name_${locale}`}>
                名称
              </label>
              <input
                id={`name_${locale}`}
                name={`name_${locale}`}
                value={copy[locale].name}
                onChange={(e) => set(locale, "name", e.target.value)}
                className="jq-field"
              />
            </div>
            <div>
              <label className="jq-label" htmlFor={`area_${locale}`}>
                エリア表示名
              </label>
              <input
                id={`area_${locale}`}
                name={`area_${locale}`}
                value={copy[locale].area}
                onChange={(e) => set(locale, "area", e.target.value)}
                className="jq-field"
              />
              <p className="mt-1 text-xs text-ink-soft">例: 東京・谷中</p>
            </div>
          </div>
          <div>
            <label className="jq-label" htmlFor={`description_${locale}`}>
              紹介文
            </label>
            <textarea
              id={`description_${locale}`}
              name={`description_${locale}`}
              rows={3}
              value={copy[locale].description}
              onChange={(e) => set(locale, "description", e.target.value)}
              className="jq-field"
            />
          </div>
        </section>
      ))}
      {/* Recorded on the revision, so the history says a draft was involved. */}
      <input type="hidden" name="usedDraft" value={message?.tone === "ok" ? "1" : ""} />
    </>
  );
}
