const axios = require('axios');
const https = require('https');

// Create an axios instance that ignores SSL errors (for local development only)
const api = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  withCredentials: true,
});

// API base URL
const API_BASE_URL = 'http://localhost:3000';

async function getCsrfToken() {
  try {
    console.log('Getting CSRF token from:', `${API_BASE_URL}/api/auth/csrf-token`);
    const response = await api.get(`${API_BASE_URL}/api/auth/csrf-token`);
    return response.data.csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    throw error;
  }
}

async function login() {
  try {
    // Get CSRF token
    const csrfToken = await getCsrfToken();
    console.log('CSRF Token obtained:', csrfToken);
    
    // Set the CSRF token in the headers
    api.defaults.headers.common['X-XSRF-TOKEN'] = csrfToken;
    
    // Login request
    const loginData = {
      identifier: 'testuser',  // Replace with a valid username or email
      password: 'Password123!' // Replace with a valid password
    };
    
    console.log('Sending login request with data:', loginData);
    
    const response = await api.post(`${API_BASE_URL}/api/auth/login`, loginData);
    
    console.log('Login response status:', response.status);
    console.log('Login response data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    throw error;
  }
}

// Execute the login function
login()
  .then(data => {
    console.log('Login successful:', data);
    process.exit(0);
  })
  .catch(error => {
    console.error('Login failed:', error.message);
    process.exit(1);
  });