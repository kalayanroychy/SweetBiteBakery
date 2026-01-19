
const urls = [
    // Frontend Routes
    '/',
    '/products',
    '/products/test-slug', // dynamic param
    '/cart',
    '/checkout',
    '/order-confirmation',
    '/about',
    '/contact',
    '/register',
    '/login',
    '/user-panel',
    '/admin/login',

    // API Routes
    '/api/products',
    '/api/categories',
    '/api/products/featured'
];

const baseUrl = 'http://localhost:5000';

async function testRoutes() {
    console.log('Starting connectivity test...');
    let hasError = false;

    for (const url of urls) {
        try {
            const response = await fetch(`${baseUrl}${url}`);
            const status = response.status;

            // For frontend routes, 200 is expected.
            // For some API routes, 200 or 404 (if data missing) is "connection success".
            // We mainly want to avoid 500 crashes.

            if (status >= 500) {
                console.log(`❌ ${url} - Status: ${status} (Server Error)`);
                hasError = true;
            } else if (status === 200) {
                console.log(`✅ ${url} - Status: ${status} (OK)`);
            } else {
                console.log(`⚠️ ${url} - Status: ${status} (Other)`);
            }

        } catch (error) {
            console.log(`❌ ${url} - Failed to connect: ${error.message}`);
            hasError = true;
        }
    }

    if (hasError) {
        console.log('\nSome tests failed. Check server logs.');
        process.exit(1);
    } else {
        console.log('\nAll checked routes are reachable.');
    }
}

testRoutes();
