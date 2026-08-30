-- CreateTable
CREATE TABLE "PlacePhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "credit" TEXT NOT NULL DEFAULT '',
    "creditUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "storageKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlacePhoto_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlacePhoto_placeId_position_idx" ON "PlacePhoto"("placeId", "position");
