/**
 * Web3Auth Service Mock Utility
 * Provides consistent mocking for Web3Auth token verification across tests
 */

export const createWeb3AuthMock = () => ({
  verifyIdToken: jest.fn(async (idToken: string) => {
    try {
      console.log(`[TEST] Web3Auth mock called with token: ${idToken}`);
      console.log(
        `[TEST] Token includes 'retail': ${idToken.includes('retail')}`
      );
      console.log(
        `[TEST] Token includes 'admin': ${idToken.includes('admin')}`
      );

      // Handle null/undefined tokens
      if (!idToken) {
        throw new Error('idToken is required');
      }

      // Return proper mock payload based on token
      const currentTime = Math.floor(Date.now() / 1000);
      const basePayload = {
        aud: 'test-client-id',
        iss: 'web3auth.io',
        iat: currentTime,
        exp: currentTime + 3600,
      };

      console.log(`[TEST] About to check branches...`);

      // Handle specific token patterns used in business flow tests
      if (
        idToken === 'mock-retail-investor-token' ||
        idToken.includes('retail')
      ) {
        console.log(`[TEST] Taking retail branch`);
        const result = {
          ...basePayload,
          sub: 'retail_001',
          email: 'retail@example.com',
          name: 'Retail Investor',
          walletAddress: '0xretail123456789012345678901234567890',
        };
        console.log(`[TEST] Returning retail result:`, result);
        return result;
      } else if (
        idToken === 'mock-accredited-investor-token' ||
        idToken.includes('accredited')
      ) {
        console.log(`[TEST] Taking accredited branch`);
        return {
          ...basePayload,
          sub: 'accredited_001',
          email: 'accredited@example.com',
          name: 'Accredited Investor',
          walletAddress: '0xaccredited123456789012345678901234567890',
        };
      } else if (
        idToken === 'mock-institutional-investor-token' ||
        idToken.includes('institutional')
      ) {
        console.log(`[TEST] Taking institutional branch`);
        return {
          ...basePayload,
          sub: 'institutional_001',
          email: 'institutional@example.com',
          name: 'Institutional Investor',
          walletAddress: '0xinstitutional123456789012345678901234567890',
        };
      } else if (
        idToken === 'mock-unverified-token' ||
        idToken.includes('unverified')
      ) {
        console.log(`[TEST] Taking unverified branch`);
        return {
          ...basePayload,
          sub: 'unverified_001',
          email: 'unverified@example.com',
          name: 'Unverified User',
          walletAddress: '0xunverified123456789012345678901234567890',
        };
      } else if (idToken.includes('admin')) {
        console.log(`[TEST] Taking admin branch`);
        return {
          ...basePayload,
          sub: 'admin_001',
          email: 'admin@partisipro.com',
          name: 'Admin User',
          walletAddress: '0xadmin123456789012345678901234567890',
        };
      } else if (idToken.includes('spv')) {
        console.log(`[TEST] Taking spv branch`);
        return {
          ...basePayload,
          sub: 'spv_001',
          email: 'spv@example.com',
          name: 'SPV Company',
          walletAddress: '0xspv1234567890123456789012345678901234',
        };
      } else {
        console.log(`[TEST] Taking default branch for token: ${idToken}`);
        const result = {
          ...basePayload,
          sub: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          walletAddress: '0x1234567890123456789012345678901234567890',
        };
        console.log(`[TEST] Returning default result:`, result);
        return result;
      }
    } catch (error) {
      console.log(`[TEST] Error in Web3Auth mock:`, error);
      throw error;
    }
  }),
});
