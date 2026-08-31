-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "areaKey" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "famous" BOOLEAN NOT NULL DEFAULT false,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
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
    "verifiedAt" TIMESTAMP(3),
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceTranslation" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "area" TEXT NOT NULL,

    CONSTRAINT "PlaceTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceTag" (
    "placeId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "PlaceTag_pkey" PRIMARY KEY ("placeId","tag")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerLabel" TEXT NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 2,
    "stamina" TEXT NOT NULL DEFAULT 'standard',
    "accessibleOnly" BOOLEAN NOT NULL DEFAULT false,
    "startHour" INTEGER NOT NULL DEFAULT 9,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripStop" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "placeSlug" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "TripStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripNote" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "pickupPointId" TEXT,
    "destinationCountry" TEXT,
    "hotelName" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "itemJpy" INTEGER NOT NULL,
    "feeJpy" INTEGER NOT NULL,
    "totalJpy" INTEGER NOT NULL,
    "commissionJpy" INTEGER NOT NULL,
    "partnerName" TEXT NOT NULL,
    "etaDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "travellerId" TEXT NOT NULL,
    "placeSlug" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("travellerId","placeSlug")
);

-- CreateTable
CREATE TABLE "Editor" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "Editor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceRevision" (
    "id" TEXT NOT NULL,
    "placeSlug" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "editorId" TEXT,
    "editorEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaceRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacePhoto" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "credit" TEXT NOT NULL DEFAULT '',
    "creditUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "storageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerClick" (
    "id" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "targetRef" TEXT NOT NULL,
    "targetHost" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "placeSlug" TEXT,
    "estimatedValueJpy" INTEGER NOT NULL DEFAULT 0,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerClick_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "PlaceDailyStat_pkey" PRIMARY KEY ("placeSlug","day")
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

-- CreateIndex
CREATE UNIQUE INDEX "Trip_shareId_key" ON "Trip"("shareId");

-- CreateIndex
CREATE INDEX "TripStop_tripId_position_idx" ON "TripStop"("tripId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "TripStop_tripId_placeSlug_key" ON "TripStop"("tripId", "placeSlug");

-- CreateIndex
CREATE INDEX "TripNote_tripId_createdAt_idx" ON "TripNote"("tripId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

-- CreateIndex
CREATE INDEX "Booking_travellerId_createdAt_idx" ON "Booking"("travellerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");

-- CreateIndex
CREATE INDEX "Order_travellerId_createdAt_idx" ON "Order"("travellerId", "createdAt");

-- CreateIndex
CREATE INDEX "Visit_travellerId_idx" ON "Visit"("travellerId");

-- CreateIndex
CREATE UNIQUE INDEX "Editor_email_key" ON "Editor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EditorSession_tokenHash_key" ON "EditorSession"("tokenHash");

-- CreateIndex
CREATE INDEX "EditorSession_expiresAt_idx" ON "EditorSession"("expiresAt");

-- CreateIndex
CREATE INDEX "PlaceRevision_placeSlug_createdAt_idx" ON "PlaceRevision"("placeSlug", "createdAt");

-- CreateIndex
CREATE INDEX "PlaceRevision_createdAt_idx" ON "PlaceRevision"("createdAt");

-- CreateIndex
CREATE INDEX "PlacePhoto_placeId_position_idx" ON "PlacePhoto"("placeId", "position");

-- CreateIndex
CREATE INDEX "PartnerClick_day_idx" ON "PartnerClick"("day");

-- CreateIndex
CREATE INDEX "PartnerClick_createdAt_idx" ON "PartnerClick"("createdAt");

-- CreateIndex
CREATE INDEX "PartnerClick_partnerId_createdAt_idx" ON "PartnerClick"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "PartnerClick_surface_createdAt_idx" ON "PartnerClick"("surface", "createdAt");

-- CreateIndex
CREATE INDEX "PlaceDailyStat_day_idx" ON "PlaceDailyStat"("day");

-- AddForeignKey
ALTER TABLE "PlaceTranslation" ADD CONSTRAINT "PlaceTranslation_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceTag" ADD CONSTRAINT "PlaceTag_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripNote" ADD CONSTRAINT "TripNote_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorSession" ADD CONSTRAINT "EditorSession_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "Editor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceRevision" ADD CONSTRAINT "PlaceRevision_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "Editor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacePhoto" ADD CONSTRAINT "PlacePhoto_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
