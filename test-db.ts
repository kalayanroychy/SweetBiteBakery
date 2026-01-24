
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    console.log("--- Database Connection Test ---");
    console.log("Checking environment...");

    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("❌ DATABASE_URL is missing in .env");
        return;
    }

    // Mask password for logging
    const maskedUrl = url.replace(/:([^:@]+)@/, ':****@');
    console.log(`Target URL: ${maskedUrl}`);

    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    console.log(`Connection Mode: ${isLocal ? 'Local/Tunnel (SSL Disabled)' : 'Remote (SSL Required)'}`);

    const pool = new Pool({
        connectionString: url,
        connectionTimeoutMillis: 5000, // 5 second timeout
        ssl: isLocal ? false : { rejectUnauthorized: false }
    });

    try {
        console.log("Attempting to connect...");
        const client = await pool.connect();
        console.log("✅ Socket connected!");

        console.log("Running query: SELECT NOW()...");
        const res = await client.query('SELECT NOW()');
        console.log(`✅ Query successful! Server time: ${res.rows[0].now}`);

        client.release();
    } catch (err: any) {
        console.error("❌ Connection Failed!");
        console.error(`Error Name: ${err.name}`);
        console.error(`Error Message: ${err.message}`);
        console.error(`Code: ${err.code}`);

        if (err.message.includes('timeout')) {
            console.log("\n💡 SUGGESTION: This looks like a timeout.");
            console.log("1. Is the 'connect-db.bat' script running?");
            console.log("2. Did the tunnel script say 'Tunnel active'?");
            console.log("3. Is something else running on port 5432 locally?");
        } else if (err.code === 'ECONNREFUSED') {
            console.log("\n💡 SUGGESTION: Connection refused.");
            console.log("The tunnel is likely closed or not listening on port 5432.");
        }
    } finally {
        await pool.end();
    }
}

testConnection();
