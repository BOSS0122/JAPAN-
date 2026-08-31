import type { MetadataRoute } from "next";
import { absoluteUrl, siteOrigin } from "@/lib/seo";
import { isLaunched } from "@/config/launch";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Before launch the answer is simply no. Letting a crawler index a holding
  // page costs the real launch its first impression in the results.
  if (!isLaunched()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The consoles, the tracked redirect and personal pages are not for
        // the index. /api/go especially: a crawler following hand-offs would
        // fill the click table with referrals nobody made.
        disallow: ["/admin", "/dashboard", "/api/", "/*/you", "/*/trips/", "/*/bookings/", "/*/orders/"],
      },
    ],
    sitemap: siteOrigin() ? absoluteUrl("/sitemap.xml") : undefined,
  };
}
