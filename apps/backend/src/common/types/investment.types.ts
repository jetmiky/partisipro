export enum InvestmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TransactionType {
  INVESTMENT = 'investment',
  PROFIT_CLAIM = 'profit_claim',
  BUYBACK = 'buyback',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface PaymentDetails {
  paymentId: string;
  paymentMethod: string;
  processedAt: Date;
  gatewayResponse?: Record<string, unknown>;
}

export interface Investment {
  id: string;
  userId: string;
  projectId: string;
  tokenAmount: number;
  investmentAmount: number; // in IDR
  purchasePrice: number; // per token in IDR
  transactionHash: string;
  status: InvestmentStatus;
  paymentDetails: PaymentDetails;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockchainTransaction {
  transactionHash: string;
  blockNumber: number;
  gasUsed: number;
  gasPrice: number;
  confirmations: number;
}

export interface Transaction {
  id: string;
  userId: string;
  projectId?: string;
  type: TransactionType;
  amount: number; // in IDR
  status: TransactionStatus;
  blockchain: BlockchainTransaction;
  payment: PaymentDetails;
  createdAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}
