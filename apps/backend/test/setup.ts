import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  credential: {
    cert: jest.fn(),
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    batch: jest.fn(),
    runTransaction: jest.fn(),
  })),
  auth: jest.fn(() => ({
    createUser: jest.fn(),
    getUserByEmail: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    verifyIdToken: jest.fn(),
  })),
}));

// Mock Firebase Functions
jest.mock('firebase-functions', () => ({
  config: jest.fn(() => ({})),
  https: {
    onRequest: jest.fn(),
    onCall: jest.fn(),
  },
  firestore: {
    document: jest.fn(),
  },
  auth: {
    user: jest.fn(),
  },
}));

// Mock ethers.js
jest.mock('ethers', () => ({
  ethers: {
    providers: {
      JsonRpcProvider: jest.fn(),
    },
    Wallet: jest.fn(),
    Contract: jest.fn(),
    ContractFactory: jest.fn(),
    utils: {
      parseEther: jest.fn(),
      formatEther: jest.fn(),
      solidityKeccak256: jest.fn(),
      arrayify: jest.fn(),
    },
  },
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    flushall: jest.fn(),
  })),
}));

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(() =>
    Promise.resolve([
      {
        statusCode: 202,
        body: '',
        headers: {
          'x-message-id': 'test-message-id-' + Date.now(),
        },
      },
    ])
  ),
}));

// Mock jwks-client
jest.mock('jwks-client', () => ({
  JwksClient: jest.fn(() => ({
    getSigningKey: jest.fn(() =>
      Promise.resolve({
        getPublicKey: jest.fn(() => 'mock-public-key'),
      })
    ),
  })),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, key, callback) => {
    const mockPayload = {
      sub: 'test-wallet-address',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud: 'test-audience',
      iss: 'https://web3auth.io',
    };
    callback(null, mockPayload);
  }),
  decode: jest.fn(() => ({
    header: { kid: 'test-key-id' },
    payload: {
      sub: 'test-wallet-address',
      email: 'test@example.com',
    },
  })),
}));

// Mock axios for HTTP requests
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  })),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
}));

// Global test utilities
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidEmail(): R;
      toBeValidDate(): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },
});

// Test database setup
export const setupTestDatabase = async () => {
  // Mock Firebase emulator setup
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIREBASE_PROJECT_ID = 'partisipro-test';
};

// Test cleanup
export const cleanupTestDatabase = async () => {
  // Cleanup mock data
  jest.clearAllMocks();
};

// Test app factory
export const createTestApp = async (
  moduleClass: any
): Promise<INestApplication> => {
  const moduleBuilder = Test.createTestingModule(moduleClass);

  const module: TestingModule = await moduleBuilder.compile();

  const app = module.createNestApplication();
  await app.init();

  return app;
};

// Test request helper
export const createTestRequest = (app: INestApplication) => {
  return request(app.getHttpServer());
};

// Mock user factory
export const createMockUser = (overrides: Partial<any> = {}) => {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'investor',
    walletAddress: '0x1234567890123456789012345678901234567890',
    web3AuthId: 'web3auth-test-id',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      nationality: 'Indonesia',
      address: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'Test Country',
      },
    },
    kyc: {
      status: 'approved',
      provider: 'verihubs',
      verificationId: 'kyc-test-id',
      submittedAt: new Date(),
      approvedAt: new Date(),
      documents: [],
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

// Mock project factory
export const createMockProject = (overrides: Partial<any> = {}) => {
  return {
    id: 'test-project-id',
    spvId: 'test-spv-id',
    name: 'Test Project',
    description: 'Test project description',
    category: 'transportation',
    location: {
      province: 'Test Province',
      city: 'Test City',
      coordinates: {
        latitude: -6.2088,
        longitude: 106.8456,
      },
    },
    financial: {
      totalValue: 1000000000,
      tokenPrice: 100000,
      totalTokens: 10000,
      minimumInvestment: 1000000,
      maximumInvestment: 100000000,
    },
    tokenization: {
      contractAddress: '0x1234567890123456789012345678901234567890',
      tokenSymbol: 'TEST',
      tokenName: 'Test Token',
      decimals: 18,
    },
    offering: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: 'active',
      soldTokens: 0,
      raisedAmount: 0,
    },
    concession: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2030-12-31'),
      duration: 5,
    },
    documents: [],
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

// Mock investment factory
export const createMockInvestment = (overrides: Partial<any> = {}) => {
  return {
    id: 'test-investment-id',
    userId: 'test-user-id',
    projectId: 'test-project-id',
    tokenAmount: 10,
    investmentAmount: 1000000,
    purchasePrice: 100000,
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    status: 'completed',
    paymentDetails: {
      paymentId: 'test-payment-id',
      paymentMethod: 'bank_transfer',
      processedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

// JWT token helper
export const generateTestJWT = (payload: any = {}) => {
  const defaultPayload = {
    sub: 'test-user-id',
    email: 'test@example.com',
    role: 'investor',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  return Buffer.from(
    JSON.stringify({ ...defaultPayload, ...payload })
  ).toString('base64');
};

// Test configuration
export const TEST_CONFIG = {
  jwt: {
    secret: 'test-jwt-secret',
    expiresIn: '1h',
  },
  firebase: {
    projectId: 'partisipro-test',
    apiKey: 'test-api-key',
  },
  redis: {
    host: 'localhost',
    port: 6379,
  },
};

// Setup and teardown hooks
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await cleanupTestDatabase();
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
