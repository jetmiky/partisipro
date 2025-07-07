// Token addresses and configurations
export const TOKENS = {
  // Project Garuda IDR Stablecoin (TODO: Update with actual address)
  GARUDA_IDR: {
    address: process.env.GARUDA_IDR_TOKEN_ADDRESS || '',
    symbol: 'GIDR',
    name: 'Project Garuda IDR Stablecoin',
    decimals: 18,
  },
} as const;

export const TOKEN_ADDRESSES = {
  GARUDA_IDR: TOKENS.GARUDA_IDR.address,
} as const;