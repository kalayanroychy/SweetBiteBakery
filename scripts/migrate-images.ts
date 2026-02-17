
import "dotenv/config";
import { getDb } from "../server/db";
import { products } from "../shared/schema";
import { optimizeImage } from "../server/utils/image";
import { eq } from "drizzle-orm";

async function runMigration() {
    console.log("Starting Image Migration...");

    try {
        const db = getDb();
        if (!db) throw new Error("DB not initialized");

        const allProducts = await db.select().from(products);
        console.log(`Found ${allProducts.length} products to process.`);

        let totalSavedBytes = 0;

        for (const product of allProducts) {
            console.log(`Processing product: ${product.name} (ID: ${product.id})`);

            let changed = false;
            let initialSize = 0;
            let finalSize = 0;

            // Optimize Main Image
            if (product.image) {
                initialSize += product.image.length;
                const optimized = await optimizeImage(product.image);
                if (optimized !== product.image) {
                    product.image = optimized;
                    changed = true;
                }
                finalSize += product.image.length;
            }

            // Optimize Images Array
            if (product.images && Array.isArray(product.images)) {
                const optimizedImages = await Promise.all(
                    product.images.map(async img => {
                        initialSize += img.length;
                        const opt = await optimizeImage(img);
                        finalSize += opt.length;
                        if (opt !== img) changed = true;
                        return opt;
                    })
                );
                product.images = optimizedImages;
            }

            if (changed) {
                await db.update(products)
                    .set({
                        image: product.image,
                        images: product.images
                    })
                    .where(eq(products.id, product.id));

                const saved = initialSize - finalSize;
                totalSavedBytes += saved;
                console.log(`  ✅ Optimized! Saved ${(saved / 1024).toFixed(2)} KB`);
            } else {
                console.log(`  Skipped (Already optimized or empty)`);
            }
        }

        console.log("\n--------------------------------");
        console.log(`Migration Complete.`);
        console.log(`Total Space Saved: ${(totalSavedBytes / (1024 * 1024)).toFixed(2)} MB`);

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit(0);
    }
}

runMigration();
