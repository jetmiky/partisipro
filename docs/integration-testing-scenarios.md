# Integration Testing Scenarios

## Overview

This document defines comprehensive integration testing scenarios for the
Partisipro platform, covering frontend-backend integration, smart contract
interactions, and third-party service integrations.

## Test Environment Setup

### Test Data Configuration

```typescript
// Test environment configuration
export const TEST_CONFIG = {
  API_BASE_URL: 'http://localhost:3001/api/v1',
  BLOCKCHAIN_NETWORK: 'arbitrum-sepolia',
  WS_URL: 'ws://localhost:3001/ws',

  // Test wallets
  TEST_WALLETS: {
    ADMIN: {
      address: '0x1234567890123456789012345678901234567890',
      privateKey: process.env.TEST_ADMIN_PRIVATE_KEY,
    },
    SPV: {
      address: '0x2345678901234567890123456789012345678901',
      privateKey: process.env.TEST_SPV_PRIVATE_KEY,
    },
    INVESTOR: {
      address: '0x3456789012345678901234567890123456789012',
      privateKey: process.env.TEST_INVESTOR_PRIVATE_KEY,
    },
  },

  // Test project data
  TEST_PROJECT: {
    title: 'Test Jakarta Metro Extension',
    category: 'transportation',
    totalValue: 15000000000,
    targetAmount: 5000000000,
    minimumInvestment: 1000000,
  },

  // KYC provider test config
  KYC_PROVIDER: {
    testMode: true,
    autoApprove: true,
    webhookUrl: 'http://localhost:3001/webhooks/kyc-status',
  },
};
```

## Authentication & Authorization Tests

### Test Suite 1: User Authentication Flow

```typescript
describe('Authentication Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestDatabase();
  });

  test('1.1: User Registration Flow', async () => {
    // Frontend: Submit registration form
    const registrationData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      userType: 'investor',
      acceptTerms: true,
    };

    // API Call: POST /auth/signup
    const response = await apiClient.post('/auth/signup', registrationData);

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.user.email).toBe(registrationData.email);
    expect(response.data.data.token).toBeDefined();

    testUser = response.data.data.user;
    authToken = response.data.data.token;

    // Verify user in database
    const dbUser = await db.users.findByEmail(registrationData.email);
    expect(dbUser).toBeDefined();
    expect(dbUser.emailVerified).toBe(false);
  });

  test('1.2: Email Verification', async () => {
    // Simulate email verification click
    const verificationToken = await db.users.getVerificationToken(testUser.id);

    // API Call: GET /auth/verify-email/:token
    const response = await apiClient.get(
      `/auth/verify-email/${verificationToken}`
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    // Verify email is marked as verified
    const updatedUser = await db.users.findById(testUser.id);
    expect(updatedUser.emailVerified).toBe(true);
  });

  test('1.3: User Login', async () => {
    // Frontend: Submit login form
    const loginData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    // API Call: POST /auth/signin
    const response = await apiClient.post('/auth/signin', loginData);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.token).toBeDefined();
    expect(response.data.data.user.emailVerified).toBe(true);
  });

  test('1.4: Protected Route Access', async () => {
    // API Call: GET /portfolio (protected route)
    const response = await apiClient.get('/portfolio', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test('1.5: Token Refresh', async () => {
    // Wait for token to near expiry or manually expire
    const refreshToken = await db.users.getRefreshToken(testUser.id);

    // API Call: POST /auth/refresh
    const response = await apiClient.post('/auth/refresh', {
      refreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.data.data.token).toBeDefined();
    expect(response.data.data.refreshToken).toBeDefined();
  });
});
```

## Identity & KYC Integration Tests

### Test Suite 2: KYC Verification Flow

```typescript
describe('KYC Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let kycSessionId: string;

  beforeAll(async () => {
    // Create test user
    const { user, token } = await createTestUser('investor');
    testUser = user;
    authToken = token;
  });

  test('2.1: KYC Initiation', async () => {
    // Frontend: Start KYC process
    const kycData = {
      provider: 'verihubs',
      verificationType: 'individual',
    };

    // API Call: POST /identity/kyc/initiate
    const response = await apiClient.post('/identity/kyc/initiate', kycData, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.sessionId).toBeDefined();
    expect(response.data.data.redirectUrl).toBeDefined();

    kycSessionId = response.data.data.sessionId;

    // Verify KYC session in database
    const kycSession =
      await db.identityVerifications.findBySessionId(kycSessionId);
    expect(kycSession).toBeDefined();
    expect(kycSession.status).toBe('pending');
  });

  test('2.2: KYC Document Upload Simulation', async () => {
    // Simulate document upload to KYC provider
    const documents = [
      {
        type: 'national_id',
        file: 'test-id-card.jpg',
        extractedData: {
          fullName: 'John Doe',
          idNumber: '1234567890123456',
          dateOfBirth: '1990-01-01',
        },
      },
      {
        type: 'selfie',
        file: 'test-selfie.jpg',
      },
    ];

    // Mock KYC provider processing
    for (const doc of documents) {
      await kycProviderMock.uploadDocument(kycSessionId, doc);
    }

    // Check KYC status
    const response = await apiClient.get(
      `/identity/kyc/status/${kycSessionId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.data.status).toBe('in_review');
    expect(response.data.data.completedChecks).toContain('document');
  });

  test('2.3: KYC Webhook Processing', async () => {
    // Simulate KYC provider webhook
    const webhookPayload = {
      sessionId: kycSessionId,
      status: 'approved',
      userId: testUser.id,
      checks: {
        document: 'passed',
        facial: 'passed',
        liveness: 'passed',
        aml: 'passed',
      },
      extractedInformation: {
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
        nationality: 'IDN',
      },
      timestamp: new Date().toISOString(),
    };

    // API Call: POST /webhooks/kyc-status
    const response = await webhookClient.post(
      '/webhooks/kyc-status',
      webhookPayload
    );

    expect(response.status).toBe(200);

    // Verify KYC status updated
    const updatedVerification =
      await db.identityVerifications.findBySessionId(kycSessionId);
    expect(updatedVerification.status).toBe('approved');

    // Verify claims issued
    const claims = await db.identityClaims.findByVerificationId(
      updatedVerification.id
    );
    expect(claims.length).toBeGreaterThan(0);
    expect(
      claims.some(claim => claim.claimType === ClaimType.KYC_APPROVED)
    ).toBe(true);
  });

  test('2.4: Identity Status Check', async () => {
    // Frontend: Check identity status
    const response = await apiClient.get('/identity/status', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.data.kycStatus).toBe('approved');
    expect(response.data.data.verificationLevel).toBe('advanced');
    expect(response.data.data.claimsCount).toBeGreaterThan(0);
  });
});
```

## Project Management Integration Tests

### Test Suite 3: Project Creation & Management

```typescript
describe('Project Management Integration Tests', () => {
  let spvUser: any;
  let spvToken: string;
  let adminToken: string;
  let testProject: any;

  beforeAll(async () => {
    // Create SPV user and admin
    const { user: spv, token: spvAuth } = await createTestUser('spv');
    const { token: adminAuth } = await createTestUser('admin');

    spvUser = spv;
    spvToken = spvAuth;
    adminToken = adminAuth;

    // Approve SPV
    await apiClient.post(
      '/admin/spv/approve',
      { spvId: spv.id },
      {
        headers: { Authorization: `Bearer ${adminAuth}` },
      }
    );
  });

  test('3.1: SPV Project Creation', async () => {
    // Frontend: SPV creates project
    const projectData = {
      title: 'Jakarta Smart Metro Extension',
      description:
        'Modern metro extension connecting Jakarta to surrounding areas',
      category: 'transportation',
      location: 'Jakarta - Tangerang',
      province: 'DKI Jakarta',
      totalValue: 15000000000,
      targetAmount: 5000000000,
      minimumInvestment: 1000000,
      expectedReturn: 12.5,
      duration: 24,
      startDate: '2024-03-01',
      endDate: '2026-03-01',
      riskLevel: 'medium',
    };

    // API Call: POST /projects
    const response = await apiClient.post('/projects', projectData, {
      headers: { Authorization: `Bearer ${spvToken}` },
    });

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.approvalStatus).toBe('pending');

    testProject = response.data.data;

    // Verify project in database
    const dbProject = await db.projects.findById(testProject.id);
    expect(dbProject).toBeDefined();
    expect(dbProject.spvId).toBe(spvUser.id);
  });

  test('3.2: Admin Project Approval', async () => {
    // Frontend: Admin approves project
    const approvalData = {
      status: 'approved',
      comments: 'Project meets all requirements',
    };

    // API Call: POST /admin/projects/:id/approve
    const response = await apiClient.post(
      `/admin/projects/${testProject.id}/approve`,
      approvalData,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    // Verify project status updated
    const updatedProject = await db.projects.findById(testProject.id);
    expect(updatedProject.approvalStatus).toBe('approved');
    expect(updatedProject.approvedAt).toBeDefined();
  });

  test('3.3: Smart Contract Deployment', async () => {
    // Simulate smart contract deployment
    const deploymentData = {
      projectId: testProject.id,
      tokenName: testProject.title,
      tokenSymbol: 'JSME',
      totalSupply: testProject.targetAmount / 1000, // 1000 IDR per token
      identityRegistry: CONTRACT_ADDRESSES.IDENTITY_REGISTRY,
    };

    // Mock blockchain deployment
    const contractAddresses =
      await blockchainMock.deployProjectContracts(deploymentData);

    // API Call: POST /projects/:id/deploy-contracts
    const response = await apiClient.post(
      `/projects/${testProject.id}/deploy-contracts`,
      {
        contractAddresses,
      },
      {
        headers: { Authorization: `Bearer ${spvToken}` },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    // Verify contract addresses stored
    const updatedProject = await db.projects.findById(testProject.id);
    expect(updatedProject.contractAddresses).toBeDefined();
    expect(updatedProject.contractAddresses.projectToken).toBeDefined();
  });

  test('3.4: Project Goes Live', async () => {
    // API Call: POST /projects/:id/launch
    const response = await apiClient.post(
      `/projects/${testProject.id}/launch`,
      {},
      {
        headers: { Authorization: `Bearer ${spvToken}` },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    // Verify project status
    const liveProject = await db.projects.findById(testProject.id);
    expect(liveProject.status).toBe('active');
    expect(liveProject.launchedAt).toBeDefined();
  });
});
```

## Investment Flow Integration Tests

### Test Suite 4: Complete Investment Process

```typescript
describe('Investment Flow Integration Tests', () => {
  let investorUser: any;
  let investorToken: string;
  let testProject: any;
  let testInvestment: any;

  beforeAll(async () => {
    // Create verified investor
    const { user, token } = await createVerifiedInvestor();
    investorUser = user;
    investorToken = token;

    // Create active project
    testProject = await createActiveProject();
  });

  test('4.1: Investment Initiation', async () => {
    // Frontend: Investor selects investment amount
    const investmentData = {
      amount: 5000000, // 5 million IDR
      paymentMethod: 'bank_transfer',
      acceptRisks: true,
      acceptTerms: true,
    };

    // API Call: POST /projects/:id/invest
    const response = await apiClient.post(
      `/projects/${testProject.id}/invest`,
      investmentData,
      {
        headers: { Authorization: `Bearer ${investorToken}` },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.status).toBe('pending_payment');
    expect(response.data.data.paymentInstructions).toBeDefined();

    testInvestment = response.data.data;

    // Verify investment in database
    const dbInvestment = await db.investments.findById(
      testInvestment.investmentId
    );
    expect(dbInvestment).toBeDefined();
    expect(dbInvestment.userId).toBe(investorUser.id);
  });

  test('4.2: Payment Processing', async () => {
    // Simulate payment gateway webhook
    const paymentWebhook = {
      investmentId: testInvestment.investmentId,
      paymentId: 'PAY-' + Date.now(),
      status: 'completed',
      amount: testInvestment.amount,
      currency: 'IDR',
      timestamp: new Date().toISOString(),
    };

    // API Call: POST /webhooks/payment-status
    const response = await webhookClient.post(
      '/webhooks/payment-status',
      paymentWebhook
    );

    expect(response.status).toBe(200);

    // Verify payment status updated
    const updatedInvestment = await db.investments.findById(
      testInvestment.investmentId
    );
    expect(updatedInvestment.paymentStatus).toBe('confirmed');
  });

  test('4.3: Token Minting', async () => {
    // Simulate smart contract token minting
    const mintingData = {
      investmentId: testInvestment.investmentId,
      investor: investorUser.walletAddress,
      amount: testInvestment.tokenAmount,
    };

    const txHash = await blockchainMock.mintTokens(
      testProject.contractAddresses.projectToken,
      mintingData
    );

    // API Call: POST /investments/:id/confirm-minting
    const response = await apiClient.post(
      `/investments/${testInvestment.investmentId}/confirm-minting`,
      {
        transactionHash: txHash,
      },
      {
        headers: { Authorization: `Bearer ${investorToken}` },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    // Verify investment status
    const finalInvestment = await db.investments.findById(
      testInvestment.investmentId
    );
    expect(finalInvestment.status).toBe('active');
    expect(finalInvestment.transactionHash).toBe(txHash);
  });

  test('4.4: Portfolio Update', async () => {
    // Frontend: Check updated portfolio
    const response = await apiClient.get('/portfolio', {
      headers: { Authorization: `Bearer ${investorToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.investments.length).toBe(1);
    expect(response.data.data.summary.totalInvested).toBe(
      testInvestment.amount
    );
  });
});
```

## Real-time Features Integration Tests

### Test Suite 5: WebSocket & Real-time Updates

```typescript
describe('Real-time Features Integration Tests', () => {
  let wsClient: WebSocket;
  let investorToken: string;
  let testProject: any;

  beforeAll(async () => {
    const { token } = await createVerifiedInvestor();
    investorToken = token;
    testProject = await createActiveProject();
  });

  test('5.1: WebSocket Connection', async () => {
    // Frontend: Establish WebSocket connection
    wsClient = new WebSocket(`${TEST_CONFIG.WS_URL}?token=${investorToken}`);

    await new Promise(resolve => {
      wsClient.onopen = resolve;
    });

    expect(wsClient.readyState).toBe(WebSocket.OPEN);
  });

  test('5.2: Portfolio Update Notification', async () => {
    const updateReceived = new Promise(resolve => {
      wsClient.onmessage = event => {
        const message = JSON.parse(event.data);
        if (message.type === 'portfolio_update') {
          resolve(message);
        }
      };
    });

    // Simulate portfolio value change
    await simulatePortfolioUpdate(testProject.id, {
      valueChange: 125000,
      percentageChange: 2.5,
      newROI: 15.3,
    });

    const updateMessage = await updateReceived;
    expect(updateMessage).toBeDefined();
    expect(updateMessage.data.projectId).toBe(testProject.id);
    expect(updateMessage.data.impact.valueChange).toBe(125000);
  });

  test('5.3: Governance Notification', async () => {
    const governanceReceived = new Promise(resolve => {
      wsClient.onmessage = event => {
        const message = JSON.parse(event.data);
        if (message.type === 'governance_notification') {
          resolve(message);
        }
      };
    });

    // Create governance proposal
    await createGovernanceProposal(testProject.id, {
      title: 'Contract Upgrade Proposal',
      description: 'Upgrade smart contract for efficiency improvements',
    });

    const governanceMessage = await governanceReceived;
    expect(governanceMessage).toBeDefined();
    expect(governanceMessage.data.eventType).toBe('new_proposal');
    expect(governanceMessage.data.projectId).toBe(testProject.id);
  });

  afterAll(() => {
    if (wsClient) {
      wsClient.close();
    }
  });
});
```

## Smart Contract Integration Tests

### Test Suite 6: Blockchain Interactions

```typescript
describe('Smart Contract Integration Tests', () => {
  let provider: JsonRpcProvider;
  let adminWallet: Wallet;
  let investorWallet: Wallet;
  let contracts: any;

  beforeAll(async () => {
    // Setup blockchain test environment
    provider = new JsonRpcProvider(TEST_CONFIG.BLOCKCHAIN_NETWORK);
    adminWallet = new Wallet(
      TEST_CONFIG.TEST_WALLETS.ADMIN.privateKey,
      provider
    );
    investorWallet = new Wallet(
      TEST_CONFIG.TEST_WALLETS.INVESTOR.privateKey,
      provider
    );

    // Get contract instances
    contracts = await getContractInstances();
  });

  test('6.1: Identity Registry Integration', async () => {
    // Register identity
    const tx = await contracts.identityRegistry
      .connect(adminWallet)
      .registerIdentity(
        investorWallet.address,
        investorWallet.address, // Using wallet as identity for test
        360 // Indonesia country code
      );

    await tx.wait();

    // Verify identity registered
    const isVerified = await contracts.identityRegistry.isVerified(
      investorWallet.address
    );
    expect(isVerified).toBe(true);
  });

  test('6.2: Claims Issuance', async () => {
    // Issue KYC approved claim
    const claimData = ethers.utils.defaultAbiCoder.encode(
      ['bool', 'string'],
      [true, 'KYC verification completed']
    );

    const tx = await contracts.trustedIssuer
      .connect(adminWallet)
      .addClaim(investorWallet.address, ClaimType.KYC_APPROVED, claimData);

    await tx.wait();

    // Verify claim exists
    const hasClaim = await contracts.identityRegistry.hasValidClaim(
      investorWallet.address,
      ClaimType.KYC_APPROVED
    );
    expect(hasClaim).toBe(true);
  });

  test('6.3: Project Token Purchase', async () => {
    // Get project token contract
    const projectToken = await getProjectTokenContract(
      testProject.contractAddresses.projectToken
    );
    const offering = await getOfferingContract(
      testProject.contractAddresses.offering
    );

    // Check initial balance
    const initialBalance = await projectToken.balanceOf(investorWallet.address);
    expect(initialBalance).toBe(0);

    // Purchase tokens
    const purchaseAmount = ethers.utils.parseEther('5000'); // 5000 tokens
    const authVoucher = await generateAuthorizationVoucher(
      investorWallet.address,
      purchaseAmount
    );

    const tx = await offering
      .connect(investorWallet)
      .buyTokens(purchaseAmount, authVoucher);
    await tx.wait();

    // Verify tokens received
    const finalBalance = await projectToken.balanceOf(investorWallet.address);
    expect(finalBalance).toBe(purchaseAmount);
  });

  test('6.4: Governance Voting', async () => {
    const governance = await getGovernanceContract(
      testProject.contractAddresses.governance
    );

    // Create proposal
    const proposalData = ethers.utils.defaultAbiCoder.encode(
      ['string', 'uint256'],
      ['upgrade', 123]
    );

    const createTx = await governance.connect(adminWallet).createProposal(
      'Contract upgrade proposal',
      proposalData,
      86400 // 1 day voting period
    );

    const receipt = await createTx.wait();
    const proposalId = receipt.events[0].args.proposalId;

    // Vote on proposal
    const voteTx = await governance.connect(investorWallet).vote(
      proposalId,
      true, // support
      'I support this upgrade'
    );

    await voteTx.wait();

    // Verify vote recorded
    const hasVoted = await governance.hasVoted(
      proposalId,
      investorWallet.address
    );
    expect(hasVoted).toBe(true);

    const userVote = await governance.getUserVote(
      proposalId,
      investorWallet.address
    );
    expect(userVote).toBe(true);
  });
});
```

## Performance & Load Testing

### Test Suite 7: Performance Integration Tests

```typescript
describe('Performance Integration Tests', () => {
  test('7.1: Concurrent User Registration', async () => {
    const concurrentUsers = 50;
    const startTime = Date.now();

    const registrationPromises = Array.from(
      { length: concurrentUsers },
      (_, i) =>
        apiClient.post('/auth/signup', {
          email: `test${i}@example.com`,
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          userType: 'investor',
          acceptTerms: true,
        })
    );

    const results = await Promise.allSettled(registrationPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const endTime = Date.now();

    expect(successCount).toBeGreaterThan(concurrentUsers * 0.9); // 90% success rate
    expect(endTime - startTime).toBeLessThan(30000); // Complete within 30 seconds
  });

  test('7.2: Database Query Performance', async () => {
    // Create test data
    await createTestInvestments(1000);

    const startTime = Date.now();

    // Complex analytics query
    const response = await apiClient.get('/portfolio/analytics?timeRange=1Y', {
      headers: { Authorization: `Bearer ${testToken}` },
    });

    const endTime = Date.now();

    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(5000); // Query completes within 5 seconds
  });

  test('7.3: WebSocket Connection Load', async () => {
    const connectionCount = 100;
    const connections: WebSocket[] = [];

    // Establish multiple connections
    for (let i = 0; i < connectionCount; i++) {
      const ws = new WebSocket(`${TEST_CONFIG.WS_URL}?token=${testTokens[i]}`);
      connections.push(ws);
    }

    // Wait for all connections to open
    await Promise.all(
      connections.map(
        ws =>
          new Promise(resolve => {
            ws.onopen = resolve;
          })
      )
    );

    const openConnections = connections.filter(
      ws => ws.readyState === WebSocket.OPEN
    );
    expect(openConnections.length).toBe(connectionCount);

    // Cleanup
    connections.forEach(ws => ws.close());
  });
});
```

## Error Handling & Edge Cases

### Test Suite 8: Error Scenarios

```typescript
describe('Error Handling Integration Tests', () => {
  test('8.1: Invalid Authentication', async () => {
    // Test invalid token
    const response = await apiClient.get('/portfolio', {
      headers: { Authorization: 'Bearer invalid_token' },
    });

    expect(response.status).toBe(401);
    expect(response.data.error.code).toBe('AUTH_002');
  });

  test('8.2: Insufficient Funds Investment', async () => {
    const investmentData = {
      amount: 999999999999, // Very large amount
      paymentMethod: 'bank_transfer',
      acceptRisks: true,
      acceptTerms: true,
    };

    const response = await apiClient.post(
      `/projects/${testProject.id}/invest`,
      investmentData,
      {
        headers: { Authorization: `Bearer ${investorToken}` },
      }
    );

    expect(response.status).toBe(400);
    expect(response.data.error.code).toBe('INVEST_001');
  });

  test('8.3: Blockchain Transaction Failure', async () => {
    // Simulate failed blockchain transaction
    const failedTxHash = '0x' + '0'.repeat(64);

    const response = await apiClient.post(
      `/investments/${testInvestment.id}/confirm-minting`,
      {
        transactionHash: failedTxHash,
      },
      {
        headers: { Authorization: `Bearer ${investorToken}` },
      }
    );

    expect(response.status).toBe(400);
    expect(response.data.error.code).toBe('BLOCKCHAIN_001');
  });

  test('8.4: Rate Limiting', async () => {
    // Send requests rapidly to trigger rate limit
    const requests = Array.from({ length: 200 }, () =>
      apiClient.get('/projects')
    );

    const results = await Promise.allSettled(requests);
    const rateLimitedCount = results.filter(
      r => r.status === 'fulfilled' && r.value.status === 429
    ).length;

    expect(rateLimitedCount).toBeGreaterThan(0);
  });
});
```

## Test Utilities & Helpers

```typescript
// Test helper functions
export class TestHelpers {
  static async createTestUser(role: 'investor' | 'spv' | 'admin') {
    const userData = {
      email: `test-${role}-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      userType: role,
      acceptTerms: true,
    };

    const response = await apiClient.post('/auth/signup', userData);
    return {
      user: response.data.data.user,
      token: response.data.data.token,
    };
  }

  static async createVerifiedInvestor() {
    const { user, token } = await this.createTestUser('investor');

    // Complete KYC verification
    await this.completeKYCVerification(user.id);

    return { user, token };
  }

  static async completeKYCVerification(userId: string) {
    const verification = await db.identityVerifications.create({
      userId,
      status: 'approved',
      verificationLevel: 'advanced',
      provider: 'test',
    });

    await db.identityClaims.create({
      verificationId: verification.id,
      claimType: ClaimType.KYC_APPROVED,
      issuer: TEST_CONFIG.TEST_WALLETS.ADMIN.address,
      status: 'active',
    });
  }

  static async createActiveProject() {
    const { user: spv } = await this.createTestUser('spv');

    const project = await db.projects.create({
      ...TEST_CONFIG.TEST_PROJECT,
      spvId: spv.id,
      status: 'active',
      approvalStatus: 'approved',
    });

    return project;
  }

  static async setupTestDatabase() {
    // Initialize test database with clean slate
    await db.migrate.latest();
    await db.seed.run();
  }

  static async cleanupTestDatabase() {
    // Clean up test data
    await db.raw('TRUNCATE TABLE users CASCADE');
    await db.raw('TRUNCATE TABLE projects CASCADE');
    await db.raw('TRUNCATE TABLE investments CASCADE');
  }
}
```

## Continuous Integration Setup

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: partisipro_test
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping" --health-interval 10s --health-timeout
          5s --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test environment
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/partisipro_test
          REDIS_URL: redis://localhost:6379
        run: |
          npm run db:migrate
          npm run db:seed:test

      - name: Run integration tests
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/partisipro_test
          REDIS_URL: redis://localhost:6379
        run: npm run test:integration

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

This comprehensive integration testing specification ensures thorough validation
of all system interactions and provides confidence in the platform's reliability
and performance.
