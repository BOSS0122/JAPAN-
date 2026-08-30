-- CreateTable
CREATE TABLE "Editor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "EditorSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "EditorSession_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "Editor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlaceRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placeSlug" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "editorId" TEXT,
    "editorEmail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlaceRevision_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "Editor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
