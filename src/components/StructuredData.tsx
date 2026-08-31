import type { Place } from "@/data/types";
import { t as localized } from "@/lib/localized";
import { absoluteUrl, siteOrigin } from "@/lib/seo";
import { SERVICE_NAME } from "@/config/site";

/**
 * schema.org JSON-LD.
 *
 * This is how a place page earns a rich result instead of a blue link — for a
 * discovery service, the difference in click-through is the whole game. Each
 * type is chosen to match what the place actually is; labelling a restaurant a
 * TouristAttraction is the kind of mismatch that gets structured data ignored.
 *
 * Only facts already visible on the page are emitted. Marking up something the
 * reader cannot see is what the guidelines call out, and it is also just lying.
 */

const SCHEMA_TYPE: Record<Place["category"], string> = {
  spot: "TouristAttraction",
  experience: "TouristAttraction",
  restaurant: "Restaurant",
};

function json(data: unknown) {
  // Escaping "<" keeps a description containing markup from closing the tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function PlaceJsonLd({ place, locale }: { place: Place; locale: string }) {
  const origin = siteOrigin();
  if (!origin) return null;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[place.category],
    name: localized(place.name, locale),
    description: localized(place.description, locale),
    url: absoluteUrl(`/${locale}/places/${place.id}`),
    address: {
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: place.prefecture,
      addressLocality: localized(place.area, locale),
    },
    geo: { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng },
    isAccessibleForFree: place.priceFrom == null,
    publicAccess: true,
  };

  if (place.photos.length > 0) {
    data.image = place.photos.map((photo) => absoluteUrl(photo.url));
  }
  if (place.priceFrom != null) {
    data.offers = {
      "@type": "Offer",
      price: place.priceFrom,
      priceCurrency: "JPY",
      availability: "https://schema.org/InStock",
    };
  }
  if (place.category === "restaurant") {
    data.servesCuisine = "Japanese";
    data.openingHours = `Mo-Su ${String(place.openHour).padStart(2, "0")}:00-${String(
      place.closeHour,
    ).padStart(2, "0")}:00`;
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(data) }} />
  );
}

export function SiteJsonLd({ locale }: { locale: string }) {
  const origin = siteOrigin();
  if (!origin) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: json({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SERVICE_NAME,
          url: absoluteUrl(`/${locale}`),
          inLanguage: locale,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: absoluteUrl(`/${locale}/explore?q={search_term_string}`),
            },
            "query-input": "required name=search_term_string",
          },
        }),
      }}
    />
  );
}
