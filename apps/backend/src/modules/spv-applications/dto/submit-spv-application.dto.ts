import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsIn,
  IsUrl,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentsDto {
  @ApiProperty({ description: 'Company registration certificate' })
  @IsOptional()
  @IsString()
  companyRegistration?: string;

  @ApiProperty({ description: 'Tax registration certificate (NPWP)' })
  @IsOptional()
  @IsString()
  taxCertificate?: string;

  @ApiProperty({ description: 'Audited financial statements (last 3 years)' })
  @IsOptional()
  @IsString()
  auditedFinancials?: string;

  @ApiProperty({ description: 'Business license (SIUP/NIB)' })
  @IsOptional()
  @IsString()
  businessLicense?: string;

  @ApiProperty({ description: 'Director ID cards and CVs' })
  @IsOptional()
  @IsString()
  directorIds?: string;

  @ApiProperty({ description: 'Bank statements (last 6 months)' })
  @IsOptional()
  @IsString()
  bankStatements?: string;

  @ApiProperty({ description: 'Project portfolio and references' })
  @IsOptional()
  @IsString()
  projectPortfolio?: string;

  @ApiProperty({ description: 'Legal opinion letter' })
  @IsOptional()
  @IsString()
  legalOpinion?: string;
}

export class SubmitSpvApplicationDto {
  // Company Information
  @ApiProperty({ description: 'Company name' })
  @IsString()
  companyName: string;

  @ApiProperty({
    description: 'Legal entity type',
    enum: [
      'PT (Perseroan Terbatas)',
      'CV (Comanditaire Vennootschap)',
      'Firma',
      'Koperasi',
      'Yayasan',
      'Perkumpulan',
      'BUMN',
      'BUMD',
    ],
  })
  @IsString()
  @IsIn([
    'PT (Perseroan Terbatas)',
    'CV (Comanditaire Vennootschap)',
    'Firma',
    'Koperasi',
    'Yayasan',
    'Perkumpulan',
    'BUMN',
    'BUMD',
  ])
  legalEntityType: string;

  @ApiProperty({ description: 'Company registration number' })
  @IsString()
  registrationNumber: string;

  @ApiProperty({ description: 'Tax ID (NPWP)' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty({ description: 'Year company was established' })
  @IsOptional()
  @IsString()
  yearEstablished?: string;

  @ApiProperty({
    description: 'Business type',
    enum: [
      'Infrastructure Development',
      'Construction',
      'Energy & Utilities',
      'Transportation',
      'Real Estate',
      'Technology',
      'Healthcare',
      'Education',
      'Manufacturing',
      'Other',
    ],
  })
  @IsString()
  @IsIn([
    'Infrastructure Development',
    'Construction',
    'Energy & Utilities',
    'Transportation',
    'Real Estate',
    'Technology',
    'Healthcare',
    'Education',
    'Manufacturing',
    'Other',
  ])
  businessType: string;

  @ApiProperty({ description: 'Detailed business description' })
  @IsString()
  businessDescription: string;

  @ApiProperty({ description: 'Company address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'Province' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ description: 'Country', default: 'Indonesia' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Company website' })
  @IsOptional()
  @IsUrl()
  website?: string;

  // Contact Information
  @ApiProperty({ description: 'Primary contact person name' })
  @IsString()
  contactPerson: string;

  @ApiPropertyOptional({ description: 'Contact person title' })
  @IsOptional()
  @IsString()
  contactTitle?: string;

  @ApiProperty({ description: 'Contact email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Primary phone number' })
  @IsPhoneNumber('ID')
  phone: string;

  @ApiPropertyOptional({ description: 'Alternate phone number' })
  @IsOptional()
  @IsPhoneNumber('ID')
  alternatePhone?: string;

  // Financial Information
  @ApiProperty({
    description: 'Annual revenue range',
    enum: [
      'Under Rp 1 Billion',
      'Rp 1-5 Billion',
      'Rp 5-10 Billion',
      'Rp 10-25 Billion',
      'Rp 25-50 Billion',
      'Rp 50-100 Billion',
      'Over Rp 100 Billion',
    ],
  })
  @IsString()
  @IsIn([
    'Under Rp 1 Billion',
    'Rp 1-5 Billion',
    'Rp 5-10 Billion',
    'Rp 10-25 Billion',
    'Rp 25-50 Billion',
    'Rp 50-100 Billion',
    'Over Rp 100 Billion',
  ])
  annualRevenue: string;

  @ApiProperty({ description: 'Number of years in operation' })
  @IsNumber()
  @Min(0)
  @Max(100)
  yearsOfOperation: number;

  @ApiProperty({
    description: 'Description of previous projects and experience',
  })
  @IsString()
  previousProjects: string;

  // Multi-signature Wallet
  @ApiProperty({ description: 'Multi-signature wallet address' })
  @IsString()
  walletAddress: string;

  @ApiProperty({
    description: 'Wallet type',
    enum: ['Safe (Gnosis Safe)', 'Other Multi-Sig'],
    default: 'Safe (Gnosis Safe)',
  })
  @IsString()
  @IsIn(['Safe (Gnosis Safe)', 'Other Multi-Sig'])
  walletType: string;

  @ApiProperty({ description: 'Array of signer wallet addresses' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  signers: string[];

  @ApiProperty({
    description: 'Number of signatures required for transactions',
  })
  @IsNumber()
  @Min(1)
  threshold: number;

  // Documents (file IDs from file upload service)
  @ApiProperty({ description: 'Document file references' })
  @ValidateNested()
  @Type(() => DocumentsDto)
  documents: DocumentsDto;

  // Legal & Compliance
  @ApiProperty({ description: 'Whether company has pending legal issues' })
  @IsBoolean()
  hasLegalIssues: boolean;

  @ApiPropertyOptional({ description: 'Description of legal issues if any' })
  @IsOptional()
  @IsString()
  legalIssuesDescription?: string;

  @ApiProperty({ description: 'Agreement to platform compliance terms' })
  @IsBoolean()
  complianceAgreement: boolean;

  @ApiProperty({ description: 'Consent to data processing' })
  @IsBoolean()
  dataProcessingConsent: boolean;

  // Additional Information
  @ApiProperty({
    description: 'Project types of interest',
    enum: [
      'Toll Roads',
      'Airports',
      'Seaports',
      'Railways',
      'Power Plants',
      'Water Treatment',
      'Hospitals',
      'Schools',
      'Housing',
      'Industrial Parks',
      'Smart Cities',
      'Renewable Energy',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  projectTypes: string[];

  @ApiProperty({
    description: 'Target funding range',
    enum: [
      'Under Rp 10 Billion',
      'Rp 10-50 Billion',
      'Rp 50-100 Billion',
      'Rp 100-500 Billion',
      'Rp 500 Billion - 1 Trillion',
      'Over Rp 1 Trillion',
    ],
  })
  @IsString()
  @IsIn([
    'Under Rp 10 Billion',
    'Rp 10-50 Billion',
    'Rp 50-100 Billion',
    'Rp 100-500 Billion',
    'Rp 500 Billion - 1 Trillion',
    'Over Rp 1 Trillion',
  ])
  targetFundingRange: string;

  @ApiPropertyOptional({ description: 'Additional information' })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}
