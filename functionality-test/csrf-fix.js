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

async function fixCsrfIssue() {
  try {
    console.log('Step 1: Getting CSRF token...');
    
    // First, get the CSRF token
    const csrfResponse = await api.get('/api/auth/csrf-token');
    prettyPrint('CSRF Response', csrfResponse.data);
    
    // Extract the CSRF token from cookies
    const cookies = csrfResponse.headers['set-cookie'];
    prettyPrint('Cookies received', cookies);
    
    let rawCsrfToken = null;
    
    if (cookies && Array.isArray(cookies)) {
      const csrfCookie = cookies.find(cookie => cookie.startsWith('XSRF-TOKEN='));
      if (csrfCookie) {
        // Get the raw token exactly as it appears in the cookie
        rawCsrfToken = csrfCookie.split(';')[0].replace('XSRF-TOKEN=', '');
        console.log('Raw CSRF token from cookie:', rawCsrfToken);
      }
    }
    
    if (!rawCsrfToken) {
      console.error('Failed to extract CSRF token from cookies');
      return;
    }
    
    console.log('\nStep 2: Attempting registration with raw token...');
    
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
      // Use the raw token exactly as received in the cookie
      const registrationResponse = await api.post('/api/auth/register', 
        registrationData,
        {
          headers: {
            'X-XSRF-TOKEN': rawCsrfToken
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

// Run the fix function
fixCsrfIssue();