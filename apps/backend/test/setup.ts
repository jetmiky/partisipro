import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

// Create stateful mock data store
const mockFirestoreData = new Map<string, Map<string, any>>();

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  apps: [], // Add apps property
  credential: {
    cert: jest.fn(),
  },
  firestore: Object.assign(
    jest.fn(() => ({
      FieldValue: {
        serverTimestamp: jest.fn(() => new Date()),
        increment: jest.fn((n: number) => n),
        arrayUnion: jest.fn((...elements: any[]) => elements),
        arrayRemove: jest.fn((...elements: any[]) => elements),
        delete: jest.fn(),
      },
      collection: jest.fn((collectionName: string) => {
        if (!mockFirestoreData.has(collectionName)) {
          mockFirestoreData.set(collectionName, new Map());
        }
        const collection = mockFirestoreData.get(collectionName)!;

        return {
          where: jest.fn((field: string, op: string, value: any) => ({
            get: jest.fn(() => {
              const docs = Array.from(collection.entries())
                .filter(([_, data]) => data[field] === value)
                .map(([id, data]) => ({
                  id,
                  data: () => data,
                }));

              return Promise.resolve({
                docs,
                size: docs.length,
                empty: docs.length === 0,
              });
            }),
          })),
          doc: jest.fn((docId: string) => ({
            get: jest.fn(() => {
              const exists = collection.has(docId);
              return Promise.resolve({
                exists,
                id: docId,
                data: () => (exists ? collection.get(docId) : null),
              });
            }),
            set: jest.fn((data: any) => {
              collection.set(docId, data);
              return Promise.resolve();
            }),
            update: jest.fn((data: any) => {
              if (collection.has(docId)) {
                collection.set(docId, { ...collection.get(docId), ...data });
              }
              return Promise.resolve();
            }),
            delete: jest.fn(() => {
              collection.delete(docId);
              return Promise.resolve();
            }),
          })),
          add: jest.fn((data: any) => {
            const id = `mock-doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            collection.set(id, data);
            return Promise.resolve({ id });
          }),
          get: jest.fn(() => {
            const docs = Array.from(collection.entries()).map(([id, data]) => ({
              id,
              data: () => data,
            }));

            return Promise.resolve({
              docs,
              size: docs.length,
              empty: docs.length === 0,
            });
          }),
        };
      }),
      doc: jest.fn((docPath: string) => {
        const [collectionName, docId] = docPath.split('/');
        if (!mockFirestoreData.has(collectionName)) {
          mockFirestoreData.set(collectionName, new Map());
        }
        const collection = mockFirestoreData.get(collectionName)!;

        return {
          get: jest.fn(() => {
            const exists = collection.has(docId);
            return Promise.resolve({
              exists,
              id: docId,
              data: () => (exists ? collection.get(docId) : null),
            });
          }),
          set: jest.fn((data: any) => {
            collection.set(docId, data);
            return Promise.resolve();
          }),
          update: jest.fn((data: any) => {
            if (collection.has(docId)) {
              collection.set(docId, { ...collection.get(docId), ...data });
            }
            return Promise.resolve();
          }),
          delete: jest.fn(() => {
            collection.delete(docId);
            return Promise.resolve();
          }),
        };
      }),
      batch: jest.fn(() => ({
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn(() => Promise.resolve()),
      })),
      runTransaction: jest.fn(),
    })),
    {
      FieldValue: {
        serverTimestamp: jest.fn(() => new Date()),
        increment: jest.fn((n: number) => n),
        arrayUnion: jest.fn((...elements: any[]) => elements),
        arrayRemove: jest.fn((...elements: any[]) => elements),
        delete: jest.fn(),
      },
    }
  ),
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

// Mock ioredis (used by CacheService)
jest.mock('ioredis', () => {
  const mockRedis = {
    // Connection methods
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => Promise.resolve()),
    quit: jest.fn(() => Promise.resolve()),

    // Basic operations
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    setex: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    exists: jest.fn(() => Promise.resolve(0)),
    keys: jest.fn(() => Promise.resolve([])),
    mget: jest.fn(() => Promise.resolve([])),
    ttl: jest.fn(() => Promise.resolve(-1)),
    expire: jest.fn(() => Promise.resolve(1)),
    incrby: jest.fn(() => Promise.resolve(1)),

    // Advanced operations
    flushdb: jest.fn(() => Promise.resolve('OK')),
    info: jest.fn(() => Promise.resolve('redis_version:5.0.0')),
    ping: jest.fn(() => Promise.resolve('PONG')),

    // Pipeline operations
    pipeline: jest.fn(() => ({
      setex: jest.fn(),
      exec: jest.fn(() => Promise.resolve([])),
    })),

    // Event methods
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),

    // Connection status
    status: 'ready',
  };

  return jest.fn(() => mockRedis);
});

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
  sign: jest.fn(() => 'mock-jwt-token'),
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
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
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
  // Enable mock Web3Auth in test environment
  process.env.NODE_ENV = 'test';
  process.env.WEB3AUTH_ENABLE_MOCK = 'true';
};

// Test cleanup
export const cleanupTestDatabase = async () => {
  // Cleanup mock data
  jest.clearAllMocks();
  // Clear mock Firestore data
  mockFirestoreData.clear();
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
  // Clear mock Firestore data between tests
  mockFirestoreData.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});
