# AGENTS.md - Family Website Repository

## Commands

- **Build**: `npm run build` (Turbo builds API and web)
- **Lint**: `npm run lint` / `npm run lint:fix` (ESLint with TypeScript)
- **Test**: `npm run test` (Jest for API, Vitest for web)
- **Single test**: API `npx jest apps/api/src/path/to/file.test.ts`, Web `npx vitest run apps/web/src/path/to/file.test.ts`
- **Type check**: `npm run type-check` (Turbo)
- **Format**: `npm run format` (Prettier)

## Code Style

- **Language**: TypeScript strict mode, 2-space indentation
- **Imports**: Relative paths, group external then internal
- **Naming**: PascalCase components, camelCase variables/functions, UPPER_SNAKE constants
- **Types**: Define interfaces for data structures, use unions/enums
- **Error handling**: Async/await with try/catch, log errors, return user-friendly messages
- **React**: Functional components with hooks, no classes
- **Styling**: Tailwind CSS classes, responsive design
- **Comments**: Minimal, only for complex logic
- **Formatting**: Prettier auto-formats, ESLint enforces rules
- **Architecture**: Monorepo with Turbo, API (Express) + Web (React/Vite)
