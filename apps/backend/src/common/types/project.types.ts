export enum ProjectCategory {
  TRANSPORTATION = 'transportation',
  ENERGY = 'energy',
  WATER = 'water',
  TELECOMMUNICATIONS = 'telecommunications',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OfferingStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface ProjectLocation {
  province: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface ProjectFinancial {
  totalValue: number; // in IDR
  tokenPrice: number; // in IDR
  totalTokens: number;
  minimumInvestment: number;
  maximumInvestment: number;
}

export interface ProjectTokenization {
  contractAddress: string;
  tokenSymbol: string;
  tokenName: string;
  decimals: number;
}

export interface ProjectOffering {
  startDate: Date;
  endDate: Date;
  status: OfferingStatus;
  soldTokens: number;
  raisedAmount: number;
}

export interface ProjectConcession {
  startDate: Date;
  endDate: Date;
  duration: number; // in years
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Project {
  id: string;
  spvId: string;
  name: string;
  description: string;
  category: ProjectCategory;
  location: ProjectLocation;
  financial: ProjectFinancial;
  tokenization: ProjectTokenization;
  offering: ProjectOffering;
  concession: ProjectConcession;
  documents: ProjectDocument[];
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}
