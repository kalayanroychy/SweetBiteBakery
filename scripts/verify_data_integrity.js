
const baseUrl = 'http://localhost:5000';

async function verifyData() {
    console.log('Starting Data Integrity Verification...');
    console.log('Endpoint'.padEnd(30) + ' | ' + 'Status'.padEnd(10) + ' | ' + 'Data Check');
    console.log('-'.repeat(80));

    let allPassed = true;

    // 1. Verify Categories
    try {
        const res = await fetch(`${baseUrl}/api/categories`);
        const data = await res.json();
        const passed = Array.isArray(data) && data.length > 0;
        const details = passed ? `✅ Found ${data.length} categories` : '❌ Empty or invalid';
        console.log('/api/categories'.padEnd(30) + ' | ' + `${res.status}`.padEnd(10) + ' | ' + details);
        if (!passed) allPassed = false;
    } catch (e) {
        console.log('/api/categories'.padEnd(30) + ' | ' + 'FAIL'.padEnd(10) + ' | ' + e.message);
        allPassed = false;
    }

    // 2. Verify Products
    try {
        const res = await fetch(`${baseUrl}/api/products`);
        const data = await res.json();
        const passed = Array.isArray(data) && data.length > 0;

        let details = '❌ Empty or invalid';
        if (passed) {
            const sample = data[0];
            const hasCategory = sample.category && sample.category.name;
            details = `✅ Found ${data.length} products. Sample: ${sample.name} (${sample.price}). Category Linked: ${!!hasCategory}`;
        }

        console.log('/api/products'.padEnd(30) + ' | ' + `${res.status}`.padEnd(10) + ' | ' + details);
        if (!passed) allPassed = false;
    } catch (e) {
        console.log('/api/products'.padEnd(30) + ' | ' + 'FAIL'.padEnd(10) + ' | ' + e.message);
        allPassed = false;
    }

    // 3. Verify Featured Products
    try {
        const res = await fetch(`${baseUrl}/api/products/featured`);
        const data = await res.json();
        const passed = Array.isArray(data);
        const details = passed ? `✅ Found ${data.length} featured items` : '❌ Invalid response';
        console.log('/api/products/featured'.padEnd(30) + ' | ' + `${res.status}`.padEnd(10) + ' | ' + details);
        if (!passed) allPassed = false;
    } catch (e) {
        console.log('/api/products/featured'.padEnd(30) + ' | ' + 'FAIL'.padEnd(10) + ' | ' + e.message);
        allPassed = false;
    }

    console.log('-'.repeat(80));
    if (allPassed) {
        console.log('SUCCESS: All data endpoints returned valid data.');
    } else {
        console.log('FAILURE: Some endpoints failed to return expected data.');
    }
}

verifyData();
