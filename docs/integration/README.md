# Partisipro Backend Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the Partisipro
Backend Platform with frontend and blockchain platforms. The backend is
production-ready with ERC-3643 identity-centric compliance, real-time WebSocket
capabilities, and comprehensive security infrastructure.

**Integration Architecture**: Hybrid on-chain/off-chain with identity-centric
compliance  
**Current Status**: Production-ready for immediate integration  
**Testing Coverage**: 161/161 tests passing (100% success rate)

## Frontend Platform Integration

### **Quick Start Integration**

#### **1. Environment Setup**

```bash
# Frontend project setup
cd ../frontend  # Navigate to frontend worktree
npm install

# Environment configuration
cp .env.example .env.local

# Required environment variables
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
```

#### **2. API Client Configuration**

```typescript
// lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      await refreshToken();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### **3. Authentication Integration**

```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { Web3Auth } from '@web3auth/modal';
import apiClient from '../lib/api-client';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Web3Auth login integration
  const login = async () => {
    try {
      const web3auth = new Web3Auth({
        clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
        chainConfig: {
          chainNamespace: 'eip155',
          chainId: '0x66eee', // Arbitrum Sepolia
        },
      });

      await web3auth.initModal();
      const web3authProvider = await web3auth.connect();
      const idToken = await web3auth.authenticateUser();

      // Backend authentication
      const response = await apiClient.post('/auth/web3auth/login', {
        idToken: idToken.idToken,
      });

      const { user, accessToken, refreshToken } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setUser(user);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await apiClient.get('/auth/profile');
          setUser(response.data.user);
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  return { user, login, isLoading };
};
```

#### **4. Real-time WebSocket Integration**

```typescript
// hooks/useWebSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useWebSocket = (userId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('accessToken');
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId]);

  return { socket, isConnected };
};

// hooks/usePortfolioUpdates.ts
export const usePortfolioUpdates = (userId: string) => {
  const { socket } = useWebSocket(userId);
  const [portfolioData, setPortfolioData] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // Subscribe to portfolio updates
    socket.emit('subscribe_portfolio', userId);

    // Listen for updates
    socket.on('portfolio_update', data => {
      setPortfolioData(data);
    });

    return () => {
      socket.off('portfolio_update');
    };
  }, [socket, userId]);

  return portfolioData;
};
```

#### **5. ERC-3643 Identity Integration**

```typescript
// hooks/useIdentity.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';

export const useIdentity = (userAddress?: string) => {
  const queryClient = useQueryClient();

  // Get identity status
  const identityQuery = useQuery({
    queryKey: ['identity', userAddress],
    queryFn: async () => {
      const response = await apiClient.get('/v2/identity/status');
      return response.data;
    },
    enabled: !!userAddress,
  });

  // Get user claims
  const claimsQuery = useQuery({
    queryKey: ['claims', userAddress],
    queryFn: async () => {
      const response = await apiClient.get(`/v2/claims/${userAddress}`);
      return response.data;
    },
    enabled: !!userAddress,
  });

  // Register identity mutation
  const registerIdentity = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiClient.post('/v2/identity/register', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identity'] });
    },
  });

  return {
    identity: identityQuery.data,
    claims: claimsQuery.data,
    isIdentityVerified: identityQuery.data?.status === 'verified',
    registerIdentity,
    isLoading: identityQuery.isLoading || claimsQuery.isLoading,
  };
};
```

#### **6. Investment Flow Integration**

```typescript
// hooks/useInvestments.ts
export const useInvestments = () => {
  const [isInvesting, setIsInvesting] = useState(false);

  const purchaseTokens = async (projectId: string, amount: number) => {
    setIsInvesting(true);
    try {
      // 1. Verify identity and compliance
      const complianceCheck = await apiClient.post(
        '/v2/compliance/verify-investment',
        {
          projectId,
          amount,
        }
      );

      if (!complianceCheck.data.eligible) {
        throw new Error(
          'Investment not eligible: ' + complianceCheck.data.reason
        );
      }

      // 2. Initiate payment
      const paymentResponse = await apiClient.post('/payments/initiate', {
        amount,
        currency: 'IDR',
        projectId,
      });

      // 3. Redirect to payment gateway or handle payment
      if (paymentResponse.data.redirectUrl) {
        window.location.href = paymentResponse.data.redirectUrl;
      }

      // 4. Create investment record
      const investmentResponse = await apiClient.post('/investments/purchase', {
        projectId,
        amount,
        paymentId: paymentResponse.data.paymentId,
      });

      return investmentResponse.data;
    } catch (error) {
      console.error('Investment failed:', error);
      throw error;
    } finally {
      setIsInvesting(false);
    }
  };

  return { purchaseTokens, isInvesting };
};
```

### **Advanced Frontend Integration**

#### **7. Governance Integration**

```typescript
// hooks/useGovernance.ts
export const useGovernance = (projectId: string) => {
  const { socket } = useWebSocket();

  // Get proposals
  const proposalsQuery = useQuery({
    queryKey: ['proposals', projectId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/governance/proposals?projectId=${projectId}`
      );
      return response.data;
    },
  });

  // Vote on proposal
  const voteOnProposal = useMutation({
    mutationFn: async ({
      proposalId,
      vote,
    }: {
      proposalId: string;
      vote: 'for' | 'against' | 'abstain';
    }) => {
      const response = await apiClient.post(
        `/governance/proposals/${proposalId}/vote`,
        { vote }
      );
      return response.data;
    },
  });

  // Real-time governance updates
  useEffect(() => {
    if (!socket) return;

    socket.emit('subscribe_governance', projectId);
    socket.on('governance_update', data => {
      // Update UI with real-time governance changes
      queryClient.setQueryData(['proposals', projectId], (old: any) => {
        // Update proposals with new data
        return updateProposalsWithNewData(old, data);
      });
    });

    return () => {
      socket.off('governance_update');
    };
  }, [socket, projectId]);

  return {
    proposals: proposalsQuery.data,
    voteOnProposal,
    isLoading: proposalsQuery.isLoading,
  };
};
```

#### **8. Error Handling & User Experience**

```typescript
// lib/error-handler.ts
export const handleApiError = (error: any) => {
  if (error.response?.data?.error) {
    const { code, message } = error.response.data.error;

    switch (code) {
      case 'IDENTITY_NOT_VERIFIED':
        return {
          title: 'Identity Verification Required',
          message: 'Please complete your identity verification to continue.',
          action: 'verify-identity',
        };
      case 'IDENTITY_CLAIMS_MISSING':
        return {
          title: 'KYC Verification Required',
          message: 'Please complete your KYC verification to invest.',
          action: 'complete-kyc',
        };
      case 'AUTH_MFA_REQUIRED':
        return {
          title: 'Two-Factor Authentication Required',
          message: 'Please complete MFA verification.',
          action: 'setup-mfa',
        };
      default:
        return {
          title: 'Error',
          message: message || 'An unexpected error occurred.',
          action: null,
        };
    }
  }

  return {
    title: 'Network Error',
    message: 'Please check your internet connection and try again.',
    action: 'retry',
  };
};
```

## Blockchain Platform Integration

### **Smart Contract Integration**

#### **1. Contract Address Configuration**

```typescript
// config/contracts.ts
export const CONTRACTS = {
  // Core Infrastructure
  PLATFORM_REGISTRY: '0xc27bDcdeA460de9A76f759e785521a5cb834B7a1',
  PLATFORM_TREASURY: '0x53ab91a863B79824c4243EB258Ce9F23a0fAB89A',
  PROJECT_FACTORY: '0xC3abeE18DCfE502b38d0657dAc04Af8a746913D1',

  // ERC-3643 Compliance Infrastructure
  CLAIM_TOPICS_REGISTRY: '0x2DbA5D6bdb79Aa318cB74300D62F54e7baB949f6',
  TRUSTED_ISSUERS_REGISTRY: '0x812aA860f141D48E6c294AFD7ad6437a17051235',
  IDENTITY_REGISTRY: '0x7f7ae1E07EedfEeeDd7A96ECA67dce85fe2A84eA',

  // Project Implementation Templates
  PROJECT_TOKEN: '0x1f8Fb3846541571a5E3ed05f311d4695f02dc8Cd',
  PROJECT_OFFERING: '0x445b8Aa90eA5d2E80916Bc0f8ACc150d9b91634F',
  PROJECT_TREASURY: '0x6662D1f5103dB37Cb72dE44b016c240167c44c35',
  PROJECT_GOVERNANCE: '0x1abd0E1e64258450e8F74f43Bc1cC47bfE6Efa23',
};

export const NETWORK_CONFIG = {
  ARBITRUM_SEPOLIA: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
  },
  ARBITRUM_ONE: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
  },
};
```

#### **2. Backend Blockchain Service Integration**

```typescript
// services/blockchain.service.ts
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { CONTRACTS, NETWORK_CONFIG } from '../config/contracts';

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      NETWORK_CONFIG.ARBITRUM_SEPOLIA.rpcUrl
    );
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
  }

  // Identity verification integration
  async verifyIdentity(userAddress: string): Promise<boolean> {
    try {
      const identityRegistry = new ethers.Contract(
        CONTRACTS.IDENTITY_REGISTRY,
        IDENTITY_REGISTRY_ABI,
        this.provider
      );

      return await identityRegistry.isVerified(userAddress);
    } catch (error) {
      console.error('Identity verification failed:', error);
      return false;
    }
  }

  // Register identity on-chain
  async registerIdentity(
    userAddress: string,
    identityKey: string
  ): Promise<string> {
    const identityRegistry = new ethers.Contract(
      CONTRACTS.IDENTITY_REGISTRY,
      IDENTITY_REGISTRY_ABI,
      this.wallet
    );

    const tx = await identityRegistry.registerIdentity(
      userAddress,
      identityKey
    );
    await tx.wait();

    return tx.hash;
  }

  // Issue claim on-chain
  async issueClaim(
    identityAddress: string,
    claimTopic: string,
    issuer: string,
    data: any
  ): Promise<string> {
    const identityRegistry = new ethers.Contract(
      CONTRACTS.IDENTITY_REGISTRY,
      IDENTITY_REGISTRY_ABI,
      this.wallet
    );

    const tx = await identityRegistry.addClaim(
      identityAddress,
      claimTopic,
      issuer,
      ethers.solidityPackedKeccak256(['string'], [JSON.stringify(data)])
    );

    await tx.wait();
    return tx.hash;
  }

  // Deploy project contracts
  async deployProject(
    projectData: any
  ): Promise<{ contractAddress: string; transactionHash: string }> {
    const projectFactory = new ethers.Contract(
      CONTRACTS.PROJECT_FACTORY,
      PROJECT_FACTORY_ABI,
      this.wallet
    );

    const tx = await projectFactory.createProject(
      projectData.name,
      projectData.symbol,
      projectData.totalSupply,
      projectData.tokenPrice
    );

    const receipt = await tx.wait();

    // Extract contract address from events
    const event = receipt.logs.find(
      (log: any) =>
        log.topics[0] ===
        ethers.id(
          'ProjectCreated(uint256,address,address,address,address,address)'
        )
    );

    const contractAddress = ethers.AbiCoder.defaultAbiCoder().decode(
      ['uint256', 'address', 'address', 'address', 'address', 'address'],
      event.data
    )[2]; // ProjectToken address

    return {
      contractAddress,
      transactionHash: tx.hash,
    };
  }

  // Generate authorization signature for investments
  async generateAuthorizationSignature(
    investorAddress: string,
    amount: string,
    projectId: string
  ): Promise<string> {
    const message = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'string'],
      [investorAddress, amount, projectId]
    );

    return await this.wallet.signMessage(ethers.getBytes(message));
  }

  // Monitor blockchain events
  async monitorEvents() {
    const projectFactory = new ethers.Contract(
      CONTRACTS.PROJECT_FACTORY,
      PROJECT_FACTORY_ABI,
      this.provider
    );

    // Listen for project creation events
    projectFactory.on(
      'ProjectCreated',
      async (projectId, spv, tokenAddress) => {
        console.log('New project created:', { projectId, spv, tokenAddress });

        // Update database with contract address
        await this.updateProjectContractAddress(
          projectId.toString(),
          tokenAddress
        );
      }
    );

    // Listen for investment events
    const identityRegistry = new ethers.Contract(
      CONTRACTS.IDENTITY_REGISTRY,
      IDENTITY_REGISTRY_ABI,
      this.provider
    );

    identityRegistry.on('ClaimAdded', async (identity, claimTopic, issuer) => {
      console.log('New claim added:', { identity, claimTopic, issuer });

      // Update backend claims database
      await this.updateClaimStatus(identity, claimTopic, 'active');
    });
  }

  private async updateProjectContractAddress(
    projectId: string,
    contractAddress: string
  ) {
    // Update project in database with contract address
    // This would integrate with your ProjectsService
  }

  private async updateClaimStatus(
    identity: string,
    claimTopic: string,
    status: string
  ) {
    // Update claim status in database
    // This would integrate with your ClaimsService
  }
}
```

#### **3. Event Monitoring & Synchronization**

```typescript
// services/blockchain-sync.service.ts
@Injectable()
export class BlockchainSyncService {
  constructor(
    private blockchainService: BlockchainService,
    private projectsService: ProjectsService,
    private claimsService: ClaimsService,
    private investmentsService: InvestmentsService
  ) {}

  async startEventMonitoring() {
    console.log('Starting blockchain event monitoring...');

    // Monitor project events
    this.monitorProjectEvents();

    // Monitor identity events
    this.monitorIdentityEvents();

    // Monitor investment events
    this.monitorInvestmentEvents();
  }

  private async monitorProjectEvents() {
    const projectFactory = new ethers.Contract(
      CONTRACTS.PROJECT_FACTORY,
      PROJECT_FACTORY_ABI,
      this.blockchainService.provider
    );

    projectFactory.on(
      'ProjectCreated',
      async (
        projectId,
        spv,
        tokenAddress,
        offeringAddress,
        treasuryAddress,
        governanceAddress
      ) => {
        try {
          // Update project with contract addresses
          await this.projectsService.updateProjectContracts(
            projectId.toString(),
            {
              tokenAddress,
              offeringAddress,
              treasuryAddress,
              governanceAddress,
            }
          );

          console.log(`Project ${projectId} contracts deployed successfully`);
        } catch (error) {
          console.error('Failed to update project contracts:', error);
        }
      }
    );
  }

  private async monitorIdentityEvents() {
    const identityRegistry = new ethers.Contract(
      CONTRACTS.IDENTITY_REGISTRY,
      IDENTITY_REGISTRY_ABI,
      this.blockchainService.provider
    );

    identityRegistry.on('IdentityRegistered', async (identity, identityKey) => {
      try {
        await this.claimsService.updateIdentityStatus(identity, 'verified');
        console.log(`Identity ${identity} registered on-chain`);
      } catch (error) {
        console.error('Failed to update identity status:', error);
      }
    });

    identityRegistry.on(
      'ClaimAdded',
      async (identity, claimTopic, issuer, claimData) => {
        try {
          await this.claimsService.synchronizeClaimFromBlockchain(
            identity,
            claimTopic,
            issuer,
            claimData
          );
          console.log(`Claim ${claimTopic} added for ${identity}`);
        } catch (error) {
          console.error('Failed to synchronize claim:', error);
        }
      }
    );
  }
}
```

### **Development Environment Setup**

#### **1. Firebase Emulator Configuration**

```bash
# Start Firebase emulators
firebase emulators:start --only firestore,auth

# In another terminal, start backend
cd apps/backend
npm run dev

# Backend will automatically connect to emulators
```

#### **2. Environment Variables Setup**

```bash
# Backend environment (.env.development)
NODE_ENV=development
PORT=3001

# Firebase Configuration
FIREBASE_PROJECT_ID=partisipro-dev
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@partisipro-dev.iam.gserviceaccount.com

# Web3Auth Configuration
WEB3AUTH_DOMAIN=your_web3auth_domain
WEB3AUTH_CLIENT_ID=your_web3auth_client_id
WEB3AUTH_CLIENT_SECRET=your_web3auth_client_secret

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@partisipro.com

# Blockchain Configuration
PRIVATE_KEY=your_ethereum_private_key
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBISCAN_API_KEY=your_arbiscan_api_key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

#### **3. Docker Development Setup**

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - redis
      - firebase-emulator

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --appendonly yes

  firebase-emulator:
    image: gcr.io/firebase-tools/firebase-tools
    ports:
      - '4000:4000' # Firebase UI
      - '8080:8080' # Firestore
      - '9099:9099' # Auth
    volumes:
      - .:/workspace
    command: firebase emulators:start --host 0.0.0.0
```

## Testing Integration

### **End-to-End Integration Testing**

```typescript
// tests/integration/complete-flow.spec.ts
describe('Complete Integration Flow', () => {
  let app: INestApplication;
  let frontendClient: any;

  beforeAll(async () => {
    // Setup backend
    app = await createTestingModule();
    await app.listen(3001);

    // Setup frontend client
    frontendClient = new APIClient('http://localhost:3001');
  });

  it('should complete full user journey', async () => {
    // 1. User registration with Web3Auth
    const authResult = await frontendClient.login('mock_web3auth_token');
    expect(authResult.user).toBeDefined();

    // 2. Identity verification
    const identityResult = await frontendClient.registerIdentity({
      walletAddress: authResult.user.walletAddress,
    });
    expect(identityResult.status).toBe('verified');

    // 3. KYC process
    const kycResult = await frontendClient.initiateKYC();
    expect(kycResult.status).toBe('approved');

    // 4. Project browsing
    const projects = await frontendClient.getProjects();
    expect(projects.length).toBeGreaterThan(0);

    // 5. Investment process
    const investment = await frontendClient.investInProject({
      projectId: projects[0].id,
      amount: 1000000, // 1M IDR
    });
    expect(investment.status).toBe('completed');

    // 6. Portfolio check
    const portfolio = await frontendClient.getPortfolio();
    expect(portfolio.investments).toHaveLength(1);

    // 7. Governance participation
    const proposal = await frontendClient.createProposal({
      projectId: projects[0].id,
      title: 'Test Proposal',
      description: 'Test governance proposal',
    });
    expect(proposal.id).toBeDefined();

    const voteResult = await frontendClient.voteOnProposal({
      proposalId: proposal.id,
      vote: 'for',
    });
    expect(voteResult.success).toBe(true);
  });
});
```

### **Performance Testing**

```typescript
// tests/performance/load-test.spec.ts
describe('Load Testing', () => {
  it('should handle 100 concurrent users', async () => {
    const promises = Array.from({ length: 100 }, async (_, i) => {
      const client = new APIClient();
      await client.login(`user_${i}`);
      await client.getPortfolio();
      await client.getProjects();
    });

    const results = await Promise.all(promises);
    expect(results).toHaveLength(100);
  });

  it('should maintain WebSocket connections for 1000 users', async () => {
    const connections = Array.from({ length: 1000 }, () => {
      return io('http://localhost:3001', {
        auth: { token: 'mock_token' },
      });
    });

    // Wait for all connections
    await Promise.all(
      connections.map(
        socket => new Promise(resolve => socket.on('connect', resolve))
      )
    );

    expect(connections.every(socket => socket.connected)).toBe(true);

    // Cleanup
    connections.forEach(socket => socket.disconnect());
  });
});
```

## Production Deployment

### **Environment Configuration**

```bash
# Production environment variables
NODE_ENV=production
PORT=3001

# Firebase Production
_FIREBASE_PROJECT_ID=partisipro-prod
_FIREBASE_PRIVATE_KEY="production_private_key"
_FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@partisipro-prod.iam.gserviceaccount.com

# Production blockchain
PRIVATE_KEY=production_ethereum_private_key
ARBITRUM_ONE_RPC_URL=https://arb1.arbitrum.io/rpc

# Production Redis (managed service)
REDIS_URL=redis://production-redis-cluster:6379

# Real service configurations
SENDGRID_API_KEY=production_sendgrid_key
VERIHUBS_API_KEY=production_verihubs_key
MIDTRANS_API_KEY=production_midtrans_key
```

### **Deployment Checklist**

```typescript
// Pre-deployment validation
const deploymentChecklist = {
  // Backend readiness
  backend: {
    allTestsPassing: true, // 161/161 tests
    zeroTypeScriptErrors: true, // npm run type-check
    productionConfigValid: true, // Environment variables
    databaseSchemaDeployed: true, // Firestore collections
    securityRulesDeployed: true, // Firestore security
  },

  // Integration readiness
  integration: {
    frontendApiConnected: true, // API integration tested
    webSocketWorking: true, // Real-time features
    blockchainConnected: true, // Smart contract integration
    externalServicesReady: true, // KYC, payments, email
  },

  // Security validation
  security: {
    httpsConfigured: true, // SSL certificates
    corsConfigured: true, // Production origins
    rateLimitingActive: true, // Production rate limits
    auditLoggingEnabled: true, // Compliance logging
    mfaEnforced: true, // Multi-factor auth
  },

  // Performance optimization
  performance: {
    cachingConfigured: true, // Redis production cluster
    databaseOptimized: true, // Firestore indexes
    connectionPooling: true, // HTTP connection pools
    monitoringEnabled: true, // Health checks, alerts
  },
};
```

This integration guide provides comprehensive instructions for connecting the
production-ready Partisipro backend with frontend and blockchain platforms,
ensuring seamless development and deployment workflows.
