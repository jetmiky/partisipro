# Partisipro Database Schema Documentation

## Overview

Partisipro uses **Firebase/Firestore** as the primary NoSQL database for storing
off-chain data, user information, and business logic state. The database is
designed with document-based collections optimized for the ERC-3643
identity-centric compliance model.

**Database Type**: Cloud Firestore (NoSQL Document Database)  
**Environment**: Firebase Emulators (development) / Firebase Cloud
(production)  
**Security**: Firestore Security Rules with role-based access control

## Database Architecture

### **Collection Structure (9 Primary Collections)**

```
Firestore Database:
├── users                    # User profiles and authentication
├── identity_registry        # ERC-3643 central identity management ✨
├── claims                   # ERC-3643 identity claims ✨
├── trusted_issuers         # ERC-3643 KYC provider management ✨
├── projects                # Project tokenization metadata
├── investments             # Investment tracking and portfolio
├── profit_distributions    # Quarterly profit allocations
├── governance_proposals    # Token holder voting
└── notifications           # System notifications and alerts
```

### **Indexing Strategy**

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "email", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "identity_registry",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Collection Schemas

### **1. Users Collection**

```typescript
interface User {
  id: string;                           // Document ID (Firebase UID)
  email: string;                        // User email address
  walletAddress: string;                // Ethereum wallet address
  web3AuthId: string;                   // Web3Auth user identifier
  profile: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: Date;
    nationality: string;
    address: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
  };
  kyc: {
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    provider: string;                   // 'verihubs' | 'sumsub' | 'jumio'
    verificationId: string;
    submittedAt: Date;
    approvedAt?: Date;
    expiresAt?: Date;
    documents: {
      type: string;                     // 'passport' | 'national_id' | 'driver_license'
      documentId: string;
      uploadedAt: Date;
      status: 'pending' | 'approved' | 'rejected';
    }[];
    failureReason?: string;
  };
  role: 'investor' | 'spv' | 'admin';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Example Document
{
  "id": "user_12345",
  "email": "investor@example.com",
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "web3AuthId": "web3auth_user_001",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+62812345678",
    "dateOfBirth": "1990-01-01T00:00:00Z",
    "nationality": "Indonesian",
    "address": {
      "street": "Jl. Sudirman No. 123",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "postalCode": "12190",
      "country": "Indonesia"
    }
  },
  "kyc": {
    "status": "approved",
    "provider": "verihubs",
    "verificationId": "vh_12345",
    "submittedAt": "2024-01-01T10:00:00Z",
    "approvedAt": "2024-01-01T11:30:00Z",
    "documents": []
  },
  "role": "investor",
  "isActive": true,
  "createdAt": "2024-01-01T09:00:00Z",
  "updatedAt": "2024-01-01T11:30:00Z"
}
```

### **2. Identity Registry Collection** ✨ **ERC-3643**

```typescript
interface IdentityRegistry {
  id: string;                           // User wallet address
  userId: string;                       // Reference to users collection
  identityKey: string;                  // On-chain identity key
  status: 'pending' | 'verified' | 'revoked';
  claims: string[];                     // Array of claim IDs
  trustedIssuers: string[];             // Authorized issuer addresses
  metadata: {
    registeredBy: string;               // Admin who registered
    verificationMethod: string;         // 'automatic' | 'manual'
    compliance: {
      gdpr: boolean;
      pciDss: boolean;
      indonesianRegulations: boolean;
    };
  };
  createdAt: Date;
  verifiedAt?: Date;
  lastUpdated: Date;
}

// Example Document
{
  "id": "0x1234567890123456789012345678901234567890",
  "userId": "user_12345",
  "identityKey": "identity_key_12345",
  "status": "verified",
  "claims": ["claim_kyc_001", "claim_accredited_001"],
  "trustedIssuers": ["0xTrustedIssuer1", "0xTrustedIssuer2"],
  "metadata": {
    "registeredBy": "admin_001",
    "verificationMethod": "automatic",
    "compliance": {
      "gdpr": true,
      "pciDss": true,
      "indonesianRegulations": true
    }
  },
  "createdAt": "2024-01-01T09:00:00Z",
  "verifiedAt": "2024-01-01T11:30:00Z",
  "lastUpdated": "2024-01-01T11:30:00Z"
}
```

### **3. Claims Collection** ✨ **ERC-3643**

```typescript
interface Claims {
  id: string;                           // Unique claim ID
  identityId: string;                   // Reference to identity registry
  claimTopic: string;                   // 'KYC_APPROVED' | 'ACCREDITED_INVESTOR' | etc.
  issuer: string;                       // Trusted issuer address
  data: {
    provider?: string;                  // KYC provider name
    verificationId?: string;            // External verification ID
    accreditationLevel?: string;        // Investor accreditation level
    jurisdiction?: string;              // Legal jurisdiction
    customData?: any;                   // Additional claim-specific data
  };
  issuedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'revoked' | 'expired';
  verificationHash: string;             // On-chain verification hash
  revocationReason?: string;
  metadata: {
    issuerName: string;
    issuerType: 'kyc_provider' | 'platform_admin' | 'regulatory_authority';
    confidenceScore: number;           // 0-100 confidence in claim validity
  };
}

// Example Document
{
  "id": "claim_kyc_001",
  "identityId": "0x1234567890123456789012345678901234567890",
  "claimTopic": "KYC_APPROVED",
  "issuer": "0xVerihubsIssuer",
  "data": {
    "provider": "verihubs",
    "verificationId": "vh_12345",
    "jurisdiction": "Indonesia"
  },
  "issuedAt": "2024-01-01T11:30:00Z",
  "expiresAt": "2025-01-01T11:30:00Z",
  "status": "active",
  "verificationHash": "0xabc123...",
  "metadata": {
    "issuerName": "Verihubs Indonesia",
    "issuerType": "kyc_provider",
    "confidenceScore": 95
  }
}
```

### **4. Trusted Issuers Collection** ✨ **ERC-3643**

```typescript
interface TrustedIssuers {
  id: string;                           // Issuer address
  name: string;                         // KYC provider name
  authorizedClaims: string[];           // Claim topics they can issue
  status: 'active' | 'suspended' | 'revoked';
  contact: {
    email: string;
    website: string;
    apiEndpoint?: string;
  };
  credentials: {
    licenses: string[];                 // Regulatory licenses
    certifications: string[];           // Industry certifications
    jurisdiction: string[];             // Operating jurisdictions
  };
  performance: {
    totalClaims: number;
    successRate: number;                // 0-100 success rate
    averageProcessingTime: number;      // In seconds
    lastActivity: Date;
  };
  registeredAt: Date;
  registeredBy: string;                 // Admin who registered
  lastUpdated: Date;
}

// Example Document
{
  "id": "0xVerihubsIssuer",
  "name": "Verihubs Indonesia",
  "authorizedClaims": ["KYC_APPROVED", "AML_CLEARED"],
  "status": "active",
  "contact": {
    "email": "api@verihubs.com",
    "website": "https://verihubs.com",
    "apiEndpoint": "https://api.verihubs.com/v1"
  },
  "credentials": {
    "licenses": ["OJK_LICENSE_001"],
    "certifications": ["ISO27001", "SOC2"],
    "jurisdiction": ["Indonesia"]
  },
  "performance": {
    "totalClaims": 1500,
    "successRate": 94,
    "averageProcessingTime": 180,
    "lastActivity": "2024-01-01T15:00:00Z"
  },
  "registeredAt": "2023-12-01T09:00:00Z",
  "registeredBy": "admin_001",
  "lastUpdated": "2024-01-01T09:00:00Z"
}
```

### **5. Projects Collection**

```typescript
interface Project {
  id: string; // Document ID
  spvId: string; // Reference to SPV user
  name: string;
  description: string;
  category:
    | 'transportation'
    | 'energy'
    | 'water'
    | 'telecommunications'
    | 'healthcare';
  location: {
    province: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  financial: {
    totalValue: number; // Project value in IDR
    tokenPrice: number; // Token price in IDR
    totalTokens: number;
    minimumInvestment: number;
    maximumInvestment: number;
    currency: 'IDR';
    expectedReturn: number; // Annual return percentage
  };
  tokenization: {
    contractAddress?: string; // Smart contract address
    tokenSymbol: string;
    tokenName: string;
    decimals: number;
    standard: 'ERC3643'; // Always ERC-3643 compliant
  };
  offering: {
    startDate: Date;
    endDate: Date;
    status: 'upcoming' | 'active' | 'completed' | 'cancelled';
    soldTokens: number;
    raisedAmount: number;
    participantCount: number;
  };
  concession: {
    startDate: Date;
    endDate: Date;
    duration: number; // In years
    terms: string;
  };
  documents: {
    type: string; // 'feasibility' | 'legal' | 'financial'
    name: string;
    url: string;
    uploadedAt: Date;
    size: number;
  }[];
  status:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'active'
    | 'completed'
    | 'cancelled';
  approvedBy?: string; // Admin who approved
  createdAt: Date;
  updatedAt: Date;
}
```

### **6. Investments Collection**

```typescript
interface Investment {
  id: string; // Document ID
  userId: string; // Reference to investor
  projectId: string; // Reference to project
  tokenAmount: number;
  investmentAmount: number; // Investment amount in IDR
  purchasePrice: number; // Price per token in IDR
  transactionHash?: string; // Blockchain transaction hash
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentDetails: {
    paymentId: string;
    paymentMethod: string; // 'bank_transfer' | 'e_wallet' | 'credit_card'
    gatewayProvider: string; // 'midtrans' | 'xendit'
    processedAt?: Date;
    gatewayResponse?: any;
  };
  compliance: {
    kycVerified: boolean;
    identityVerified: boolean; // ERC-3643 identity verification
    claimsVerified: string[]; // Verified claims for this investment
  };
  performance: {
    currentValue: number; // Current value in IDR
    totalReturns: number; // Total returns received
    returnPercentage: number; // Return percentage
    lastUpdated: Date;
  };
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}
```

### **7. Profit Distributions Collection**

```typescript
interface ProfitDistribution {
  id: string; // Document ID
  projectId: string; // Reference to project
  period: {
    startDate: Date;
    endDate: Date;
    quarter: number; // 1-4
    year: number;
  };
  financial: {
    totalRevenue: number; // Total project revenue in IDR
    operatingExpenses: number; // Operating expenses in IDR
    totalProfit: number; // Net profit in IDR
    platformFee: number; // Platform fee (5%) in IDR
    distributedProfit: number; // Profit for distribution in IDR
  };
  distribution: {
    pricePerToken: number; // Profit per token in IDR
    eligibleTokens: number; // Total tokens eligible for distribution
    totalClaims: number; // Number of investors claiming
    claimedAmount: number; // Total amount claimed in IDR
    unclaimedAmount: number; // Unclaimed amount in IDR
  };
  status: 'calculated' | 'distributed' | 'partially_claimed' | 'completed';
  transactionHash?: string; // Blockchain transaction hash
  metadata: {
    calculatedBy: string; // Admin who calculated
    distributedBy: string; // Admin who distributed
    notes?: string;
  };
  createdAt: Date;
  distributedAt?: Date;
  completedAt?: Date;
}
```

### **8. Governance Proposals Collection**

```typescript
interface GovernanceProposal {
  id: string; // Document ID
  projectId: string; // Reference to project
  proposerId: string; // Reference to user who created proposal
  title: string;
  description: string;
  type:
    | 'upgrade'
    | 'parameter_change'
    | 'fund_allocation'
    | 'strategic_decision'
    | 'other';
  voting: {
    startDate: Date;
    endDate: Date;
    quorum: number; // Minimum votes required (percentage)
    threshold: number; // Percentage needed to pass
    eligibilityRules: {
      minTokenBalance: number;
      requiresIdentityVerification: boolean; // ERC-3643 requirement
      requiredClaims: string[]; // Required claims for voting
    };
  };
  votes: {
    for: number; // Votes in favor
    against: number; // Votes against
    abstain: number; // Abstain votes
    totalVotingPower: number; // Total voting power participated
    participationRate: number; // Participation percentage
  };
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed' | 'expired';
  contractCall?: {
    targetContract: string;
    methodName: string;
    parameters: any[];
    gasEstimate: number;
  };
  execution: {
    executedAt?: Date;
    executedBy?: string;
    transactionHash?: string;
    executionResult?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### **9. Notifications Collection**

```typescript
interface Notification {
  id: string; // Document ID
  userId: string; // Reference to user (or 'all' for broadcast)
  type: 'investment' | 'profit' | 'governance' | 'kyc' | 'security' | 'system';
  category: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: {
    projectId?: string;
    investmentId?: string;
    proposalId?: string;
    amount?: number;
    action?: string;
    url?: string;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    push?: boolean;
  };
  delivery: {
    inApp: {
      delivered: boolean;
      deliveredAt?: Date;
      read: boolean;
      readAt?: Date;
    };
    email?: {
      delivered: boolean;
      deliveredAt?: Date;
      opened?: boolean;
      openedAt?: Date;
      emailId?: string;
    };
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  createdAt: Date;
}
```

## Security Rules

### **Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return request.auth.token.role;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isAdmin() {
      return getUserRole() == 'admin';
    }

    function isSPV() {
      return getUserRole() == 'spv';
    }

    // Users collection - users can only access their own data
    match /users/{userId} {
      allow read, write: if isAuthenticated() && (isOwner(userId) || isAdmin());
    }

    // Identity Registry - ERC-3643 compliance
    match /identity_registry/{identityId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (isAdmin() || resource.data.userId == request.auth.uid);
    }

    // Claims - identity-based access
    match /claims/{claimId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isAdmin();
    }

    // Trusted Issuers - admin only
    match /trusted_issuers/{issuerId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isAdmin();
    }

    // Projects - public read, SPV/Admin write
    match /projects/{projectId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isSPV();
      allow update: if isAuthenticated() && (
        (isSPV() && resource.data.spvId == request.auth.uid) ||
        isAdmin()
      );
      allow delete: if isAuthenticated() && isAdmin();
    }

    // Investments - user-specific access
    match /investments/{investmentId} {
      allow read, write: if isAuthenticated() && (
        isOwner(resource.data.userId) ||
        isAdmin()
      );
    }

    // Profit Distributions - read for all, admin write
    match /profit_distributions/{distributionId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isAdmin();
    }

    // Governance Proposals - project-based access
    match /governance_proposals/{proposalId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated(); // Token holders can create proposals
      allow update: if isAuthenticated() && (
        resource.data.proposerId == request.auth.uid ||
        isAdmin()
      );
    }

    // Notifications - user-specific access
    match /notifications/{notificationId} {
      allow read, update: if isAuthenticated() && (
        isOwner(resource.data.userId) ||
        resource.data.userId == 'all' ||
        isAdmin()
      );
      allow create: if isAuthenticated() && isAdmin();
    }
  }
}
```

## Query Patterns & Performance

### **Common Query Patterns**

```typescript
// Get user by wallet address
const userQuery = firestore
  .collection('users')
  .where('walletAddress', '==', walletAddress)
  .limit(1);

// Get active projects by category
const projectsQuery = firestore
  .collection('projects')
  .where('status', '==', 'active')
  .where('category', '==', 'transportation')
  .orderBy('createdAt', 'desc');

// Get user's investments
const investmentsQuery = firestore
  .collection('investments')
  .where('userId', '==', userId)
  .where('status', '==', 'completed')
  .orderBy('createdAt', 'desc');

// Get identity claims
const claimsQuery = firestore
  .collection('claims')
  .where('identityId', '==', identityId)
  .where('status', '==', 'active')
  .orderBy('issuedAt', 'desc');

// Get active governance proposals
const proposalsQuery = firestore
  .collection('governance_proposals')
  .where('projectId', '==', projectId)
  .where('status', '==', 'active')
  .orderBy('voting.startDate', 'desc');
```

### **Performance Optimization**

```typescript
// Use composite indexes for complex queries
const complexQuery = firestore
  .collection('projects')
  .where('status', '==', 'active')
  .where('category', '==', 'transportation')
  .where('financial.totalValue', '>=', 1000000000)
  .orderBy('financial.totalValue', 'desc')
  .orderBy('createdAt', 'desc')
  .limit(20);

// Use pagination for large result sets
const paginatedQuery = firestore
  .collection('investments')
  .where('userId', '==', userId)
  .orderBy('createdAt', 'desc')
  .startAfter(lastDoc)
  .limit(20);
```

## Data Migration & Backup

### **Migration Strategies**

```typescript
// User migration to ERC-3643 identity system
async function migrateUserToIdentitySystem(userId: string) {
  const user = await firestore.collection('users').doc(userId).get();
  const userData = user.data();

  // Create identity registry entry
  const identityData = {
    id: userData.walletAddress,
    userId: userId,
    identityKey: `identity_${userId}`,
    status: userData.kyc.status === 'approved' ? 'verified' : 'pending',
    claims: [],
    trustedIssuers: [],
    createdAt: new Date(),
    lastUpdated: new Date(),
  };

  await firestore
    .collection('identity_registry')
    .doc(userData.walletAddress)
    .set(identityData);

  // Create KYC claim if approved
  if (userData.kyc.status === 'approved') {
    const claimData = {
      id: `claim_kyc_${userId}`,
      identityId: userData.walletAddress,
      claimTopic: 'KYC_APPROVED',
      issuer: 'platform_migration',
      data: {
        provider: userData.kyc.provider,
        verificationId: userData.kyc.verificationId,
      },
      issuedAt: userData.kyc.approvedAt,
      status: 'active',
      verificationHash: `0x${Buffer.from(`kyc_${userId}`).toString('hex')}`,
    };

    await firestore.collection('claims').doc(claimData.id).set(claimData);
  }
}
```

### **Backup Configuration**

```typescript
// Automated backup configuration
const backupConfig = {
  schedule: 'daily',
  retention: 30, // days
  collections: [
    'users',
    'identity_registry',
    'claims',
    'trusted_issuers',
    'projects',
    'investments',
    'profit_distributions',
    'governance_proposals',
  ],
  excludeCollections: [
    'notifications', // Temporary data
  ],
};
```

This database documentation provides comprehensive coverage of the
Firebase/Firestore schema, security rules, and optimization strategies for the
Partisipro backend platform.
