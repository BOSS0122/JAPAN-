import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getTripByShareId } from "@/lib/store";
import { addTripNoteAction } from "@/actions";
import { TripClient } from "@/components/TripClient";
import { SectionHeading } from "@/components/ui";

export default async function TripPage({
  params,
}: {
  params: Promise<{ locale: string; shareId: string }>;
}) {
  const { locale, shareId } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("trip");
  const trip = await getTripByShareId(shareId);

  if (!trip) {
    return (
      <div className="jq-card p-10 text-center">
        <p className="text-4xl" aria-hidden>
          🔗
        </p>
        <p className="mt-3 font-display text-xl font-extrabold text-ink">{t("notFound")}</p>
        <Link href="/plan" className="jq-btn jq-btn-accent mt-4">
          {t("title")} →
        </Link>
      </div>
    );
  }

  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/${locale}/trips/${trip.shareId}`;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={trip.ownerLabel}
        title={trip.title}
        sub={t("subtitle")}
      />

      <TripClient trip={trip} shareUrl={shareUrl} />

      <section className="jq-card p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">{t("notes")}</h2>

        <ul className="mt-4 space-y-3">
          {trip.notes.length === 0 && (
            <li className="text-sm text-ink-soft">{t("noNotes")}</li>
          )}
          {trip.notes.map((note) => (
            <li key={note.id} className="rounded-xl bg-cream px-4 py-3">
              <p className="text-sm font-extrabold text-ink">{note.author}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{note.body}</p>
              <p className="mt-1 text-xs text-ink-soft/70">
                {new Date(note.createdAt).toLocaleString(locale)}
              </p>
            </li>
          ))}
        </ul>

        <form action={addTripNoteAction} className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr_auto]">
          <input type="hidden" name="shareId" value={trip.shareId} />
          <input
            name="author"
            className="jq-field"
            placeholder={t("noteAuthor")}
            aria-label={t("noteAuthor")}
          />
          <input
            name="body"
            required
            className="jq-field"
            placeholder={t("notePlaceholder")}
            aria-label={t("notePlaceholder")}
          />
          <button type="submit" className="jq-btn jq-btn-accent">
            {t("addNote")}
          </button>
        </form>
      </section>
    </div>
  );
}
