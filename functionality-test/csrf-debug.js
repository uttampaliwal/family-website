const axios = require('axios');

// Helper function for pretty printing
function prettyPrint(label, data) {
  console.log('\n' + '='.repeat(50));
  console.log(`${label}:`);
  console.log('-'.repeat(50));
  console.log(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  console.log('='.repeat(50));
}

// Create an axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true
});

async function debugCsrfToken() {
  try {
    console.log('Step 1: Getting CSRF token...');
    
    // First, get the CSRF token
    const csrfResponse = await api.get('/api/auth/csrf-token');
    prettyPrint('CSRF Response', csrfResponse.data);
    
    // Extract the CSRF token from cookies
    const cookies = csrfResponse.headers['set-cookie'];
    prettyPrint('Cookies received', cookies);
    
    let rawCsrfToken = null;
    let decodedCsrfToken = null;
    
    if (cookies && Array.isArray(cookies)) {
      const csrfCookie = cookies.find(cookie => cookie.startsWith('XSRF-TOKEN='));
      if (csrfCookie) {
        rawCsrfToken = csrfCookie.split(';')[0].replace('XSRF-TOKEN=', '');
        decodedCsrfToken = decodeURIComponent(rawCsrfToken);
        console.log('Raw CSRF token:', rawCsrfToken);
        console.log('Decoded CSRF token:', decodedCsrfToken);
      }
    }
    
    if (!rawCsrfToken) {
      console.error('Failed to extract CSRF token from cookies');
      return;
    }
    
    // Now let's try different header formats
    const testHeaders = [
      { name: 'Raw token in X-XSRF-TOKEN', headers: { 'X-XSRF-TOKEN': rawCsrfToken } },
      { name: 'Decoded token in X-XSRF-TOKEN', headers: { 'X-XSRF-TOKEN': decodedCsrfToken } },
      { name: 'Raw token in x-xsrf-token (lowercase)', headers: { 'x-xsrf-token': rawCsrfToken } },
      { name: 'Decoded token in x-xsrf-token (lowercase)', headers: { 'x-xsrf-token': decodedCsrfToken } },
      { name: 'Raw token in X-CSRF-Token', headers: { 'X-CSRF-Token': rawCsrfToken } },
      { name: 'Decoded token in X-CSRF-Token', headers: { 'X-CSRF-Token': decodedCsrfToken } }
    ];
    
    // Test each header format with a simple GET request to avoid triggering validation errors
    for (const test of testHeaders) {
      try {
        console.log(`\nTesting: ${test.name}`);
        const response = await api.get('/api/auth/csrf-token', { headers: test.headers });
        console.log(`✅ Success with ${test.name}`);
        prettyPrint('Response headers', response.headers);
      } catch (error) {
        console.error(`❌ Failed with ${test.name}: ${error.message}`);
        if (error.response) {
          prettyPrint('Error response', {
            status: error.response.status,
            data: error.response.data
          });
        }
      }
    }
    
    // Now try a POST request with the most promising header format
    console.log('\nTrying POST request with raw token in X-XSRF-TOKEN header');
    try {
      const postResponse = await api.post('/api/auth/register', 
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestPassword123!',
          dob: '1990-01-01',
          mobileNumber: '1234567890',
          username: 'testuser',
          gender: 'Male'
        },
        {
          headers: {
            'X-XSRF-TOKEN': rawCsrfToken
          }
        }
      );
      
      prettyPrint('POST Response', {
        status: postResponse.status,
        data: postResponse.data
      });
    } catch (error) {
      console.error('POST request failed:', error.message);
      if (error.response) {
        prettyPrint('Error response', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        prettyPrint('Request headers sent', error.config.headers);
      }
    }
    
  } catch (error) {
    console.error('Error in CSRF debugging:', error.message);
  }
}

// Run the debug function
debugCsrfToken();