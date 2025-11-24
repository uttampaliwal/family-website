# API Development Guide

This guide provides instructions for setting up and running the API service locally for development.

## Prerequisites

- Node.js (v18 or higher)
- npm
- Docker and Docker Compose (for running with other services)
- A running instance of MongoDB. You can use a local installation or the one provided in the project's Docker Compose setup.

## Setup

1.  **Install Dependencies:** From the root of the monorepo, run:

    ```bash
    npm install
    ```

2.  **Environment Variables:** This project uses a `.env` file at the root of the monorepo to manage environment variables. Copy the `.env.example` file (if it exists) to a new file named `.env` and fill in the required values.

## Running the API

There are three ways to run the API for development:

- **`npm run dev:local --workspace=api`**: This is the recommended script for most development scenarios. It connects to a MongoDB instance running on `localhost`.

- **`npm run dev:docker --workspace=api`**: This script is for when you are running the entire application stack using `docker compose up`. It connects to the `mongo` service defined in the `docker-compose.yml` file.

- **`npm run dev --workspace=api`**: This is a generic script that can be used if you have a different MongoDB setup. You will need to configure the `MONGO_HOST` environment variable accordingly.

All commands should be run from the root of the monorepo.

## Running Tests

To run the tests, use the following command from the root of the monorepo:

```bash
npm test --workspace=api
```

To run the tests in watch mode, use:

```bash
npm run test:watch --workspace=api
```

## Linting

To check for linting errors, run the following command from the root of the monorepo:

```bash
npm run lint --workspace=api
```
