# Development Workflow

This document outlines the development workflow and best practices for contributing to the Family Website project.

## Development Environment Setup

1. **Clone the Repository**

   ```bash
   git clone <repository_url>
   cd family-website
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   - Create `.env` file in the project root
   - Create `.env` file in `apps/api` directory (if running API outside Docker)
   - See [Getting Started](./getting-started.md) for details on environment variables

4. **Start Development Environment**
   - With Docker Compose (recommended):
     ```bash
     docker compose up -d --build
     ```
   - Without Docker (for faster development):

     ```bash
     # Start MongoDB container
     docker compose up -d mongo

     # In one terminal (API)
     cd apps/api
     npm run dev

     # In another terminal (Web)
     cd apps/web
     npm run dev
     ```

## Monorepo Structure with Turborepo

This project uses Turborepo to manage the monorepo structure. The key benefits include:

- **Workspace Management:** Easily manage multiple packages/apps in a single repository
- **Task Running:** Run commands across all workspaces or target specific ones
- **Caching:** Intelligent caching of task outputs for faster builds
- **Dependencies:** Automatically manage internal dependencies between workspaces

### Common Turborepo Commands

```bash
# Run a command in all workspaces
npm run dev

# Run a command in a specific workspace
npm run dev --workspace=apps/web

# Build all workspaces
npm run build

# Clean all workspaces
npm run clean
```

## Git Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for feature development
- `feature/*`: Feature branches (e.g., `feature/user-profile`)
- `bugfix/*`: Bug fix branches (e.g., `bugfix/login-error`)

### Creating a New Feature

1. **Create a new branch from `develop`**

   ```bash
   git checkout develop
   git pull
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes and commit them**

   ```bash
   git add .
   git commit -m "feat: add my new feature"
   ```

3. **Push your branch to the remote repository**

   ```bash
   git push -u origin feature/my-new-feature
   ```

4. **Create a Pull Request to merge into `develop`**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select `develop` as the base branch and your feature branch as the compare branch
   - Fill out the PR template and submit

### Commit Message Format

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

Examples:

```
feat: add user profile page
fix(auth): resolve login error with special characters
docs: update API documentation
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific workspace
npm test --workspace=apps/api

# Run tests in watch mode
npm test -- --watch
```

### Writing Tests

- **API Tests:** Located in `apps/api/src/**/*.test.ts`
- **Web Tests:** Located in `apps/web/src/**/*.test.tsx`

Example test for a React component:

```tsx
import { render, screen } from "@testing-library/react";
import Button from "./Button";

test("renders button with correct text", () => {
  render(<Button>Click me</Button>);
  const buttonElement = screen.getByText(/click me/i);
  expect(buttonElement).toBeInTheDocument();
});
```

## Code Style and Linting

This project uses ESLint and TypeScript for code quality and consistency.

### Running Linting

```bash
# Lint all workspaces
npm run lint

# Lint a specific workspace
npm run lint --workspace=apps/web

# Fix linting issues
npm run lint -- --fix
```

### TypeScript

- Strict mode is enabled
- Use explicit types for function parameters and return values
- Use interfaces for complex objects
- Use type guards for runtime type checking

## Debugging

### Backend (API)

1. **Using console.log:**

   ```typescript
   console.log("Debug:", variable);
   ```

2. **Using VS Code debugger:**
   - Add a `.vscode/launch.json` file with the following configuration:
     ```json
     {
       "version": "0.2.0",
       "configurations": [
         {
           "type": "node",
           "request": "attach",
           "name": "Attach to API",
           "port": 9229,
           "restart": true,
           "sourceMaps": true
         }
       ]
     }
     ```
   - Start the API with the `--inspect` flag:
     ```bash
     node --inspect node_modules/.bin/tsx watch --tsconfig ./tsconfig.json -r dotenv/config ./src/index.ts
     ```
   - Add breakpoints in VS Code and start debugging

### Frontend (Web)

1. **Using console.log:**

   ```typescript
   console.log("Debug:", variable);
   ```

2. **Using React DevTools:**
   - Install the [React DevTools browser extension](https://reactjs.org/blog/2019/08/15/new-react-devtools.html)
   - Open browser developer tools and navigate to the React tab
   - Inspect component props, state, and hooks

3. **Using VS Code debugger:**
   - Add a `.vscode/launch.json` file with the following configuration:
     ```json
     {
       "version": "0.2.0",
       "configurations": [
         {
           "type": "chrome",
           "request": "launch",
           "name": "Launch Chrome against localhost",
           "url": "http://localhost:5173",
           "webRoot": "${workspaceFolder}/apps/web"
         }
       ]
     }
     ```
   - Add breakpoints in VS Code and start debugging

## Deployment

### Building for Production

```bash
# Build all workspaces
npm run build

# Build a specific workspace
npm run build --workspace=apps/web
```

### Docker Production Build

```bash
# Build and start production containers
docker compose -f docker-compose.prod.yml up -d --build
```

## Continuous Integration

This project uses GitHub Actions for continuous integration. The workflow is defined in `.github/workflows/main.yml`.

The CI pipeline includes:

- Installing dependencies
- Linting
- Type checking
- Running tests
- Building the application
