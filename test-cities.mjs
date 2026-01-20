// Test Pathao Cities API
// Run with: node test-cities.mjs

import https from 'https';

const config = {
    baseUrl: 'https://api-hermes.pathao.com',
    clientId: 'N1aM105aWm',
    clientSecret: 'C9w7W9nnphsGpmuoGldLCAoDCCUkrwMAC8pAMsAj',
    username: 'probashibakery@gmail.com',
    password: 'Probashi1234@'
};

console.log('🔐 Step 1: Getting Access Token...\n');

// Step 1: Get access token
const authData = JSON.stringify({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    username: config.username,
    password: config.password,
    grant_type: 'password'
});

const authUrl = new URL(`${config.baseUrl}/aladdin/api/v1/issue-token`);

const authOptions = {
    hostname: authUrl.hostname,
    port: 443,
    path: authUrl.pathname,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(authData)
    }
};

const authReq = https.request(authOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);

            if (jsonData.access_token) {
                console.log('✅ Got access token!\n');

                // Step 2: Fetch cities using the token
                console.log('🏙️ Step 2: Fetching Cities...\n');

                const citiesUrl = new URL(`${config.baseUrl}/aladdin/api/v1/city-list`);

                const citiesOptions = {
                    hostname: citiesUrl.hostname,
                    port: 443,
                    path: citiesUrl.pathname,
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${jsonData.access_token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                };

                const citiesReq = https.request(citiesOptions, (citiesRes) => {
                    let citiesData = '';

                    citiesRes.on('data', (chunk) => {
                        citiesData += chunk;
                    });

                    citiesRes.on('end', () => {
                        console.log('✅ Response Status:', citiesRes.statusCode);
                        console.log('');

                        try {
                            const citiesJson = JSON.parse(citiesData);
                            console.log('📄 Cities Response:');
                            console.log(JSON.stringify(citiesJson, null, 2));

                            if (citiesJson.data && Array.isArray(citiesJson.data)) {
                                console.log('');
                                console.log('🎉 SUCCESS! Got', citiesJson.data.length, 'cities');
                                console.log('');
                                console.log('📍 First 5 cities:');
                                citiesJson.data.slice(0, 5).forEach(city => {
                                    console.log(`  - ${city.city_name} (ID: ${city.city_id})`);
                                });
                            }
                        } catch (e) {
                            console.log(citiesData);
                        }
                    });
                });

                citiesReq.on('error', (error) => {
                    console.error('❌ Cities Request Error:', error.message);
                });

                citiesReq.end();
            } else {
                console.log('❌ No access token received');
                console.log(jsonData);
            }
        } catch (e) {
            console.log('❌ Parse error:', e.message);
            console.log(data);
        }
    });
});

authReq.on('error', (error) => {
    console.error('❌ Auth Request Error:', error.message);
});

authReq.write(authData);
authReq.end();
