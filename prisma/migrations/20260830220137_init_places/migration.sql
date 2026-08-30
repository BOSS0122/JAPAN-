-- CreateTable
CREATE TABLE "Place" (
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

-- CreateTable
CREATE TABLE "PlaceTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placeId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    CONSTRAINT "PlaceTranslation_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlaceTag" (
    "placeId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    PRIMARY KEY ("placeId", "tag"),
    CONSTRAINT "PlaceTag_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");

-- CreateIndex
CREATE INDEX "Place_status_areaKey_idx" ON "Place"("status", "areaKey");

-- CreateIndex
CREATE INDEX "Place_status_category_idx" ON "Place"("status", "category");

-- CreateIndex
CREATE INDEX "PlaceTranslation_locale_idx" ON "PlaceTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceTranslation_placeId_locale_key" ON "PlaceTranslation"("placeId", "locale");

-- CreateIndex
CREATE INDEX "PlaceTag_tag_idx" ON "PlaceTag"("tag");
