import {
  ProfileFormData,
  ValidationSchema,
  ValidationRule,
  AgeRange,
  IncomeRange,
  ExperienceLevel,
  InvestmentType,
  InvestmentGoal,
  RiskTolerance,
  MarketReaction,
  HoldingPeriod,
  ProjectDetailImportance,
  TokenType,
} from '@/types/profiling';

// Validation rules for each field
export const profileValidationSchema: ValidationSchema = {
  age: {
    required: true,
    custom: (value: string) => {
      return (
        Object.values(AgeRange).includes(value as AgeRange) ||
        'Pilih salah satu rentang usia yang tersedia'
      );
    },
  },
  income: {
    required: true,
    custom: (value: string) => {
      return (
        Object.values(IncomeRange).includes(value as IncomeRange) ||
        'Pilih salah satu rentang penghasilan yang tersedia'
      );
    },
  },
  experience: {
    required: true,
    custom: (value: string) => {
      return (
        Object.values(ExperienceLevel).includes(value as ExperienceLevel) ||
        'Pilih salah satu tingkat pengalaman yang tersedia'
      );
    },
  },
  knownInvestments: {
    required: true,
    custom: (value: string[]) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Pilih minimal satu jenis investasi';
      }
      const validTypes = Object.values(InvestmentType);
      const invalidTypes = value.filter(
        type => !validTypes.includes(type as InvestmentType)
      );
      return (
        invalidTypes.length === 0 ||
        `Tipe investasi tidak valid: ${invalidTypes.join(', ')}`
      );
    },
  },
  investmentGoal: {
    required: true,
    custom: (value: string) => {
      return (
        Object.values(InvestmentGoal).includes(value as InvestmentGoal) ||
        'Pilih salah satu tujuan investasi yang tersedia'
      );
    },
  },
  riskTolerance: {
    required: true,
    custom: (value: string) => {
      return (
        Object.values(RiskTolerance).includes(value as RiskTolerance) ||
        'Pilih salah satu tingkat toleransi risiko yang tersedia'
      );
    },
  },
  marketReaction: {
    required: true,
    custom: (value: string) => {
      return (
        Object.values(MarketReaction).includes(value as MarketReaction) ||
        'Pilih salah satu reaksi pasar yang tersedia'
      );
    },
  },
  holdingPeriod: {
    required: true,
    custom: (value: string) => {
      return (
        Object.values(HoldingPeriod).includes(value as HoldingPeriod) ||
        'Pilih salah satu periode holding yang tersedia'
      );
    },
  },
  projectDetailImportance: {
    required: true,
    custom: (value: string) => {
      return (
        Object.values(ProjectDetailImportance).includes(
          value as ProjectDetailImportance
        ) || 'Pilih salah satu tingkat kepentingan detail proyek yang tersedia'
      );
    },
  },
  tokenTypes: {
    required: true,
    custom: (value: string[]) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Pilih minimal satu jenis token';
      }
      const validTypes = Object.values(TokenType);
      const invalidTypes = value.filter(
        type => !validTypes.includes(type as TokenType)
      );
      return (
        invalidTypes.length === 0 ||
        `Tipe token tidak valid: ${invalidTypes.join(', ')}`
      );
    },
  },
};

// Validation function
export function validateField(
  fieldName: string,
  value: any,
  rule: ValidationRule
): string | null {
  // Check if field is required
  if (
    rule.required &&
    (value === undefined || value === null || value === '')
  ) {
    return 'Field ini wajib diisi';
  }

  // Check if field is empty and not required
  if (
    !rule.required &&
    (value === undefined || value === null || value === '')
  ) {
    return null;
  }

  // Check minimum length
  if (
    rule.minLength &&
    typeof value === 'string' &&
    value.length < rule.minLength
  ) {
    return `Minimal ${rule.minLength} karakter`;
  }

  // Check maximum length
  if (
    rule.maxLength &&
    typeof value === 'string' &&
    value.length > rule.maxLength
  ) {
    return `Maksimal ${rule.maxLength} karakter`;
  }

  // Check pattern
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return 'Format tidak valid';
  }

  // Check custom validation
  if (rule.custom) {
    const result = rule.custom(value);
    if (typeof result === 'string') {
      return result;
    }
    if (result === false) {
      return 'Nilai tidak valid';
    }
  }

  return null;
}

// Validate entire form
export function validateProfileForm(
  data: ProfileFormData
): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.entries(profileValidationSchema).forEach(([fieldName, rule]) => {
    const fieldValue = data[fieldName as keyof ProfileFormData];
    const error = validateField(fieldName, fieldValue, rule);

    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
}

// Validate specific section
export function validateSection(
  data: ProfileFormData,
  sectionFields: string[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  sectionFields.forEach(fieldName => {
    const rule = profileValidationSchema[fieldName];
    if (rule) {
      const fieldValue = data[fieldName as keyof ProfileFormData];
      const error = validateField(fieldName, fieldValue, rule);

      if (error) {
        errors[fieldName] = error;
      }
    }
  });

  return errors;
}

// Check if form is valid
export function isFormValid(data: ProfileFormData): boolean {
  const errors = validateProfileForm(data);
  return Object.keys(errors).length === 0;
}

// Check if specific section is valid
export function isSectionValid(
  data: ProfileFormData,
  sectionFields: string[]
): boolean {
  const errors = validateSection(data, sectionFields);
  return Object.keys(errors).length === 0;
}

// Get completion percentage
export function getCompletionPercentage(data: ProfileFormData): number {
  const totalFields = Object.keys(profileValidationSchema).length;
  const completedFields = Object.entries(data).filter(([_, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== '' && value !== null && value !== undefined;
  }).length;

  return Math.round((completedFields / totalFields) * 100);
}

// Risk Assessment Utility
export function calculateRiskScore(data: ProfileFormData): number {
  let score = 0;

  // Age factor (higher age = lower risk tolerance generally)
  switch (data.age) {
    case AgeRange.UNDER_25:
      score += 4;
      break;
    case AgeRange.BETWEEN_26_35:
      score += 3;
      break;
    case AgeRange.BETWEEN_36_45:
      score += 2;
      break;
    case AgeRange.BETWEEN_46_55:
      score += 1;
      break;
    case AgeRange.OVER_55:
      score += 0;
      break;
  }

  // Income factor (higher income = higher risk tolerance)
  switch (data.income) {
    case IncomeRange.UNDER_5M:
      score += 0;
      break;
    case IncomeRange.BETWEEN_5_10M:
      score += 1;
      break;
    case IncomeRange.BETWEEN_10_20M:
      score += 2;
      break;
    case IncomeRange.BETWEEN_20_50M:
      score += 3;
      break;
    case IncomeRange.OVER_50M:
      score += 4;
      break;
  }

  // Experience factor
  switch (data.experience) {
    case ExperienceLevel.NEVER:
      score += 0;
      break;
    case ExperienceLevel.LESS_THAN_1_YEAR:
      score += 1;
      break;
    case ExperienceLevel.BETWEEN_1_3_YEARS:
      score += 2;
      break;
    case ExperienceLevel.BETWEEN_3_5_YEARS:
      score += 3;
      break;
    case ExperienceLevel.MORE_THAN_5_YEARS:
      score += 4;
      break;
  }

  // Risk tolerance factor
  switch (data.riskTolerance) {
    case RiskTolerance.VERY_CONSERVATIVE:
      score += 0;
      break;
    case RiskTolerance.CONSERVATIVE:
      score += 1;
      break;
    case RiskTolerance.MODERATE:
      score += 2;
      break;
    case RiskTolerance.AGGRESSIVE:
      score += 3;
      break;
    case RiskTolerance.VERY_AGGRESSIVE:
      score += 4;
      break;
  }

  // Market reaction factor
  switch (data.marketReaction) {
    case MarketReaction.PANIC_SELL:
      score += 0;
      break;
    case MarketReaction.WORRY_WAIT:
      score += 1;
      break;
    case MarketReaction.BUY_MORE:
      score += 3;
      break;
    case MarketReaction.NO_WORRY_LONG_TERM:
      score += 2;
      break;
  }

  // Holding period factor
  switch (data.holdingPeriod) {
    case HoldingPeriod.LESS_THAN_1_YEAR:
      score += 0;
      break;
    case HoldingPeriod.BETWEEN_1_3_YEARS:
      score += 1;
      break;
    case HoldingPeriod.BETWEEN_3_5_YEARS:
      score += 2;
      break;
    case HoldingPeriod.MORE_THAN_5_YEARS:
      score += 3;
      break;
  }

  // Normalize score to 0-100 range
  const maxScore = 24; // 4 + 4 + 4 + 4 + 3 + 3 + 2 (age + income + experience + risk + market + holding)
  return Math.round((score / maxScore) * 100);
}

// Get risk level from score
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 33) return 'low';
  if (score < 66) return 'medium';
  return 'high';
}

// Generate investment recommendations
export function generateInvestmentRecommendations(
  data: ProfileFormData
): string[] {
  const recommendations: string[] = [];
  const riskScore = calculateRiskScore(data);
  const riskLevel = getRiskLevel(riskScore);

  // Based on risk level
  if (riskLevel === 'low') {
    recommendations.push(
      'Fokus pada token berbasis utang dengan pendapatan tetap'
    );
    recommendations.push(
      'Diversifikasi minimal 3-5 proyek untuk mengurangi risiko'
    );
    recommendations.push(
      'Pilih proyek infrastruktur dengan track record yang baik'
    );
  } else if (riskLevel === 'medium') {
    recommendations.push(
      'Campurkan token utang dan ekuitas untuk keseimbangan'
    );
    recommendations.push('Pertimbangkan token hibrida untuk fleksibilitas');
    recommendations.push('Alokasikan 60-70% pada token konservatif');
  } else {
    recommendations.push('Eksplor token ekuitas untuk potensi capital gain');
    recommendations.push('Pertimbangkan proyek inovatif dengan potensi tinggi');
    recommendations.push(
      'Siapkan portofolio yang beragam dengan toleransi volatilitas'
    );
  }

  // Based on investment goal
  if (data.investmentGoal === InvestmentGoal.REGULAR_INCOME) {
    recommendations.push(
      'Prioritaskan token hak pendapatan untuk cash flow reguler'
    );
  } else if (data.investmentGoal === InvestmentGoal.LONG_TERM_GROWTH) {
    recommendations.push(
      'Fokus pada proyek dengan potensi pertumbuhan jangka panjang'
    );
  }

  // Based on holding period
  if (data.holdingPeriod === HoldingPeriod.MORE_THAN_5_YEARS) {
    recommendations.push(
      'Manfaatkan compound effect dengan reinvestasi dividen'
    );
  }

  return recommendations;
}
