# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Pre-commit hooks with husky for code quality enforcement
- CONTRIBUTING.md with development guidelines
- CODE_OF_CONDUCT.md for community standards
- Comprehensive documentation in docs/ folder
- .editorconfig for consistent coding styles
- LICENSE file (MIT)
- .env.example with production overrides
- Security vulnerability fixes via npm audit

### Changed

- Updated .gitignore to ignore .env.production
- Enhanced .env.example with detailed configuration

### Fixed

- Removed unnecessary files from repository
- Fixed security vulnerabilities in dependencies

## [0.2.5] - 2025-11-21

### Added

- Initial release of Family Portal
- User authentication and authorization
- Family management features
- Calendar system
- Document management
- Real-time chat
- Social features
- Admin dashboard
- Docker support
- Comprehensive testing suite
- API documentation with Swagger

### Security

- JWT-based authentication
- CSRF protection
- Input sanitization
- Rate limiting
- Security headers with Helmet

### Infrastructure

- Monorepo setup with Turbo
- TypeScript throughout
- ESLint and Prettier configuration
- GitHub Actions CI/CD
- Docker containerization
- Multiple deployment options (Vercel, Render, Docker)
