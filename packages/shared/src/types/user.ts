export interface User {
  id: string;
  email: string;
  walletAddress?: string;
  kycStatus: KYCStatus;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum KYCStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum UserRole {
  INVESTOR = 'investor',
  SPV = 'spv',
  ADMIN = 'admin',
}

export interface UserProfile {
  userId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  nationality?: string;
  phoneNumber?: string;
  address?: UserAddress;
  investmentExperience?: InvestmentExperience;
  riskTolerance?: RiskTolerance;
}

export interface UserAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export enum InvestmentExperience {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum RiskTolerance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}
