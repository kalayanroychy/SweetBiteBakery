
import "dotenv/config";
import { getDb } from "../server/db";
import { products } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
    console.log("🌱 Seeding featured products...");

    try {
        const db = getDb();
        if (!db) {
            console.error("❌ Failed to initialize database connection. Check DATABASE_URL.");
            process.exit(1);
        }

        // Get all products to see what we have
        const allProducts = await db.select().from(products);
        console.log(`Found ${allProducts.length} total products.`);

        if (allProducts.length === 0) {
            console.log("No products found in database. Please run initial data seed first.");
            process.exit(1);
        }

        // Pick first 4 products to feature
        const productsToFeature = allProducts.slice(0, 4).map(p => p.id);

        if (productsToFeature.length > 0) {
            console.log(`Marking products IDs ${productsToFeature.join(', ')} as featured...`);

            await db
                .update(products)
                .set({ featured: true })
                .where(inArray(products.id, productsToFeature));

            console.log("✅ Successfully updated featured products.");
        } else {
            console.log("⚠️ No products available to feature.");
        }

    } catch (error) {
        console.error("❌ Error seeding featured products:", error);
        process.exit(1);
    }

    process.exit(0);
}

main();
