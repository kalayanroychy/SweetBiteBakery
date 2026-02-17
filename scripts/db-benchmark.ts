
import "dotenv/config";
import { getDb } from "../server/db";
import { products } from "../shared/schema";

async function runBenchmark() {
    console.log("Measuring Load Time...");
    const start = Date.now();

    try {
        const db = getDb();
        if (!db) throw new Error("DB not initialized");

        const result = await db.select().from(products).limit(6);
        const end = Date.now();

        console.log(`Time Taken: ${end - start}ms`);
        console.log(`Products Fetched: ${result.length}`);

    } catch (error) {
        console.error("Benchmark failed:", error);
    } finally {
        process.exit(0);
    }
}

runBenchmark();
