import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma";
import { places } from "../src/data/places";
import { locales } from "../src/i18n/routing";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // rely on the ambient environment
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
});

/**
 * Seeds the database from the original in-repo catalogue. Idempotent: running it
 * again updates the same rows rather than duplicating them.
 */
async function main() {
  for (const place of places) {
    const scalars = {
      category: place.category,
      areaKey: place.areaKey,
      prefecture: place.prefecture,
      famous: place.famous,
      lat: place.lat,
      lng: place.lng,
      stayMinutes: place.stayMinutes,
      crowd: place.crowd,
      indoor: place.indoor,
      accessible: place.accessible,
      openHour: place.openHour,
      closeHour: place.closeHour,
      priceFrom: place.priceFrom ?? null,
      bookable: place.bookable,
      externalBookingUrl: place.externalBookingUrl ?? null,
      mealSlot: place.mealSlot ?? null,
      imageEmoji: place.image.emoji,
      // Lowercased to match what the editor console's colour inputs write, so
      // the first save of a seeded place doesn't log a change nobody made.
      imageFrom: place.image.from.toLowerCase(),
      imageTo: place.image.to.toLowerCase(),
      seasonSpring: place.seasonScore.spring,
      seasonSummer: place.seasonScore.summer,
      seasonAutumn: place.seasonScore.autumn,
      seasonWinter: place.seasonScore.winter,
      status: "published",
      // Seeded content is hand-written, so it counts as confirmed today.
      verifiedAt: new Date(),
      source: "seed",
    };

    await prisma.place.upsert({
      where: { slug: place.id },
      update: scalars,
      create: { slug: place.id, ...scalars },
    });

    const row = await prisma.place.findUniqueOrThrow({ where: { slug: place.id } });

    await prisma.placeTranslation.deleteMany({ where: { placeId: row.id } });
    await prisma.placeTranslation.createMany({
      data: locales.map((locale) => ({
        placeId: row.id,
        locale,
        name: place.name[locale],
        description: place.description[locale],
        area: place.area[locale],
      })),
    });

    await prisma.placeTag.deleteMany({ where: { placeId: row.id } });
    await prisma.placeTag.createMany({
      data: place.tags.map((tag) => ({ placeId: row.id, tag })),
    });
  }

  const count = await prisma.place.count();
  console.log(`seeded ${places.length} places · ${count} rows in the database`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
