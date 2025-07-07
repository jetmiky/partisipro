// Validation utilities
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidTxHash = (hash: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

export const isValidPrivateKey = (key: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(key) || /^[a-fA-F0-9]{64}$/.test(key);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().toLowerCase();
};
