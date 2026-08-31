-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentRef" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'uncollected';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentRef" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'uncollected';
