'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building,
  FileText,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Globe,
  User,
  Calendar,
  Hash,
  Briefcase,
  Shield,
} from 'lucide-react';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { ScrollReveal } from '@/components/ui/ScrollAnimations';
import { PageTransition } from '@/components/ui/PageTransition';
import { toast } from '@/components/ui/AnimatedNotification';

interface SPVApplicationData {
  // Company Information
  companyName: string;
  legalEntityType: string;
  registrationNumber: string;
  taxId: string;
  yearEstablished: string;
  businessType: string;
  businessDescription: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  website: string;

  // Contact Information
  contactPerson: string;
  contactTitle: string;
  email: string;
  phone: string;
  alternatePhone: string;

  // Financial Information
  annualRevenue: string;
  yearsOfOperation: string;
  previousProjects: string;

  // Multi-signature Wallet
  walletAddress: string;
  walletType: string;
  signers: string[];
  threshold: number;

  // Documents
  documents: {
    companyRegistration: File | null;
    taxCertificate: File | null;
    auditedFinancials: File | null;
    businessLicense: File | null;
    directorIds: File | null;
    bankStatements: File | null;
    projectPortfolio: File | null;
    legalOpinion: File | null;
  };

  // Legal & Compliance
  hasLegalIssues: boolean;
  legalIssuesDescription: string;
  complianceAgreement: boolean;
  dataProcessingConsent: boolean;

  // Additional Information
  projectTypes: string[];
  targetFundingRange: string;
  additionalInfo: string;
}

const initialFormData: SPVApplicationData = {
  companyName: 'PT Mitra Infrastruktur Nusantara',
  legalEntityType: 'PT (Perseroan Terbatas)',
  registrationNumber: 'SPV-010101/2025',
  taxId: '12.345.678.9-012.000',
  yearEstablished: '2012',
  businessType: 'Infrastructure Development',
  businessDescription: 'Pembangunan infrastruktur Jalan Tol Trans Sumatera',
  address: 'Gedung Artha Graha, Jl. Jend. Sudirman Kav. 52-53',
  city: 'Jakarta Selatan',
  province: 'DKI Jakarta',
  postalCode: '12190',
  country: 'Indonesia',
  website: 'https://www.pt-spv.id',
  contactPerson: 'Rendra',
  contactTitle: 'Chief Administrative Officer',
  email: 'contact@pt-spv.id',
  phone: '0211234567',
  alternatePhone: '+6281123456789',
  annualRevenue: 'Rp 1-5 Billion',
  yearsOfOperation: '3',
  previousProjects: 'Jalan Tol Trans Sumatera',
  walletAddress: '0x215033cdE0619D60B7352348F4598316Cc39bC6E',
  walletType: 'Safe (Gnosis Safe)',
  signers: [
    '0x1234567890123456789012345678901234567890',
    '0x1234567890123456789012345678901234567891',
    '0x1234567890123456789012345678901234567892',
  ],
  threshold: 2,
  documents: {
    companyRegistration: null,
    taxCertificate: null,
    auditedFinancials: null,
    businessLicense: null,
    directorIds: null,
    bankStatements: null,
    projectPortfolio: null,
    legalOpinion: null,
  },
  hasLegalIssues: false,
  legalIssuesDescription: '',
  complianceAgreement: false,
  dataProcessingConsent: false,
  projectTypes: ['Infrastruktur Jalan dan Jembatan', 'Infrastruktur Energi'],
  targetFundingRange: 'Rp 10-50 Billion',
  additionalInfo: '',
};

const LEGAL_ENTITY_TYPES = [
  'PT (Perseroan Terbatas)',
  'Firma',
  'BUMN',
  'BUMD',
  'Lainnya',
];

const BUSINESS_TYPES = [
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
];

const PROJECT_TYPES = [
  'Infrastruktur Jalan dan Jembatan',
  'Infrastruktur Air dan Sanitasi',
  'Infrastruktur Kesehatan',
  'Infrastruktur Energi',
  'Infrastruktur Telekomunikasi',
  'Lainnya',
];

const REVENUE_RANGES = [
  'Under Rp 1 Billion',
  'Rp 1-5 Billion',
  'Rp 5-10 Billion',
  'Rp 10-25 Billion',
  'Rp 25-50 Billion',
  'Rp 50-100 Billion',
  'Over Rp 100 Billion',
];

const FUNDING_RANGES = [
  'Under Rp 10 Billion',
  'Rp 10-50 Billion',
  'Rp 50-100 Billion',
  'Rp 100-500 Billion',
  'Rp 500 Billion - 1 Trillion',
  'Over Rp 1 Trillion',
];

const DOCUMENT_REQUIREMENTS = {
  companyRegistration: 'Company Registration Certificate (Akta Pendirian)',
  taxCertificate: 'Tax Registration Certificate (NPWP)',
  auditedFinancials: 'Audited Financial Statements (Last 3 years)',
  businessLicense: 'Business License (SIUP/NIB)',
  directorIds: 'Director ID Cards & CVs',
  bankStatements: 'Bank Statements (Last 6 months)',
  projectPortfolio: 'Project Portfolio & References',
  legalOpinion: 'Legal Opinion Letter',
};

export default function SPVApplyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SPVApplicationData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 6;

  const updateFormData = (field: keyof SPVApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateDocuments = (
    docType: keyof SPVApplicationData['documents'],
    file: File | null
  ) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docType]: file,
      },
    }));
  };

  const addSigner = () => {
    setFormData(prev => ({
      ...prev,
      signers: [...prev.signers, ''],
    }));
  };

  const removeSigner = (index: number) => {
    setFormData(prev => ({
      ...prev,
      signers: prev.signers.filter((_, i) => i !== index),
    }));
  };

  const updateSigner = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      signers: prev.signers.map((signer, i) => (i === index ? value : signer)),
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Company Information
        if (!formData.companyName)
          newErrors.companyName = 'Nama Perusahaan is required';
        if (!formData.legalEntityType)
          newErrors.legalEntityType = 'Jenis Badan Hukum is required';
        if (!formData.registrationNumber)
          newErrors.registrationNumber = 'Registration number is required';
        if (!formData.businessType)
          newErrors.businessType = 'Business type is required';
        if (!formData.businessDescription)
          newErrors.businessDescription = 'Business description is required';
        break;

      case 2: // Contact Information
        if (!formData.contactPerson)
          newErrors.contactPerson = 'Contact person is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        if (!formData.address) newErrors.address = 'Address is required';
        if (!formData.city) newErrors.city = 'City is required';
        break;

      case 3: // Financial Information
        if (!formData.annualRevenue)
          newErrors.annualRevenue = 'Annual revenue is required';
        if (!formData.yearsOfOperation)
          newErrors.yearsOfOperation = 'Years of operation is required';
        if (!formData.previousProjects)
          newErrors.previousProjects =
            'Previous projects description is required';
        break;

      case 4: // Multi-signature Wallet
        if (!formData.walletAddress)
          newErrors.walletAddress = 'Wallet address is required';
        if (formData.signers.some(signer => !signer))
          newErrors.signers = 'All signer addresses must be filled';
        if (formData.threshold < 1)
          newErrors.threshold = 'Threshold must be at least 1';
        if (formData.threshold > formData.signers.length)
          newErrors.threshold = 'Threshold cannot exceed number of signers';
        break;

      case 5: // Documents
        // eslint-disable-next-line no-case-declarations
        // const requiredDocs = [
        //   'companyRegistration',
        //   'taxCertificate',
        //   'auditedFinancials',
        //   'businessLicense',
        // ];
        // requiredDocs.forEach(doc => {
        //   if (!formData.documents[doc as keyof typeof formData.documents]) {
        //     newErrors[doc] =
        //       `${DOCUMENT_REQUIREMENTS[doc as keyof typeof DOCUMENT_REQUIREMENTS]} is required`;
        //   }
        // });
        break;

      case 6: // Legal & Compliance
        if (!formData.complianceAgreement)
          newErrors.complianceAgreement = 'You must agree to compliance terms';
        if (!formData.dataProcessingConsent)
          newErrors.dataProcessingConsent =
            'Data processing consent is required';
        if (formData.projectTypes.length === 0)
          newErrors.projectTypes = 'Select at least one project type';
        if (!formData.targetFundingRange)
          newErrors.targetFundingRange = 'Target funding range is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0 });
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast.success(
        'SPV application submitted successfully! We will review your application within 3-5 business days.'
      );
      router.push('/spv/apply/success');
    } catch (error) {
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (
    docType: keyof SPVApplicationData['documents'],
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPEG, and PNG files are allowed');
        return;
      }

      updateDocuments(docType, file);
      toast.success(`${file.name} uploaded successfully`);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-700">
          Application Progress
        </h2>
        <span className="text-sm text-gray-500">
          {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Building className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gradient mb-2">
          Informasi Perusahaan SPV
        </h3>
        <p className="text-gray-600">
          Informasi dasar mengenai perusahaan SPV.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div className="md:col-span-2">
          <AnimatedInput
            label="Nama Perusahaan"
            value={formData.companyName}
            onChange={e => updateFormData('companyName', e.target.value)}
            placeholder="PT ABC Infrastructure"
            error={errors.companyName}
            icon={<Building className="w-4 h-4" />}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jenis Badan Hukum *
          </label>
          <select
            value={formData.legalEntityType}
            onChange={e => updateFormData('legalEntityType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Pilih Badan Hukum</option>
            {LEGAL_ENTITY_TYPES.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.legalEntityType && (
            <p className="text-red-500 text-sm mt-1">
              {errors.legalEntityType}
            </p>
          )}
        </div>

        <div>
          <AnimatedInput
            label="Nomor Akta Pendirian"
            value={formData.registrationNumber}
            onChange={e => updateFormData('registrationNumber', e.target.value)}
            placeholder="1234567890123"
            error={errors.registrationNumber}
            icon={<Hash className="w-4 h-4" />}
            required
          />
        </div>

        <div>
          <AnimatedInput
            label="Tax ID (NPWP)"
            value={formData.taxId}
            onChange={e => updateFormData('taxId', e.target.value)}
            placeholder="12.345.678.9-012.000"
            icon={<FileText className="w-4 h-4" />}
          />
        </div>

        <div>
          <AnimatedInput
            label="Tahun Pendirian"
            type="number"
            value={formData.yearEstablished}
            onChange={e => updateFormData('yearEstablished', e.target.value)}
            placeholder="2010"
            icon={<Calendar className="w-4 h-4" />}
            min="1900"
            max={new Date().getFullYear()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sektor Bisnis Perusahaan *
          </label>
          <select
            value={formData.businessType}
            onChange={e => updateFormData('businessType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Pilih Sektor Bisnis</option>
            {BUSINESS_TYPES.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.businessType && (
            <p className="text-red-500 text-sm mt-1">{errors.businessType}</p>
          )}
        </div>

        <div>
          <AnimatedInput
            label="Website"
            value={formData.website}
            onChange={e => updateFormData('website', e.target.value)}
            placeholder="https://www.company.com"
            icon={<Globe className="w-4 h-4" />}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi Bisnis Perusahaan *
          </label>
          <textarea
            value={formData.businessDescription}
            onChange={e =>
              updateFormData('businessDescription', e.target.value)
            }
            placeholder="Aktivitas bisnis utama, expertise, dan focus area perusahaan SPV"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {errors.businessDescription && (
            <p className="text-red-500 text-sm mt-1">
              {errors.businessDescription}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gradient mb-2">
          Informasi Kontak Perusahaan
        </h3>
        <p className="text-gray-600">
          Informasi detail mengenai kontak perusahaan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <AnimatedInput
            label="Contact Person"
            value={formData.contactPerson}
            onChange={e => updateFormData('contactPerson', e.target.value)}
            placeholder="John Doe"
            error={errors.contactPerson}
            icon={<User className="w-4 h-4" />}
            required
          />
        </div>

        <div>
          <AnimatedInput
            label="Contact Title"
            value={formData.contactTitle}
            onChange={e => updateFormData('contactTitle', e.target.value)}
            placeholder="Managing Director"
            icon={<Briefcase className="w-4 h-4" />}
          />
        </div>

        <div>
          <AnimatedInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={e => updateFormData('email', e.target.value)}
            placeholder="contact@company.com"
            error={errors.email}
            icon={<Mail className="w-4 h-4" />}
            required
          />
        </div>

        <div>
          <AnimatedInput
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={e => updateFormData('phone', e.target.value)}
            placeholder="+62 21 1234 5678"
            error={errors.phone}
            icon={<Phone className="w-4 h-4" />}
            required
          />
        </div>

        <div>
          <AnimatedInput
            label="Alternate Phone"
            type="tel"
            value={formData.alternatePhone}
            onChange={e => updateFormData('alternatePhone', e.target.value)}
            placeholder="+62 812 3456 7890"
            icon={<Phone className="w-4 h-4" />}
          />
        </div>

        <div className="md:col-span-2">
          <AnimatedInput
            label="Alamat Perusahaan"
            value={formData.address}
            onChange={e => updateFormData('address', e.target.value)}
            placeholder="Jl. Sudirman No. 123"
            error={errors.address}
            icon={<MapPin className="w-4 h-4" />}
            required
          />
        </div>

        <div>
          <AnimatedInput
            label="Kota"
            value={formData.city}
            onChange={e => updateFormData('city', e.target.value)}
            placeholder="Jakarta"
            error={errors.city}
            icon={<MapPin className="w-4 h-4" />}
            required
          />
        </div>

        <div>
          <AnimatedInput
            label="Provinsi"
            value={formData.province}
            onChange={e => updateFormData('province', e.target.value)}
            placeholder="DKI Jakarta"
            icon={<MapPin className="w-4 h-4" />}
          />
        </div>

        <div>
          <AnimatedInput
            label="Kode Pos"
            value={formData.postalCode}
            onChange={e => updateFormData('postalCode', e.target.value)}
            placeholder="12345"
            icon={<MapPin className="w-4 h-4" />}
          />
        </div>

        <div>
          <AnimatedInput
            label="Negara"
            value={formData.country}
            onChange={e => updateFormData('country', e.target.value)}
            placeholder="Indonesia"
            icon={<MapPin className="w-4 h-4" />}
            readOnly
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-support-500 to-support-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gradient mb-2">
          Informasi Keuangan
        </h3>
        <p className="text-gray-600">
          Latar belakang finansial dan pengalaman pengelolaan proyek.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Revenue *
          </label>
          <select
            value={formData.annualRevenue}
            onChange={e => updateFormData('annualRevenue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select revenue range</option>
            {REVENUE_RANGES.map(range => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
          {errors.annualRevenue && (
            <p className="text-red-500 text-sm mt-1">{errors.annualRevenue}</p>
          )}
        </div>

        <div>
          <AnimatedInput
            label="Years of Operation"
            type="number"
            value={formData.yearsOfOperation}
            onChange={e => updateFormData('yearsOfOperation', e.target.value)}
            placeholder="5"
            error={errors.yearsOfOperation}
            icon={<Calendar className="w-4 h-4" />}
            min="0"
            max="100"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Previous Projects & Experience *
          </label>
          <textarea
            value={formData.previousProjects}
            onChange={e => updateFormData('previousProjects', e.target.value)}
            placeholder="Describe your company's previous infrastructure projects, including project values, locations, and outcomes..."
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {errors.previousProjects && (
            <p className="text-red-500 text-sm mt-1">
              {errors.previousProjects}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gradient mb-2">
          Multi-Signature Wallet
        </h3>
        <p className="text-gray-600">
          Multi-Signature Wallet milik perusahaan SPV
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <AnimatedInput
            label="Multi-Sig Wallet Address"
            value={formData.walletAddress}
            onChange={e => updateFormData('walletAddress', e.target.value)}
            placeholder="0x1234567890123456789012345678901234567890"
            error={errors.walletAddress}
            icon={<Shield className="w-4 h-4" />}
            className="font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Type
          </label>
          <select
            value={formData.walletType}
            onChange={e => updateFormData('walletType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Safe (Gnosis Safe)">Safe (Gnosis Safe)</option>
            <option value="Other Multi-Sig">Other Multi-Sig</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signer Addresses *
          </label>
          {formData.signers.map((signer, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <AnimatedInput
                value={signer}
                onChange={e => updateSigner(index, e.target.value)}
                placeholder="0x1234567890123456789012345678901234567890"
                className="flex-1 font-mono w-full"
              />
              {formData.signers.length > 1 && (
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  onClick={() => removeSigner(index)}
                >
                  Remove
                </AnimatedButton>
              )}
            </div>
          ))}
          {errors.signers && (
            <p className="text-red-500 text-sm mt-1">{errors.signers}</p>
          )}
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={addSigner}
            className="mt-2"
          >
            Add Signer
          </AnimatedButton>
        </div>

        <div className="mt-4">
          <AnimatedInput
            label="Signature Threshold"
            type="number"
            value={formData.threshold.toString()}
            onChange={e =>
              updateFormData('threshold', parseInt(e.target.value))
            }
            placeholder="2"
            error={errors.threshold}
            min="1"
            max={formData.signers.length}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Jumlah signatures minimal untuk persetujuan melakukan transaksi.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gradient mb-2">
          Kelengkapan Berkas
        </h3>
        <p className="text-gray-600">
          Upload dokumen kepatuhan hukum dan dokumen finansial
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(DOCUMENT_REQUIREMENTS).map(([key, description]) => (
          <div key={key} className="glass-modern p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-lg mb-2">
                {description}
              </h4>
              {formData.documents[key as keyof typeof formData.documents] ? (
                <CheckCircle className="w-5 h-5 text-support-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>

            <div className="space-y-2">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e =>
                  handleFileUpload(key as keyof typeof formData.documents, e)
                }
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />

              {formData.documents[key as keyof typeof formData.documents] && (
                <div className="text-sm text-support-600">
                  ✓{' '}
                  {
                    formData.documents[key as keyof typeof formData.documents]
                      ?.name
                  }
                </div>
              )}

              {errors[key] && (
                <p className="text-red-500 text-sm">{errors[key]}</p>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Max 10MB • PDF, JPG, PNG
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-support-500 to-support-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gradient mb-2">
          Final Details
        </h3>
        <p className="text-gray-600">Preferensi proyek dan kepatuhan hukum</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Project Types of Interest *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PROJECT_TYPES.map(type => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.projectTypes.includes(type)}
                  onChange={e => {
                    if (e.target.checked) {
                      updateFormData('projectTypes', [
                        ...formData.projectTypes,
                        type,
                      ]);
                    } else {
                      updateFormData(
                        'projectTypes',
                        formData.projectTypes.filter(t => t !== type)
                      );
                    }
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
          {errors.projectTypes && (
            <p className="text-red-500 text-sm mt-1">{errors.projectTypes}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Funding Range *
          </label>
          <select
            value={formData.targetFundingRange}
            onChange={e => updateFormData('targetFundingRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select funding range</option>
            {FUNDING_RANGES.map(range => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
          {errors.targetFundingRange && (
            <p className="text-red-500 text-sm mt-1">
              {errors.targetFundingRange}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Legal Issues Declaration
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.hasLegalIssues}
                onChange={e =>
                  updateFormData('hasLegalIssues', e.target.checked)
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Perusahaan SPV sedang mengalami permasalahan hukum
              </span>
            </label>

            {formData.hasLegalIssues && (
              <textarea
                value={formData.legalIssuesDescription}
                onChange={e =>
                  updateFormData('legalIssuesDescription', e.target.value)
                }
                placeholder="Please describe any legal issues or disputes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Informasi Tambahan
          </label>
          <textarea
            value={formData.additionalInfo}
            onChange={e => updateFormData('additionalInfo', e.target.value)}
            placeholder="Informasi tambahan bersifat opsional"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={formData.complianceAgreement}
              onChange={e =>
                updateFormData('complianceAgreement', e.target.checked)
              }
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1"
            />
            <span className="text-sm text-gray-700">
              Kami setuju untuk mematuhi seluruh ketentuan platform, regulasi di
              Indonesia, serta persyaratan kepatuhan yang berlaku. *
            </span>
          </label>
          {errors.complianceAgreement && (
            <p className="text-red-500 text-sm">{errors.complianceAgreement}</p>
          )}

          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={formData.dataProcessingConsent}
              onChange={e =>
                updateFormData('dataProcessingConsent', e.target.checked)
              }
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1"
            />
            <span className="text-sm text-gray-700">
              Kami menyetujui pemrosesan data perusahaan untuk application
              review dan operasional platform. *
            </span>
          </label>
          {errors.dataProcessingConsent && (
            <p className="text-red-500 text-sm">
              {errors.dataProcessingConsent}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <div className="relative z-10 pt-10 pb-10">
        <PageTransition type="fade" duration={300}>
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <ScrollReveal animation="slide-up" delay={0}>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gradient mb-4">
                  Pendaftaran SPV
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground mb-2">
                  Buka akses pembiayaan baru, percepat realisasi infrastruktur.
                  Partisipro membuka peluang bagi proyek Public-Private
                  Partnership (PPP) atau Kerja Sama Pemerintah dan Badan Usaha
                  (KPBU) untuk mendapatkan pembiayaan inovatif melalui
                  tokenisasi aset.
                </p>

                <p className="text-lg text-muted-foreground">
                  Jika Anda mewakili SPV, BUP, atau PJPK dan ingin menjangkau
                  investor ritel maupun institusi secara langsung dan
                  transparan, mulailah dari sini.
                </p>
              </div>
            </ScrollReveal>

            {/* Main Form */}
            <ScrollReveal animation="slide-up" delay={200}>
              <div className="glass-modern p-8 rounded-2xl">
                {renderProgressBar()}

                <div className="min-h-96">{renderCurrentStep()}</div>

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <AnimatedButton
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    ripple
                  >
                    Kembali
                  </AnimatedButton>

                  <div className="flex items-center space-x-2">
                    {Array.from({ length: totalSteps }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i + 1 <= currentStep
                            ? 'bg-primary-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {currentStep < totalSteps ? (
                    <AnimatedButton onClick={nextStep} ripple>
                      Selanjutnya
                    </AnimatedButton>
                  ) : (
                    <AnimatedButton
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      loading={isSubmitting}
                      ripple
                    >
                      Submit Application
                    </AnimatedButton>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
