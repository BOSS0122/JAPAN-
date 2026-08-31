-- CreateTable
CREATE TABLE "MoodSearchCache" (
    "key" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "semantic" BOOLEAN NOT NULL DEFAULT false,
    "matches" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoodSearchCache_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "MoodSearchCache_expiresAt_idx" ON "MoodSearchCache"("expiresAt");
