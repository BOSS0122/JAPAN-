"use client";

import { useTranslations } from "next-intl";
import { useShortlist } from "./shortlist";

export function ShortlistButton({
  id,
  variant = "compact",
}: {
  id: string;
  variant?: "compact" | "full";
}) {
  const t = useTranslations("explore");
  const { has, toggle, ready } = useShortlist();
  const added = ready && has(id);

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggle(id)}
        aria-pressed={added}
        className={`jq-btn w-full sm:w-auto ${added ? "jq-btn-ghost" : "jq-btn-accent"}`}
      >
        <span aria-hidden>{added ? "✓" : "＋"}</span>
        {added ? t("inTrip") : t("addToTrip")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={added}
      aria-label={added ? t("inTrip") : t("addToTrip")}
      className={`jq-chip border-2 transition ${
        added
          ? "border-berry bg-berry text-white"
          : "border-line bg-paper text-ink hover:border-berry hover:text-berry"
      }`}
    >
      <span aria-hidden>{added ? "✓" : "＋"}</span>
      {added ? t("inTrip") : t("addToTrip")}
    </button>
  );
}
