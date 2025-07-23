/* eslint-disable no-case-declarations */
'use client';

// Force dynamic rendering for presentation mode compatibility
export const dynamic = 'force-dynamic';

import {
  useState,
  //  useEffect
} from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { ScrollReveal } from '@/components/ui/ScrollAnimations';
import { PageTransition } from '@/components/ui/PageTransition';
import { toast } from '@/components/ui/AnimatedNotification';
// import { useAuth } from '@/hooks/useAuth';
import { projectsService } from '@/services/projects.service';

interface ProjectFormData {
  // Basic Information
  projectName: string;
  projectType: string;
  location: string;
  description: string;
  pjpk: string;

  // Financial Parameters
  totalValue: number;
  tokenSupply: number;
  tokenPrice: number;
  minimumInvestment: number;

  // Timeline
  offeringStart: string;
  offeringEnd: string;
  projectStart: string;
  projectEnd: string;

  // Legal Documents
  businessPlan: File | null;
  feasibilityStudy: File | null;
  environmentalImpact: File | null;
  governmentApproval: File | null;

  // Revenue Model
  expectedAnnualRevenue: number;
  profitDistributionFrequency: string;
  managementFeePercentage: number;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function SPVCreatePage() {
  const router = useRouter();
  // const { isSPV, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: 'Jalan Tol Sumatera',
    projectType: 'Toll Road',
    location: 'Sumatera',
    description: 'Jalan Tol Lintas Sumatera',
    pjpk: 'Kementerian Pekerjaan Umum',
    totalValue: 1000000000000,
    tokenSupply: 100000000,
    tokenPrice: 5000,
    minimumInvestment: 100000,
    offeringStart: '2025-07-20',
    offeringEnd: '2025-07-30',
    projectStart: '2025-01-01',
    projectEnd: '2030-12-31',
    businessPlan: null,
    feasibilityStudy: null,
    environmentalImpact: null,
    governmentApproval: null,
    expectedAnnualRevenue: 50000000000,
    profitDistributionFrequency: 'semi-annually',
    managementFeePercentage: 5,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [listingFee, setListingFee] = useState<{
    amount: number;
    currency: 'IDR' | 'ETH';
    feePercentage: number;
    estimatedTotal: number;
    paymentMethods: string[];
  } | null>(null);
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<
    'pending' | 'processing' | 'completed' | 'failed'
  >('pending');

  // Check authentication and SPV role
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push('/auth?redirectTo=/spv/create');
  //     return;
  //   }
  //   if (isAuthenticated && !isSPV) {
  //     toast.error('Only SPVs can create projects');
  //     router.push('/dashboard');
  //   }
  // }, [isAuthenticated, isSPV, router]);

  // Show loading if not authenticated or checking user role
  // if (!isAuthenticated || (isAuthenticated && !isSPV)) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Checking permissions...</p>
  //       </div>
  //     </div>
  //   );
  // }

  const totalSteps = 5;
  const stepTitles = [
    'Basic Information',
    'Financial Parameters',
    'Timeline & Documentation',
    'Revenue Model & Review',
    'Listing Fee Payment',
  ];

  const projectTypes = [
    'Toll Road',
    'Airport',
    'Port',
    'Bridge',
    'Power Plant',
    'Water Treatment',
    'Hospital',
    'Education Facility',
    'Other Infrastructure',
  ];

  const updateFormData = (
    field: keyof ProjectFormData,
    value: string | number
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!formData.projectName)
          newErrors.projectName = 'Project name is required';
        if (!formData.projectType)
          newErrors.projectType = 'Project type is required';
        if (!formData.location) newErrors.location = 'Location is required';
        if (!formData.description)
          newErrors.description = 'Description is required';
        break;

      case 2:
        if (!formData.totalValue || formData.totalValue <= 0) {
          newErrors.totalValue = 'Total value must be greater than 0';
        }
        if (!formData.tokenSupply || formData.tokenSupply <= 0) {
          newErrors.tokenSupply = 'Token supply must be greater than 0';
        }
        if (!formData.tokenPrice || formData.tokenPrice <= 0) {
          newErrors.tokenPrice = 'Token price must be greater than 0';
        }
        if (!formData.minimumInvestment || formData.minimumInvestment <= 0) {
          newErrors.minimumInvestment =
            'Minimum investment must be greater than 0';
        }
        break;

      case 3:
        if (!formData.offeringStart)
          newErrors.offeringStart = 'Offering start date is required';
        if (!formData.offeringEnd)
          newErrors.offeringEnd = 'Offering end date is required';
        if (!formData.projectStart)
          newErrors.projectStart = 'Project start date is required';
        if (!formData.projectEnd)
          newErrors.projectEnd = 'Project end date is required';

        // Date validation
        const offeringStart = new Date(formData.offeringStart);
        const offeringEnd = new Date(formData.offeringEnd);
        const projectStart = new Date(formData.projectStart);
        const projectEnd = new Date(formData.projectEnd);

        if (offeringEnd <= offeringStart) {
          newErrors.offeringEnd = 'Offering end must be after start date';
        }
        // if (projectStart <= offeringEnd) {
        //   newErrors.projectStart = 'Project start must be after offering end';
        // }
        if (projectEnd <= projectStart) {
          newErrors.projectEnd = 'Project end must be after start date';
        }
        break;

      case 4:
        if (
          !formData.expectedAnnualRevenue ||
          formData.expectedAnnualRevenue <= 0
        ) {
          newErrors.expectedAnnualRevenue =
            'Expected annual revenue must be greater than 0';
        }
        break;

      case 5:
        if (!selectedPaymentMethod) {
          newErrors.selectedPaymentMethod = 'Please select a payment method';
        }
        if (!listingFee) {
          newErrors.listingFee = 'Listing fee calculation is required';
        }
        if (paymentStatus !== 'completed') {
          newErrors.paymentStatus = 'Listing fee payment must be completed';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const newStep = Math.min(currentStep + 1, totalSteps);
      setCurrentStep(newStep);

      // Calculate listing fee when entering step 5
      if (newStep === 5) {
        calculateListingFee();
      }

      if (typeof window !== 'undefined') {
        window.scroll({ top: 0 });
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const calculateListingFee = async () => {
    if (!formData.totalValue || !formData.tokenSupply || !formData.tokenPrice) {
      toast.error('Please complete all financial parameters first');
      return;
    }

    setIsLoadingFee(true);
    try {
      const feeData = await projectsService.getListingFee({
        totalSupply: formData.tokenSupply,
        tokenPrice: formData.tokenPrice,
        currency: 'IDR',
      });

      setListingFee(feeData);
      if (feeData.paymentMethods.length > 0) {
        setSelectedPaymentMethod(feeData.paymentMethods[0]);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to calculate listing fee: ${errorMessage}`);
    } finally {
      setIsLoadingFee(false);
    }
  };

  const processListingFeePayment = async () => {
    if (!listingFee || !selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setPaymentStatus('processing');
    try {
      // Create project first to get projectId
      const projectData = {
        name: formData.projectName,
        description: formData.description,
        totalSupply: formData.tokenSupply,
        tokenPrice: formData.tokenPrice,
        currency: 'IDR' as const,
        minimumInvestment: formData.minimumInvestment,
        maximumInvestment: formData.totalValue,
        offeringStartDate: formData.offeringStart,
        offeringEndDate: formData.offeringEnd,
        projectType: formData.projectType,
        location: formData.location,
        expectedReturn:
          (formData.expectedAnnualRevenue / formData.totalValue) * 100,
        riskLevel: 'medium' as const,
      };

      const createdProject = await projectsService.createProject(projectData);

      // Process payment
      const paymentResult = await projectsService.payListingFee(
        createdProject.id,
        {
          amount: listingFee.amount,
          currency: listingFee.currency,
          paymentMethod: selectedPaymentMethod,
          paymentReference: `project-${createdProject.id}-${Date.now()}`,
        }
      );

      if (paymentResult.status === 'confirmed') {
        setPaymentStatus('completed');
        toast.success('Listing fee payment completed successfully!');
      } else {
        setPaymentStatus('failed');
        toast.error('Payment failed. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setPaymentStatus('failed');
      toast.error(`Payment failed: ${errorMessage}`);
    }
  };

  const handleFileUpload = (
    field: keyof ProjectFormData,
    file: File | null
  ) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const submitProject = async () => {
    if (!validateStep(currentStep)) return;

    // Check if payment has been completed
    if (paymentStatus !== 'completed') {
      toast.error('Please complete the listing fee payment first');
      return;
    }

    setIsSubmitting(true);

    try {
      // Project has already been created in the payment step
      // We just need to finalize it by uploading any remaining documents
      // and deploying contracts

      // Note: In a real implementation, we would get the project ID from the payment step
      // For now, we'll simulate completion

      toast.success('Project finalized successfully!');

      // Redirect to SPV dashboard
      router.push('/spv/dashboard');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Project creation failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <ScrollReveal animation="slide-up" delay={100}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gradient mb-3">
            Basic Project Information
          </h2>
          <p className="text-muted-foreground">
            Provide the fundamental details about your infrastructure project.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal animation="slide-up" delay={200}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="md:col-span-2">
            <AnimatedInput
              id="projectName"
              label="Nama Proyek Lengkap"
              value={formData.projectName}
              onChange={e => updateFormData('projectName', e.target.value)}
              placeholder="e.g., Jakarta-Bandung High-Speed Rail"
              error={errors.projectName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-3">
              Sektor Proyek
            </label>
            <select
              value={formData.projectType}
              onChange={e => updateFormData('projectType', e.target.value)}
              className={`w-full px-4 py-3 border border-primary-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 hover-glow transition-all ${
                errors.projectType ? 'border-error-500' : ''
              }`}
            >
              <option value="">Select project type</option>
              {projectTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.projectType && (
              <p className="mt-1 text-sm text-error-600">
                {errors.projectType}
              </p>
            )}
          </div>

          <div>
            <AnimatedInput
              id="location"
              label="Location"
              value={formData.location}
              onChange={e => updateFormData('location', e.target.value)}
              placeholder="e.g., Jakarta, Indonesia"
              error={errors.location}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary-700 mb-3">
              Project Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => updateFormData('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 border border-primary-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 hover-glow transition-all resize-none ${
                errors.description ? 'border-error-500' : ''
              }`}
              placeholder="Provide a detailed description of the project, its purpose, and expected impact..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error-600">
                {errors.description}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <AnimatedInput
              id="projectPJPK"
              label="Nama Penanggung Jawab Proyek Kerja Sama"
              value={formData.pjpk}
              onChange={e => updateFormData('pjpk', e.target.value)}
              placeholder="e.g., Kementerian PUPR"
              error={errors.pjpk}
            />
          </div>
        </div>
      </ScrollReveal>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gradient mb-3">
          Financial Parameters
        </h2>
        <p className="text-muted-foreground">
          Define the tokenization structure and investment parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <AnimatedInput
            id="totalValue"
            label="Total Project Value (IDR)"
            type="number"
            value={formData.totalValue || ''}
            onChange={e =>
              updateFormData('totalValue', parseFloat(e.target.value) || 0)
            }
            placeholder="1000000000"
            error={errors.totalValue}
          />
        </div>

        <div>
          <AnimatedInput
            id="tokenSupply"
            label="Total Token Supply"
            type="number"
            value={formData.tokenSupply || ''}
            onChange={e =>
              updateFormData('tokenSupply', parseFloat(e.target.value) || 0)
            }
            placeholder="1000000"
            error={errors.tokenSupply}
          />
        </div>

        <div>
          <AnimatedInput
            id="tokenPrice"
            label="Token Price (IDR)"
            type="number"
            value={formData.tokenPrice || ''}
            onChange={e =>
              updateFormData('tokenPrice', parseFloat(e.target.value) || 0)
            }
            placeholder="1000"
            error={errors.tokenPrice}
          />
        </div>

        <div>
          <AnimatedInput
            id="minimumInvestment"
            label="Minimum Investment (IDR)"
            type="number"
            value={formData.minimumInvestment || ''}
            onChange={e =>
              updateFormData(
                'minimumInvestment',
                parseFloat(e.target.value) || 0
              )
            }
            placeholder="100000"
            error={errors.minimumInvestment}
          />
        </div>
      </div>

      {/* Calculation Summary */}
      {formData.totalValue > 0 && formData.tokenSupply > 0 && (
        <div className="glass-modern rounded-2xl p-6 border border-primary-200">
          <h3 className="text-xl font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">💰</span>
            </div>
            Tokenization Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-primary-600 text-sm font-medium">
                Total Fundraising Target:
              </span>
              <p className="text-xl font-bold text-gradient">
                IDR{' '}
                {(formData.tokenSupply * formData.tokenPrice).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-primary-600 text-sm font-medium">
                Funding Percentage:
              </span>
              <p className="text-xl font-bold text-gradient">
                {(
                  ((formData.tokenSupply * formData.tokenPrice) /
                    formData.totalValue) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gradient mb-3">
          Timeline & Documentation
        </h2>
        <p className="text-muted-foreground">
          Set project timeline and upload required legal documents.
        </p>
      </div>

      {/* Timeline */}
      <div className="glass-modern rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs">📅</span>
          </div>
          Project Timeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <AnimatedInput
              id="offeringStart"
              label="Token Offering Start Date"
              type="date"
              value={formData.offeringStart}
              onChange={e => updateFormData('offeringStart', e.target.value)}
              error={errors.offeringStart}
            />
          </div>

          <div>
            <AnimatedInput
              id="offeringEnd"
              label="Token Offering End Date"
              type="date"
              value={formData.offeringEnd}
              onChange={e => updateFormData('offeringEnd', e.target.value)}
              error={errors.offeringEnd}
            />
          </div>

          <div>
            <AnimatedInput
              id="projectStart"
              label="Project Operation Start"
              type="date"
              value={formData.projectStart}
              onChange={e => updateFormData('projectStart', e.target.value)}
              error={errors.projectStart}
            />
          </div>

          <div>
            <AnimatedInput
              id="projectEnd"
              label="Project Operation End"
              type="date"
              value={formData.projectEnd}
              onChange={e => updateFormData('projectEnd', e.target.value)}
              error={errors.projectEnd}
            />
          </div>
        </div>
      </div>

      {/* Document Upload */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-primary-800 flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-support-500 to-support-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs">📄</span>
          </div>
          Required Documents
        </h3>

        <div className="grid gap-4">
          {[
            { key: 'businessPlan', label: 'Business Plan', required: true },
            {
              key: 'feasibilityStudy',
              label: 'Feasibility Study',
              required: true,
            },
            {
              key: 'environmentalImpact',
              label: 'Environmental Impact Assessment',
              required: false,
            },
            {
              key: 'governmentApproval',
              label: 'Government Approval Letter',
              required: true,
            },
          ].map(doc => (
            <div
              key={doc.key}
              className="glass-modern rounded-xl p-6 hover-lift transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-semibold text-primary-700">
                  {doc.label}{' '}
                  {doc.required && <span className="text-error-500">*</span>}
                </label>
                {formData[doc.key as keyof ProjectFormData] && (
                  <span className="text-sm text-success-600 flex items-center gap-1">
                    <div className="w-4 h-4 bg-success-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    Uploaded
                  </span>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e =>
                  handleFileUpload(
                    doc.key as keyof ProjectFormData,
                    e.target.files?.[0] || null
                  )
                }
                className="w-full text-sm text-primary-600 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 file:transition-all file:hover-lift cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gradient mb-3">
          Revenue Model & Final Review
        </h2>
        <p className="text-muted-foreground">
          Define profit distribution parameters and review all project details.
        </p>
      </div>

      {/* Revenue Model */}
      <div className="glass-modern rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs">📈</span>
          </div>
          Revenue Model
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-3">
              Expected Annual Revenue (IDR)
            </label>
            <AnimatedInput
              id="expectedAnnualRevenue"
              label="Expected Annual Revenue"
              type="number"
              value={formData.expectedAnnualRevenue || ''}
              onChange={e =>
                updateFormData(
                  'expectedAnnualRevenue',
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="500000000"
              error={errors.expectedAnnualRevenue}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-primary-700">
              Profit Distribution Frequency
            </label>
            <select
              value={formData.profitDistributionFrequency}
              onChange={e =>
                updateFormData('profitDistributionFrequency', e.target.value)
              }
              className="w-full px-4 py-3 border border-primary-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 hover-glow transition-all"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi-annually">Semi-Annually</option>
              <option value="annually">Annually</option>
            </select>
          </div>

          {/* <div>
            <AnimatedInput
              id="platformFee"
              label="Platform Management Fee (%)"
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={formData.managementFeePercentage || ''}
              onChange={e =>
                updateFormData(
                  'managementFeePercentage',
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="5"
            />
          </div> */}
        </div>
      </div>

      {/* Project Summary */}
      <div className="glass-feature rounded-2xl p-8 hover-lift">
        <h3 className="text-xl font-bold text-gradient mb-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm">🏗️</span>
          </div>
          Project Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <span className="text-primary-600 text-sm font-medium">
              Project Name:
            </span>
            <p className="font-semibold text-primary-800">
              {formData.projectName || 'Not specified'}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-primary-600 text-sm font-medium">Type:</span>
            <p className="font-semibold text-primary-800">
              {formData.projectType || 'Not specified'}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-primary-600 text-sm font-medium">
              Location:
            </span>
            <p className="font-semibold text-primary-800">
              {formData.location || 'Not specified'}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-primary-600 text-sm font-medium">
              Total Value:
            </span>
            <p className="font-bold text-gradient">
              IDR {formData.totalValue.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-primary-600 text-sm font-medium">
              Token Supply:
            </span>
            <p className="font-bold text-gradient">
              {formData.tokenSupply.toLocaleString()} tokens
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-primary-600 text-sm font-medium">
              Token Price:
            </span>
            <p className="font-bold text-gradient">
              IDR {formData.tokenPrice.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-primary-600 text-sm font-medium">
              Expected Annual Revenue:
            </span>
            <p className="font-bold text-gradient">
              IDR {formData.expectedAnnualRevenue.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-primary-600 text-sm font-medium">
              Distribution Frequency:
            </span>
            <p className="font-semibold text-primary-800 capitalize">
              {formData.profitDistributionFrequency}
            </p>
          </div>
          {/* <div className="space-y-2">
            <span className="text-primary-600 text-sm font-medium">
              Management Fee:
            </span>
            <p className="font-semibold text-primary-800">
              {formData.managementFeePercentage}%
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gradient mb-3">
          Listing Fee Payment
        </h2>
        <p className="text-muted-foreground">
          Complete the listing fee payment to finalize your project creation.
        </p>
      </div>

      {/* Fee Calculation */}
      <div className="glass-feature rounded-2xl p-8 hover-lift">
        <h3 className="text-xl font-bold text-gradient mb-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm">💳</span>
          </div>
          Fee Calculation
        </h3>

        {isLoadingFee ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 gradient-brand-hero rounded-xl flex items-center justify-center animate-float">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
            <span className="ml-4 text-primary-600 font-medium">
              Calculating fee...
            </span>
          </div>
        ) : listingFee ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-modern rounded-xl p-4 space-y-2">
                <span className="text-primary-600 text-sm font-medium">
                  Project Value:
                </span>
                <p className="text-lg font-bold text-primary-800">
                  IDR {formData.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="glass-modern rounded-xl p-4 space-y-2">
                <span className="text-primary-600 text-sm font-medium">
                  Fee Rate:
                </span>
                <p className="text-lg font-bold text-primary-800">
                  {listingFee.feePercentage}%
                </p>
              </div>
            </div>

            <div className="border-t border-primary-200 pt-6">
              <div className="flex justify-between items-center glass-modern rounded-xl p-6">
                <span className="text-xl font-bold text-primary-800">
                  Total Listing Fee:
                </span>
                <p className="text-3xl font-bold text-gradient">
                  {listingFee.currency} {listingFee.amount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-error-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-error-500 text-2xl">⚠️</span>
            </div>
            <p className="text-primary-600 mb-4">
              Fee calculation failed. Please try again.
            </p>
            <AnimatedButton
              onClick={calculateListingFee}
              variant="outline"
              ripple
            >
              Recalculate Fee
            </AnimatedButton>
          </div>
        )}
      </div>

      {/* Payment Method Selection */}
      {listingFee && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-primary-800 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">💰</span>
            </div>
            Select Payment Method
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listingFee.paymentMethods.map(method => (
              <div key={method}>
                <label className="block cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={selectedPaymentMethod === method}
                    onChange={e => setSelectedPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`glass-modern rounded-xl p-6 hover-lift transition-all duration-300 border-2 ${
                      selectedPaymentMethod === method
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-transparent hover:border-primary-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === method
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-secondary-300'
                        }`}
                      >
                        {selectedPaymentMethod === method && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-primary-800">
                          {method}
                        </p>
                        <p className="text-sm text-primary-600">
                          {method === 'ETH'
                            ? 'Ethereum Payment'
                            : 'Indonesian Rupiah'}
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {errors.selectedPaymentMethod && (
            <p className="text-sm text-error-600">
              {errors.selectedPaymentMethod}
            </p>
          )}
        </div>
      )}

      {/* Payment Status */}
      {listingFee && selectedPaymentMethod && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-primary-800 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-support-500 to-support-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">📊</span>
            </div>
            Payment Status
          </h3>

          <div className="glass-feature rounded-2xl p-6">
            <div className="flex items-center space-x-4 mb-6">
              {paymentStatus === 'pending' && (
                <div className="w-6 h-6 bg-secondary-400 rounded-full"></div>
              )}
              {paymentStatus === 'processing' && (
                <div className="w-6 h-6 bg-warning-400 rounded-full animate-pulse"></div>
              )}
              {paymentStatus === 'completed' && (
                <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              {paymentStatus === 'failed' && (
                <div className="w-6 h-6 bg-error-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✕</span>
                </div>
              )}

              <span className="text-lg font-semibold text-primary-800">
                {paymentStatus === 'pending' && 'Ready to Pay'}
                {paymentStatus === 'processing' && 'Processing Payment...'}
                {paymentStatus === 'completed' && 'Payment Completed'}
                {paymentStatus === 'failed' && 'Payment Failed'}
              </span>
            </div>

            {paymentStatus === 'pending' && (
              <AnimatedButton
                onClick={processListingFeePayment}
                disabled={!selectedPaymentMethod}
                className="w-full"
                ripple
              >
                Pay Listing Fee
              </AnimatedButton>
            )}

            {paymentStatus === 'failed' && (
              <AnimatedButton
                onClick={processListingFeePayment}
                variant="outline"
                className="w-full"
                ripple
              >
                Retry Payment
              </AnimatedButton>
            )}

            {paymentStatus === 'completed' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-success-500 text-2xl">✅</span>
                </div>
                <p className="text-success-600 font-medium">
                  Payment completed successfully! You can now finalize your
                  project.
                </p>
              </div>
            )}
          </div>

          {errors.paymentStatus && (
            <p className="text-sm text-error-600">{errors.paymentStatus}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-8">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <PageTransition type="fade" duration={300}>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          {/* Header */}
          <ScrollReveal animation="slide-up" delay={0}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gradient mb-3">
                Create New Project
              </h1>
              <p className="text-muted-foreground">
                Tokenize your infrastructure project for public-private
                partnership funding
              </p>
            </div>
          </ScrollReveal>

          {/* Progress Bar */}
          <ScrollReveal animation="slide-up" delay={200}>
            <div className="glass-feature rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                {stepTitles.map((title, index) => (
                  <div key={index} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 hover-scale ${
                          index + 1 === currentStep
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg'
                            : index + 1 < currentStep
                              ? 'bg-gradient-to-br from-success-500 to-success-600 text-white shadow-lg'
                              : 'bg-secondary-200 text-secondary-600'
                        }`}
                      >
                        {index + 1 < currentStep ? '✓' : index + 1}
                      </div>
                      <span
                        className={`text-xs mt-2 font-medium text-center max-w-20 ${
                          index + 1 === currentStep
                            ? 'text-primary-700'
                            : index + 1 < currentStep
                              ? 'text-success-700'
                              : 'text-secondary-600'
                        }`}
                      >
                        {title}
                      </span>
                    </div>
                    {index < stepTitles.length - 1 && (
                      <div className="flex-1 px-4">
                        <div className="h-1 bg-secondary-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              index + 1 < currentStep
                                ? 'bg-gradient-to-r from-success-500 to-success-600 w-full'
                                : 'w-0'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <p className="text-sm text-primary-600 font-medium">
                  Step {currentStep} of {totalSteps}:{' '}
                  {stepTitles[currentStep - 1]}
                </p>
                <div className="w-full bg-secondary-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Form */}
          <ScrollReveal animation="slide-up" delay={300}>
            <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}

              {/* Navigation */}
              <div className="flex justify-between pt-8">
                <AnimatedButton
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  variant="outline"
                  ripple
                >
                  Previous
                </AnimatedButton>

                {currentStep < totalSteps ? (
                  <AnimatedButton onClick={nextStep} ripple>
                    Next
                  </AnimatedButton>
                ) : (
                  <AnimatedButton
                    onClick={submitProject}
                    disabled={isSubmitting || paymentStatus !== 'completed'}
                    loading={isSubmitting}
                    ripple
                  >
                    {isSubmitting
                      ? 'Finalizing Project...'
                      : 'Finalize Project'}
                  </AnimatedButton>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </PageTransition>
    </div>
  );
}
