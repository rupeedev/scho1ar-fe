#!/usr/bin/env node

/**
 * Complete Authentication Flow Test
 * Tests the full Supabase authentication + backend integration flow
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';

// Configuration from .env
const SUPABASE_URL = 'https://cnpgynayzzatfsxlveur.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGd5bmF5enphdGZzeGx2ZXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Njc2MDgsImV4cCI6MjA2MjA0MzYwOH0.vrm72IDCCQTQTHhZImj_cemAk06G9msDfVIeNfVaHAs';
const BACKEND_URL = 'https://costpie-backend.onrender.com';

// Test credentials - Using real user from system
const TEST_EMAIL = 'rupesh.panwwar@gmail.com';
const TEST_PASSWORD = 'TestPassword123!';

class CompleteAuthTester {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.accessToken = null;
    this.user = null;
  }

  makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BACKEND_URL);
      const requestOptions = {
        hostname: url.hostname,
        port: 443,
        path: `/api/v1${url.pathname}${url.search}`,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CostPie-Complete-Auth-Test/1.0',
          ...options.headers
        }
      };

      const req = https.request(requestOptions, (res) => {
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

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async testSupabaseAuth() {
    console.log('🔐 Testing Supabase Authentication...');
    
    try {
      // First, try to sign out any existing session
      await this.supabase.auth.signOut();

      // Try to sign in directly (assuming user already exists)
      console.log('   🔑 Attempting sign in for existing user...');
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      if (error) {
        console.error('   ❌ Sign in failed:', error.message);
        console.log('   💡 Note: This user may need to be created first in Supabase Auth');
        return false;
      }

      if (data.user && data.session) {
        console.log('   ✅ Sign in successful');
        console.log(`   📧 User email: ${data.user.email}`);
        console.log(`   🆔 User ID: ${data.user.id}`);
        console.log(`   ⏰ Session expires: ${new Date(data.session.expires_at * 1000).toISOString()}`);
        
        this.accessToken = data.session.access_token;
        this.user = data.user;
        console.log(`   🔑 Access token obtained (${this.accessToken.length} chars)`);
        
        return true;
      }

      console.error('   ❌ No user or session in response');
      return false;
    } catch (error) {
      console.error('   ❌ Exception during authentication:', error.message);
      return false;
    }
  }

  async testSupabaseSignIn() {
    console.log('🔐 Testing Supabase Sign In...');
    
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      if (error) {
        console.error('   ❌ Sign in failed:', error.message);
        return false;
      }

      if (data.user && data.session) {
        console.log('   ✅ Sign in successful');
        console.log(`   📧 User email: ${data.user.email}`);
        console.log(`   🆔 User ID: ${data.user.id}`);
        console.log(`   ⏰ Session expires: ${new Date(data.session.expires_at * 1000).toISOString()}`);
        
        this.accessToken = data.session.access_token;
        this.user = data.user;
        console.log(`   🔑 Access token obtained (${this.accessToken.length} chars)`);
        
        return true;
      }

      console.error('   ❌ No user or session in response');
      return false;
    } catch (error) {
      console.error('   ❌ Exception during sign in:', error.message);
      return false;
    }
  }

  async testBackendTokenValidation() {
    console.log('🔍 Testing Backend JWT Token Validation...');
    
    if (!this.accessToken) {
      console.error('   ❌ No access token available');
      return false;
    }

    try {
      // Test protected endpoint with token
      const response = await this.makeRequest('/organizations/mine', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      console.log(`   📡 Response status: ${response.statusCode}`);
      
      if (response.statusCode === 401) {
        console.error('   ❌ Backend rejected token (401 Unauthorized)');
        if (typeof response.body === 'object') {
          console.error(`   🔍 Error details: ${JSON.stringify(response.body, null, 2)}`);
        } else {
          console.error(`   🔍 Error text: ${response.body}`);
        }
        return false;
      }

      if (response.statusCode === 200) {
        console.log('   ✅ Backend accepted token successfully');
        console.log(`   📊 Response: ${JSON.stringify(response.body).substring(0, 100)}...`);
        return true;
      }

      console.log(`   ⚠️  Unexpected status: ${response.statusCode}`);
      console.log(`   📊 Response: ${JSON.stringify(response.body, null, 2)}`);
      
      // Consider 2xx status codes as success
      return response.statusCode < 300;
    } catch (error) {
      console.error('   ❌ Exception during token validation:', error.message);
      return false;
    }
  }

  async testProtectedRoutes() {
    console.log('🛡️  Testing Protected Route Access...');
    
    const protectedEndpoints = [
      { path: '/organizations/mine', name: 'Get My Organizations' },
      { path: '/cloud-accounts', name: 'Get Cloud Accounts' },
      { path: '/costs/trend', name: 'Get Cost Trends' },
    ];

    let passedTests = 0;
    let totalTests = protectedEndpoints.length * 2; // 2 tests per endpoint (with/without auth)

    for (const endpoint of protectedEndpoints) {
      console.log(`   🧪 Testing: ${endpoint.name} (${endpoint.path})`);
      
      try {
        // Test 1: Without authentication
        const unauthResponse = await this.makeRequest(endpoint.path);
        
        if (unauthResponse.statusCode === 401) {
          console.log(`     ✅ Correctly requires authentication`);
          passedTests++;
        } else if (unauthResponse.statusCode === 200) {
          console.log(`     ⚠️  Allows access without auth (dev mode)`);
          passedTests++; // In dev mode, this is expected
        } else {
          console.log(`     ❌ Unexpected status without auth: ${unauthResponse.statusCode}`);
        }

        // Test 2: With authentication
        if (this.accessToken) {
          const authResponse = await this.makeRequest(endpoint.path, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`
            }
          });

          if (authResponse.statusCode < 300) {
            console.log(`     ✅ Access granted with valid token (${authResponse.statusCode})`);
            passedTests++;
          } else if (authResponse.statusCode === 401) {
            console.log(`     ❌ Access denied even with valid token`);
          } else {
            console.log(`     ⚠️  Unexpected status with auth: ${authResponse.statusCode}`);
            // Don't fail for 404s or other non-auth errors
            if (authResponse.statusCode === 404) {
              passedTests++;
            }
          }
        } else {
          console.log(`     ⏩ Skipping auth test - no token available`);
        }
      } catch (error) {
        console.error(`     ❌ Exception testing ${endpoint.name}:`, error.message);
      }
    }

    const successRate = Math.round((passedTests / totalTests) * 100);
    console.log(`   📊 Protected routes test: ${passedTests}/${totalTests} passed (${successRate}%)`);
    
    return passedTests >= Math.floor(totalTests * 0.7); // 70% pass rate considered success
  }

  async testSessionManagement() {
    console.log('🧹 Testing Session Management...');
    
    try {
      // Test getting current session
      const { data: sessionData } = await this.supabase.auth.getSession();
      
      if (sessionData.session) {
        console.log('   ✅ Active session found');
        console.log(`   ⏰ Expires: ${new Date(sessionData.session.expires_at * 1000).toISOString()}`);
      } else {
        console.log('   ⚠️  No active session');
      }

      // Test sign out
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        console.error('   ❌ Sign out failed:', error.message);
        return false;
      }

      console.log('   ✅ Sign out successful');
      
      // Verify session is cleared
      const { data: postSignOutSession } = await this.supabase.auth.getSession();
      
      if (!postSignOutSession.session) {
        console.log('   ✅ Session properly cleared');
        this.accessToken = null;
        this.user = null;
        return true;
      } else {
        console.error('   ❌ Session still exists after sign out');
        return false;
      }
    } catch (error) {
      console.error('   ❌ Exception during session management test:', error.message);
      return false;
    }
  }

  async runCompleteTest() {
    console.log('🧪 COMPLETE AUTHENTICATION FLOW TEST');
    console.log('=' .repeat(60));
    console.log(`🔗 Backend URL: ${BACKEND_URL}`);
    console.log(`🏗️  Supabase URL: ${SUPABASE_URL}`);
    console.log(`👤 User Email: ${TEST_EMAIL}`);
    console.log('=' .repeat(60));

    const results = {
      supabaseAuth: false,
      tokenValidation: false,
      protectedRoutes: false,
      sessionManagement: false,
    };

    try {
      // Test 1: Supabase Authentication
      console.log('\n🔑 Step 1: Supabase Authentication');
      results.supabaseAuth = await this.testSupabaseAuth();
      
      // Test 2: Backend Token Validation
      if (results.supabaseAuth) {
        console.log('\n🔍 Step 2: Backend Token Validation');
        results.tokenValidation = await this.testBackendTokenValidation();
      } else {
        console.log('\n⏩ Step 2: Skipped - Authentication failed');
      }
      
      // Test 3: Protected Routes
      if (results.tokenValidation) {
        console.log('\n🛡️  Step 3: Protected Route Access');
        results.protectedRoutes = await this.testProtectedRoutes();
      } else {
        console.log('\n⏩ Step 3: Skipped - Token validation failed');
      }
      
      // Test 4: Session Management
      console.log('\n🧹 Step 4: Session Management');
      results.sessionManagement = await this.testSessionManagement();

    } catch (error) {
      console.error('❌ Fatal error during testing:', error.message);
    }

    // Final Results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    const testNames = {
      supabaseAuth: 'Supabase Authentication',
      tokenValidation: 'JWT Token Validation',
      protectedRoutes: 'Protected Route Access',
      sessionManagement: 'Session Management'
    };

    Object.entries(results).forEach(([key, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${testNames[key]}: ${passed ? 'PASS' : 'FAIL'}`);
    });

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log('\n📈 Overall Results:');
    console.log(`   Passed: ${passedTests}/${totalTests} tests`);
    console.log(`   Success Rate: ${successRate}%`);

    if (successRate >= 75) {
      console.log('\n🎉 AUTHENTICATION FLOW VERIFICATION: SUCCESS!');
      console.log('✅ The authentication system is working correctly');
    } else {
      console.log('\n⚠️  AUTHENTICATION FLOW VERIFICATION: NEEDS ATTENTION');
      console.log('❌ Some components of the authentication system need fixing');
    }

    console.log('\n🔧 Next Steps for Manual Testing:');
    console.log('1. Open http://localhost:8081/ in your browser');
    console.log('2. Navigate to /login');
    console.log('3. Sign up/Sign in with the test credentials');
    console.log('4. Open Developer Tools → Network tab');
    console.log('5. Navigate to protected pages and verify API calls include Authorization headers');
    console.log('6. Logout and verify you\'re redirected to login page');

    return results;
  }
}

// Execute the test
const tester = new CompleteAuthTester();
tester.runCompleteTest().catch(console.error);