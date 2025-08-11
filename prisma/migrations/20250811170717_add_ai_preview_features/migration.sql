-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "aiPreviewUrl" TEXT,
ADD COLUMN     "compressionRatio" DOUBLE PRECISION,
ADD COLUMN     "highQualityUrl" TEXT,
ADD COLUMN     "keyMoments" TEXT[],
ADD COLUMN     "originalQualityUrl" TEXT,
ADD COLUMN     "previewDuration" INTEGER,
ADD COLUMN     "thumbnailUrl" TEXT;
