
const url = 'http://localhost:5000/api/products';

async function testApiLatency() {
    console.log('Testing /api/products latency (5 requests)...');
    console.log('Attempt | Status | Time (ms)');
    console.log('-'.repeat(35));

    for (let i = 1; i <= 5; i++) {
        try {
            const start = performance.now();
            const response = await fetch(url);
            const end = performance.now();
            const duration = (end - start).toFixed(0);

            console.log(
                `#${i}`.padEnd(7) + ' | ' +
                `${response.status}`.padEnd(6) + ' | ' +
                `${duration} ms`
            );

            // Small delay between requests
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.log(`#${i}      | FAIL   | ${error.message}`);
        }
    }
}

testApiLatency();
