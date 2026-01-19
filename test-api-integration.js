#!/usr/bin/env node

/**
 * Frontend-Backend Integration Test Script
 * Tests API connectivity from frontend configuration
 */

import https from 'https';

// Use the same URL as configured in frontend
const API_URL = 'https://costpie-backend.onrender.com';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CostPie-Frontend-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function testIntegration() {
  console.log('🧪 Frontend-Backend Integration Test');
  console.log(`📡 Backend URL: ${API_URL}`);
  console.log('=' .repeat(50));

  const tests = [
    {
      name: 'Organizations API (/organizations/mine)',
      endpoint: '/organizations/mine',
      expectedStatus: 200
    },
    {
      name: 'Swagger Documentation (/api/docs)',
      endpoint: '/api/docs',
      expectedStatus: 200
    },
    {
      name: 'Cloud Accounts API (sample org)',
      endpoint: '/organizations/org-test-1/cloud-accounts',
      expectedStatus: 200
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      const response = await makeRequest(test.endpoint);
      
      if (response.statusCode === test.expectedStatus) {
        console.log(`✅ PASS - Status: ${response.statusCode}`);
        if (response.body && typeof response.body === 'object') {
          console.log(`📊 Response: ${JSON.stringify(response.body).substring(0, 100)}...`);
        }
        passed++;
      } else {
        console.log(`❌ FAIL - Expected: ${test.expectedStatus}, Got: ${response.statusCode}`);
        console.log(`📊 Response: ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      console.log(`❌ FAIL - Network error: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📊 INTEGRATION TEST RESULTS');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📈 Success Rate: ${Math.round((passed/total) * 100)}%`);

  if (passed === total) {
    console.log('\n🎉 All integration tests passed!');
    console.log('✅ Frontend is ready to communicate with backend');
  } else {
    console.log('\n⚠️  Some tests failed. Check the backend connectivity.');
  }

  console.log('\n📝 Next Steps:');
  console.log('1. Start frontend: npm run dev');
  console.log('2. Open: http://localhost:8080');
  console.log('3. Test user authentication and workflows');
}

testIntegration().catch(console.error);