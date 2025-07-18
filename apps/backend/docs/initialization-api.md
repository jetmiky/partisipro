# Firebase Initialization API Documentation

## Overview

The Firebase Initialization API provides comprehensive endpoints for setting up
and managing initial data in the Partisipro platform. This API is designed to
streamline the process of initializing Firebase collections, creating default
users, and setting up essential system configurations.

## Endpoints

### 1. Initialize Platform

**POST** `/api/admin/initialization/initialize`

Initializes the platform with essential default data including admin users,
system configurations, identity registry, and optionally sample data.

#### Request Body

```json
{
  "forceReinitialize": false,
  "includeSampleData": false,
  "includeDevData": false,
  "adminUser": {
    "email": "admin@partisipro.com",
    "firstName": "System",
    "lastName": "Administrator",
    "walletAddress": "0x23ff0dc338DD32aC07Ce6bEA73e83bf62F919367",
    "phoneNumber": "+62812345678"
  },
  "environment": "development",
  "initializeIdentityRegistry": true,
  "initializeTrustedIssuers": true,
  "initializeSystemConfigs": true,
  "skipFirebaseAuth": false
}
```

#### Response

```json
{
  "success": true,
  "message": "Platform initialized successfully",
  "data": {
    "adminUser": {
      "id": "admin_user_id",
      "email": "admin@partisipro.com",
      "role": "admin",
      "createdAt": "2025-01-15T10:00:00.000Z"
    },
    "systemConfigs": {
      "platformFees": {
        "listingFee": 0.02,
        "managementFee": 0.05,
        "transactionFee": 0.001
      },
      "maintenanceMode": {
        "enabled": false,
        "message": "Platform under maintenance"
      },
      "systemSettings": {
        "maxInvestmentAmount": 1000000000,
        "minInvestmentAmount": 100000,
        "defaultCurrency": "IDR"
      },
      "kycSettings": {
        "providers": ["verihubs", "sumsub", "jumio"],
        "defaultProvider": "verihubs"
      }
    },
    "identityRegistry": {
      "registryInfo": {
        "name": "Partisipro Identity Registry",
        "version": "1.0.0",
        "isActive": true
      }
    },
    "trustedIssuers": [
      {
        "name": "Partisipro KYC Service",
        "description": "Internal KYC verification service",
        "walletAddress": "0x1234567890123456789012345678901234567890",
        "authorizedTopics": [1, 2, 3, 4, 5],
        "isActive": true
      }
    ],
    "claimTopics": [
      {
        "id": 1,
        "name": "KYC_APPROVED",
        "description": "Know Your Customer verification approved",
        "isActive": true
      },
      {
        "id": 2,
        "name": "ACCREDITED_INVESTOR",
        "description": "Accredited investor status verified",
        "isActive": true
      }
    ],
    "summary": {
      "totalUsers": 1,
      "totalProjects": 0,
      "totalInvestments": 0,
      "totalIdentities": 0,
      "totalClaims": 0,
      "totalTrustedIssuers": 3,
      "totalClaimTopics": 5
    }
  }
}
```

### 2. Initialize Development Platform

**POST** `/api/admin/initialization/initialize/dev`

Initializes the platform with comprehensive development and testing data.

#### Request Body

No request body required.

#### Response

```json
{
  "success": true,
  "message": "Development platform initialized successfully",
  "data": {
    "users": [],
    "projects": [],
    "investments": [],
    "identities": [],
    "claims": [],
    "governance": [],
    "profits": [],
    "summary": {
      "totalUsers": 25,
      "totalProjects": 10,
      "totalInvestments": 50,
      "totalIdentities": 25,
      "totalClaims": 75,
      "totalGovernance": 5,
      "totalProfits": 15
    }
  }
}
```

### 3. Reset Platform

**POST** `/api/admin/initialization/reset`

Resets all platform data to initial state. **This is a destructive operation.**

#### Request Body

No request body required.

#### Response

```json
{
  "success": true,
  "message": "Platform reset successfully",
  "data": {
    "collections": [
      "projects",
      "investments",
      "identity_registry",
      "claims",
      "trusted_issuers",
      "governance_proposals",
      "profit_distributions"
    ],
    "preservedData": {
      "adminUsers": [
        {
          "id": "admin_id",
          "email": "admin@partisipro.com",
          "role": "admin"
        }
      ],
      "systemConfigs": ["platformFees", "maintenanceMode", "systemSettings"]
    },
    "deletedCounts": {
      "users": 50,
      "projects": 10,
      "investments": 100,
      "identities": 50,
      "claims": 150,
      "governance": 10,
      "profits": 25,
      "auditLogs": 1000
    }
  }
}
```

### 4. Check Platform Status

**POST** `/api/admin/initialization/status`

Returns the current initialization status of the platform.

#### Request Body

No request body required.

#### Response

```json
{
  "success": true,
  "data": {
    "isInitialized": true,
    "initializationDate": "2025-01-15T10:00:00.000Z",
    "adminCount": 2,
    "userCount": 150,
    "projectCount": 25,
    "investmentCount": 500,
    "identityRegistryCount": 150,
    "trustedIssuerCount": 3,
    "claimTopicCount": 5,
    "lastUpdated": "2025-01-15T12:00:00.000Z"
  }
}
```

## Data Structures

### System Configurations

The initialization process creates several system configuration documents:

#### Platform Fees

- `listingFee`: 2% fee for project listing
- `managementFee`: 5% fee for project management
- `transactionFee`: 0.1% fee for transactions

#### Maintenance Mode

- `enabled`: Boolean flag for maintenance mode
- `message`: Message to display during maintenance

#### System Settings

- `maxInvestmentAmount`: Maximum investment amount (1 billion IDR)
- `minInvestmentAmount`: Minimum investment amount (100k IDR)
- `maxProjectFunding`: Maximum project funding (100 billion IDR)
- `defaultCurrency`: Default currency (IDR)
- `supportedCurrencies`: Supported currencies array

#### KYC Settings

- `providers`: Available KYC providers
- `defaultProvider`: Default KYC provider
- `requiredDocuments`: Required documents for KYC
- `expiryDays`: KYC expiry period in days

### Identity Registry

#### Claim Topics

1. **KYC_APPROVED** (ID: 1): Know Your Customer verification approved
2. **ACCREDITED_INVESTOR** (ID: 2): Accredited investor status verified
3. **AML_CLEARED** (ID: 3): Anti-Money Laundering check cleared
4. **INSTITUTIONAL_INVESTOR** (ID: 4): Institutional investor status verified
5. **RETAIL_QUALIFIED** (ID: 5): Retail investor qualification verified

#### Trusted Issuers

- **Partisipro KYC Service**: Internal KYC verification service
- **Verihubs Indonesia**: External KYC provider for Indonesian users
- **Sumsub Global**: Global KYC and AML verification service

### Firebase Collections Created

The initialization process creates and populates the following Firebase
collections:

1. **users** - User accounts (admin, SPV, investor)
2. **system_config** - System configurations and settings
3. **identity_registry** - Central identity registry data
4. **claim_topics** - Available claim types
5. **trusted_issuers** - Authorized KYC providers
6. **projects** - Project data (if sample data included)
7. **investments** - Investment data (if sample data included)
8. **claims** - User claims (if sample data included)
9. **governance_proposals** - Governance proposals (if dev data included)
10. **profit_distributions** - Profit distributions (if dev data included)

## Authentication

All initialization endpoints require:

- **JWT Bearer Token** in Authorization header
- **Admin role** - Only users with admin role can access these endpoints

```bash
Authorization: Bearer <jwt_token>
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Failed to initialize platform: Invalid configuration data",
  "statusCode": 400
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Forbidden - Admin access required",
  "statusCode": 403
}
```

### 409 Conflict

```json
{
  "success": false,
  "message": "Platform is already initialized. Use forceReinitialize=true to override.",
  "statusCode": 409
}
```

## Usage Examples

### Initialize Platform for Production

```bash
curl -X POST \
  http://localhost:3001/api/admin/initialization/initialize \
  -H 'Authorization: Bearer <admin_jwt_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "adminUser": {
      "email": "admin@partisipro.com",
      "firstName": "System",
      "lastName": "Administrator",
      "walletAddress": "0x23ff0dc338DD32aC07Ce6bEA73e83bf62F919367"
    },
    "environment": "production",
    "initializeIdentityRegistry": true,
    "initializeTrustedIssuers": true,
    "initializeSystemConfigs": true
  }'
```

### Initialize Development Environment

```bash
curl -X POST \
  http://localhost:3001/api/admin/initialization/initialize/dev \
  -H 'Authorization: Bearer <admin_jwt_token>' \
  -H 'Content-Type: application/json'
```

### Check Platform Status

```bash
curl -X POST \
  http://localhost:3001/api/admin/initialization/status \
  -H 'Authorization: Bearer <admin_jwt_token>' \
  -H 'Content-Type: application/json'
```

### Reset Platform (Destructive)

```bash
curl -X POST \
  http://localhost:3001/api/admin/initialization/reset \
  -H 'Authorization: Bearer <admin_jwt_token>' \
  -H 'Content-Type: application/json'
```

## Security Considerations

1. **Admin Only**: All endpoints require admin authentication
2. **Destructive Operations**: Reset endpoint is destructive and should be used
   with caution
3. **Firebase Auth**: Admin users can be created in Firebase Auth for
   authentication
4. **Audit Logging**: All initialization activities are logged for audit
   purposes
5. **Environment Checks**: Different initialization data based on environment

## Best Practices

1. **Initial Setup**: Use `/initialize` endpoint for initial platform setup
2. **Development**: Use `/initialize/dev` for development environments
3. **Testing**: Use reset functionality with caution, preferably in test
   environments
4. **Status Monitoring**: Regularly check platform status after initialization
5. **Backup**: Always backup data before performing reset operations

## Integration with Frontend

The frontend can use these endpoints to:

- Initialize the platform during first-time setup
- Check initialization status on admin dashboard
- Provide reset functionality for development environments
- Display platform statistics and configuration status

Example frontend integration:

```typescript
// Initialize platform
const initializePlatform = async (config: InitializeDataDto) => {
  const response = await fetch('/api/admin/initialization/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  return response.json();
};

// Check platform status
const getPlatformStatus = async () => {
  const response = await fetch('/api/admin/initialization/status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
};
```

This API provides a comprehensive solution for initializing and managing the
Partisipro platform's Firebase data, ensuring consistent setup across different
environments and use cases.
