import { registerAs } from '@nestjs/config';

export default registerAs('web3auth', () => ({
  // Web3Auth configuration
  domain: process.env.WEB3AUTH_DOMAIN || 'web3auth.io',
  clientId: process.env.WEB3AUTH_CLIENT_ID || '',
  clientSecret: process.env.WEB3AUTH_CLIENT_SECRET || '',
  issuer: process.env.WEB3AUTH_ISSUER || 'web3auth.io',

  // Development/testing configuration
  enableMock:
    process.env.WEB3AUTH_ENABLE_MOCK === 'true' ||
    process.env.NODE_ENV === 'development',

  // Token validation settings
  tolerance: parseInt(process.env.WEB3AUTH_TIME_TOLERANCE || '300', 10), // 5 minutes

  // Cache settings for JWKS
  jwksCache: {
    maxAge: parseInt(process.env.WEB3AUTH_JWKS_CACHE_MAX_AGE || '86400000', 10), // 24 hours
    rateLimit: parseInt(process.env.WEB3AUTH_JWKS_RATE_LIMIT || '10', 10), // requests per minute
  },

  // API endpoints
  endpoints: {
    userInfo:
      process.env.WEB3AUTH_USERINFO_URL || 'https://web3auth.io/userinfo',
    token: process.env.WEB3AUTH_TOKEN_URL || 'https://web3auth.io/oauth/token',
    jwks:
      process.env.WEB3AUTH_JWKS_URL ||
      'https://web3auth.io/.well-known/jwks.json',
  },
}));
