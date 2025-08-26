const axios = require('axios');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

// Helper function for pretty printing
function prettyPrint(label, data) {
  console.log('\n' + '='.repeat(50));
  console.log(`${label}:`);
  console.log('-'.repeat(50));
  console.log(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  console.log('='.repeat(50));
}

// Create a cookie jar
const jar = new tough.CookieJar();

// Create an axios instance with cookie jar support
const api = wrapper(axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  jar: jar
}));

async function debugCsrfCookies() {
  try {
    console.log('Step 1: Getting CSRF token...');
    
    // First, get the CSRF token
    const csrfResponse = await api.get('/api/auth/csrf-token');
    prettyPrint('CSRF Response', csrfResponse.data);
    
    // Extract the CSRF token from cookies
    const cookies = csrfResponse.headers['set-cookie'];
    prettyPrint('Cookies received', cookies);
    
    // Get all cookies from the jar
    const cookiesInJar = await jar.getCookies('http://localhost:3000');
    prettyPrint('Cookies in jar', cookiesInJar.map(c => ({ name: c.key, value: c.value })));
    
    // Find the CSRF token cookie
    const csrfCookie = cookiesInJar.find(c => c.key === 'XSRF-TOKEN');
    if (!csrfCookie) {
      console.error('Failed to find CSRF token in cookie jar');
      return;
    }
    
    const rawCsrfToken = csrfCookie.value;
    console.log('Raw CSRF token from cookie jar:', rawCsrfToken);
    
    // Decode the token
    const decodedCsrfToken = decodeURIComponent(rawCsrfToken);
    console.log('Decoded CSRF token:', decodedCsrfToken);
    
    console.log('\nStep 2: Making a simple GET request to check cookies...');
    
    // Make a simple GET request to check if cookies are sent
    const testResponse = await api.get('/api/test');
    prettyPrint('Test Response', testResponse.data);
    
    // Check what cookies were sent in the request
    prettyPrint('Request headers sent', testResponse.config.headers);
    
    console.log('\nStep 3: Attempting registration with decoded token...');
    
    // Registration data
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
    
    try {
      // Use the decoded token in the header
      const registrationResponse = await api.post('/api/auth/register', 
        registrationData,
        {
          headers: {
            'X-XSRF-TOKEN': decodedCsrfToken
          }
        }
      );
      
      prettyPrint('Registration Response', {
        status: registrationResponse.status,
        data: registrationResponse.data
      });
    } catch (error) {
      console.error('Registration failed:', error.message);
      if (error.response) {
        prettyPrint('Error response', {
          status: error.response.status,
          data: error.response.data
        });
        prettyPrint('Request headers sent', error.config.headers);
      }
    }
    
  } catch (error) {
    console.error('Error in CSRF debugging:', error.message);
  }
}

// Run the debug function
debugCsrfCookies();