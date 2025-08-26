const axios = require('axios');
const https = require('https');

// Create an axios instance that ignores SSL errors for local testing
const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

// Helper function to pretty print objects
function prettyPrint(label, obj) {
  console.log(`\n${label}:`);
  console.log(JSON.stringify(obj, null, 2));
}

async function testRegistration() {
  try {
    console.log('Step 1: Getting CSRF token...');
    
    // First, get the CSRF token
    const csrfResponse = await api.get('/api/auth/csrf-token');
    prettyPrint('CSRF Response', csrfResponse.data);
    
    // Extract the CSRF token from cookies
    const cookies = csrfResponse.headers['set-cookie'];
    prettyPrint('Cookies received', cookies);
    
    let csrfToken = null;
    if (cookies && Array.isArray(cookies)) {
      const csrfCookie = cookies.find(cookie => cookie.startsWith('XSRF-TOKEN='));
      if (csrfCookie) {
        csrfToken = csrfCookie.split(';')[0].replace('XSRF-TOKEN=', '');
        csrfToken = decodeURIComponent(csrfToken);
        console.log('Extracted CSRF token:', csrfToken);
      }
    }
    
    if (!csrfToken) {
      console.error('Failed to extract CSRF token from cookies');
      return;
    }
    
    console.log('\nStep 2: Attempting registration...');
    
    // Now attempt registration with the CSRF token
    const registrationData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123!',
      dob: '1990-01-01',
      mobileNumber: '1234567890',
      username: 'testuser',
      gender: 'Male'
    };
    
    prettyPrint('Registration payload', registrationData);
    console.log('Using CSRF token:', csrfToken);
    
    // Try sending the raw token without decoding it
    const rawCsrfToken = cookies.find(cookie => cookie.startsWith('XSRF-TOKEN='))
      ?.split(';')[0].replace('XSRF-TOKEN=', '');
    
    console.log('Raw CSRF token:', rawCsrfToken);
    console.log('Decoded CSRF token:', csrfToken);
    
    const registrationResponse = await api.post('/api/auth/register', registrationData, {
      headers: {
        'X-XSRF-TOKEN': rawCsrfToken  // Use the raw token exactly as received in the cookie
      }
    });
    
    // Log the request headers for debugging
    prettyPrint('Request headers sent', registrationResponse.config.headers);
    
    console.log('\nRegistration successful!');
    console.log('Status:', registrationResponse.status);
    prettyPrint('Response', registrationResponse.data);
    
  } catch (error) {
    console.error('\nRegistration failed!');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      prettyPrint('Response data', error.response.data);
      prettyPrint('Response headers', error.response.headers);
      prettyPrint('Request headers sent', error.config.headers);
    }
  }
}

// Run the test
testRegistration();