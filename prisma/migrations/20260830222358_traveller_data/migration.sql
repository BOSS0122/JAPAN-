-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerLabel" TEXT NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 2,
    "stamina" TEXT NOT NULL DEFAULT 'standard',
    "accessibleOnly" BOOLEAN NOT NULL DEFAULT false,
    "startHour" INTEGER NOT NULL DEFAULT 9,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TripStop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "placeSlug" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "TripStop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripNote_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Visit" (
    "travellerId" TEXT NOT NULL,
    "placeSlug" TEXT NOT NULL,
    "visitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("travellerId", "placeSlug")
);

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
