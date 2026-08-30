"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { SERVICE_NAME } from "@/config/site";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useShortlist } from "./shortlist";

const NAV = [
  { href: "/explore", key: "explore" },
  { href: "/plan", key: "plan" },
  { href: "/shop", key: "shop" },
  { href: "/flights", key: "flights" },
  { href: "/hotels", key: "stays" },
  { href: "/support", key: "support" },
  { href: "/rewards", key: "rewards" },
] as const;

export function SiteHeader({ userName }: { userName: string | null }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const { ids, ready } = useShortlist();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-xl bg-berry text-lg text-white"
          >
            ⛩
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">
            {SERVICE_NAME}
          </span>
          <span className="jq-chip hidden bg-grape-soft text-grape sm:inline-flex">
            {tc("demoBadge")}
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm font-bold transition ${
                  active ? "bg-ink text-white" : "text-ink-soft hover:bg-grape-soft hover:text-grape"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/plan"
            className="jq-chip border-2 border-berry bg-berry-soft text-berry"
          >
            <span aria-hidden>🧳</span>
            {ready ? ids.length : 0}
          </Link>
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>
          <Link
            href="/signin"
            className="hidden text-sm font-bold text-ink-soft hover:text-grape sm:block"
          >
            {userName ?? t("signIn")}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={t("menu")}
            className="grid h-9 w-9 place-items-center rounded-xl border-2 border-line bg-paper text-ink lg:hidden"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-paper px-4 py-3 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl bg-cream px-3 py-2 text-sm font-bold text-ink"
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              href="/signin"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-cream px-3 py-2 text-sm font-bold text-ink"
            >
              {userName ?? t("signIn")}
            </Link>
          </div>
          <div className="mt-3 sm:hidden">
            <LocaleSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
