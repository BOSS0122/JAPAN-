"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

/**
 * Shown when a page throws. The message is deliberately generic: an exception's
 * own text can carry internal detail, and a traveller can do nothing with it.
 * The digest is included because it is the one string that lets an operator
 * find this exact failure in the logs.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // Where an error reporter (Sentry and the like) is wired in, report here.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-5 py-12 text-center">
      <p aria-hidden className="text-6xl">
        🚧
      </p>
      <h1 className="font-display text-3xl font-extrabold text-ink">{t("errorTitle")}</h1>
      <p className="text-base text-ink-soft">{t("errorBody")}</p>
      <button type="button" onClick={reset} className="jq-btn jq-btn-accent">
        {t("retry")}
      </button>
      {error.digest && (
        <p className="font-mono text-xs text-ink-mute">{t("reference", { id: error.digest })}</p>
      )}
    </div>
  );
}
