# Project: Family Website

This document serves as the central hub for understanding the "Family Website" project, outlining its core philosophy, technical architecture, development methodology, and current status. It reflects our commitment to building a high-quality, maintainable, and scalable web application while serving as a practical learning platform for full-stack web development.

## 1. Goal & Philosophy

The primary goal of this project is to build a personal/family website that serves as a hands-on learning experience in full-stack web development. Beyond simply creating a functional website with user authentication and content management (photos, blogs, calendars), our philosophy emphasizes:

*   **Continuous Learning:** Embracing new technologies and best practices, and documenting our journey and decisions.
*   **Code Quality & Craftsmanship:** Writing clean, readable, maintainable, and efficient code. Adhering to established conventions and striving for idiomatic solutions.
*   **User-Centric Design:** Prioritizing a clean, intuitive, and responsive user experience (UI/UX).
*   **Modularity & Scalability:** Designing components and services that are loosely coupled, reusable, and can scale independently.
*   **Transparency & Documentation:** Thoroughly documenting decisions, processes, and technical details to ensure clarity and facilitate future development.

## 2. Technology Stack & Rationale

This project is structured as a MERN-like monorepo, managed with Turborepo, reflecting a modern approach to full-stack development.

*   **Monorepo Management: Turborepo**
    *   **Rationale:** Chosen for its high-performance build system, caching capabilities, and simplicity in managing multiple interdependent applications (frontend and backend) within a single repository. It streamlines development workflows and ensures consistent tooling.
*   **Frontend: React with Vite and TypeScript**
    *   **Rationale:** React provides a robust and widely adopted library for building interactive user interfaces. Vite is selected for its incredibly fast development server and build times, leveraging native ES modules. TypeScript ensures type safety, improves code quality, and enhances developer productivity through better tooling and fewer runtime errors.
*   **Backend: Node.js with Express.js**
    *   **Rationale:** Node.js offers a JavaScript runtime environment, enabling a unified language across the full stack. Express.js provides a minimalist and flexible web application framework for building robust APIs.
*   **Database: MongoDB running in Docker**
    *   **Rationale:** MongoDB, a NoSQL database, offers flexibility and scalability for handling diverse data types. Running it in Docker ensures a consistent and isolated development environment, simplifying setup and management without direct host installation.
*   **Authentication: JSON Web Tokens (JWT)**
    *   **Rationale:** JWTs are a secure and stateless method for handling user authentication, ideal for API-driven applications.
*   **Styling: Tailwind CSS v4.1**
    *   **Rationale:** Tailwind CSS is a utility-first CSS framework that promotes rapid UI development and consistent design. Version 4.1, as a PostCSS plugin, allows for highly optimized and performant CSS output. Our commitment to this framework ensures a cohesive visual language across the application.

## 3. Methodology & Evolution

Our development methodology is iterative and adaptive, focusing on continuous improvement and learning from each phase.

*   **Iterative Development:** Features are developed in small, manageable chunks, allowing for frequent feedback and adjustments.
*   **Refactoring as a Core Practice:** We actively seek opportunities to refactor code, improving its structure, readability, and maintainability. This includes the recent extensive refactoring of inline styles to Tailwind CSS classes, demonstrating our commitment to code quality.
*   **Problem-Solving & Debugging:** When issues arise, we employ systematic debugging approaches, including adding detailed logging and verifying changes thoroughly. This was evident in resolving the persistent frontend validation issues.
*   **Documentation-Driven Development:** Key decisions, architectural choices, and significant changes are documented to provide a clear historical record and guide future development. This ensures that the project's evolution is transparent and understandable.

## 4. Core Principles & Values

Our commitment to this project is underpinned by several core values:

*   **Consistency:** Maintaining a uniform approach to coding style, naming conventions, and UI/UX across the entire codebase.
*   **Maintainability:** Writing code that is easy to understand, modify, and extend by current and future developers.
*   **Efficiency:** Optimizing development workflows and application performance.
*   **Clarity:** Ensuring that the codebase and documentation are clear, concise, and unambiguous.
*   **Adaptability:** Being open to new tools and techniques, and adapting our approach as the project evolves or new insights emerge.

## 5. Current Status

The project is in an active implementation phase. The foundational monorepo structure is established, with both frontend and backend applications operational.

*   **Frontend (`apps/web`):**
    *   Features basic, styled login and register pages with conditional rendering.
    *   Extensive refactoring of inline styles to Tailwind CSS classes has been completed, ensuring a consistent and maintainable styling approach.
    *   Custom `CustomSelect` component implemented for enhanced UI/UX on the register page.
    *   Frontend validation logic has been refined for improved user feedback.
*   **Backend (`apps/api`):**
    *   A minimal Express.js server with robust authentication routes (register, login, email verification).
    *   MongoDB integration for data persistence.
    *   Implemented centralized error handling middleware for graceful error management.

## 6. Recent Development (July 2, 2025)

*   **Checkpoint:** A project checkpoint has been created: [family-website-checkpoint.zip](./family-website-checkpoint.zip)
*   **Frontend Rebuild:** The `apps/web` directory was completely rebuilt from scratch using Vite, React, and TypeScript, establishing a clean and modern frontend foundation.
*   **Styling Refactoring:** All inline styles in the web application have been refactored to use Tailwind CSS classes, significantly improving code quality and maintainability.
*   **Custom Select Component:** Implemented a custom select component for the gender field on the register page to overcome native HTML select styling limitations and ensure theme consistency.
*   **Frontend Validation Enhancement:** Improved the specificity and order of validation messages on the register page for a better user experience.
*   **Backend Error Handling:** Implemented centralized error handling middleware in the API for graceful error management.
*   **Terminology Standardization:** Standardized "Sign Up" to "Register" and "Sign In" to "Login" across the entire project (code and documentation) for consistency.
*   **Version Release:** Version `v0.1.0` has been released and tagged in Git.
*   **Dependency and TypeScript Configuration Updates:** Upgraded dependencies to their latest stable versions and ensured consistent TypeScript configurations across `apps/api` and `apps/web`. Removed the root `tsconfig.json`.
*   **Backend Development Environment Fix:** Resolved issues with `npm run dev` in `apps/api` by switching from `ts-node-dev` to `tsx` and removing redundant dependencies, ensuring a stable development environment.
*   **Security Enhancements:**
    *   Changed email verification route from GET to POST in `apps/api/src/routes/auth.ts`.
    *   Removed hardcoded MongoDB credentials from `apps/api/src/index.ts`.
    *   Removed hardcoded JWT secret fallbacks from `apps/api/src/middleware/authMiddleware.ts` and `apps/api/src/routes/auth.ts`.
*   **Robustness & Error Handling:**
    *   Improved error handling in `apps/api/src/routes/auth.ts` to provide more specific client messages and detailed logging.
    *   Added MongoDB reconnection logic in `apps/api/src/index.ts`.
*   **Validation & Performance:**
    *   Enhanced user registration validation (email format, password strength) in `apps/api/src/routes/auth.ts`.
    *   Defined indexes for `email` and `username` in `apps/api/src/models/User.ts`.
*   **Frontend Improvements:**
    *   Configured API endpoint in `apps/web/src/pages/RegisterPage.tsx` via environment variables.
    *   Improved network error handling with retry mechanisms in `apps/web/src/pages/RegisterPage.tsx`.
    *   Enhanced form accessibility with ARIA attributes in `apps/web/src/pages/RegisterPage.tsx`.
    *   Implemented memoization (`useCallback`) for event handlers in `apps/web/src/pages/RegisterPage.tsx`.
    *   Added a note for logo image optimization in `apps/web/src/App.tsx` and `README.md`.
