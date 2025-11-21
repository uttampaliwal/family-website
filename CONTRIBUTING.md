# Contributing to Family Portal

Thank you for your interest in contributing to the Family Portal! This document provides guidelines and information for contributors.

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before participating.

## How to Contribute

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/family-portal.git`
3. Install dependencies: `npm run setup`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Set up environment: `cp .env.example .env` and configure
6. Start development: `npm run dev`

### Development Workflow

1. **Write Code**: Follow the existing code style and conventions
2. **Test**: Ensure all tests pass with `npm test`
3. **Lint**: Run `npm run lint:fix` to fix code issues
4. **Format**: Run `npm run format` to format code
5. **Type Check**: Run `npm run type-check` for TypeScript validation
6. **Commit**: Use descriptive commit messages
7. **Push**: Push your changes to your fork
8. **Create PR**: Open a pull request with a clear description

### Code Standards

- **TypeScript**: Strict type safety throughout
- **ESLint**: Follow the configured linting rules
- **Prettier**: Code is automatically formatted
- **Testing**: Write tests for new features
- **Documentation**: Update docs for significant changes

### Commit Messages

Use conventional commit format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for formatting
- `refactor:` for code restructuring
- `test:` for testing
- `chore:` for maintenance

Example: `feat: add user profile picture upload`

### Pull Request Guidelines

- Provide a clear description of changes
- Reference any related issues
- Ensure CI checks pass
- Request review from maintainers
- Be responsive to feedback

### Reporting Issues

- Use GitHub issues for bugs and feature requests
- Provide detailed steps to reproduce bugs
- Include environment information
- Use issue templates when available

### Security

- Report security vulnerabilities privately to maintainers
- Do not commit sensitive information
- Follow secure coding practices

## Getting Help

- Check the [documentation](docs/) first
- Search existing issues
- Ask in discussions (if enabled)

Thank you for contributing to make the Family Portal better!
