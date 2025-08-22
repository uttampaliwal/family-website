import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createTestApp } from '../helpers/testApp';
import { User } from '../../models/User';

describe('Authentication Integration Tests', () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to test database
    await mongoose.connect(mongoUri);
    
    // Create test app
    app = createTestApp();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: '1990-01-01',
      termsAccepted: true
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with weak password', async () => {
      const invalidData = { 
        ...validUserData, 
        password: 'weak',
        confirmPassword: 'weak'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with mismatched passwords', async () => {
      const invalidData = { 
        ...validUserData, 
        confirmPassword: 'DifferentPassword123!'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      // Second registration with same email
      const duplicateData = { 
        ...validUserData, 
        username: 'differentuser'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a verified user for login tests
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: new Date('1990-01-01'),
        isEmailVerified: true
      });
      await user.save();
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login for unverified email', async () => {
      // Create unverified user
      const unverifiedUser = new User({
        username: 'unverified',
        email: 'unverified@example.com',
        password: 'TestPassword123!',
        firstName: 'Unverified',
        lastName: 'User',
        dateOfBirth: new Date('1990-01-01'),
        isEmailVerified: false
      });
      await unverifiedUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unverified@example.com',
          password: 'TestPassword123!'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Please verify your email before logging in.');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create and login user
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: new Date('1990-01-01'),
        isEmailVerified: true
      });
      await user.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    it('should clear refresh token cookie on logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken=;'))).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData);
      }

      // The 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(429);

      expect(response.body).toHaveProperty('error', 'Too many requests');
    });
  });
});