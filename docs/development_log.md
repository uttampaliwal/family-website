# Development Log

This document tracks the development process, decisions, and technical explanations for the family website project.

## Phase 1: Requirement Analysis & Planning (2025-06-26)

### Initial User Requirements:
- A personal/family website to learn full-stack development.
- Must use latest, free, popular, and secured technologies.
- Full software development cycle coverage (requirements to deployment).
- MERN-like monorepo for scalability and separation of concerns.
- Local management of databases and files for full control.
- Detailed explanations for all technology choices and alternatives.
- User authentication (Sign In/Register) for family members to access personal dashboards.
- Content: Photos, blogs, calendars.
- Access: A mix of public-facing pages and private, login-protected dashboards.
- Future Features: Potential for a chat application.

### High-Level Design & Technology Selection

A MERN-like stack within a monorepo is an excellent, modern choice for this project. It's scalable, maintainable, and provides experience with in-demand technologies.

**1. Monorepo Management: Turborepo**
- **Why:** High-performance build system for JS/TS monorepos. Its key advantages are speed (it caches everything) and simplicity. It's less opinionated than alternatives, making it easier to integrate with other tools.
- **Alternative:** **Nx**. A powerful "batteries-included" framework.
- **Rejection Justification:** Nx has a steeper learning curve. For this project, Turborepo's simplicity allows a clearer focus on the application code (React, Node.js) rather than the tooling.

**2. Frontend: React with Vite**
- **Why:** React is the 'R' in MERN. We will use **Vite** as our build tool for its significantly faster development experience compared to the older Create React App.

**3. Backend: Node.js with Express.js**
- **Why:** The classic "E" and "N" in MERN. Express is a minimal and flexible Node.js web application framework.

**4. Database: MongoDB running in Docker**
- **Why:** MongoDB is the 'M' in MERN, a flexible NoSQL database. We will run it locally using **Docker**.
- **Why Docker:** Docker isolates services like our database into "containers". This guarantees a consistent environment, simplifies management (start, stop, reset), and aligns with modern deployment practices without installing MongoDB directly on the host system.

**5. Authentication: JSON Web Tokens (JWT)**
- **Why:** JWT is the industry standard for securing APIs between a frontend and backend.

## Phase 3: Implementation (Chunks)

### Chunk 1: Project Scaffolding & Documentation (2025-06-26)
- Created the `family-website` monorepo structure with `apps` and `packages` directories.
- Initialized the project with a root `package.json` and `turbo.json`.
- Set up the `docs` directory with `development_log.md` and `user_prompts.md`.
- Installed root dependencies (`turbo`, `prettier`).

### Chunk 2: Creating Frontend & Backend Applications (2025-06-26)
- Scaffolded the `web` frontend application using Vite (`react-ts` template).
- Manually created the `api` backend application with Express.js and TypeScript.
- Installed dependencies for both applications using `npm install` from the root.

### Chunk 3: Verification & Troubleshooting (2025-06-26)
- **Attempt 1:** Ran `npm run dev`. The process failed.
- **Diagnosis 1:** The `turbo.json` file used the deprecated `pipeline` key instead of `tasks`.
- **Fix 1:** Renamed `pipeline` to `tasks` in `turbo.json`.
- **Attempt 2:** Ran `npm run dev` again. The `api` service started, but the `web` service failed with a `TypeError: crypto.hash is not a function` error.
- **Diagnosis 2:** This error is often caused by an incompatible or older version of Node.js. The user's version was `v18.18.1`.
- **Fix 2:** Instructed the user to install `nvm` (Node Version Manager) and upgrade to the latest LTS version of Node.js (`v20.x`).
- **Resolution:** The user discovered the command was being run in an old terminal that still had the old Node.js version loaded. Running `npm run dev` in a new terminal resolved the issue.
- **Verification:** Both the `api` (on port 3001) and `web` (on port 5173) servers are now running successfully.

### Chunk 4: Basic Frontend Login UI (2025-06-26)
- Created a `components` directory in the `web` app.
- Created `LoginPage.tsx` and `RegisterPage.tsx` with basic, unstyled forms.
- Updated `App.tsx` to display the new components.

### Chunk 5: Styling Setup with Tailwind CSS & Environment Troubleshooting (2025-06-26)
- **Technology Choice:** Selected **Tailwind CSS v4.1** for its utility-first approach, which is excellent for learning and rapid prototyping.
- **Installation Attempt 1:** `npm install` failed with an `EACCES` permission error in `node_modules`.
- **Diagnosis:** File ownership issues, likely from a previous `sudo` command.
- **Fix:** Instructed user to run `sudo chown -R uttam:uttam` on the project directory.
- **Installation Attempt 2:** `npm install` succeeded, but `npx tailwindcss init -p` failed with `could not determine executable to run` and `Unsupported engine` warnings.
- **Diagnosis:** A persistent Node.js version conflict. The project was still being affected by an older Node version (v18) despite v20 being installed.
- **Fix 1:** Created a `.nvmrc` file in the project root to enforce the use of the latest LTS Node version.
- **Fix 2:** The `nvm` command was not found. Guided user to add the `nvm` sourcing script to their `.bashrc` file to make it available in all new terminals.
- **Fix 3:** The `npx` command continued to fail. As a workaround, instructed the user to run the tailwind executable directly (`./node_modules/.bin/tailwindcss init -p`).
- **Resolution:** The user successfully created the `tailwind.config.js` and `postcss.config.js` files.
- **Configuration:** Updated `tailwind.config.js` to scan the project's source files and configured `index.css` with Tailwind's base directives.
- **Final Verification:** User confirmed that running `npm run dev` in a new terminal (after `nvm use`) successfully starts both the `web` and `api` servers without errors.

### Chunk 6: Tailwind CSS PostCSS Plugin Fix & Verification (2025-06-27)
- **Issue:** The web application failed to load with a PostCSS error, indicating `tailwindcss` was used directly as a PostCSS plugin instead of `@tailwindcss/postcss`.
- **Fix 1:** Installed `@tailwindcss/postcss` in the monorepo root (`npm install @tailwindcss/postcss`).
- **Fix 2:** Updated `apps/web/postcss.config.js` to use `@tailwindcss/postcss` instead of `tailwindcss`.
- **Verification:** The web application successfully started and is accessible on `http://localhost:5174` (port 5173 was in use).

### Chunk 7: Styling Login/Register UI (2025-06-27)
- Applied basic Tailwind CSS styling to `LoginPage.tsx` and `RegisterPage.tsx` to create a visually appealing and responsive form layout.

### Chunk 8: Conditional Rendering of Login/Register UI (2025-06-27)
- Modified `App.tsx` to conditionally render `LoginPage` and `RegisterPage` components, allowing users to switch between them via a button.
- Ensured only one form is displayed at a time, resolving previous layout conflicts and centering the active form on the page.

### Chunk 9: Backend Authentication Review (2025-06-27)
- Reviewed `docker-compose.yml` and confirmed MongoDB setup is in place.
- Reviewed `apps/api/src/index.ts` and confirmed the backend connects to MongoDB using Mongoose.
- Reviewed `apps/api/.env` and confirmed `MONGO_URI` and `JWT_SECRET` are configured.
- Reviewed `apps/api/src/models/User.ts` and confirmed the User model is defined.
- Reviewed `apps/api/src/routes/auth.ts` and confirmed `/register` and `/login` routes are implemented with bcrypt and JWT.
- **Conclusion:** The core backend authentication logic is already in place.

### Chunk 10: Frontend-Backend Integration for Authentication (2025-06-27)
- Modified `apps/web/src/components/RegisterPage.tsx` to handle user registration.
  - Added state variables for name, email, password, and messages.
  - Implemented `handleSubmit` function to send registration data to `http://localhost:3001/api/auth/register`.
  - Displayed success or error messages based on API response.
- Modified `apps/web/src/components/LoginPage.tsx` to handle user login.
  - Added state variables for email, password, and messages.
  - Implemented `handleSubmit` function to send login data to `http://localhost:3001/api/auth/login`.
  - Displayed success or error messages based on API response.
  - Logged the received JWT token to the console upon successful login.

### Chunk 11: Docker Troubleshooting (2025-06-27)
- **Issue:** `docker-compose` command not found, then `docker compose` permission denied.
- **Diagnosis 1:** `docker-compose` (v1) was not installed or in PATH. `docker compose` (v2) was installed but user lacked permissions.
- **Fix 1:** Instructed user to run `sudo apt --fix-broken install` to resolve potential dependency issues.
- **Diagnosis 2:** `sudo apt --fix-broken install` did not fully resolve the issue, and `docker.io` conflicts were observed.
- **Fix 2:** Instructed user to run `sudo apt remove docker.io` to remove conflicting packages.
- **Diagnosis 3:** `docker compose` still showed "permission denied" error.
- **Fix 3:** Instructed user to add their user to the `docker` group (`sudo usermod -aG docker $USER`) and **log out and log back in** for changes to take effect.
- **Current Status:** Awaiting user to log out and log back in to apply Docker group changes.

### Chunk 12: Environment Variable Loading Troubleshooting (2025-06-27)
- **Issue:** The API server was getting stuck during initialization, specifically at the point of loading environment variables from the `.env` file, even after confirming `dotenv.config()` was called.
- **Diagnosis:** Initial investigation suggested `dotenv.config()` might be failing silently or not picking up the `.env` file in the expected location.
- **Fix:** Modified `apps/api/src/index.ts` to explicitly specify the path to the `.env` file using `path.resolve(__dirname, '../.env')` within `dotenv.config()`. This involved adding `import path from 'path';` and then updating the `dotenv.config()` call.
- **Current Status:** The issue persists, and the API server is still getting stuck, indicating the problem might be deeper than just the `.env` file, possibly related to the MongoDB connection string or the connection process itself. Further debugging is required.

### Chunk 35: Frontend Rebuild (2025-06-30)

- **Action:** The entire `apps/web` directory was backed up and then removed from the project to address persistent, unresolvable styling issues.
- **Reasoning:** After exhausting all available debugging options for the Tailwind CSS and PostCSS integration with Vite, a full rebuild of the frontend was deemed the most efficient path forward. This allows for a clean slate and a more structured approach to the frontend development.
- **Process:**
    - The existing `apps/web` directory was moved to `/home/uttam/development/repo-backups/web-backup-$(date +%s)`.
    - A new Vite project with the React and TypeScript template was created in `apps/web`.
    - A new `FRONTEND_DESIGN.md` file was created to document the frontend architecture, design, and development process.
    - Project documentation (`GEMINI.md`, `docs/development_log.md`, `docs/user_prompts.md`) was updated to reflect the changes.

### Chunk 36: Fresh Frontend Creation (2025-07-01)

- **Action:** The `apps/web` directory was removed to ensure a clean slate.
- **Process:**
    - The existing `apps/web` directory was removed using `rm -rf`.
    - A new React project with TypeScript was created using `npm create vite@latest apps/web -- --template react-ts`.
    - Dependencies for the new project were installed using `npm install` within the `apps/web` directory.

### Chunk 37: Sign-in Flow and UI Centering Improvements (2025-07-02)

- **Checkpoint:** A project checkpoint has been created: [family-website-checkpoint.zip](../family-website-checkpoint.zip)
- **Backend (`apps/api/src/routes/auth.ts`):
    - Modified the login route to return 'User not found' instead of 'Invalid credentials' when an email is not registered.
    - Added `verificationUrl` definition for email verification.
    - Created `apps/api/src/types/express.d.ts` to extend the Express `Request` interface with a `user` property, resolving TypeScript errors.
    - Updated `apps/api/tsconfig.json` to include the new `src/types` directory.
- **Frontend (`apps/web/src/pages/LoginPage.tsx`):
    - Implemented logic to check for the 'User not found' message from the backend.
    - If 'User not found', displays a message and redirects the user to the register page after a short delay.
    - Centered the login form using `margin: '0 auto'` and `max-width`.
- **Frontend (`apps/web/src/pages/RegisterPage.tsx`):
    - Removed unused `useNavigate` import and declaration to resolve linting errors.
    - Centered the sign-up form using `margin: '0 auto'` and `max-width`.
- **Frontend (`apps/web/src/pages/HomePage.tsx`):
    - Fixed linting error related to unused `err` variable in `useEffect`.
    - Attempted to center the "Welcome to your Family Website!" message and other content by adjusting `div` styles and `h1`/`p` `textAlign`.
- **Frontend (`apps/web/src/App.tsx`):
    - Adjusted main `div` styling to ensure proper centering of content within the application layout.
    - Wrapped `Routes` component in a `div` with `width: '100%'`.
- **Frontend (`apps/web/src/index.css`):
    - Modified `html` and `body` styles to ensure full width and height, and adjusted `body`'s flexbox properties for overall page centering.
### Chunk 38: Fix Blank Page and Refactor Auth Buttons (2025-07-02)

- **Issue:** The web application was showing a blank gray page after recent changes to `App.tsx`.
- **Diagnosis:** The `useLocation` hook was being called outside of the `Router` context in `App.tsx`, causing a runtime error.
- **Fix:** Refactored the conditional rendering of authentication buttons into a new component, `AuthButtons.tsx`.
    - Created `apps/web/src/components/AuthButtons.tsx` to encapsulate the `useLocation` hook and the conditional rendering logic for the "Login" and "Register" buttons.
    - Modified `apps/web/src/App.tsx` to import and render the `AuthButtons` component within the `Router`.
- **Frontend (`apps/web/src/pages/LoginPage.tsx` and `apps/web/src/pages/RegisterPage.tsx`):
    - Removed the global "Login" and "Register" buttons from these pages, as they are now handled by the `AuthButtons` component.
    - Added `Link` components to allow switching between login and register forms within their respective pages.
- **Verification:** The web application now renders correctly, and the authentication buttons are displayed only on the home page.