import "server-only";
import { prisma } from "@/lib/db";
import { locales } from "@/i18n/routing";
import { isLaunched } from "@/config/launch";
import { missingOperatorFields } from "@/config/operator";
import { moodSearchIsSemantic, paymentsLive } from "@/lib/providers";
import { mailLive } from "@/lib/mail";
import { allowedPartnerHosts } from "@/lib/partner-link";

/**
 * Everything that must be true before the site is opened to the public.
 *
 * The point is that going live becomes a decision rather than a hope: run this,
 * make it green, flip LAUNCHED. A check is only worth having if it can fail, so
 * each one asks the database or the environment rather than trusting a note in
 * a README.
 *
 * Severity is the whole design. `blocker` means opening would harm someone —
 * charging nothing while saying "confirmed", publishing a legal page with
 * blanks in it. `warning` means the service works but something is worse than
 * it should be. Only blockers stop a launch, so the list stays honest instead
 * of being ignored wholesale.
 */

export type Severity = "blocker" | "warning" | "ok";

export interface Check {
  id: string;
  label: string;
  severity: Severity;
  detail: string;
  /** What to do about it, when there is something to do. */
  fix?: string;
}

export interface PreflightReport {
  launched: boolean;
  checks: Check[];
  blockers: number;
  warnings: number;
  /** True when nothing would harm a traveller or break the law. */
  readyToLaunch: boolean;
}

const ok = (id: string, label: string, detail: string): Check => ({
  id,
  label,
  severity: "ok",
  detail,
});

export async function preflight(): Promise<PreflightReport> {
  const checks: Check[] = [];

  // ---------------------------------------------------------------- legal
  const missing = missingOperatorFields();
  checks.push(
    missing.length === 0
      ? ok("operator", "事業者情報", "特定商取引法に基づく表記が揃っています")
      : {
          id: "operator",
          label: "事業者情報",
          severity: "blocker",
          detail: `${missing.length}項目が未入力: ${missing.join(", ")}`,
          fix: "src/config/operator.ts を記入してください。物販には法的に必須です。",
        },
  );

  // -------------------------------------------------------------- secrets
  const secret = process.env.LINK_SECRET ?? "";
  checks.push(
    secret.length >= 16
      ? ok("linkSecret", "送客リンクの署名鍵", "設定済み")
      : {
          id: "linkSecret",
          label: "送客リンクの署名鍵",
          severity: "blocker",
          detail: "LINK_SECRET が未設定、または16文字未満です",
          fix: "本番では未設定だと起動しません。ランダムな長い文字列を設定してください。",
        },
  );

  const siteUrl = process.env.SITE_URL ?? "";
  checks.push(
    /^https:\/\/[^\s/]+$/.test(siteUrl)
      ? ok("siteUrl", "公開URL", siteUrl)
      : {
          id: "siteUrl",
          label: "公開URL",
          severity: siteUrl ? "warning" : "blocker",
          detail: siteUrl
            ? `https:// で始まる末尾スラッシュなしの形式にしてください（現在: ${siteUrl}）`
            : "SITE_URL が未設定です",
          fix: "canonical・hreflang・サイトマップがすべて出力されません。",
        },
  );

  // ------------------------------------------------------------- payments
  checks.push(
    paymentsLive()
      ? ok("payments", "決済", "決済事業者が設定されています")
      : {
          id: "payments",
          label: "決済",
          severity: "blocker",
          detail: "決済事業者が未設定です",
          fix: "PAYMENT_PROVIDER を設定してください。未設定のまま公開すると有料の予約・注文は拒否されます。",
        },
  );

  // ----------------------------------------------------------------- mail
  checks.push(
    mailLive()
      ? ok("mail", "確認メール", "配信されます")
      : {
          id: "mail",
          label: "確認メール",
          severity: "blocker",
          detail: "サーバーログに記録されるだけで、配信されません",
          fix: "MAIL_PROVIDER を設定し、送信ドメインのSPF・DKIMを済ませてください。",
        },
  );

  // -------------------------------------------------------------- partners
  const mockOnly = allowedPartnerHosts().every((host) => host.endsWith(".invalid"));
  checks.push(
    mockOnly
      ? {
          id: "partners",
          label: "提携先",
          severity: "warning",
          detail: "送客先がモックのホストだけです",
          fix: "契約成立後、src/lib/partner-link.ts の許可リストに実ホストを追加してください。",
        }
      : ok("partners", "提携先", `${allowedPartnerHosts().length}ホストを許可`),
  );

  // -------------------------------------------------------------- pending
  const pending = await prisma.place.count({ where: { status: "pending" } });
  checks.push(
    pending === 0
      ? ok("review", "審査待ち", "滞留はありません")
      : {
          id: "review",
          label: "審査待ち",
          severity: "warning",
          detail: `${pending}件が加盟店からの提出待ちです`,
          fix: "/admin/review で承認または差し戻してください。待たされている相手がいます。",
        },
  );

  // ------------------------------------------------------------------- ai
  checks.push(
    moodSearchIsSemantic()
      ? ok("moodSearch", "気分検索", "Claude が有効です")
      : {
          id: "moodSearch",
          label: "気分検索",
          severity: "warning",
          detail: "キーワード一致で動作しています",
          fix: "MOOD_PROVIDER=claude と ANTHROPIC_API_KEY を設定すると、文章での検索が効くようになります。",
        },
  );

  // -------------------------------------------------------------- content
  // Counted in application code rather than as a `where`: the database can say
  // "some translation is blank", but not "a language is missing a row at all",
  // and a place created outside the console can have either problem.
  const [publishedRows, withPhotos] = await Promise.all([
    prisma.place.findMany({
      where: { status: "published" },
      select: { slug: true, translations: { select: { locale: true, name: true } } },
    }),
    prisma.place.count({ where: { status: "published", photos: { some: {} } } }),
  ]);

  const published = publishedRows.length;
  const incomplete = publishedRows.filter((row) => {
    const named = new Set(
      row.translations.filter((t) => t.name.trim()).map((t) => t.locale),
    );
    return locales.some((locale) => !named.has(locale));
  });
  const missingTranslations = incomplete.length;

  checks.push(
    published >= 30
      ? ok("catalogue", "掲載数", `公開中 ${published}件`)
      : {
          id: "catalogue",
          label: "掲載数",
          severity: "warning",
          detail: `公開中 ${published}件`,
          fix: "コース自動提案は近接したスポットが必要です。1都市を埋めてから次へ。",
        },
  );

  const fullyTranslated = published - missingTranslations;
  checks.push(
    missingTranslations === 0
      ? ok("translations", "翻訳", `公開中の全${published}件が${locales.length}言語そろっています`)
      : {
          id: "translations",
          label: "翻訳",
          severity: "blocker",
          detail: `${missingTranslations}件に未入力の言語があります（${fullyTranslated}件は完了）: ${incomplete
            .slice(0, 5)
            .map((row) => row.slug)
            .join(", ")}${incomplete.length > 5 ? " …" : ""}`,
          fix: "未翻訳のまま公開すると、その言語の利用者には空欄が見えます。",
        },
  );

  checks.push(
    withPhotos === published && published > 0
      ? ok("photos", "写真", "公開中の全件に写真があります")
      : {
          id: "photos",
          label: "写真",
          severity: "warning",
          detail: `${published - withPhotos}件が絵文字表示のままです`,
          fix: "旅行コンテンツは写真が主役です。編集画面から追加できます。",
        },
  );

  const blockers = checks.filter((c) => c.severity === "blocker").length;
  const warnings = checks.filter((c) => c.severity === "warning").length;

  return {
    launched: isLaunched(),
    checks,
    blockers,
    warnings,
    readyToLaunch: blockers === 0,
  };
}
