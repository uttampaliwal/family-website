# Family Portal

This project is a personal/family website built to learn and demonstrate full-stack web development using modern technologies. It features user authentication, personalized profiles, and a clean, responsive design.

## Features

- **User Authentication:** Secure user registration, login, and session management.
- **Email Verification:** New users must verify their email address.
- **Password Reset:** Users can securely reset their password.
- **User Profiles:** Users can view and edit their profiles.
- **Responsive Design:** The application is designed to work on all devices.
- **Light/Dark Mode:** The application supports both light and dark themes.

## Project Structure

This project is a monorepo managed by Turborepo. It consists of two main packages:

- `apps/api`: A Node.js and Express.js backend that provides a RESTful API.
- `apps/web`: A React and Vite frontend that consumes the API.

## Getting Started

This project uses Docker Compose for easy setup and local development.

1.  **Ensure Docker is Running:** Make sure Docker Desktop (or your Docker environment) is running.
2.  **Start the Application:** From the project root, run `docker-compose up -d --build`. This will build the images, create the containers, and start the services in the background.
3.  **Access the Application:**
    - **Frontend:** Open your browser and navigate to `http://localhost:80/`.
    - **Backend API:** The API is accessible at `http://localhost:3000/api/`.

For more detailed instructions, including environment variable setup and troubleshooting, please see the [Project Documentation](./PROJECT_DOCS.md).

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
