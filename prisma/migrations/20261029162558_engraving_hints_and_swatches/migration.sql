-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "backLineHints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "frontLineHints" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "swatch" TEXT;
