-- Adds PartnerClick.day (YYYY-MM-DD, JST). Existing rows are backfilled from
-- their own timestamp rather than defaulted, so history stays truthful.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PartnerClick" (
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
    "day" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PartnerClick" ("day", "createdAt", "estimatedValueJpy", "id", "locale", "partnerId", "partnerName", "placeSlug", "surface", "targetHost", "targetRef", "travellerId") SELECT date("createdAt", '+9 hours'), "createdAt", "estimatedValueJpy", "id", "locale", "partnerId", "partnerName", "placeSlug", "surface", "targetHost", "targetRef", "travellerId" FROM "PartnerClick";
DROP TABLE "PartnerClick";
ALTER TABLE "new_PartnerClick" RENAME TO "PartnerClick";
CREATE INDEX "PartnerClick_day_idx" ON "PartnerClick"("day");
CREATE INDEX "PartnerClick_createdAt_idx" ON "PartnerClick"("createdAt");
CREATE INDEX "PartnerClick_partnerId_createdAt_idx" ON "PartnerClick"("partnerId", "createdAt");
CREATE INDEX "PartnerClick_surface_createdAt_idx" ON "PartnerClick"("surface", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
