# Partisipro Backend - Development Setup

This guide provides comprehensive instructions for setting up the Partisipro
backend development environment.

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI
- Docker and Docker Compose (optional)
- Redis (optional, for caching)
- Git

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 3. Set Up Environment Variables

Copy the development environment file:

```bash
cp .env.development .env.local
```

Edit `.env.local` with your specific configuration values.

### 4. Start Development Environment

#### Option A: With Firebase Emulators (Recommended)

```bash
# Start Firebase emulators and backend concurrently
npm run dev

# Or start separately
npm run emulators:start  # In one terminal
npm run start:dev        # In another terminal
```

#### Option B: With Docker Compose

```bash
# Start all services including Redis, PostgreSQL, and Firebase emulators
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### 5. Seed Test Data

```bash
# Seed the Firebase emulator with test data
npm run emulators:seed
```

## Development Workflow

### Firebase Emulators

The development environment uses Firebase emulators for local development:

- **Firestore**: `localhost:8080`
- **Authentication**: `localhost:9099`
- **Storage**: `localhost:9199`
- **Functions**: `localhost:5001`
- **Firebase UI**: `localhost:4000`

### Test Credentials

After seeding, you can use these test accounts:

- **Admin**: `admin@partisipro.com` / `admin123`
- **SPV**: `spv@example.com` / `spv123`
- **Investor**: `investor@example.com` / `investor123`

### API Endpoints

The backend API will be available at:

- **Base URL**: `http://localhost:3000`
- **API Documentation**: `http://localhost:3000/api/docs` (Swagger)
- **Health Check**: `http://localhost:3000/health`

## Development Commands

```bash
# Start development with hot reload
npm run start:dev

# Start with debugging
npm run start:debug

# Build the application
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## Firebase Emulator Commands

```bash
# Start all emulators
npm run emulators:start

# Export emulator data
npm run emulators:export

# Import emulator data
npm run emulators:import

# Seed test data
npm run emulators:seed
```

## Project Structure

```
apps/backend/
├── src/
│   ├── common/           # Shared utilities and services
│   ├── config/           # Configuration files
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── users/        # User management
│   │   ├── projects/     # Project management
│   │   ├── investments/  # Investment handling
│   │   ├── payments/     # Payment processing
│   │   ├── kyc/          # KYC verification
│   │   ├── profits/      # Profit distribution
│   │   ├── blockchain/   # Blockchain integration
│   │   ├── admin/        # Admin functionality
│   │   └── notifications/ # Notification system
│   ├── app.module.ts     # Main application module
│   └── main.ts           # Application entry point
├── test/                 # Test files
├── scripts/              # Utility scripts
├── firebase.json         # Firebase configuration
├── firestore.rules       # Firestore security rules
├── package.json          # Dependencies and scripts
└── README.dev.md         # This file
```

## Environment Variables

### Firebase Configuration

```env
_FIREBASE_PROJECT_ID=partisipro-dev
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

### JWT Configuration

```env
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

### Third-party Services

```env
KYC_PROVIDER=verihubs
KYC_API_KEY=your_kyc_api_key
PAYMENT_GATEWAY=midtrans
PAYMENT_API_KEY=your_payment_api_key
```

## Database Schema

The application uses Firestore with the following collections:

- **users**: User profiles and authentication data
- **projects**: Project information and tokenization details
- **investments**: Investment records and transactions
- **profit_distributions**: Profit distribution records
- **profit_claims**: Individual profit claims
- **notifications**: User notifications
- **system_configuration**: Platform configuration
- **spv_whitelist**: Whitelisted SPV addresses

## API Documentation

### Swagger/OpenAPI

Visit `http://localhost:3000/api/docs` for interactive API documentation.

### Key Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/projects` - List projects
- `POST /api/investments` - Create investment
- `GET /api/profits/my-claims` - Get profit claims
- `POST /api/admin/spv/whitelist` - Whitelist SPV (Admin)

## Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### E2E Tests

```bash
# Run e2e tests
npm run test:e2e
```

### Manual Testing

Use the seeded test data to manually test the API endpoints using:

- Postman or Insomnia
- curl commands
- Swagger UI at `http://localhost:3000/api/docs`

## Troubleshooting

### Common Issues

1. **Firebase Emulator Connection Issues**
   - Make sure emulators are running: `npm run emulators:start`
   - Check emulator status: `firebase emulators:exec "echo 'Emulators running'"`

2. **Port Conflicts**
   - Backend API: Change `API_PORT` in `.env.local`
   - Firebase Emulators: Modify ports in `firebase.json`

3. **Module Not Found Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear TypeScript cache: `rm -rf dist && npm run build`

### Debugging

1. **Enable Debug Logging**

   ```env
   LOG_LEVEL=debug
   ```

2. **Use VS Code Debugger**
   - Set breakpoints in code
   - Run debug configuration: "Launch Program"

3. **Check Emulator Logs**
   - Firebase UI: `http://localhost:4000`
   - Console logs in terminal

## Contributing

1. **Code Style**
   - Follow ESLint and Prettier configurations
   - Use TypeScript strictly
   - Write comprehensive tests

2. **Git Workflow**
   - Create feature branches
   - Use conventional commits
   - Submit pull requests

3. **Documentation**
   - Update API documentation
   - Add inline code comments
   - Update README files

## Security

### Development Security

- Use environment variables for sensitive data
- Never commit secrets to version control
- Use HTTPS in production
- Implement proper authentication and authorization

### Firebase Security

- Use Firebase Security Rules for Firestore
- Validate all inputs
- Implement proper user access controls
- Monitor for security violations

## Performance

### Optimization Tips

- Use Redis caching for frequently accessed data
- Implement pagination for large datasets
- Use database indexes for query optimization
- Monitor performance metrics

### Monitoring

- Use Firebase Performance Monitoring
- Implement health checks
- Set up alerting for errors
- Monitor resource usage

## Deployment

### Production Deployment

See the main project README for production deployment instructions.

### Staging Deployment

1. Set up staging environment variables
2. Deploy to Firebase staging project
3. Run smoke tests
4. Promote to production

## Support

For development support:

1. Check this documentation
2. Review code comments
3. Check Firebase documentation
4. Ask team members
5. Create GitHub issues

---

Happy coding! 🚀
