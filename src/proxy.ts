import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export const TRAVELLER_COOKIE = "jq_traveller";

export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  // Anonymous device id: stamp rallies, bookings and check-ins hang off this
  // until real accounts exist.
  if (!request.cookies.get(TRAVELLER_COOKIE)) {
    response.cookies.set(TRAVELLER_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}

export const config = {
  // /dashboard is the B2B console and stays outside the localized traveller app.
  matcher: ["/", "/(en|ja|th)/:path*", "/((?!api|dashboard|_next|_vercel|.*\\..*).*)"],
};
