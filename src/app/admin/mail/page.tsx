import { requireEditor } from "@/lib/auth/editor";
import { mailLive, getMailProvider, renderBookingMail, renderOrderMail } from "@/lib/mail";
import { getPlaceBySlug } from "@/lib/repo/places";
import { products } from "@/data/commerce";
import { locales } from "@/i18n/routing";
import type { Booking, Order } from "@/lib/store";

/**
 * What a traveller actually receives.
 *
 * Confirmation mail is the one part of the service nobody on the team sees in
 * normal use, which is how it ends up broken in a language nobody checked.
 * Rendered from the real templates with sample records, so it cannot drift.
 */

const sampleBooking = (placeSlug: string): Booking => ({
  id: "sample",
  reference: "JQ-XXXXXX",
  placeId: placeSlug,
  travellerId: "sample",
  date: "2026-09-14",
  time: "10:00",
  partySize: 2,
  name: "Sample Traveller",
  email: "traveller@example.com",
  requests: "",
  totalJpy: 17800,
  commissionJpy: 1780,
  paymentStatus: "uncollected",
  createdAt: new Date().toISOString(),
});

const sampleOrder = (productId: string): Order => ({
  id: "sample",
  reference: "JQ-SXXXXXX",
  travellerId: "sample",
  productId,
  quantity: 1,
  mode: "ship-international",
  destinationCountry: "Australia",
  name: "Sample Traveller",
  email: "traveller@example.com",
  itemJpy: 6500,
  feeJpy: 1000,
  totalJpy: 7500,
  commissionJpy: 1170,
  paymentStatus: "uncollected",
  partnerName: "Imabari Towel Co-op",
  etaDays: 9,
  createdAt: new Date().toISOString(),
});

export default async function MailPreviewPage() {
  await requireEditor();

  const place = await getPlaceBySlug("uji-tea-ceremony");
  const product = products[0];
  const provider = getMailProvider();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">確認メール</h1>
        <p className="text-sm text-ink-soft">
          実際のテンプレートをサンプルデータで描画しています。表示と実際の送信内容がずれることはありません。
        </p>
      </div>

      <p
        className={`jq-card p-4 text-sm font-bold ${
          mailLive() ? "text-matcha" : "border-2 border-sunshine text-[#6b4700]"
        }`}
      >
        送信方法: {provider.name}
        {!mailLive() && "（実際には配信されません。MAIL_PROVIDER を設定してください）"}
      </p>

      {place && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-extrabold text-ink">予約確認</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {locales.map((locale) => {
              const mail = renderBookingMail(sampleBooking(place.id), place, locale);
              return <MailCard key={locale} locale={locale} subject={mail.subject} body={mail.text} />;
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-ink">注文確認</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {locales.map((locale) => {
            const mail = renderOrderMail(sampleOrder(product.id), product, locale);
            return <MailCard key={locale} locale={locale} subject={mail.subject} body={mail.text} />;
          })}
        </div>
      </section>
    </div>
  );
}

function MailCard({
  locale,
  subject,
  body,
}: {
  locale: string;
  subject: string;
  body: string;
}) {
  return (
    <div className="jq-card overflow-hidden">
      <div className="border-b border-line bg-cream px-4 py-2.5">
        <p className="jq-chip bg-grape-soft text-grape">{locale}</p>
        <p className="mt-1 font-display text-sm font-extrabold text-ink">{subject}</p>
      </div>
      {/* Pre, because the mail is plain text and its line breaks are the layout. */}
      <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed text-ink-soft">
        {body}
      </pre>
    </div>
  );
}
