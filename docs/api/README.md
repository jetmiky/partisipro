# Partisipro Backend API Documentation

## Overview

The Partisipro Backend API provides comprehensive REST endpoints and WebSocket
real-time features for the blockchain-based PPP funding platform. The API
follows RESTful principles with JWT authentication and supports the ERC-3643
identity-centric compliance model.

**Base URL**: `http://localhost:3001/api` (development)  
**WebSocket**: `ws://localhost:3001/realtime`  
**Documentation**: Auto-generated Swagger at `/api/docs`

## Authentication

### JWT Bearer Token Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Web3Auth Integration

```typescript
// Login with Web3Auth
POST /api/auth/web3auth/login
Content-Type: application/json

{
  "idToken": "web3auth_jwt_token"
}

// Response
{
  "user": { ... },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

## API Endpoints by Category

### Authentication & User Management (15 endpoints)

```typescript
// Authentication
POST   /api/auth/web3auth/login          // Web3Auth login
POST   /api/auth/web3auth/refresh        // Refresh JWT tokens
POST   /api/auth/logout                  // Logout user
GET    /api/auth/profile                 // Get user profile
PUT    /api/auth/profile                 // Update user profile

// Multi-Factor Authentication
POST   /api/auth/mfa/setup               // Setup MFA
POST   /api/auth/mfa/verify              // Verify MFA code
POST   /api/auth/mfa/disable             // Disable MFA
GET    /api/auth/mfa/backup-codes        // Get backup codes
POST   /api/auth/mfa/regenerate-codes    // Regenerate backup codes

// User Management
POST   /api/users/register               // User registration
GET    /api/users                        // List users (admin)
GET    /api/users/:id                    // Get user details
PUT    /api/users/:id                    // Update user
DELETE /api/users/:id                    // Delete user (admin)
```

### ERC-3643 Identity Management (26 endpoints) ✨

```typescript
// Identity Registry
POST   /api/v2/identity/register         // Register new identity
GET    /api/v2/identity/status           // Check identity status
PUT    /api/v2/identity/verify           // Verify identity
DELETE /api/v2/identity/revoke           // Revoke identity
POST   /api/v2/identity/batch-register   // Batch identity registration

// Claims Management
POST   /api/v2/claims/issue              // Issue new claim
GET    /api/v2/claims/:identityId        // Get identity claims
PUT    /api/v2/claims/:claimId/renew     // Renew claim
DELETE /api/v2/claims/:claimId/revoke    // Revoke claim
POST   /api/v2/claims/verify             // Verify claim validity
POST   /api/v2/claims/batch-update       // Bulk claim updates

// Trusted Issuers Management
POST   /api/v2/trusted-issuers/add       // Add trusted issuer
GET    /api/v2/trusted-issuers           // List trusted issuers
PUT    /api/v2/trusted-issuers/:id       // Update issuer
DELETE /api/v2/trusted-issuers/:id       // Remove issuer

// Compliance Verification
POST   /api/v2/compliance/verify-transfer      // Verify transfer eligibility
POST   /api/v2/compliance/verify-investment    // Verify investment eligibility
POST   /api/v2/compliance/verify-governance    // Verify governance participation
GET    /api/v2/compliance/status/:address      // Get compliance status
POST   /api/v2/compliance/batch-verify         // Batch compliance verification
```

### Project Management (12 endpoints)

```typescript
// SPV Project Operations
POST   /api/projects                     // Create project (SPV only)
GET    /api/projects                     // List all projects
GET    /api/projects/:id                 // Get project details
PUT    /api/projects/:id                 // Update project (SPV only)
DELETE /api/projects/:id                 // Delete project (admin)

// Project Lifecycle
POST   /api/projects/:id/submit          // Submit for approval
PUT    /api/projects/:id/approve         // Approve project (admin)
PUT    /api/projects/:id/reject          // Reject project (admin)
GET    /api/projects/:id/analytics       // Project analytics
GET    /api/projects/:id/investors       // Project investors (SPV)

// Offering Management
GET    /api/projects/:id/offering        // Get offering details
POST   /api/projects/:id/offering/finalize // Finalize offering
```

### Investment Management (10 endpoints)

```typescript
// Investment Operations
POST   /api/investments/purchase         // Purchase tokens
GET    /api/investments/portfolio        // Get portfolio
GET    /api/investments/:id              // Get investment details
POST   /api/investments/:id/claim        // Claim profits
GET    /api/investments/:id/history      // Investment history

// Portfolio Management
GET    /api/investments/performance      // Portfolio performance
POST   /api/investments/:id/cancel       // Cancel investment
POST   /api/investments/validate         // Validate investment
GET    /api/investments/analytics        // Investment analytics
POST   /api/investments/:id/buyback      // Final buyback
```

### Governance (8 endpoints)

```typescript
// Proposal Management
POST   /api/governance/proposals         // Create proposal
GET    /api/governance/proposals         // List proposals
GET    /api/governance/proposals/:id     // Get proposal details
PUT    /api/governance/proposals/:id     // Update proposal

// Voting Operations
POST   /api/governance/proposals/:id/vote // Vote on proposal
GET    /api/governance/voting-power      // Get voting power
POST   /api/governance/proposals/:id/execute // Execute proposal
GET    /api/governance/analytics         // Governance analytics
```

### Investor Profiling (13 endpoints) ✨

```typescript
// Core Profiling
POST   /api/profiling/submit              // Submit profile questionnaire
GET    /api/profiling/profile/:userId     // Get user profile
PATCH  /api/profiling/profile/:userId     // Update profile
DELETE /api/profiling/profile/:userId     // Delete profile

// Analytics & Recommendations
GET    /api/profiling/risk-assessment/:userId    // Risk assessment
GET    /api/profiling/recommendations/:userId    // Investment recommendations
GET    /api/profiling/analytics/:userId          // Profile analytics
GET    /api/profiling/completion/:userId         // Completion status
GET    /api/profiling/report/:userId             // Comprehensive report

// Admin Operations
GET    /api/profiling/admin/statistics           // Profile statistics
POST   /api/profiling/admin/bulk-import          // Bulk import
GET    /api/profiling/admin/completion-funnel    // Completion funnel

// Compliance & Export
GET    /api/profiling/export/:userId             // Export profile data
```

### KYC & Payments (14 endpoints)

```typescript
// KYC Management
POST / api / kyc / initiate; // Start KYC process
GET / api / kyc / status; // Check KYC status
POST / api / kyc / webhook; // KYC provider webhook
GET / api / kyc / documents; // Get documents
PUT / api / kyc / documents; // Update documents
GET / api / kyc / history; // KYC history

// Payment Processing
POST / api / payments / initiate; // Initiate payment
GET / api / payments / methods; // Available payment methods
POST / api / payments / webhook; // Payment webhook
GET / api / payments / history; // Payment history
POST / api / payments / refund; // Request refund
GET / api / payments / status; // Payment status
POST / api / payments / cancel; // Cancel payment
POST / api / payments / retry; // Retry failed payment
```

### Profit Distribution (5 endpoints)

```typescript
// Profit Management
POST / api / profits / distribute; // Distribute profits (admin)
GET / api / profits / calculations; // Profit calculations
GET / api / profits / claims; // Claimable profits
POST / api / profits / claims / process; // Process profit claims
GET / api / profits / history; // Distribution history
```

### Platform Administration (12 endpoints)

```typescript
// Admin Dashboard
GET    /api/admin/dashboard              // Admin dashboard data
GET    /api/admin/analytics              // Platform analytics
POST   /api/admin/maintenance            // Maintenance mode

// SPV Management
POST   /api/admin/spv/whitelist          // Whitelist SPV
DELETE /api/admin/spv/whitelist/:id      // Remove SPV
GET    /api/admin/spv                    // List SPVs

// Platform Configuration
PUT    /api/admin/fees                   // Update fees
GET    /api/admin/users                  // Manage users
PUT    /api/admin/system                 // System configuration
GET    /api/admin/reports                // Generate reports
POST   /api/admin/notifications/broadcast // Broadcast notifications
GET    /api/admin/logs                   // System logs
```

### Notifications & Real-time (6 endpoints)

```typescript
// Notifications
GET    /api/notifications                // Get notifications
POST   /api/notifications/mark-read      // Mark as read
PUT    /api/notifications/preferences    // Update preferences

// Email Service
POST   /api/email/webhook                // SendGrid webhook
GET    /api/email/templates/:type        // Email templates
GET    /api/email/stats                  // Email statistics
```

## WebSocket Real-time API

### Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: accessToken },
});
```

### Subscription Types

```typescript
// Portfolio Updates
socket.emit('subscribe_portfolio', userId);
socket.on('portfolio_update', data => {
  // Real-time investment changes
});

// Governance Updates
socket.emit('subscribe_governance', projectId);
socket.on('governance_update', data => {
  // Live voting and proposals
});

// KYC Status Updates
socket.emit('subscribe_kyc', userId);
socket.on('kyc_update', data => {
  // Verification progress
});

// Project Updates
socket.emit('subscribe_project', projectId);
socket.on('project_update', data => {
  // SPV project changes
});

// Profit Distribution
socket.emit('subscribe_profits', userId);
socket.on('profit_update', data => {
  // Payment notifications
});

// System Notifications
socket.emit('subscribe_system');
socket.on('system_notification', data => {
  // Platform alerts
});
```

## Request/Response Formats

### Standard Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  }
}
```

### Authentication Headers

```typescript
// Required for all protected endpoints
headers: {
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

## Error Codes

### Standard HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

### Custom Error Codes

```typescript
// Authentication Errors
'AUTH_TOKEN_INVALID'; // Invalid JWT token
'AUTH_TOKEN_EXPIRED'; // Expired JWT token
'AUTH_MFA_REQUIRED'; // MFA verification required
'AUTH_ACCOUNT_LOCKED'; // Account locked due to failed attempts

// Identity Errors (ERC-3643)
'IDENTITY_NOT_VERIFIED'; // Identity not verified
'IDENTITY_CLAIMS_MISSING'; // Required claims missing
'IDENTITY_ISSUER_UNTRUSTED'; // Untrusted issuer
'IDENTITY_CLAIM_EXPIRED'; // Claim expired

// Business Logic Errors
'PROJECT_NOT_FOUND'; // Project not found
'INVESTMENT_INVALID'; // Invalid investment
'INSUFFICIENT_BALANCE'; // Insufficient token balance
'KYC_VERIFICATION_PENDING'; // KYC verification required
'PAYMENT_PROCESSING_FAILED'; // Payment processing failed

// Profiling Errors
'PROFILE_NOT_FOUND'; // Profile not found
'PROFILE_ALREADY_EXISTS'; // Profile already exists
'PROFILE_VALIDATION_FAILED'; // Invalid profile data
'PROFILE_INCOMPLETE'; // Incomplete profile data
'PROFILE_RISK_ASSESSMENT_FAILED'; // Risk assessment failed
'PROFILE_EXTERNAL_API_ERROR'; // External API unavailable
```

## Rate Limiting

### Rate Limits by User Type

```typescript
// Investor: 100 requests per minute
// SPV: 200 requests per minute
// Admin: 500 requests per minute

// Auth endpoints: 10 requests per minute (stricter)
// Public endpoints: 1000 requests per minute
```

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Security Features

### Input Validation

- All inputs validated using class-validator
- XSS protection with HTML sanitization
- SQL injection prevention
- File upload validation

### Audit Logging

- All sensitive operations logged
- User activity tracking
- Security event monitoring
- Compliance audit trail

### CORS Configuration

```typescript
// Allowed origins
origins: [
  'http://localhost:3000', // Frontend development
  'http://localhost:3001', // Frontend alternative
  'https://app.partisipro.com', // Production frontend
];
```

## Development & Testing

### Swagger Documentation

- **URL**: `http://localhost:3001/api/docs`
- **Format**: OpenAPI 3.0
- **Features**: Interactive API testing, request/response examples

### Mock Data

- **KYC Success Rate**: 80% (configurable)
- **Payment Success Rate**: 90% (configurable)
- **Response Delays**: 2-3 seconds (realistic simulation)

### Environment Configuration

```bash
# Development
NODE_ENV=development
PORT=3001
JWT_SECRET=your_jwt_secret

# Firebase
_FIREBASE_PROJECT_ID=partisipro-dev
_FIREBASE_PRIVATE_KEY=your_private_key
_FIREBASE_CLIENT_EMAIL=your_client_email

# External Services
SENDGRID_API_KEY=your_sendgrid_key
WEB3AUTH_CLIENT_ID=your_web3auth_id
REDIS_URL=redis://localhost:6379
```

## Detailed Endpoint Documentation

For comprehensive documentation of specific endpoint categories, refer to:

- **[Profiling Endpoints](./profiling-endpoints.md)** - Complete investor
  profiling API specification
- **[Complete API Contracts](../api-contracts.md)** - Full API specification
  with examples

## Additional Resources

- **[Data Models & Schemas](../data-models-schemas.md)** - Database schemas and
  validation
- **[Integration Architecture](../integration-architecture.md)** - System
  architecture and deployment
- **[Testing Scenarios](../integration-testing-scenarios.md)** - API testing and
  validation

This API documentation provides comprehensive coverage of all backend endpoints
and real-time features, enabling seamless integration with frontend and
blockchain platforms.
