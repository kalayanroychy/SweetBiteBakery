const { Client } = require('pg');
require('dotenv').config({ path: '/var/www/sweetbite-bakery/.env' });

console.log('--- Database Diagnostic Tool ---');
console.log('Time:', new Date().toISOString());

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('❌ DATABASE_URL is NOT set in .env');
    process.exit(1);
}

// Mask password for safety
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
console.log('✅ DATABASE_URL is set:', maskedUrl);

const client = new Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log('Attempting to connect to PostgreSQL...');
        await client.connect();
        console.log('✅ Connection successful!');

        console.log('Checking for tables...');
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        if (tables.rows.length === 0) {
            console.warn('⚠️  Connected, but NO tables found! Did you run migrations?');
        } else {
            console.log('✅ Tables found:', tables.rows.map(r => r.table_name).join(', '));

            // Specific check for products
            const products = await client.query('SELECT count(*) FROM products');
            console.log(`📊 Number of products: ${products.rows[0].count}`);
        }

    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        if (err.message.includes('password')) {
            console.error('   Hint: Check your database password in .env');
        }
        if (err.message.includes('connect ECONNREFUSED')) {
            console.error('   Hint: Is PostgreSQL running? Try: systemctl status postgresql');
        }
    } finally {
        await client.end();
    }
}

check();
