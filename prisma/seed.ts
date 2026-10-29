import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { products } from "../src/lib/seed-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — copy .env.example to .env.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// The admin portal owns the catalogue once it is loaded: by default the seed only adds missing products.
// `npm run db:seed -- --reset` rewrites the seed products (prices, stock, finishes) from the dataset.
const reset = process.argv.includes("--reset");

async function main() {
  let skipped = 0;
  for (const { variants, volumeTiers, ...product } of products) {
    if (!reset && (await prisma.product.findUnique({ where: { slug: product.slug }, select: { id: true } }))) {
      skipped++;
      continue;
    }
    // Idempotent: upsert the product by slug, then rebuild its variants and tiers from the dataset.
    await prisma.$transaction(async (tx) => {
      const { id } = await tx.product.upsert({
        where: { slug: product.slug },
        create: product,
        update: product,
      });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.volumeTier.deleteMany({ where: { productId: id } });
      await tx.productVariant.createMany({
        data: variants.map((variant, sortOrder) => ({ ...variant, sortOrder, productId: id })),
      });
      if (volumeTiers.length > 0) {
        await tx.volumeTier.createMany({ data: volumeTiers.map((tier) => ({ ...tier, productId: id })) });
      }
    });
    console.log(`✓ ${product.branch.padEnd(9)} ${product.blankSku.padEnd(18)} ${product.name}`);
  }
  console.log(
    `Seeded ${products.length - skipped} products${skipped ? `, kept ${skipped} existing (use --reset to overwrite them)` : ""}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
