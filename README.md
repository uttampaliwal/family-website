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

*   User authentication (login, register, email verification)
*   Basic styled login and register pages
*   Custom select component for enhanced UI/UX
*   Centralized error handling

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

### 3. Set up Environment Variables (for Backend)

Create a `.env` file in the `apps/api` directory with the necessary environment variables. These variables are crucial for the backend's operation, including database connection, JWT authentication, and email services. Refer to the backend documentation for a complete list of required variables and their descriptions.

**Example `.env` structure (values should be kept secret):**

```
PORT=3001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email_username
EMAIL_PASS=your_email_password
```

**Note:** Ensure your `MONGO_URI` is correctly configured for your MongoDB instance (e.g., `mongodb://localhost:27017/family-website` for a local Docker setup). The `JWT_SECRET` should be a strong, randomly generated string. `EMAIL_USER` and `EMAIL_PASS` are for your email service provider.

### 4. Run MongoDB with Docker

Ensure Docker is running, then start the MongoDB container:

```bash
docker-compose up -d
```

### 5. Run the Applications

**Start the Backend API:**

```bash
npm run dev --workspace=apps/api
```

**Start the Frontend Web Application:**

```bash
npm run dev --workspace=apps/web
```

Once both are running, you can access the frontend application in your browser, usually at `http://localhost:5173` (or whatever port Vite assigns).

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.