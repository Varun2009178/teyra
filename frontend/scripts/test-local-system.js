#!/usr/bin/env node

/**
 * Test script for Teyra local system
 * Run this to verify everything is working before production
 */

const https = require('https');
const http = require('http');

console.log('🧪 Testing Teyra Local System...\n');

// Test local endpoints
const localTests = [
  {
    name: 'Daily Reset Check',
          url: 'http://localhost:3000/api/daily-reset',
    method: 'GET'
  },
  {
    name: 'AI Learning Endpoint',
          url: 'http://localhost:3000/api/ai/learn-user-patterns',
    method: 'POST'
  },
  {
    name: 'Get User Patterns',
          url: 'http://localhost:3000/api/ai/get-user-patterns',
    method: 'GET'
  }
];

// Test production endpoints (if accessible)
const productionTests = [
  {
    name: 'Production Cron Endpoint',
    url: 'https://teyra.app/api/cron/daily-emails',
    method: 'POST'
  }
];

async function testEndpoint(test) {
  return new Promise((resolve) => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Teyra-Test-Script/1.0'
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          name: test.name,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          url: test.url
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name: test.name,
        status: 'ERROR',
        success: false,
        error: error.message,
        url: test.url
      });
    });

    // Add body for POST requests
    if (test.method === 'POST') {
      req.write(JSON.stringify({ test: true, timestamp: new Date().toISOString() }));
    }

    req.end();
  });
}

async function runTests() {
  console.log('📍 Testing Local Endpoints (localhost:3000)...\n');
  
  for (const test of localTests) {
    const result = await testEndpoint(test);
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }

  console.log('🌐 Testing Production Endpoints...\n');
  
  for (const test of productionTests) {
    const result = await testEndpoint(test);
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }

  console.log('📋 Summary:');
  console.log('✅ = Working correctly');
  console.log('❌ = Needs attention');
  console.log('\n💡 If local tests fail, make sure:');
  console.log('   1. Your dev server is running (npm run dev)');
  console.log('   2. Database tables are created');
  console.log('   3. Environment variables are set');
  console.log('\n💡 If production tests fail, make sure:');
  console.log('   1. Your app is deployed to teyra.app');
  console.log('   2. Cron job is properly configured');
  console.log('   3. Production environment variables are set');
}

// Run the tests
runTests().catch(console.error);



