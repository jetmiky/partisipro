// Seed data script for Firebase emulators
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

const app = initializeApp({
  projectId: 'partisipro-dev',
});

const db = getFirestore(app);
const auth = getAuth(app);

// Seed data
const seedData = async () => {
  console.log('🌱 Seeding Firebase emulator data...');

  try {
    // Create test users
    const testUsers = [
      {
        uid: 'admin_001',
        email: 'admin@partisipro.com',
        password: 'admin123',
        role: 'admin',
        displayName: 'Admin User',
      },
      {
        uid: 'spv_001',
        email: 'spv@example.com',
        password: 'spv123',
        role: 'spv',
        displayName: 'SPV Company',
      },
      {
        uid: 'investor_001',
        email: 'investor@example.com',
        password: 'investor123',
        role: 'investor',
        displayName: 'John Investor',
      },
    ];

    // Create users in Firebase Auth
    for (const userData of testUsers) {
      try {
        await auth.createUser({
          uid: userData.uid,
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
        });

        // Create user profile in Firestore
        await db
          .collection('users')
          .doc(userData.uid)
          .set({
            id: userData.uid,
            email: userData.email,
            role: userData.role,
            walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
            web3AuthId: `web3auth_${userData.uid}`,
            profile: {
              firstName: userData.displayName.split(' ')[0],
              lastName: userData.displayName.split(' ')[1] || '',
              phoneNumber: '+6281234567890',
              dateOfBirth: new Date('1990-01-01'),
              nationality: 'Indonesia',
              address: {
                street: 'Jl. Sudirman No. 1',
                city: 'Jakarta',
                state: 'DKI Jakarta',
                postalCode: '10220',
                country: 'Indonesia',
              },
            },
            kyc: {
              status: userData.role === 'admin' ? 'approved' : 'pending',
              provider: 'verihubs',
              verificationId: `kyc_${userData.uid}`,
              submittedAt: new Date(),
              approvedAt: userData.role === 'admin' ? new Date() : null,
              documents: [],
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

        console.log(`✅ Created user: ${userData.email}`);
      } catch (error) {
        console.log(`⚠️ User ${userData.email} already exists`);
      }
    }

    // Create test projects
    const testProjects = [
      {
        id: 'proj_001',
        spvId: 'spv_001',
        name: 'Jakarta-Bandung High Speed Rail',
        description: 'High-speed rail connecting Jakarta and Bandung',
        category: 'transportation',
        location: {
          province: 'West Java',
          city: 'Jakarta',
          coordinates: {
            latitude: -6.2088,
            longitude: 106.8456,
          },
        },
        financial: {
          totalValue: 50000000000, // 50 billion IDR
          tokenPrice: 100000, // 100k IDR per token
          totalTokens: 500000,
          minimumInvestment: 1000000, // 1 million IDR
          maximumInvestment: 100000000, // 100 million IDR
        },
        tokenization: {
          contractAddress: '0x1234567890123456789012345678901234567890',
          tokenSymbol: 'JHSR',
          tokenName: 'Jakarta-Bandung HSR Token',
          decimals: 18,
        },
        offering: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-30'),
          status: 'active',
          soldTokens: 150000,
          raisedAmount: 15000000000, // 15 billion IDR
        },
        concession: {
          startDate: new Date('2024-07-01'),
          endDate: new Date('2054-06-30'),
          duration: 30,
        },
        expectedAnnualReturn: 12.5,
        riskLevel: 3,
        documents: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'proj_002',
        spvId: 'spv_001',
        name: 'Solar Power Plant Bali',
        description: 'Renewable energy solar power plant in Bali',
        category: 'energy',
        location: {
          province: 'Bali',
          city: 'Denpasar',
          coordinates: {
            latitude: -8.6705,
            longitude: 115.2126,
          },
        },
        financial: {
          totalValue: 25000000000, // 25 billion IDR
          tokenPrice: 50000, // 50k IDR per token
          totalTokens: 500000,
          minimumInvestment: 500000, // 500k IDR
          maximumInvestment: 50000000, // 50 million IDR
        },
        tokenization: {
          contractAddress: '0x2345678901234567890123456789012345678901',
          tokenSymbol: 'SPPB',
          tokenName: 'Solar Power Plant Bali Token',
          decimals: 18,
        },
        offering: {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-07-31'),
          status: 'active',
          soldTokens: 200000,
          raisedAmount: 10000000000, // 10 billion IDR
        },
        concession: {
          startDate: new Date('2024-08-01'),
          endDate: new Date('2049-07-31'),
          duration: 25,
        },
        expectedAnnualReturn: 15.0,
        riskLevel: 2,
        documents: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create projects in Firestore
    for (const project of testProjects) {
      await db.collection('projects').doc(project.id).set(project);
      console.log(`✅ Created project: ${project.name}`);
    }

    // Create test investments
    const testInvestments = [
      {
        id: 'inv_001',
        userId: 'investor_001',
        projectId: 'proj_001',
        tokenAmount: 100,
        investmentAmount: 10000000, // 10 million IDR
        purchasePrice: 100000,
        transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
        status: 'completed',
        paymentDetails: {
          paymentId: 'pay_001',
          paymentMethod: 'bank_transfer',
          processedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'inv_002',
        userId: 'investor_001',
        projectId: 'proj_002',
        tokenAmount: 200,
        investmentAmount: 10000000, // 10 million IDR
        purchasePrice: 50000,
        transactionHash: '0x2345678901abcdef2345678901abcdef23456789',
        status: 'completed',
        paymentDetails: {
          paymentId: 'pay_002',
          paymentMethod: 'bank_transfer',
          processedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create investments in Firestore
    for (const investment of testInvestments) {
      await db.collection('investments').doc(investment.id).set(investment);
      console.log(`✅ Created investment: ${investment.id}`);
    }

    // Create system configuration
    const systemConfigs = [
      {
        id: 'fees_listing_fee_percentage',
        category: 'fees',
        key: 'listing_fee_percentage',
        value: 2.0,
        description: 'Platform listing fee percentage',
        updatedBy: 'admin_001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'fees_management_fee_percentage',
        category: 'fees',
        key: 'management_fee_percentage',
        value: 5.0,
        description: 'Platform management fee percentage',
        updatedBy: 'admin_001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'limits_minimum_investment',
        category: 'limits',
        key: 'minimum_investment',
        value: 1000000,
        description: 'Minimum investment amount in IDR',
        updatedBy: 'admin_001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create system configurations
    for (const config of systemConfigs) {
      await db.collection('system_configuration').doc(config.id).set(config);
      console.log(`✅ Created system config: ${config.key}`);
    }

    console.log('🎉 Firebase emulator data seeding completed!');
    console.log('');
    console.log('Test credentials:');
    console.log('Admin: admin@partisipro.com / admin123');
    console.log('SPV: spv@example.com / spv123');
    console.log('Investor: investor@example.com / investor123');
    console.log('');
    console.log('Firebase UI: http://localhost:4000');
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};

seedData();
