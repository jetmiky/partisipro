# Contributing to Partisipro

Welcome to Partisipro! We're excited that you're interested in contributing to
our blockchain-based PPP funding platform.

## Development Setup

### Prerequisites

- Node.js 18+ and npm 8+
- Git
- Docker (optional, for full local development)

### Getting Started

1. **Fork and clone the repository**:

   ```bash
   git clone https://github.com/your-username/partisipro.git
   cd partisipro
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment**:

   ```bash
   ./tools/scripts/setup-env.sh
   ```

4. **Start development**:
   ```bash
   npm run dev
   ```

## Development Workflow

### Code Quality

We use several tools to maintain code quality:

- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks for pre-commit checks
- **Commitlint**: Conventional commit message validation

### Git Hooks

Our Git hooks will automatically run the following checks:

#### Pre-commit:

- ESLint with auto-fix
- Prettier formatting
- Type checking

#### Commit message:

- Conventional commit format validation

#### Pre-push:

- Full type checking
- Test suite
- Build verification

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for our
commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or dependency changes
- `ci`: CI configuration changes
- `chore`: Other maintenance tasks
- `contract`: Smart contract changes
- `deploy`: Deployment related changes

#### Examples:

```bash
feat(frontend): add wallet connection component
fix(backend): resolve authentication token validation
docs: update API documentation
contract(token): implement profit distribution logic
```

### Using Commitizen (Optional)

For interactive commit message creation:

```bash
npm run commit
```

## Project Structure

```
partisipro/
├── apps/
│   ├── frontend/          # Next.js frontend
│   └── backend/           # NestJS backend
├── packages/
│   ├── contracts/         # Smart contracts
│   └── shared/            # Shared utilities
└── tools/                 # Development tools
```

## Development Commands

### Root Level Commands:

```bash
# Development
npm run dev                # Start all services
npm run build              # Build all packages
npm run test               # Run all tests
npm run lint               # Lint all code
npm run lint:fix           # Fix linting issues
npm run format             # Format all code
npm run type-check         # Type check all packages

# Git workflow
npm run commit             # Interactive commit (Commitizen)
```

### Package-specific Commands:

```bash
# Frontend
cd apps/frontend
npm run dev                # Start frontend dev server
npm run build              # Build frontend
npm run lint               # Lint frontend code

# Backend
cd apps/backend
npm run dev                # Start backend dev server
npm run build              # Build backend
npm run test               # Run backend tests

# Contracts
cd packages/contracts
npm run dev                # Start local blockchain
npm run test               # Run contract tests
npm run deploy:local       # Deploy to local network
```

## Code Style Guidelines

### TypeScript/JavaScript:

- Use TypeScript for all new code
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Follow the existing code style (enforced by Prettier)

### React/Frontend:

- Use functional components with hooks
- Prefer named exports over default exports
- Keep components small and focused
- Use proper TypeScript types for props

### Solidity:

- Follow the
  [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use OpenZeppelin contracts when possible
- Add comprehensive NatSpec documentation
- Write thorough tests for all contracts

### Backend/NestJS:

- Use dependency injection
- Follow the module-based architecture
- Add proper error handling
- Write unit and integration tests

## Testing

### Running Tests:

```bash
# All tests
npm run test

# Specific package tests
npm run test --workspace=@partisipro/contracts
npm run test --workspace=@partisipro/backend
```

### Test Guidelines:

- Write tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Mock external dependencies

## Security

### Smart Contract Security:

- Use OpenZeppelin contracts
- Follow security best practices
- Get security audits for production code
- Never hardcode private keys or secrets

### Backend Security:

- Validate all inputs
- Use proper authentication and authorization
- Follow OWASP guidelines
- Regular dependency updates

## Documentation

### Code Documentation:

- Add JSDoc comments for public APIs
- Update README files when adding features
- Document configuration options
- Include usage examples

### API Documentation:

- Backend API is auto-documented with Swagger
- Keep Swagger annotations up to date
- Include request/response examples

## Deployment

### Development:

- Use local environment for development
- Test on Arbitrum Sepolia testnet
- Never use mainnet for testing

### Staging:

- Deploy to staging environment first
- Test all features thoroughly
- Get team approval before production

## Getting Help

- Create an issue for bugs or feature requests
- Join our development discussions
- Ask questions in pull requests
- Check existing documentation first

## License

By contributing to Partisipro, you agree that your contributions will be
licensed under the MIT License.

## Thank You!

Thank you for contributing to Partisipro! Your help in building the future of
infrastructure funding is greatly appreciated.
