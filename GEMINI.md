# Project: Family Website

This document provides a summary of the project's goals, technology stack, and current status.

## Goal

The primary goal of this project is to build a personal/family website to learn full-stack web development. The website will feature user authentication, content management (photos, blogs, calendars), and a mix of public and private pages.

## Technology Stack

This project is a MERN-like monorepo managed with Turborepo.

*   **Monorepo:** Turborepo
*   **Frontend:** React with Vite and TypeScript
*   **Backend:** Node.js with Express.js
*   **Database:** MongoDB running in Docker
*   **Authentication:** JSON Web Tokens (JWT)
*   **Styling:** Tailwind CSS v4.1

## Current Status

The project is in the implementation phase. The basic project structure is set up, and both the frontend and backend applications are running. The frontend has basic, styled login and register pages with conditional rendering. The backend is a minimal Express.js server.

**Recent Development (July 2, 2025):**
- **Checkpoint:** A project checkpoint has been created: [family-website-checkpoint.zip](./family-website-checkpoint.zip)
- **Frontend Rebuild:** The `apps/web` directory has been completely rebuilt from scratch using Vite, React, and TypeScript. A new `FRONTEND_DESIGN.md` document has been created to guide frontend development.
- **Fresh Frontend Creation:** The `apps/web` directory was removed and a fresh React project with TypeScript was created using Vite, and its dependencies were installed.