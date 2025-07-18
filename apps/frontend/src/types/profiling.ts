// Investor Profiling Types
export interface InvestorProfile {
  id: string;
  userId: string;
  age: AgeRange;
  income: IncomeRange;
  experience: ExperienceLevel;
  knownInvestments: InvestmentType[];
  investmentGoal: InvestmentGoal;
  riskTolerance: RiskTolerance;
  marketReaction: MarketReaction;
  holdingPeriod: HoldingPeriod;
  projectDetailImportance: ProjectDetailImportance;
  tokenTypes: TokenType[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Age Range Enum
export enum AgeRange {
  UNDER_25 = '<=25',
  BETWEEN_26_35 = '26-35',
  BETWEEN_36_45 = '36-45',
  BETWEEN_46_55 = '46-55',
  OVER_55 = '>55',
}

// Income Range Enum
export enum IncomeRange {
  UNDER_5M = '<=5M',
  BETWEEN_5_10M = '5.1-10M',
  BETWEEN_10_20M = '10.1-20M',
  BETWEEN_20_50M = '20.1-50M',
  OVER_50M = '>50M',
}

// Experience Level Enum
export enum ExperienceLevel {
  NEVER = 'never',
  LESS_THAN_1_YEAR = '<1year',
  BETWEEN_1_3_YEARS = '1-3years',
  BETWEEN_3_5_YEARS = '3-5years',
  MORE_THAN_5_YEARS = '>5years',
}

// Investment Types Enum
export enum InvestmentType {
  SAVINGS = 'savings',
  MUTUAL_FUNDS = 'mutual_funds',
  STOCKS = 'stocks',
  BONDS = 'bonds',
  PROPERTY = 'property',
  GOLD = 'gold',
  CRYPTO = 'crypto',
  OTHERS = 'others',
}

// Investment Goal Enum
export enum InvestmentGoal {
  LONG_TERM_GROWTH = 'long_term_growth',
  REGULAR_INCOME = 'regular_income',
  INFLATION_HEDGE = 'inflation_hedge',
  MEDIUM_TERM_GOALS = 'medium_term_goals',
  DIVERSIFICATION = 'diversification',
}

// Risk Tolerance Enum
export enum RiskTolerance {
  VERY_CONSERVATIVE = 'very_conservative',
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
  VERY_AGGRESSIVE = 'very_aggressive',
}

// Market Reaction Enum
export enum MarketReaction {
  PANIC_SELL = 'panic_sell',
  WORRY_WAIT = 'worry_wait',
  BUY_MORE = 'buy_more',
  NO_WORRY_LONG_TERM = 'no_worry_long_term',
}

// Holding Period Enum
export enum HoldingPeriod {
  LESS_THAN_1_YEAR = '<1year',
  BETWEEN_1_3_YEARS = '1-3years',
  BETWEEN_3_5_YEARS = '3-5years',
  MORE_THAN_5_YEARS = '>5years',
}

// Project Detail Importance Enum
export enum ProjectDetailImportance {
  VERY_IMPORTANT = 'very_important',
  IMPORTANT = 'important',
  NOT_IMPORTANT = 'not_important',
}

// Token Types Enum
export enum TokenType {
  DEBT_TOKEN = 'debt_token',
  EQUITY_TOKEN = 'equity_token',
  REVENUE_TOKEN = 'revenue_token',
  HYBRID_TOKEN = 'hybrid_token',
  UNSURE = 'unsure',
}

// Form Data Interface
export interface ProfileFormData {
  age: string;
  income: string;
  experience: string;
  knownInvestments: string[];
  investmentGoal: string;
  riskTolerance: string;
  marketReaction: string;
  holdingPeriod: string;
  projectDetailImportance: string;
  tokenTypes: string[];
}

// Question Structure
export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  question: string;
  type: 'single-choice' | 'multiple-choice';
  options: QuestionOption[];
  required?: boolean;
}

export interface QuestionSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  questions: Question[];
}

// API Response Types
export interface ProfileSubmissionResponse {
  success: boolean;
  message: string;
  profileId?: string;
  nextStep?: string;
}

export interface ProfileValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ProfileApiError {
  success: false;
  message: string;
  errors?: ProfileValidationError[];
}

// Risk Assessment Result
export interface RiskAssessmentResult {
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  suitableProducts: string[];
  recommendations: string[];
}

// Investment Recommendation
export interface InvestmentRecommendation {
  tokenType: TokenType;
  allocationPercentage: number;
  reasoning: string;
  riskLevel: string;
  expectedReturn: string;
}

// Profile Analytics
export interface ProfileAnalytics {
  completionRate: number;
  sectionCompletionStatus: {
    [sectionId: string]: boolean;
  };
  riskAssessment: RiskAssessmentResult;
  recommendations: InvestmentRecommendation[];
}

// Validation Schema Types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule;
}

// Form State Management
export interface FormState {
  data: ProfileFormData;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
  currentStep: number;
  completedSteps: number[];
}
