/* eslint-disable no-case-declarations */
'use client';

// Force dynamic rendering for presentation mode compatibility
export const dynamic = 'force-dynamic';

import {
  useState,
  //  useEffect
} from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { ScrollReveal } from '@/components/ui/ScrollAnimations';
import { PageTransition } from '@/components/ui/PageTransition';
import { toast, ToastProvider } from '@/components/ui/AnimatedNotification';
// import { useAuth } from '@/hooks/useAuth';
// import { projectsService } from '@/services/projects.service';

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
  const { t } = useTranslation('common');
  const router = useRouter();
  // const { isSPV, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: 'Jalan Tol Sumatera',
    projectType: 'Infrastruktur Jalan dan Jembatan',
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

  // Step 5 responsibility checkboxes
  const [responsibilitiesAccepted, setResponsibilitiesAccepted] =
    useState(false);
  const [feeAgreementAccepted, setFeeAgreementAccepted] = useState(false);
  const [legalComplianceAccepted, setLegalComplianceAccepted] = useState(false);

  // Contract deployment states
  const [isDeployingContracts, setIsDeployingContracts] = useState(false);
  const [deploymentStage, setDeploymentStage] = useState(0);
  const [deploymentStages] = useState([
    {
      name: 'Preparing deployment parameters...',
      description:
        'Validating project data and preparing smart contract parameters',
      duration: 2000,
    },
    {
      name: 'Deploying ProjectToken contract...',
      description:
        'Creating ERC-3643 compliant token contract with identity verification',
      duration: 3000,
    },
    {
      name: 'Deploying ProjectOffering contract...',
      description: 'Setting up token sale contract with KYC requirements',
      duration: 2500,
    },
    {
      name: 'Deploying ProjectTreasury contract...',
      description: 'Creating treasury for profit distribution management',
      duration: 2000,
    },
    {
      name: 'Deploying ProjectGovernance contract...',
      description: 'Setting up token holder voting and governance system',
      duration: 2500,
    },
    {
      name: 'Configuring contract permissions...',
      description:
        'Setting up role-based access control and contract interactions',
      duration: 2000,
    },
    {
      name: 'Finalizing deployment...',
      description: 'Verifying contracts and completing setup process',
      duration: 1500,
    },
  ]);

  // const [listingFee, setListingFee] = useState<{
  //   amount: number;
  //   currency: 'IDR' | 'ETH';
  //   feePercentage: number;
  //   estimatedTotal: number;
  //   paymentMethods: string[];
  // } | null>(null);
  // const [isLoadingFee, setIsLoadingFee] = useState(false);
  // const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  // const [paymentStatus, setPaymentStatus] = useState<
  //   'pending' | 'processing' | 'completed' | 'failed'
  // >('pending');

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

  const totalSteps = 6;
  const stepTitles = [
    'Basic Information',
    'Financial Parameters',
    'Timeline and Documents',
    'Revenue Model',
    'Final Review for Approval',
    'Smart Contracts',
  ];

  const projectTypes = [
    'Infrastruktur Jalan dan Jembatan',
    'Infrastruktur Air dan Sanitasi',
    'Infrastruktur Kesehatan',
    'Infrastruktur Energi',
    'Infrastruktur Telekomunikasi',
    'Lainnya',
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
        if (!responsibilitiesAccepted) {
          newErrors.responsibilitiesAccepted =
            'Please accept project management responsibilities';
        }
        if (!feeAgreementAccepted) {
          newErrors.feeAgreementAccepted =
            'Please accept the listing fee agreement';
        }
        if (!legalComplianceAccepted) {
          newErrors.legalComplianceAccepted =
            'Please accept legal compliance requirements';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (validateStep(currentStep)) {
      const newStep = Math.min(currentStep + 1, totalSteps);
      setCurrentStep(newStep);

      // Simulate smart contract deployment when moving from step 5 to step 6
      if (newStep === 6) {
        await deploySmartContracts();
      }

      if (typeof window !== 'undefined') {
        window.scroll({ top: 0 });
      }
    }
  };

  // Smart contract deployment simulation with realistic loading stages
  const deploySmartContracts = async () => {
    setIsDeployingContracts(true);
    setDeploymentStage(0);
    toast.info('Starting smart contract deployment...');

    // Execute each deployment stage with realistic timing
    for (let i = 0; i < deploymentStages.length; i++) {
      setDeploymentStage(i);

      // Show progress toast for current stage
      toast.info(deploymentStages[i].name);

      // Wait for the stage duration
      await new Promise(resolve =>
        setTimeout(resolve, deploymentStages[i].duration)
      );
    }

    // Deployment complete
    setIsDeployingContracts(false);
    toast.success('🎉 Smart contracts deployed successfully!');
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // const calculateListingFee = async () => {
  //   if (!formData.totalValue || !formData.tokenSupply || !formData.tokenPrice) {
  //     toast.error('Please complete all financial parameters first');
  //     return;
  //   }

  //   setIsLoadingFee(true);
  //   try {
  //     const feeData = await projectsService.getListingFee({
  //       totalSupply: formData.tokenSupply,
  //       tokenPrice: formData.tokenPrice,
  //       currency: 'IDR',
  //     });

  //     setListingFee(feeData);
  //     if (feeData.paymentMethods.length > 0) {
  //       setSelectedPaymentMethod(feeData.paymentMethods[0]);
  //     }
  //   } catch (error: unknown) {
  //     const errorMessage =
  //       error instanceof Error ? error.message : 'Unknown error';
  //     toast.error(`Failed to calculate listing fee: ${errorMessage}`);
  //   } finally {
  //     setIsLoadingFee(false);
  //   }
  // };

  // const processListingFeePayment = async () => {
  //   if (!listingFee || !selectedPaymentMethod) {
  //     toast.error('Please select a payment method');
  //     return;
  //   }

  //   setPaymentStatus('processing');
  //   try {
  //     // Create project first to get projectId
  //     const projectData = {
  //       name: formData.projectName,
  //       description: formData.description,
  //       totalSupply: formData.tokenSupply,
  //       tokenPrice: formData.tokenPrice,
  //       currency: 'IDR' as const,
  //       minimumInvestment: formData.minimumInvestment,
  //       maximumInvestment: formData.totalValue,
  //       offeringStartDate: formData.offeringStart,
  //       offeringEndDate: formData.offeringEnd,
  //       projectType: formData.projectType,
  //       location: formData.location,
  //       expectedReturn:
  //         (formData.expectedAnnualRevenue / formData.totalValue) * 100,
  //       riskLevel: 'medium' as const,
  //     };

  //     const createdProject = await projectsService.createProject(projectData);

  //     // Process payment
  //     const paymentResult = await projectsService.payListingFee(
  //       createdProject.id,
  //       {
  //         amount: listingFee.amount,
  //         currency: listingFee.currency,
  //         paymentMethod: selectedPaymentMethod,
  //         paymentReference: `project-${createdProject.id}-${Date.now()}`,
  //       }
  //     );

  //     if (paymentResult.status === 'confirmed') {
  //       setPaymentStatus('completed');
  //       toast.success('Listing fee payment completed successfully!');
  //     } else {
  //       setPaymentStatus('failed');
  //       toast.error('Payment failed. Please try again.');
  //     }
  //   } catch (error: unknown) {
  //     const errorMessage =
  //       error instanceof Error ? error.message : 'Unknown error';
  //     setPaymentStatus('failed');
  //     toast.error(`Payment failed: ${errorMessage}`);
  //   }
  // };

  const handleFileUpload = (
    field: keyof ProjectFormData,
    file: File | null
  ) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // const submitProject = async () => {
  //   if (!validateStep(currentStep)) return;

  //   // Check if payment has been completed
  //   // if (paymentStatus !== 'completed') {
  //   //   toast.error('Please complete the listing fee payment first');
  //   //   return;
  //   // }

  //   setIsSubmitting(true);

  //   try {
  //     // Project has already been created in the payment step
  //     // We just need to finalize it by uploading any remaining documents
  //     // and deploying contracts

  //     // Note: In a real implementation, we would get the project ID from the payment step
  //     // For now, we'll simulate completion

  //     setTimeout(() => {
  //       toast.success('Project finalized successfully!');
  //     }, 300);

  //     setTimeout(() => {
  //       // Redirect to SPV dashboard
  //       router.push('/spv/dashboard');
  //     }, 2000);
  //   } catch (error: unknown) {
  //     const errorMessage =
  //       error instanceof Error
  //         ? error.message
  //         : 'Project creation failed. Please try again.';
  //     toast.error(errorMessage);
  //   } finally {
  //     // setIsSubmitting(false);
  //   }
  // };

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

  const renderStep5 = () => {
    const estimatedFundraising = formData.tokenSupply * formData.tokenPrice;
    const estimatedListingFee = estimatedFundraising * 0.005; // 0.5%

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gradient mb-3">
            Final Review & Responsibilities
          </h2>
          <p className="text-muted-foreground">
            Review your responsibilities and understand the listing fee
            structure before smart contract deployment.
          </p>
        </div>

        {/* Listing Fee Information */}
        <div className="glass-feature rounded-2xl p-8 hover-lift">
          <h3 className="text-xl font-bold text-gradient mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm">💳</span>
            </div>
            Listing Fee Consent
          </h3>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">ℹ️</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-primary-800 mb-2">
                    Important: Listing Fee Payment
                  </h4>
                  <p className="text-primary-700 text-sm leading-relaxed">
                    You will be required to pay a{' '}
                    <strong>listing fee of 0.5%</strong> after the offering
                    period ends. The 0.5% will be calculated based on the actual
                    fund-raising achieved during the offering period.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-modern rounded-xl p-4 space-y-2">
                <span className="text-primary-600 text-sm font-medium">
                  Estimated Fundraising Target:
                </span>
                <p className="text-lg font-bold text-primary-800">
                  IDR {estimatedFundraising.toLocaleString()}
                </p>
              </div>
              <div className="glass-modern rounded-xl p-4 space-y-2">
                <span className="text-primary-600 text-sm font-medium">
                  Estimated Listing Fee (0.5%):
                </span>
                <p className="text-lg font-bold text-gradient">
                  IDR {estimatedListingFee.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
              <p className="text-warning-800 text-sm">
                <strong>Note:</strong> The actual listing fee will be calculated
                based on the total funds raised, not the estimated target. You
                will receive an invoice after the offering period concludes.
              </p>
            </div>
          </div>
        </div>

        {/* SPV Responsibilities */}
        <div className="glass-modern rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">📋</span>
            </div>
            SPV Responsibilities & Commitments
          </h3>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={responsibilitiesAccepted}
                onChange={e => setResponsibilitiesAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-primary-600 border-2 border-primary-300 rounded focus:ring-primary-500"
              />
              <div className="text-primary-700">
                <p className="text-sm font-medium mb-1">
                  Project Management & Operations
                </p>
                <p className="text-sm">
                  I understand and accept full responsibility for managing the
                  infrastructure project, ensuring compliance with all
                  government regulations, and delivering the promised returns to
                  token holders.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={feeAgreementAccepted}
                onChange={e => setFeeAgreementAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-primary-600 border-2 border-primary-300 rounded focus:ring-primary-500"
              />
              <div className="text-primary-700">
                <p className="text-sm font-medium mb-1">
                  Fee Payment Agreement
                </p>
                <p className="text-sm">
                  I agree to pay the 0.5% listing fee calculated based on the
                  actual funds raised during the offering period. Payment is due
                  within 30 days after the offering period ends.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={legalComplianceAccepted}
                onChange={e => setLegalComplianceAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-primary-600 border-2 border-primary-300 rounded focus:ring-primary-500"
              />
              <div className="text-sm text-primary-700">
                <p className="text-sm font-medium mb-1">
                  Legal Compliance & Reporting
                </p>
                <p className="text-sm">
                  I commit to maintaining accurate financial records, providing
                  regular project updates to investors, and ensuring full
                  compliance with Indonesian PPP regulations and blockchain
                  securities laws.
                </p>
              </div>
            </label>
          </div>

          {(!responsibilitiesAccepted ||
            !feeAgreementAccepted ||
            !legalComplianceAccepted) && (
            <div className="bg-error-50 border border-error-200 rounded-xl p-4 mt-4">
              <p className="text-error-800 text-sm font-medium">
                Please accept all responsibilities and agreements before
                proceeding to smart contract deployment.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep6 = () => {
    // Mock contract addresses for demonstration (these would come from actual deployment)
    const contractAddresses = {
      projectToken: '0x1f8Fb3846541571a5E3ed05f311d4695f02dc8Cd',
      projectOffering: '0x445b8Aa90eA5d2E80916Bc0f8ACc150d9b91634F',
      projectTreasury: '0x6662D1f5103dB37Cb72dE44b016c240167c44c35',
      projectGovernance: '0x1abd0E1e64258450e8F74f43Bc1cC47bfE6Efa23',
    };

    const arbitrumSepoliaExplorer = 'https://sepolia.arbiscan.io';

    // Show loading animation during deployment
    if (isDeployingContracts) {
      const currentStage = deploymentStages[deploymentStage];
      const progress = ((deploymentStage + 1) / deploymentStages.length) * 100;

      return (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gradient mb-3">
              Deploying Smart Contracts
            </h2>
            <p className="text-muted-foreground">
              Please wait while we deploy your project&apos;s smart contracts to
              Arbitrum Sepolia testnet.
            </p>
          </div>

          {/* Deployment Progress */}
          <div className="glass-feature rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
              </div>

              <h3 className="text-xl font-semibold text-primary-800 mb-2">
                {currentStage.name}
              </h3>
              <p className="text-muted-foreground mb-6">
                {currentStage.description}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-secondary-200 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-primary-600 font-medium">
                Step {deploymentStage + 1} of {deploymentStages.length} (
                {progress.toFixed(0)}%)
              </p>
            </div>

            {/* Deployment Stages List */}
            <div className="space-y-3">
              {deploymentStages.map((stage, index) => {
                const isCompleted = index < deploymentStage;
                const isCurrent = index === deploymentStage;
                // const isPending = index > deploymentStage;

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                      isCompleted
                        ? 'bg-success-50 border border-success-200'
                        : isCurrent
                          ? 'bg-primary-50 border border-primary-300 animate-pulse'
                          : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCompleted
                          ? 'bg-success-500 text-white'
                          : isCurrent
                            ? 'bg-primary-500 text-white animate-pulse'
                            : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <h4
                        className={`text-lg font-medium ${
                          isCompleted
                            ? 'text-success-700'
                            : isCurrent
                              ? 'text-primary-700'
                              : 'text-gray-600'
                        }`}
                      >
                        {stage.name.replace('...', '')}
                      </h4>
                      <p
                        className={`text-sm ${
                          isCompleted
                            ? 'text-success-600'
                            : isCurrent
                              ? 'text-primary-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {stage.description}
                      </p>
                    </div>
                    {isCurrent && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Warning Message */}
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mt-6">
              <p className="text-warning-800 text-sm">
                <strong>Please do not close this page</strong> during
                deployment. The process takes approximately 15-20 seconds to
                complete.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Show success page after deployment completes
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gradient mb-3">
            Smart Contract Deployment Success
          </h2>
          <p className="text-muted-foreground">
            Your project&apos;s smart contracts have been successfully deployed
            to Arbitrum Sepolia testnet.
          </p>
        </div>

        {/* Success Message */}
        <div className="glass-feature rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-success-500 text-4xl">🎉</span>
          </div>
          <h3 className="text-2xl font-bold text-success-700 mb-3">
            Deployment Successful!
          </h3>
          <p className="text-success-600 mb-6">
            Your project <strong>{formData.projectName}</strong> has been
            tokenized and is ready for investors.
          </p>
          <div className="bg-success-50 border border-success-200 rounded-xl p-4">
            <p className="text-success-800 text-sm">
              <strong>Next Steps:</strong> Your project will be visible to
              investors once the offering period begins. You can monitor
              investor participation and manage your project from the SPV
              dashboard.
            </p>
          </div>
        </div>

        {/* Contract Addresses */}
        <div className="glass-modern rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-support-500 to-support-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">📄</span>
            </div>
            Smart Contract Addresses
          </h3>

          <div className="grid gap-4">
            <div className="glass-modern rounded-xl p-4 hover-lift transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-primary-700">
                  Project Token Contract
                </span>
                <a
                  href={`${arbitrumSepoliaExplorer}/address/${contractAddresses.projectToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-support-600 hover:text-support-700 text-xs font-medium hover:underline flex items-center gap-1"
                >
                  View on Arbiscan
                  <span className="text-xs">↗</span>
                </a>
              </div>
              <p className="font-mono text-sm text-primary-900 bg-primary-50 px-3 py-2 rounded border">
                {contractAddresses.projectToken}
              </p>
            </div>

            <div className="glass-modern rounded-xl p-4 hover-lift transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-primary-700">
                  Token Offering Contract
                </span>
                <a
                  href={`${arbitrumSepoliaExplorer}/address/${contractAddresses.projectOffering}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-support-600 hover:text-support-700 text-xs font-medium hover:underline flex items-center gap-1"
                >
                  View on Arbiscan
                  <span className="text-xs">↗</span>
                </a>
              </div>
              <p className="font-mono text-sm text-primary-900 bg-primary-50 px-3 py-2 rounded border">
                {contractAddresses.projectOffering}
              </p>
            </div>

            <div className="glass-modern rounded-xl p-4 hover-lift transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-primary-700">
                  Project Treasury Contract
                </span>
                <a
                  href={`${arbitrumSepoliaExplorer}/address/${contractAddresses.projectTreasury}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-support-600 hover:text-support-700 text-xs font-medium hover:underline flex items-center gap-1"
                >
                  View on Arbiscan
                  <span className="text-xs">↗</span>
                </a>
              </div>
              <p className="font-mono text-sm text-primary-900 bg-primary-50 px-3 py-2 rounded border">
                {contractAddresses.projectTreasury}
              </p>
            </div>

            <div className="glass-modern rounded-xl p-4 hover-lift transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-primary-700">
                  Governance Contract
                </span>
                <a
                  href={`${arbitrumSepoliaExplorer}/address/${contractAddresses.projectGovernance}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-support-600 hover:text-support-700 text-xs font-medium hover:underline flex items-center gap-1"
                >
                  View on Arbiscan
                  <span className="text-xs">↗</span>
                </a>
              </div>
              <p className="font-mono text-sm text-primary-900 bg-primary-50 px-3 py-2 rounded border">
                {contractAddresses.projectGovernance}
              </p>
            </div>
          </div>
        </div>

        {/* Project Summary */}
        <div className="glass-feature rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">📊</span>
            </div>
            Project Overview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between py-2 border-b border-primary-100">
              <span className="text-primary-600">Project Name:</span>
              <span className="font-medium text-primary-800">
                {formData.projectName}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary-100">
              <span className="text-primary-600">Token Symbol:</span>
              <span className="font-medium text-primary-800">
                {formData.projectName
                  .split(' ')
                  .map(word => word[0])
                  .join('')
                  .toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary-100">
              <span className="text-primary-600">Total Supply:</span>
              <span className="font-medium text-primary-800">
                {formData.tokenSupply.toLocaleString()} tokens
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary-100">
              <span className="text-primary-600">Token Price:</span>
              <span className="font-medium text-primary-800">
                IDR {formData.tokenPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary-100">
              <span className="text-primary-600">Offering Period:</span>
              <span className="font-medium text-primary-800">
                {formData.offeringStart} to {formData.offeringEnd}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary-100">
              <span className="text-primary-600">Network:</span>
              <span className="font-medium text-primary-800">
                Arbitrum Sepolia
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <AnimatedButton
            onClick={() => router.push('/spv/dashboard')}
            variant="primary"
            ripple
            className="flex-1 sm:flex-none"
          >
            Go to SPV Dashboard
          </AnimatedButton>
          <AnimatedButton
            onClick={() => router.push('/marketplace')}
            variant="outline"
            ripple
            className="flex-1 sm:flex-none"
          >
            View in Marketplace
          </AnimatedButton>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-8">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <ToastProvider />

      <PageTransition type="fade" duration={300}>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          {/* Header */}
          <ScrollReveal animation="slide-up" delay={0}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gradient mb-3">
                {t('spvCreate.title')}
              </h1>
              <p className="text-muted-foreground">{t('spvCreate.subtitle')}</p>
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
              {currentStep === 6 && renderStep6()}

              {/* Navigation */}
              {currentStep < totalSteps && (
                <div className="flex justify-between pt-8">
                  <AnimatedButton
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    variant="outline"
                    ripple
                  >
                    Sebelumnya
                  </AnimatedButton>

                  <AnimatedButton onClick={nextStep} ripple>
                    {currentStep === 5
                      ? 'Deploy Smart Contracts'
                      : 'Selanjutnya'}
                  </AnimatedButton>
                </div>
              )}

              {/* Show Previous button only for step 6 (final step) */}
              {/* {currentStep === totalSteps && (
                <div className="flex justify-start pt-8">
                  <AnimatedButton onClick={prevStep} variant="outline" ripple>
                    Previous
                  </AnimatedButton>
                </div>
              )} */}
            </div>
          </ScrollReveal>
        </div>
      </PageTransition>
    </div>
  );
}
