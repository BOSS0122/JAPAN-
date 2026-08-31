import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { t as localized } from "@/lib/localized";
import { commerceRows, legalDocuments } from "@/data/legal";
import { missingOperatorFields, operator, type OperatorDetails } from "@/config/operator";
import { localeAlternates } from "@/lib/seo";

export function generateStaticParams() {
  return legalDocuments.map((doc) => ({ doc: doc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc } = await params;
  const found = legalDocuments.find((d) => d.slug === doc);
  if (!found) return {};
  return {
    alternates: localeAlternates(locale, `/legal/${doc}`), title: localized(found.title, locale) };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc } = await params;
  setRequestLocale(locale);

  const document = legalDocuments.find((d) => d.slug === doc);
  if (!document) notFound();

  const missing = missingOperatorFields();

  return (
    /* Narrow measure: legal text is read, not scanned, and long lines lose the eye. */
    <article className="mx-auto max-w-[42rem] space-y-8 pb-16">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-extrabold text-ink">
          {localized(document.title, locale)}
        </h1>
        <p className="text-base text-ink-soft">{localized(document.intro, locale)}</p>
      </header>

      {missing.length > 0 && (
        /* Loud on purpose. A half-filled legal page is worse than none, because
           it looks finished. */
        <p className="jq-card border-2 border-berry p-4 text-sm font-bold text-berry">
          未公開：事業者情報が未設定です（{missing.join(", ")}）。
          <code className="mx-1 font-mono">src/config/operator.ts</code>
          を記入してから公開してください。
        </p>
      )}

      {document.slug === "commerce" ? (
        <dl className="divide-y divide-line border-y border-line">
          {commerceRows.map((row) => {
            const value = row.field
              ? operator[row.field as keyof OperatorDetails]
              : localized(row.fixed!, locale);
            return (
              <div key={localized(row.label, "en")} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
                <dt className="font-display text-sm font-extrabold text-ink">
                  {localized(row.label, locale)}
                </dt>
                <dd className="text-sm leading-relaxed text-ink-soft">
                  {value ? (
                    value
                  ) : (
                    <span className="font-bold text-berry">未設定</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <div className="space-y-8">
          {document.sections.map((section) => (
            <section key={localized(section.heading, "en")} className="space-y-3">
              <h2 className="font-display text-xl font-extrabold text-ink">
                {localized(section.heading, locale)}
              </h2>
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-base leading-relaxed text-ink-soft">
                  {localized(paragraph, locale)}
                </p>
              ))}
            </section>
          ))}
        </div>
      )}

      {document.slug !== "commerce" && (
        <p className="border-t border-line pt-4 text-sm text-ink-soft">
          {localized(
            {
              en: "Questions about any of this go to the contact on the business details page.",
              ja: "本ポリシーに関するお問い合わせは、特定商取引法に基づく表記に記載の連絡先までお願いします。",
              th: "คำถามเกี่ยวกับเรื่องเหล่านี้ ติดต่อตามที่อยู่ในหน้าข้อมูลผู้ประกอบการ",
            },
            locale,
          )}
        </p>
      )}
    </article>
  );
}
