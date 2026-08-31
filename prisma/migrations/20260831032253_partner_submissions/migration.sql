-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "ownerEditorId" TEXT,
ADD COLUMN     "reviewNote" TEXT;

-- CreateIndex
CREATE INDEX "Place_ownerEditorId_status_idx" ON "Place"("ownerEditorId", "status");

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_ownerEditorId_fkey" FOREIGN KEY ("ownerEditorId") REFERENCES "Editor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
