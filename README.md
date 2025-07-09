# Family Website

This project aims to build a personal/family website, serving as a hands-on learning experience in full-stack web development. It emphasizes continuous learning, code quality, user-centric design, modularity, and scalability.

## Technology Stack

*   **Monorepo Management:** Turborepo
*   **Frontend:** React with Vite and TypeScript
*   **Backend:** Node.js with Express.js
*   **Database:** MongoDB (running in Docker)
*   **Authentication:** JSON Web Tokens (JWT)
*   **Styling:** Tailwind CSS v4.1

## Features

*   User authentication (login, register, email verification, resend verification email)
*   Personalized user profile pages after login
*   Enhanced, interactive, and visually appealing header with improved logo positioning and navigation
*   Adaptive color schemes for both light and dark modes, ensuring optimal readability and aesthetics
*   Improved form styling and symmetric date picker dropdowns
*   Custom select component for enhanced UI/UX
*   Centralized error handling
*   Improved email verification flow for mobile users

## Setup & Installation

To get this project up and running on your local machine, follow these steps:

### Image Optimization

For optimal web performance, ensure all images, especially the `family-logo.svg`, are optimized for web use. Consider converting complex SVGs to formats like WebP for faster load times.

### Prerequisites

*   Node.js (LTS version recommended)
*   npm (comes with Node.js)
*   Docker (for MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/family-website.git
cd family-website
```

### 2. Install Dependencies

Install dependencies for the monorepo and individual applications:

```bash
npm install
```

### 3. Set up Environment Variables

A single `.env` file in the project root is used to configure all services when running with Docker Compose.

1.  Create a `.env` file in the project root (`/home/uttam/development/family-website/.env`).
2.  Add the following variables, replacing placeholders with your actual credentials:

```
MONGO_INITDB_ROOT_USERNAME=your_mongo_username
MONGO_INITDB_ROOT_PASSWORD=your_mongo_password
JWT_SECRET=a_long_random_string_for_jwt_secret
MONGO_URI=mongodb://your_mongo_username:your_mongo_password@mongo:27017/familywebsite?authSource=admin
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

**Notes:**
*   For `EMAIL_PASS`, if using Gmail, you'll need to generate an App Password.
*   The `MONGO_URI` uses the service name `mongo`, as this connection happens *between containers* inside the Docker network.
*   The `FRONTEND_URL` is used by the backend for two things: constructing links in emails and setting the CORS `Access-Control-Allow-Origin` header.
    *   If you are accessing the frontend from the same machine at `http://localhost:5173`, then `FRONTEND_URL=http://localhost:5173` is correct.
    *   If you are accessing the frontend from another device on your network (e.g., a mobile phone), you must use your machine's local IP address (e.g., `FRONTEND_URL=http://192.168.1.17:5173`).

### 4. Run the Entire Application with Docker Compose

This is the recommended way to run the entire application stack for consistency.

```bash
sudo docker compose --env-file .env up -d --build
```

Once both are running, you can access the frontend application in your browser, usually at `http://localhost:5173` (or whatever port Vite assigns).

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.