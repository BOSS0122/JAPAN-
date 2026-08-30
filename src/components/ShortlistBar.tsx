"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useShortlist } from "./shortlist";

/** The float-up "n selected → build course" bar. Client-side because the
 *  shortlist lives in the browser until a trip is saved. */
export function ShortlistBar() {
  const t = useTranslations("explore");
  const { ids, ready } = useShortlist();

  if (!ready || ids.length === 0) return null;

  return (
    <div className="sticky bottom-4 z-30 mx-auto w-fit">
      <Link href="/plan" className="jq-btn jq-btn-primary shadow-lg shadow-ink/20">
        <span aria-hidden>🧳</span>
        {t("shortlistCount", { count: ids.length })} · {t("buildCourse")} →
      </Link>
    </div>
  );
}
