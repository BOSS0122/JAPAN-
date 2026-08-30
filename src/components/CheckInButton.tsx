"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleVisitAction } from "@/actions";

export function CheckInButton({
  placeId,
  initialVisited,
}: {
  placeId: string;
  initialVisited: boolean;
}) {
  const t = useTranslations("rewards");
  const [visited, setVisited] = useState(initialVisited);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setVisited(await toggleVisitAction(placeId));
        })
      }
      aria-pressed={visited}
      className={`jq-btn ${visited ? "jq-btn-ghost" : "jq-btn-primary"}`}
    >
      <span aria-hidden>{visited ? "🏅" : "📍"}</span>
      {visited ? t("checkedIn") : t("checkIn")}
    </button>
  );
}
