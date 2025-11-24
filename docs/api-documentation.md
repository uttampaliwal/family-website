# API Documentation

This document details the backend API for the Family Website project, built with Node.js and Express.js.

## Base URL

When running locally with Docker Compose:
`http://localhost:3000/api`

## Authentication Endpoints

### Register User

Creates a new user account and sends a verification email.

- **URL:** `/auth/register`
- **Method:** `POST`
- **Rate Limit:** Yes
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "password": "<PASSWORD>",
    "dateOfBirth": "1990-01-01",
    "mobileNumber": "1234567890",
    "gender": "male"
  }
  ```
- **Success Response:**
  - **Code:** 201 CREATED
  - **Content:**
    ```json
    {
      "message": "User registered successfully. Please check your email to verify your account.",
      "token": "jwt_token_here"
    }
    ```
- **Error Responses:**
  - **Code:** 400 BAD REQUEST
    - **Content:** `{ "message": "User with this email already exists" }`
    - **Content:** `{ "message": "User with this username already exists" }`
    - **Content:** `{ "message": "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character" }`
  - **Code:** 500 INTERNAL SERVER ERROR
    - **Content:** `{ "message": "Error registering user" }`

### Login User

Authenticates a user and returns a JWT token.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Rate Limit:** Yes
- **Request Body:**
  ```json
  {
    "identifier": "johndoe", // Can be username or email
    "password": "<PASSWORD>"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "message": "Login successful",
      "token": "jwt_token_here",
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "username": "johndoe",
        "email": "john@example.com"
      }
    }
    ```
- **Error Responses:**
  - **Code:** 400 BAD REQUEST
    - **Content:** `{ "message": "No account found with that email or username. Please register." }`
    - **Content:** `{ "message": "Please verify your email before logging in." }`
  - **Code:** 401 UNAUTHORIZED
    - **Content:** `{ "message": "Invalid password" }`
  - **Code:** 500 INTERNAL SERVER ERROR
    - **Content:** `{ "message": "Error logging in" }`

### Verify Email

Verifies a user's email address using the token sent via email.

- **URL:** `/auth/verify-email`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "token": "verification_token_here"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "message": "Email verified successfully" }`
- **Error Responses:**
  - **Code:** 400 BAD REQUEST
    - **Content:** `{ "message": "Invalid verification token" }`
  - **Code:** 500 INTERNAL SERVER ERROR
    - **Content:** `{ "message": "Error verifying email" }`

### Resend Verification Email

Resends the verification email to the user.

- **URL:** `/auth/resend-verification`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "identifier": "johndoe" // Can be username or email
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "message": "Verification email sent successfully" }`
- **Error Responses:**
  - **Code:** 400 BAD REQUEST
    - **Content:** `{ "message": "No account found with that email or username" }`
    - **Content:** `{ "message": "Email already verified" }`
  - **Code:** 500 INTERNAL SERVER ERROR
    - **Content:** `{ "message": "Error sending verification email" }`

### Forgot Password

Initiates the password reset process by sending a reset link to the user's email.

- **URL:** `/auth/forgot-password`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "message": "Password reset email sent" }`
- **Error Responses:**
  - **Code:** 400 BAD REQUEST
    - **Content:** `{ "message": "No account found with that email" }`
  - **Code:** 500 INTERNAL SERVER ERROR
    - **Content:** `{ "message": "Error sending password reset email" }`

### Reset Password

Resets the user's password using the token sent via email.

- **URL:** `/auth/reset-password`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "token": "reset_token_here",
    "password": "<NEW_PASSWORD>"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "message": "Password reset successful" }`
- **Error Responses:**
  - **Code:** 400 BAD REQUEST
    - **Content:** `{ "message": "Invalid or expired reset token" }`
    - **Content:** `{ "message": "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character" }`
  - **Code:** 500 INTERNAL SERVER ERROR
    - **Content:** `{ "message": "Error resetting password" }`

## User Profile Endpoints

### Get User Profile

Retrieves the profile information for the authenticated user.

- **URL:** `/auth/profile/:username`
- **Method:** `GET`
- **Authentication:** Required (JWT Token)
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "username": "johndoe",
        "email": "john@example.com",
        "dateOfBirth": "1990-01-01",
        "mobileNumber": "1234567890",
        "gender": "male"
      }
    }
    ```
- **Error Responses:**
  - **Code:** 401 UNAUTHORIZED
    - **Content:** `{ "message": "Unauthorized" }`
  - **Code:** 404 NOT FOUND
    - **Content:** `{ "message": "User not found" }`
  - **Code:** 500 INTERNAL SERVER ERROR
    - **Content:** `{ "message": "Error fetching user profile" }`

### Update User Profile

Updates the profile information for the authenticated user.

- **URL:** `/auth/profile/:username`
- **Method:** `PUT`
- **Authentication:** Required (JWT Token)
- **Request Body:**
  ```json
  {
    "name": "John Smith",
    "dateOfBirth": "1990-02-01",
    "mobileNumber": "9876543210",
    "gender": "male"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "message": "Profile updated successfully",
      "user": {
        "id": "user_id",
        "name": "John Smith",
        "username": "johndoe",
        "email": "john@example.com",
        "dateOfBirth": "1990-02-01",
        "mobileNumber": "9876543210",
        "gender": "male"
      }
    }
    ```
- **Error Responses:**
  - **Code:** 401 UNAUTHORIZED
    - **Content:** `{ "message": "Unauthorized" }`
  - **Code:** 404 NOT FOUND
    - **Content:** `{ "message": "User not found" }`
  - **Code:** 500 INTERNAL SERVER ERROR
    - **Content:** `{ "message": "Error updating user profile" }`

## Health Check Endpoint

### API Health Check

Checks if the API is running properly.

- **URL:** `/health`
- **Method:** `GET`
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "status": "ok", "message": "API is healthy" }`

## Environment Variables

The API relies on several environment variables for proper operation:

- `PORT`: The port on which the API server will listen (e.g., `3000`).
- `MONGO_URI`: The connection string for your MongoDB database.
- `JWT_SECRET`: A long, random, and unique string used for signing JSON Web Tokens.
- `REFRESH_TOKEN_SECRET`: A long, random, and unique string used for signing refresh tokens.
- `EMAIL_USER`: Your email address for sending verification emails.
- `EMAIL_PASS`: The app password for your `EMAIL_USER`.
- `FRONTEND_URL`: The base URL of your frontend application.
