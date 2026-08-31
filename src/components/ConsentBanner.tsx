"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Link } from "@/i18n/navigation";
import { setConsentAction } from "@/actions";

/**
 * Shown until a choice is made. Accept and decline are the same size and the
 * same weight — a decline styled as the lesser option is a dark pattern, and
 * an unequal pair is the thing regulators actually cite.
 */
export function ConsentBanner() {
  const t = useTranslations("consent");
  const [pending, startTransition] = useTransition();

  function choose(choice: "granted" | "declined") {
    startTransition(async () => {
      await setConsentAction(choice);
    });
  }

  return (
    <div
      role="dialog"
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-line bg-paper p-4 shadow-lg shadow-ink/10"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 text-sm text-ink-soft">
          {t("body")}{" "}
          <Link href="/legal/privacy" className="font-bold text-grape underline">
            {t("readMore")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => choose("declined")}
            className="jq-btn jq-btn-ghost flex-1 sm:flex-none"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => choose("granted")}
            className="jq-btn jq-btn-ghost flex-1 sm:flex-none"
          >
            {t("accept")}
          </button>
        </div>
      </div>
      <p className="mx-auto mt-2 max-w-4xl text-xs text-ink-mute">{t("necessary")}</p>
    </div>
  );
}
