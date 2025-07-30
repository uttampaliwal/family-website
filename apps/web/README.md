# Web Application

This document provides an overview of the frontend application for the Family Website project. The application is built with React, Vite, and TypeScript, and it consumes the backend API.

## Getting Started

To run the web application locally, you will need to have Node.js and npm installed.

1.  Install the dependencies:

    ```bash
    npm install
    ```

2.  Create a `.env` file in the `apps/web` directory. You can use the `.env.example` file as a template.

3.  Start the development server:

    ```bash
    npm run dev
    ```

## Project Structure

The web application is organized into the following directories:

*   `src/components`: Reusable components that are used throughout the application.
*   `src/pages`: Pages that are rendered by the React Router.
*   `src/hooks`: Custom hooks that are used to manage state and side effects.
*   `src/context`: React context providers that are used to share state between components.
*   `src/api`: Functions that are used to make requests to the backend API.

For more information about the web application, please see the [Project Documentation](../../PROJECT_DOCS.md).
