# Contributing to InternTrackr

Thank you for your interest in contributing to InternTrackr! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- **Node.js 22.x** (LTS) - Use `nvm install 22.x && nvm use 22.x`
- **npm 10+**
- **Docker Desktop** (for MongoDB + Redis)
- **Git** with GitHub account

### Setup

```bash
# Clone and setup
git clone <repo>
cd interntrackr
npm install

# Environment setup
cp apps/api/.env.example apps/api/.env

# Start infrastructure
docker compose up -d

# Run development servers
npm run dev:api    # Backend on http://localhost:4000
npm run dev:web     # Frontend on http://localhost:5173
```

## 🌿 Branch Strategy

### Branch Naming

- **Feature**: `feat/<area>-<short-name>` (e.g., `feat/auth-login`, `feat/api-applications`)
- **Fix**: `fix/<area>-<short-name>` (e.g., `fix/auth-token-refresh`, `fix/ui-responsive`)
- **Chore**: `chore/<description>` (e.g., `chore/update-deps`, `chore/lint-config`)
- **Docs**: `docs/<description>` (e.g., `docs/api-documentation`, `docs/setup-guide`)

### Workflow

1. **Create feature branch** from `main`
2. **Make changes** with clear, atomic commits
3. **Test locally** - ensure all tests pass
4. **Create Pull Request** linking to related issue
5. **Review process** - address feedback
6. **Merge** via squash merge to `main`

## 📝 Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(auth): add JWT token refresh mechanism
fix(api): handle validation errors in applications endpoint
docs(readme): update setup instructions
test(auth): add unit tests for login flow
```

## 🔍 Code Quality

### Before Submitting

- [ ] **Lint check**: `npm run lint` passes
- [ ] **Type check**: TypeScript compilation succeeds
- [ ] **Tests pass**: All existing tests pass
- [ ] **No console.log**: Remove debug statements
- [ ] **Commit messages**: Follow conventional commit format

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow project configuration
- **Prettier**: Auto-format on save
- **Imports**: Use absolute imports where configured

### Testing

- **Unit tests**: Required for new features
- **Integration tests**: For API endpoints
- **E2E tests**: For critical user flows
- **Test coverage**: Maintain >80% for critical paths

## 📋 Pull Request Process

### PR Requirements

1. **Link to Issue**: Reference the GitHub issue being addressed
2. **Clear Title**: Descriptive PR title
3. **Description**: Explain what, why, and how
4. **Screenshots**: For UI changes (if applicable)
5. **Testing**: Describe how you tested the changes
6. **Breaking Changes**: Document any breaking changes

### PR Template

```markdown
## Description

Brief description of changes

## Related Issue

Closes #<issue-number>

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Screenshots attached (if UI changes)

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 🐛 Bug Reports

When reporting bugs, include:

1. **Clear title**: Brief description
2. **Steps to reproduce**: Detailed steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**: OS, browser, Node version
6. **Screenshots**: If applicable
7. **Console logs**: Any error messages

## ✨ Feature Requests

For new features:

1. **Check existing issues**: Avoid duplicates
2. **Clear description**: What and why
3. **Use cases**: How would it be used?
4. **Acceptance criteria**: How to know it's done
5. **Priority**: High/Medium/Low

## 🏗️ Architecture Guidelines

### Backend (`apps/api`)

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic
- **Models**: Database schemas
- **Middleware**: Request processing
- **Routes**: API endpoint definitions

### Frontend (`apps/web`)

- **Components**: Reusable UI components
- **Pages**: Route-level components
- **Hooks**: Custom React hooks
- **Services**: API communication
- **Types**: TypeScript definitions

### File Structure

```
apps/api/src/
├── controllers/     # HTTP handlers
├── services/        # Business logic
├── models/          # Database schemas
├── middleware/      # Express middleware
├── routes/          # Route definitions
└── utils/           # Utility functions

apps/web/src/
├── components/      # Reusable components
├── pages/           # Route components
├── hooks/           # Custom hooks
├── services/        # API clients
├── types/           # TypeScript types
└── utils/           # Helper functions
```

## 🤝 Review Process

### For Reviewers

- **Be constructive**: Provide helpful feedback
- **Test changes**: Actually test the functionality
- **Check standards**: Ensure code quality
- **Ask questions**: Clarify unclear parts
- **Approve promptly**: Don't let PRs sit

### For Authors

- **Respond quickly**: Address feedback promptly
- **Be open**: Accept constructive criticism
- **Ask questions**: Clarify feedback if needed
- **Update tests**: Include tests for new features
- **Document changes**: Update relevant docs

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Pull Requests**: For code-related questions

## 📄 License

By contributing to InternTrackr, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to InternTrackr! 🎉
