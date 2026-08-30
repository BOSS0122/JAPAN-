import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getTravellerId } from "@/lib/session";
import { bumpPlaceStat, jstDay } from "@/lib/repo/revenue";
import { verifyPartnerLink } from "@/lib/partner-link";

/**
 * The affiliate hand-off. Records the click, then redirects.
 *
 * Only URLs this server signed are followed — see src/lib/partner-link.ts for
 * why that matters. An unsigned or tampered link is a 400, never a redirect.
 */
export async function GET(request: NextRequest) {
  const data = request.nextUrl.searchParams.get("d");
  const signature = request.nextUrl.searchParams.get("s");
  if (!data || !signature) {
    return NextResponse.json({ error: "Missing link" }, { status: 400 });
  }

  const target = verifyPartnerLink(data, signature);
  if (!target) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const travellerId = await getTravellerId();
  const locale = request.nextUrl.searchParams.get("l") ?? "en";

  try {
    await prisma.partnerClick.create({
      data: {
        travellerId,
        surface: target.surface,
        partnerId: target.partnerId,
        partnerName: target.partnerName,
        targetRef: target.ref,
        targetHost: new URL(target.url).hostname,
        locale,
        placeSlug: target.placeSlug ?? null,
        estimatedValueJpy: target.estimatedValueJpy ?? 0,
        day: jstDay(),
      },
    });
    if (target.placeSlug) await bumpPlaceStat(target.placeSlug, { partnerClicks: 1 });
  } catch {
    // Never strand a traveller because our bookkeeping failed. We would rather
    // lose the row than the referral it was counting.
  }

  const response = NextResponse.redirect(target.url, 302);
  // Partners need to see the click; they do not need the traveller's browsing
  // history, and a full referrer would leak the itinerary in the URL.
  response.headers.set("Referrer-Policy", "strict-origin");
  return response;
}
