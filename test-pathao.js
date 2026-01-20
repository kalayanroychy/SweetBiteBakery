// Quick Pathao API Test Script
// Run with: node test-pathao.js

const https = require('https');

const config = {
    baseUrl: 'https://api-hermes.pathao.com',
    clientId: 'N1aM105aWm',
    clientSecret: 'C9w7W9nnphsGpmuoGldLCAoDCCUkrwMAC8pAMsAj',
    username: 'probashibakery@gmail.com',
    password: 'Probashi1234@'
};

const authData = JSON.stringify({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    username: config.username,
    password: config.password,
    grant_type: 'password'
});

console.log('🔐 Testing Pathao Authentication...');
console.log('📍 Base URL:', config.baseUrl);
console.log('🔑 Client ID:', config.clientId);
console.log('');

const url = new URL(`${config.baseUrl}/aladdin/api/v1/issue-token`);

const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(authData)
    }
};

console.log(`📤 POST ${url.href}`);
console.log('📦 Request Body:', JSON.parse(authData));
console.log('');

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('✅ Response Status:', res.statusCode);
        console.log('📥 Response Headers:', JSON.stringify(res.headers, null, 2));
        console.log('');
        console.log('📄 Response Body:');

        try {
            const jsonData = JSON.parse(data);
            console.log(JSON.stringify(jsonData, null, 2));

            if (jsonData.access_token) {
                console.log('');
                console.log('🎉 SUCCESS! Got access token:', jsonData.access_token.substring(0, 20) + '...');
            } else if (jsonData.message) {
                console.log('');
                console.log('❌ ERROR:', jsonData.message);
            }
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request Error:', error.message);
});

req.write(authData);
req.end();
