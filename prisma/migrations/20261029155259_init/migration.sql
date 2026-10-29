-- CreateEnum
CREATE TYPE "Branch" AS ENUM ('pet', 'jewelry', 'vault', 'corporate');

-- CreateEnum
CREATE TYPE "Machine" AS ENUM ('M20_NEW_GEN', 'M20_OLD_GEN_1', 'M20_OLD_GEN_2');

-- CreateEnum
CREATE TYPE "EngravingMethod" AS ENUM ('DIAMOND_DRAG', 'ROTARY_MILLING');

-- CreateEnum
CREATE TYPE "Material" AS ENUM ('BRASS', 'STAINLESS_316L', 'SILVER_925', 'TITANIUM', 'LEATHER', 'WOOD', 'CERAMIC');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID_NEW', 'ASSIGNED_TO_M20', 'ENGRAVING', 'FINISHING_ULTRASONIC', 'PACKAGING', 'SHIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "EngravingSides" AS ENUM ('FRONT', 'FRONT_AND_BACK');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "branch" "Branch" NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceBani" INTEGER NOT NULL,
    "highlights" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visual" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sampleEngraving" TEXT[],
    "widthMm" DOUBLE PRECISION NOT NULL,
    "heightMm" DOUBLE PRECISION NOT NULL,
    "depthMm" DOUBLE PRECISION NOT NULL,
    "weightGrams" DOUBLE PRECISION NOT NULL,
    "blankSku" TEXT NOT NULL,
    "material" "Material" NOT NULL,
    "engraveWidthMm" DOUBLE PRECISION NOT NULL,
    "engraveHeightMm" DOUBLE PRECISION NOT NULL,
    "engraveDepthMm" DOUBLE PRECISION NOT NULL,
    "recommendedMachine" "Machine" NOT NULL,
    "engravingMethod" "EngravingMethod" NOT NULL,
    "toolRecommendation" TEXT NOT NULL,
    "maxCharsPerLine" INTEGER NOT NULL,
    "maxLines" INTEGER NOT NULL,
    "backEngravingAvailable" BOOLEAN NOT NULL DEFAULT false,
    "backEngravingPriceBani" INTEGER NOT NULL DEFAULT 0,
    "symbolSets" TEXT[],
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "material" "Material" NOT NULL,
    "priceDeltaBani" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolumeTier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL,

    CONSTRAINT "VolumeTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "customerType" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "billingName" TEXT NOT NULL,
    "billingAddress" TEXT NOT NULL,
    "billingCity" TEXT NOT NULL,
    "billingCounty" TEXT NOT NULL,
    "billingPostalCode" TEXT NOT NULL,
    "companyName" TEXT,
    "companyCui" TEXT,
    "companyRegCom" TEXT,
    "shippingName" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "shippingCity" TEXT NOT NULL,
    "shippingCounty" TEXT NOT NULL,
    "shippingPostalCode" TEXT NOT NULL,
    "subtotalBani" INTEGER NOT NULL,
    "shippingBani" INTEGER NOT NULL,
    "totalBani" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RON',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "courierName" TEXT,
    "awbNumber" TEXT,
    "shippedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "branch" "Branch" NOT NULL,
    "productName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "blankSku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceBani" INTEGER NOT NULL,
    "engravingSides" "EngravingSides" NOT NULL DEFAULT 'FRONT',
    "fontKey" TEXT NOT NULL,
    "frontLines" TEXT[],
    "backLines" TEXT[],
    "symbolKey" TEXT,
    "customUploadUrl" TEXT,
    "giftPackaging" BOOLEAN NOT NULL DEFAULT false,
    "assignedMachine" "Machine",

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_blankSku_key" ON "Product"("blankSku");

-- CreateIndex
CREATE INDEX "Product_branch_isActive_sortOrder_idx" ON "Product"("branch", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_name_key" ON "ProductVariant"("productId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "VolumeTier_productId_minQuantity_key" ON "VolumeTier"("productId", "minQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeCheckoutSessionId_key" ON "Order"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_assignedMachine_idx" ON "OrderItem"("assignedMachine");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolumeTier" ADD CONSTRAINT "VolumeTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
