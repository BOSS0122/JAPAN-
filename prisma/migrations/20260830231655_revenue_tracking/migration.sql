-- CreateTable
CREATE TABLE "PartnerClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "travellerId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "targetRef" TEXT NOT NULL,
    "targetHost" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "placeSlug" TEXT,
    "estimatedValueJpy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PlaceDailyStat" (
    "placeSlug" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "partnerClicks" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "grossJpy" INTEGER NOT NULL DEFAULT 0,
    "commissionJpy" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("placeSlug", "day")
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "placeSlug" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "requests" TEXT NOT NULL DEFAULT '',
    "totalJpy" INTEGER NOT NULL DEFAULT 0,
    "commissionJpy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Booking" ("createdAt", "date", "email", "id", "name", "partySize", "placeSlug", "reference", "requests", "time", "totalJpy", "travellerId") SELECT "createdAt", "date", "email", "id", "name", "partySize", "placeSlug", "reference", "requests", "time", "totalJpy", "travellerId" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");
CREATE INDEX "Booking_travellerId_createdAt_idx" ON "Booking"("travellerId", "createdAt");
CREATE TABLE "new_Place" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "areaKey" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "famous" BOOLEAN NOT NULL DEFAULT false,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "stayMinutes" INTEGER NOT NULL,
    "crowd" TEXT NOT NULL DEFAULT 'normal',
    "indoor" BOOLEAN NOT NULL DEFAULT false,
    "accessible" BOOLEAN NOT NULL DEFAULT true,
    "openHour" INTEGER NOT NULL DEFAULT 9,
    "closeHour" INTEGER NOT NULL DEFAULT 17,
    "priceFrom" INTEGER,
    "bookable" BOOLEAN NOT NULL DEFAULT false,
    "commissionPct" INTEGER NOT NULL DEFAULT 10,
    "externalBookingUrl" TEXT,
    "mealSlot" TEXT,
    "imageEmoji" TEXT NOT NULL DEFAULT '📍',
    "imageFrom" TEXT NOT NULL DEFAULT '#7c4dff',
    "imageTo" TEXT NOT NULL DEFAULT '#0e9cb8',
    "seasonSpring" INTEGER NOT NULL DEFAULT 3,
    "seasonSummer" INTEGER NOT NULL DEFAULT 3,
    "seasonAutumn" INTEGER NOT NULL DEFAULT 3,
    "seasonWinter" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "verifiedAt" DATETIME,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Place" ("accessible", "areaKey", "bookable", "category", "closeHour", "createdAt", "crowd", "externalBookingUrl", "famous", "id", "imageEmoji", "imageFrom", "imageTo", "indoor", "lat", "lng", "mealSlot", "openHour", "prefecture", "priceFrom", "seasonAutumn", "seasonSpring", "seasonSummer", "seasonWinter", "slug", "source", "status", "stayMinutes", "updatedAt", "verifiedAt") SELECT "accessible", "areaKey", "bookable", "category", "closeHour", "createdAt", "crowd", "externalBookingUrl", "famous", "id", "imageEmoji", "imageFrom", "imageTo", "indoor", "lat", "lng", "mealSlot", "openHour", "prefecture", "priceFrom", "seasonAutumn", "seasonSpring", "seasonSummer", "seasonWinter", "slug", "source", "status", "stayMinutes", "updatedAt", "verifiedAt" FROM "Place";
DROP TABLE "Place";
ALTER TABLE "new_Place" RENAME TO "Place";
CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");
CREATE INDEX "Place_status_areaKey_idx" ON "Place"("status", "areaKey");
CREATE INDEX "Place_status_category_idx" ON "Place"("status", "category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PartnerClick_createdAt_idx" ON "PartnerClick"("createdAt");

-- CreateIndex
CREATE INDEX "PartnerClick_partnerId_createdAt_idx" ON "PartnerClick"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "PartnerClick_surface_createdAt_idx" ON "PartnerClick"("surface", "createdAt");

-- CreateIndex
CREATE INDEX "PlaceDailyStat_day_idx" ON "PlaceDailyStat"("day");
