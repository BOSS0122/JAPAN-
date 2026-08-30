import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export const TRAVELLER_COOKIE = "jq_traveller";

/** The internal consoles sit outside the localized traveller app. */
const UNLOCALIZED = /^\/(admin|dashboard|api)(\/|$)/;

/**
 * Content Security Policy.
 *
 * Scripts are allowed only from this origin and only with the request's nonce,
 * so an injected inline script does not run even if one is ever rendered.
 * `strict-dynamic` lets Next's own bootstrap load the chunks it needs without
 * listing every one. Styles still need 'unsafe-inline': Tailwind and the
 * inline `style` attributes this app uses for gradients cannot carry a nonce.
 *
 * Development is exempt because Turbopack's HMR client uses eval, and a policy
 * that only ever runs in production is a policy nobody has tested. It is
 * applied in dev too, with the two allowances HMR requires.
 */
function contentSecurityPolicy(nonce: string, dev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    // data: covers the inline SVG chevron on selects; blob: covers map canvases.
    "img-src 'self' data: blob: https:",
    `connect-src 'self'${dev ? " ws: http:" : ""}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  // Partners get the click; they do not get the traveller's itinerary in a URL.
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=()",
};

export default function proxy(request: NextRequest) {
  const dev = process.env.NODE_ENV !== "production";
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = contentSecurityPolicy(nonce, dev);

  // Next reads the nonce back off this request header and stamps it onto the
  // scripts it renders; without it the page would load nothing of its own.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = UNLOCALIZED.test(request.nextUrl.pathname)
    ? NextResponse.next({ request: { headers: requestHeaders } })
    : intlMiddleware(new NextRequest(request, { headers: requestHeaders }));

  response.headers.set("Content-Security-Policy", csp);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  // Only meaningful over TLS, and actively harmful to set in local development.
  if (!dev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  // Anonymous device id: stamp rallies, bookings and check-ins hang off this.
  if (!request.cookies.get(TRAVELLER_COOKIE)) {
    response.cookies.set(TRAVELLER_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: !dev,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}

export const config = {
  // Everything except static assets: the consoles need the security headers
  // too, they just skip the locale routing.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|txt|xml)$).*)"],
};
