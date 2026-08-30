import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { site, SERVICE_NAME } from "@/config/site";
import { getUser } from "@/lib/session";
import { ShortlistProvider } from "@/components/shortlist";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tagline = site.tagline[locale as keyof typeof site.tagline] ?? site.tagline.en;
  return {
    title: { default: `${SERVICE_NAME} — ${tagline}`, template: `%s · ${SERVICE_NAME}` },
    description: tagline,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [user, t] = await Promise.all([getUser(), getTranslations("common")]);

  return (
    <html lang={locale}>
      <body className="min-h-dvh font-sans antialiased">
        <NextIntlClientProvider>
          <ShortlistProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
            >
              {t("next")}
            </a>
            <SiteHeader userName={user?.name ?? null} />
            <main id="main" className="mx-auto max-w-7xl px-4 py-8">
              {children}
            </main>
            <SiteFooter />
          </ShortlistProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
