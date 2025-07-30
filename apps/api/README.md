# API Documentation

This document provides an overview of the backend API for the Family Website project. The API is built with Node.js, Express.js, and TypeScript, and it provides a RESTful interface for the frontend application.

## Getting Started

To run the API locally, you will need to have Node.js and npm installed. You will also need to have a MongoDB database running.

1.  Install the dependencies:

    ```bash
    npm install
    ```

2.  Create a `.env` file in the `apps/api` directory. You can use the `.env.example` file as a template.

3.  Start the development server:

    ```bash
    npm run dev
    ```

## API Endpoints

The API provides the following endpoints:

*   `POST /api/auth/register`: Register a new user.
*   `POST /api/auth/login`: Log in a user.
*   `POST /api/auth/verify-email`: Verify a user's email address.
*   `POST /api/auth/forgot-password`: Send a password reset email.
*   `POST /api/auth/reset-password`: Reset a user's password.
*   `GET /api/users/:id`: Get a user's profile.
*   `PUT /api/users/:id`: Update a user's profile.

For more information about the API, please see the [Project Documentation](../../PROJECT_DOCS.md).