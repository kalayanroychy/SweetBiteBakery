
const urls = [
    // Frontend Routes
    '/',
    '/products',
    '/products/test-slug',
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

async function testPerformance() {
    console.log('Starting performance test...\n');
    console.log('Route'.padEnd(30) + ' | ' + 'Status'.padEnd(10) + ' | ' + 'Time (ms)');
    console.log('-'.repeat(60));

    for (const url of urls) {
        try {
            const start = performance.now();
            const response = await fetch(`${baseUrl}${url}`);
            const end = performance.now();
            const duration = (end - start).toFixed(2);
            const status = response.status;

            let statusIcon = '✅';
            if (status >= 500) statusIcon = '❌';
            else if (status >= 400) statusIcon = '⚠️';

            console.log(
                `${url}`.padEnd(30) + ' | ' +
                `${statusIcon} ${status}`.padEnd(10) + ' | ' +
                `${duration} ms`
            );

        } catch (error) {
            console.log(`${url}`.padEnd(30) + ' | ' + '❌ Fail' + '    | ' + error.message);
        }
    }
}

testPerformance();
