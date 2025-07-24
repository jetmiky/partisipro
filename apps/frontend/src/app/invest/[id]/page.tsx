'use client';

/**
 * Investment Flow Page - PRESENTATION MODE
 *
 * This page has been configured to use mock data for presentation purposes.
 * All backend service calls have been replaced with simulated responses
 * using the same mock project data structure as /projects/[id].
 *
 * Features demonstrated:
 * - Identity verification flow (ERC-3643 compliance simulation)
 * - Investment amount selection and validation
 * - Payment method selection (Indonesian payment options)
 * - Investment confirmation and processing simulation
 * - Success/failure handling with realistic timing
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// Mock types for presentation mode - no backend integration
import type {
  InvestmentEligibility,
  PaymentDetails,
} from '@/services/investments.service';
import {
  ArrowLeft,
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
  Shield,
  UserCheck,
  Award,
  ArrowRight,
} from 'lucide-react';
// Import animated components
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { PageTransition } from '@/components/ui/PageTransition';
import { ToastProvider, toast } from '@/components/ui/AnimatedNotification';

type InvestmentStep =
  | 'identity'
  | 'amount'
  | 'payment'
  | 'confirmation'
  | 'processing'
  | 'success'
  | 'failed';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'bank' | 'ewallet' | 'card';
  icon: React.ReactNode;
  fee: number;
  processingTime: string;
  description: string;
}

interface IdentityStatus {
  isVerified: boolean;
  kycStatus: 'approved' | 'pending' | 'rejected' | 'expired';
  claims: {
    id: string;
    type: string;
    status: 'active' | 'expired' | 'pending';
  }[];
  eligibleForInvestment: boolean;
}

interface MockProject {
  id: string;
  name: string;
  description: string;
  expectedReturn: number;
  minimumInvestment: number;
  maximumInvestment: number;
  offeringStartDate: string;
  offeringEndDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'pending';
  location: string;
  projectType: string;
  totalSupply: number;
  tokenPrice: number;
  currency: 'IDR';
}

// Mock project data for presentation (matching /projects/[id] format)
const getMockProjectData = (id: string): MockProject | null => {
  const projects: Record<string, MockProject> = {
    '1': {
      id: '1',
      name: 'Jakarta-Bandung High-Speed Rail Extension',
      description:
        'Expansion of the existing high-speed rail network to connect Jakarta-Bandung with Surabaya, reducing travel time by 60%. This strategic infrastructure project will boost economic development across Java and provide efficient intercity transportation.',
      expectedReturn: 12.5,
      minimumInvestment: 1000000,
      maximumInvestment: 100000000,
      offeringStartDate: '2024-03-15T00:00:00Z',
      offeringEndDate: '2049-03-15T23:59:59Z',
      riskLevel: 'medium',
      status: 'active',
      location: 'Jakarta - Surabaya',
      projectType: 'Transportation Infrastructure',
      totalSupply: 15000000000,
      tokenPrice: 1000000,
      currency: 'IDR',
    },
    '2': {
      id: '2',
      name: 'Surabaya Smart Water Management System',
      description:
        'Advanced IoT-based water distribution and monitoring system for Surabaya metropolitan area, improving water quality and reducing waste.',
      expectedReturn: 15.2,
      minimumInvestment: 500000,
      maximumInvestment: 50000000,
      offeringStartDate: '2025-02-01T00:00:00Z',
      offeringEndDate: '2032-01-31T23:59:59Z',
      riskLevel: 'low',
      status: 'active',
      location: 'Surabaya, East Java',
      projectType: 'Water Infrastructure',
      totalSupply: 5000000000,
      tokenPrice: 500000,
      currency: 'IDR',
    },
    '3': {
      id: '3',
      name: 'Bali Renewable Energy Park',
      description:
        'Large-scale solar and wind energy facility providing clean electricity to Bali region, supporting sustainable tourism and local communities.',
      expectedReturn: 10.8,
      minimumInvestment: 2000000,
      maximumInvestment: 200000000,
      offeringStartDate: '2025-03-01T00:00:00Z',
      offeringEndDate: '2035-02-28T23:59:59Z',
      riskLevel: 'medium',
      status: 'active',
      location: 'Bali',
      projectType: 'Energy Infrastructure',
      totalSupply: 8000000000,
      tokenPrice: 2000000,
      currency: 'IDR',
    },
    '4': {
      id: '4',
      name: 'Medan Digital Healthcare Hub',
      description:
        'State-of-the-art digital healthcare facility with telemedicine capabilities, serving North Sumatra region with advanced medical technology.',
      expectedReturn: 14.7,
      minimumInvestment: 1500000,
      maximumInvestment: 75000000,
      offeringStartDate: '2025-04-01T00:00:00Z',
      offeringEndDate: '2030-03-31T23:59:59Z',
      riskLevel: 'high',
      status: 'active',
      location: 'Medan, North Sumatra',
      projectType: 'Healthcare Infrastructure',
      totalSupply: 6000000000,
      tokenPrice: 1500000,
      currency: 'IDR',
    },
    '5': {
      id: '5',
      name: 'Yogyakarta Cultural Heritage Center',
      description:
        'Modern cultural preservation and exhibition center showcasing Indonesian heritage with interactive technology and educational programs.',
      expectedReturn: 9.5,
      minimumInvestment: 750000,
      maximumInvestment: 30000000,
      offeringStartDate: '2025-05-01T00:00:00Z',
      offeringEndDate: '2028-04-30T23:59:59Z',
      riskLevel: 'low',
      status: 'active',
      location: 'Yogyakarta',
      projectType: 'Cultural Infrastructure',
      totalSupply: 3000000000,
      tokenPrice: 750000,
      currency: 'IDR',
    },
  };

  return projects[id] || null;
};

export default function InvestmentFlowPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  // const { isAuthenticated, isKYCApproved, isIdentityVerified } = useAuth();

  const isAuthenticated = true;
  const isKYCApproved = true;
  const isIdentityVerified = true;

  const [project, setProject] = useState<MockProject | null>(null);
  const [currentStep, setCurrentStep] = useState<InvestmentStep>('identity');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [eligibility, setEligibility] = useState<InvestmentEligibility | null>(
    null
  );
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null
  );
  const [currentInvestmentId, setCurrentInvestmentId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  paymentDetails;
  currentInvestmentId;

  // Identity status based on authentication state
  const identityStatus: IdentityStatus = {
    isVerified: isIdentityVerified,
    kycStatus: isKYCApproved ? 'approved' : 'pending',
    claims: [
      {
        id: '1',
        type: 'KYC_APPROVED',
        status: isKYCApproved ? 'active' : 'pending',
      },
      { id: '2', type: 'INDONESIAN_RESIDENT', status: 'active' },
      {
        id: '3',
        type: 'COMPLIANCE_VERIFIED',
        status: isIdentityVerified ? 'active' : 'pending',
      },
    ],
    eligibleForInvestment:
      isAuthenticated && isKYCApproved && isIdentityVerified,
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'bca',
      name: 'Bank Central Asia (BCA)',
      type: 'bank',
      icon: <Building2 className="w-6 h-6" />,
      fee: 0,
      processingTime: '1-2 business days',
      description: 'Transfer via BCA Virtual Account',
    },
    {
      id: 'mandiri',
      name: 'Bank Mandiri',
      type: 'bank',
      icon: <Building2 className="w-6 h-6" />,
      fee: 0,
      processingTime: '1-2 business days',
      description: 'Transfer via Mandiri Virtual Account',
    },
    {
      id: 'bni',
      name: 'Bank Negara Indonesia (BNI)',
      type: 'bank',
      icon: <Building2 className="w-6 h-6" />,
      fee: 0,
      processingTime: '1-2 business days',
      description: 'Transfer via BNI Virtual Account',
    },
    {
      id: 'gopay',
      name: 'GoPay',
      type: 'ewallet',
      icon: <Smartphone className="w-6 h-6" />,
      fee: 2500,
      processingTime: 'Instant',
      description: 'Pay using GoPay e-wallet',
    },
    {
      id: 'ovo',
      name: 'OVO',
      type: 'ewallet',
      icon: <Smartphone className="w-6 h-6" />,
      fee: 2500,
      processingTime: 'Instant',
      description: 'Pay using OVO e-wallet',
    },
    {
      id: 'dana',
      name: 'DANA',
      type: 'ewallet',
      icon: <Smartphone className="w-6 h-6" />,
      fee: 2500,
      processingTime: 'Instant',
      description: 'Pay using DANA e-wallet',
    },
    {
      id: 'credit-card',
      name: 'Credit Card',
      type: 'card',
      icon: <CreditCard className="w-6 h-6" />,
      fee: 0,
      processingTime: 'Instant',
      description: 'Visa, Mastercard, JCB accepted',
    },
  ];

  useEffect(() => {
    const projectId = params.id as string;

    // Check authentication
    if (!isAuthenticated) {
      router.push(`/auth?redirectTo=/invest/${projectId}`);
      return;
    }

    // Load mock project data for presentation
    const loadProjectData = async () => {
      try {
        setLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const projectData = getMockProjectData(projectId);
        if (projectData) {
          setProject(projectData);
        } else {
          toast.error('Project not found');
          router.push('/marketplace');
        }
      } catch (error) {
        toast.error('Failed to load project. Please try again.');
        router.push('/marketplace');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [params.id, isAuthenticated, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const checkEligibility = useCallback(
    async (amount: number) => {
      if (!project) return;

      try {
        // Mock eligibility check for presentation
        await new Promise(resolve => setTimeout(resolve, 500));
        const eligible =
          amount >= project.minimumInvestment &&
          amount <= project.maximumInvestment;
        const mockEligibility: InvestmentEligibility = {
          eligible,
          reason: eligible
            ? undefined
            : amount < project.minimumInvestment
              ? `Minimum investment is ${formatCurrency(project.minimumInvestment)}`
              : `Maximum investment is ${formatCurrency(project.maximumInvestment)}`,
          identityVerified: isIdentityVerified,
          kycApproved: isKYCApproved,
          minimumInvestmentMet: amount >= project.minimumInvestment,
          maximumInvestmentExceeded: amount > project.maximumInvestment,
          offeringActive: project.status === 'active',
          tokensAvailable: true,
        };
        setEligibility(mockEligibility);
      } catch (error) {
        toast.error('Failed to check investment eligibility.');
      }
    },
    [project, isIdentityVerified, isKYCApproved, formatCurrency]
  );

  // Check eligibility when project and amount change
  useEffect(() => {
    if (project && investmentAmount && currentStep === 'amount') {
      const amount = parseFloat(investmentAmount.replace(/[^\d]/g, ''));
      if (amount > 0) {
        checkEligibility(amount);
      }
    }
  }, [project, investmentAmount, currentStep, checkEligibility]);

  const calculateReturns = () => {
    const amount = parseFloat(investmentAmount.replace(/[^\d]/g, ''));
    if (!amount || !project) return null;

    const annualReturn = (amount * project.expectedReturn) / 100;
    // Calculate duration in years from offering dates
    const startDate = new Date(project.offeringStartDate);
    const endDate = new Date(project.offeringEndDate);
    const durationYears =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const totalReturn = annualReturn * durationYears;

    return {
      annual: annualReturn,
      total: totalReturn,
      finalValue: amount + totalReturn,
    };
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setInvestmentAmount(value);
  };

  const handleNextStep = () => {
    const stepOrder: InvestmentStep[] = [
      'identity',
      'amount',
      'payment',
      'confirmation',
      'processing',
      'success',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBackStep = () => {
    const stepOrder: InvestmentStep[] = [
      'identity',
      'amount',
      'payment',
      'confirmation',
      'processing',
      'success',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const processInvestment = async () => {
    if (!project || !agreementAccepted || !riskAcknowledged) return;

    const amount = parseFloat(investmentAmount.replace(/[^\d]/g, ''));
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    setProcessingMessage('Creating investment order...');

    try {
      // Mock investment creation for presentation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockInvestmentId = `INV-${Date.now()}`;
      const selectedMethod = paymentMethods.find(
        m => m.id === selectedPaymentMethod
      );

      const mockPaymentDetails: PaymentDetails = {
        paymentReference: `REF-${Date.now()}`,
        paymentInstructions: {
          method: selectedPaymentMethod,
          accountNumber:
            selectedMethod?.type === 'bank' ? '1234567890' : undefined,
          virtualAccount:
            selectedMethod?.type === 'bank' ? 'VA-1234567890' : undefined,
          qrCode:
            selectedMethod?.type === 'ewallet'
              ? 'data:image/png;base64,mock-qr-code'
              : undefined,
          deepLink:
            selectedMethod?.type === 'ewallet'
              ? `${selectedPaymentMethod}://pay?ref=REF-${Date.now()}`
              : undefined,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        amount,
        fees: selectedMethod?.fee || 0,
        totalAmount: amount + (selectedMethod?.fee || 0),
      };

      setCurrentInvestmentId(mockInvestmentId);
      setPaymentDetails(mockPaymentDetails);

      setProcessingMessage('Awaiting payment confirmation...');

      // Start mock monitoring investment status
      monitorInvestmentStatus(mockInvestmentId);
    } catch (error) {
      setIsProcessing(false);
      setCurrentStep('failed');
      toast.error(
        error instanceof Error
          ? error.message
          : 'Investment failed. Please try again.'
      );
    }
  };

  const monitorInvestmentStatus = async (investmentId: string) => {
    investmentId;

    const processingSteps = [
      { message: 'Payment received', delay: 2000 },
      { message: 'Verifying payment details', delay: 3000 },
      { message: 'Processing blockchain transaction', delay: 4000 },
      { message: 'Confirming token allocation', delay: 2000 },
      { message: 'Investment completed successfully', delay: 1000 },
    ];

    let currentStepIndex = 0;

    const processNextStep = () => {
      if (currentStepIndex < processingSteps.length) {
        const step = processingSteps[currentStepIndex];
        setProcessingMessage(step.message);

        setTimeout(() => {
          currentStepIndex++;
          if (currentStepIndex < processingSteps.length) {
            processNextStep();
          } else {
            // Mock successful completion
            setIsProcessing(false);
            setCurrentStep('success');
            toast.success('Investment successful!', {
              message: 'Your investment has been processed successfully',
              duration: 5000,
            });
          }
        }, step.delay);
      }
    };

    // Start processing simulation after 1 second
    setTimeout(processNextStep, 1000);
  };

  // Show loading state
  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative overflow-hidden">
        {/* Fluid background shapes */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-20 animate-[float_3s_ease-in-out_infinite] blur-sm"></div>
          <div className="absolute top-1/4 right-20 w-48 h-48 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full opacity-15 animate-[float_4s_ease-in-out_infinite_reverse] blur-sm"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-25 animate-[float_5s_ease-in-out_infinite] blur-sm"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">
            Loading Project
          </h2>
          <p className="text-gray-600">
            Please wait while we load the project information...
          </p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative overflow-hidden">
        {/* Fluid background shapes */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-20 animate-[float_3s_ease-in-out_infinite] blur-sm"></div>
          <div className="absolute top-1/4 right-20 w-48 h-48 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full opacity-15 animate-[float_4s_ease-in-out_infinite_reverse] blur-sm"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <ArrowLeft className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">
            Redirecting
          </h2>
          <p className="text-gray-600">
            Please wait while we redirect you to login...
          </p>
        </div>
      </div>
    );
  }

  const renderStepIndicator = () => {
    const steps = [
      { id: 'identity', label: 'Identity' },
      { id: 'amount', label: 'Amount' },
      { id: 'payment', label: 'Payment' },
      { id: 'confirmation', label: 'Confirmation' },
      { id: 'processing', label: 'Processing' },
      { id: 'success', label: 'Complete' },
    ];

    return (
      <ScrollReveal animation="fade" delay={0}>
        <div className="flex items-center justify-center mb-8">
          <div className="glass-modern rounded-full p-6 shadow-lg">
            <StaggeredList
              className="flex items-center"
              itemDelay={100}
              animation="fade"
            >
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted =
                  steps.findIndex(s => s.id === currentStep) > index;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? 'border-primary-500 bg-gradient-to-br from-primary-100 to-primary-200 shadow-lg'
                          : isCompleted
                            ? 'border-primary-500 bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg'
                            : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <span
                        className={`text-sm font-bold ${
                          isActive
                            ? 'text-primary-600'
                            : isCompleted
                              ? 'text-white'
                              : 'text-gray-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <span
                      className={`ml-2 text-sm font-semibold ${
                        isActive
                          ? 'text-primary-600'
                          : isCompleted
                            ? 'text-primary-500'
                            : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-12 h-1 mx-4 rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600'
                            : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </StaggeredList>
          </div>
        </div>
      </ScrollReveal>
    );
  };

  const renderIdentityStep = () => (
    <div className="max-w-2xl mx-auto">
      <ScrollReveal animation="fade" delay={0}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-3">
            Verifikasi Identitas Investor
          </h2>
          <p className="text-gray-600 text-lg">
            Identitas Anda akan dilakukan proses verifikasi secara otomatis
            melalui ERC-3643 Identity Registry.
          </p>
        </div>
      </ScrollReveal>

      {identityStatus.eligibleForInvestment ? (
        <StaggeredList
          className="space-y-6"
          itemDelay={150}
          animation="slide-up"
        >
          <ScrollReveal animation="slide-up" delay={100}>
            <div className="glass-modern p-6 border border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-900">
                  Verifikasi Identitas Berhasil
                </h3>
              </div>
              <p className="text-green-800 mb-4 text-lg">
                Identitas Anda telah berhasil diverifikasi dan eligible untuk
                berinvestasi pada proyek ini. Tidak ada verifikasi tambahan
                lainnya yang diperlukan.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-green-700 font-semibold">
                  KYC Status:
                </span>
                <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-bold shadow-lg">
                  {identityStatus.kycStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="slide-up" delay={200}>
            <div className="glass-modern p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Identitas Anda
              </h3>
              <StaggeredList
                className="space-y-4"
                itemDelay={100}
                animation="slide-up"
              >
                {identityStatus.claims.map(claim => (
                  <div
                    key={claim.id}
                    className="glass-feature p-4 rounded-xl hover:scale-105 transition-transform duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900 text-lg">
                          {claim.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold shadow-lg ${
                          claim.status === 'active'
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                        }`}
                      >
                        {claim.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </StaggeredList>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="slide-up" delay={300}>
            <div className="glass-modern p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Investment Benefits
                </h3>
              </div>
              <StaggeredList
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                itemDelay={100}
                animation="slide-up"
              >
                {[
                  'Instant investment approval',
                  'Access to all project tiers',
                  'Profit distribution',
                  'Governance voting rights',
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 glass-feature rounded-lg hover:scale-105 transition-transform duration-300"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-800">{benefit}</span>
                  </div>
                ))}
              </StaggeredList>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="scale" delay={400}>
            <div className="flex justify-center">
              <AnimatedButton
                onClick={handleNextStep}
                variant="primary"
                size="lg"
                ripple={true}
              >
                Selanjutnya
                <ArrowRight className="w-4 h-4" />
              </AnimatedButton>
            </div>
          </ScrollReveal>
        </StaggeredList>
      ) : (
        <StaggeredList
          className="space-y-6"
          itemDelay={150}
          animation="slide-up"
        >
          <ScrollReveal animation="slide-up" delay={100}>
            <div className="glass-modern p-6 border border-red-200 bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-red-900">
                  Identity Verification Required
                </h3>
              </div>
              <p className="text-red-800 mb-4 text-lg">
                Your identity needs to be verified before you can invest in this
                project. Please complete the KYC process to continue.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-red-700 font-semibold">KYC Status:</span>
                <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-bold shadow-lg">
                  {identityStatus.kycStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="slide-up" delay={200}>
            <div className="glass-modern p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Required Steps
              </h3>
              <StaggeredList
                className="space-y-4"
                itemDelay={100}
                animation="slide-up"
              >
                {[
                  'Complete KYC verification',
                  'Obtain required identity claims',
                  'Wait for identity registry approval',
                ].map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 glass-feature rounded-lg"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-800">{step}</span>
                  </div>
                ))}
              </StaggeredList>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="scale" delay={300}>
            <div className="flex justify-center gap-4">
              <Link href="/kyc">
                <AnimatedButton variant="primary" size="lg" ripple={true}>
                  Start KYC Process
                </AnimatedButton>
              </Link>
              <Link href="/identity">
                <AnimatedButton variant="secondary" size="lg">
                  Check Identity Status
                </AnimatedButton>
              </Link>
            </div>
          </ScrollReveal>
        </StaggeredList>
      )}
    </div>
  );

  const renderAmountStep = () => (
    <div className="max-w-2xl mx-auto">
      <ScrollReveal animation="fade" delay={0}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-3">
            Investment Amount
          </h2>
          <p className="text-gray-600 text-lg">
            Enter the amount you want to invest in this project
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ScrollReveal animation="slide-left" delay={100}>
          <div className="glass-modern p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Investment Details
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Investment Amount
                </label>
                <AnimatedInput
                  type="text"
                  value={
                    investmentAmount
                      ? formatCurrency(parseFloat(investmentAmount))
                      : ''
                  }
                  onChange={handleAmountChange}
                  placeholder={`Min. ${formatCurrency(project?.minimumInvestment || 0)}`}
                  className="text-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Minimum investment:{' '}
                  <span className="font-semibold text-primary-600">
                    {formatCurrency(project?.minimumInvestment || 0)}
                  </span>
                </p>
              </div>

              <StaggeredList
                className="grid grid-cols-3 gap-2"
                itemDelay={100}
                animation="scale"
              >
                {[1000000, 5000000, 10000000].map(amount => (
                  <AnimatedButton
                    key={amount}
                    variant="secondary"
                    size="sm"
                    onClick={() => setInvestmentAmount(amount.toString())}
                  >
                    {formatCurrency(amount)}
                  </AnimatedButton>
                ))}
              </StaggeredList>

              {/* Eligibility feedback */}
              {eligibility && (
                <ScrollReveal animation="scale" delay={200}>
                  <div className="mt-4">
                    {eligibility.eligible ? (
                      <div className="flex items-center p-4 glass-feature rounded-xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-green-800">
                          You are eligible to invest this amount
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center p-4 glass-feature rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
                          <XCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-red-800">
                          {eligibility.reason || 'Investment not allowed'}
                        </span>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="slide-right" delay={200}>
          <div className="glass-modern p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Investment Summary
            </h3>

            {calculateReturns() && (
              <StaggeredList
                className="space-y-4"
                itemDelay={100}
                animation="slide-up"
              >
                <div className="flex justify-between items-center p-3 glass-feature rounded-lg">
                  <span className="text-gray-600 font-medium">
                    Investment Amount
                  </span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(parseFloat(investmentAmount))}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 glass-feature rounded-lg">
                  <span className="text-gray-600 font-medium">
                    Expected Annual Return
                  </span>
                  <span className="font-bold text-primary-600">
                    {project?.expectedReturn}%
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 glass-feature rounded-lg">
                  <span className="text-gray-600 font-medium">Duration</span>
                  <span className="font-bold text-gray-900">
                    {project
                      ? Math.round(
                          (new Date(project.offeringEndDate).getTime() -
                            new Date(project.offeringStartDate).getTime()) /
                            (1000 * 60 * 60 * 24 * 365)
                        )
                      : 0}{' '}
                    years
                  </span>
                </div>

                <div className="border-t-2 border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-3 p-3 glass-feature rounded-lg">
                    <span className="text-gray-600 font-medium">
                      Annual Return
                    </span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(calculateReturns()!.annual)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3 p-3 glass-feature rounded-lg">
                    <span className="text-gray-600 font-medium">
                      Total Return
                    </span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(calculateReturns()!.total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 glass-modern rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200">
                    <span className="font-bold text-gray-900 text-lg">
                      Final Value
                    </span>
                    <span className="font-bold text-primary-600 text-xl">
                      {formatCurrency(calculateReturns()!.finalValue)}
                    </span>
                  </div>
                </div>
              </StaggeredList>
            )}
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal animation="fade" delay={300}>
        <div className="flex justify-between mt-8">
          <AnimatedButton
            onClick={handleBackStep}
            variant="secondary"
            size="lg"
          >
            Back
          </AnimatedButton>
          <AnimatedButton
            onClick={handleNextStep}
            variant="primary"
            size="lg"
            disabled={
              !investmentAmount ||
              parseFloat(investmentAmount) < (project?.minimumInvestment || 0)
            }
            ripple={true}
          >
            {t('investmentPage.actions.proceedToPayment')}
          </AnimatedButton>
        </div>
      </ScrollReveal>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="max-w-2xl mx-auto">
      <ScrollReveal animation="fade" delay={0}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-3">
            Select Payment Method
          </h2>
          <p className="text-gray-600 text-lg">
            Choose how you want to pay for your investment
          </p>
        </div>
      </ScrollReveal>

      <StaggeredList className="space-y-4" itemDelay={100} animation="slide-up">
        {paymentMethods.map(method => (
          <div
            key={method.id}
            className={`glass-modern p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
              selectedPaymentMethod === method.id
                ? 'border-2 border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100'
                : 'border border-gray-200 hover:border-primary-300'
            }`}
            onClick={() => {
              setSelectedPaymentMethod(method.id);
              toast.success('Payment method selected', {
                message: `Selected ${method.name}`,
                duration: 2000,
              });
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl shadow-lg ${
                    method.type === 'bank'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : method.type === 'ewallet'
                        ? 'bg-gradient-to-br from-green-500 to-green-600'
                        : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}
                >
                  <div className="text-white">{method.icon}</div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {method.name}
                  </h3>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  {method.fee > 0 ? formatCurrency(method.fee) : 'Free'}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {method.processingTime}
                </div>
              </div>
            </div>
          </div>
        ))}
      </StaggeredList>

      <ScrollReveal animation="fade" delay={300}>
        <div className="flex justify-between mt-8">
          <AnimatedButton
            onClick={handleBackStep}
            variant="secondary"
            size="lg"
          >
            Back
          </AnimatedButton>
          <AnimatedButton
            onClick={handleNextStep}
            variant="primary"
            size="lg"
            disabled={!selectedPaymentMethod}
            ripple={true}
          >
            {t('investmentPage.actions.continueToConfirmation')}
          </AnimatedButton>
        </div>
      </ScrollReveal>
    </div>
  );

  const renderConfirmationStep = () => {
    const selectedMethod = paymentMethods.find(
      m => m.id === selectedPaymentMethod
    );
    const amount = parseFloat(investmentAmount);
    const totalAmount = amount + (selectedMethod?.fee || 0);

    return (
      <div className="max-w-2xl mx-auto">
        <ScrollReveal animation="fade" delay={0}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-3">
              {t('investmentPage.actions.confirmInvestment')}
            </h2>
            <p className="text-gray-600 text-lg">
              Please review your investment details before proceeding
            </p>
          </div>
        </ScrollReveal>

        <StaggeredList
          className="space-y-6"
          itemDelay={150}
          animation="slide-up"
        >
          <ScrollReveal animation="slide-up" delay={100}>
            <div className="glass-modern p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Investment Summary
              </h3>

              <StaggeredList
                className="space-y-4"
                itemDelay={100}
                animation="slide-up"
              >
                <div className="flex justify-between p-3 glass-feature rounded-lg">
                  <span className="text-gray-600 font-medium">Project</span>
                  <span className="font-bold text-gray-900">
                    {project?.name}
                  </span>
                </div>
                <div className="flex justify-between p-3 glass-feature rounded-lg">
                  <span className="text-gray-600 font-medium">
                    Investment Amount
                  </span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="flex justify-between p-3 glass-feature rounded-lg">
                  <span className="text-gray-600 font-medium">
                    Payment Method
                  </span>
                  <span className="font-bold text-gray-900">
                    {selectedMethod?.name}
                  </span>
                </div>
                <div className="flex justify-between p-3 glass-feature rounded-lg">
                  <span className="text-gray-600 font-medium">
                    Processing Fee
                  </span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(selectedMethod?.fee || 0)}
                  </span>
                </div>
                <div className="border-t-2 border-gray-200 pt-4">
                  <div className="flex justify-between p-4 glass-modern rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200">
                    <span className="font-bold text-gray-900 text-lg">
                      Total Amount
                    </span>
                    <span className="font-bold text-primary-600 text-xl">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </StaggeredList>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="slide-up" delay={200}>
            <div className="glass-modern p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Terms and Conditions
              </h3>

              <StaggeredList
                className="space-y-6"
                itemDelay={150}
                animation="slide-up"
              >
                <div className="flex items-start gap-4 p-4 glass-feature rounded-lg">
                  <input
                    type="checkbox"
                    id="agreement"
                    checked={agreementAccepted}
                    onChange={e => setAgreementAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="agreement"
                    className="text-sm text-gray-700 font-medium"
                  >
                    I agree to the{' '}
                    <Link
                      href="/legal"
                      className="text-primary-600 hover:underline font-semibold"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/legal"
                      className="text-primary-600 hover:underline font-semibold"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <div className="flex items-start gap-4 p-4 glass-feature rounded-lg">
                  <input
                    type="checkbox"
                    id="risk"
                    checked={riskAcknowledged}
                    onChange={e => setRiskAcknowledged(e.target.checked)}
                    className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="risk"
                    className="text-sm text-gray-700 font-medium"
                  >
                    I understand the risks involved in this investment and
                    acknowledge that returns are not guaranteed
                  </label>
                </div>
              </StaggeredList>
            </div>
          </ScrollReveal>
        </StaggeredList>

        <ScrollReveal animation="fade" delay={300}>
          <div className="flex justify-between mt-8">
            <AnimatedButton
              onClick={handleBackStep}
              variant="secondary"
              size="lg"
            >
              Back
            </AnimatedButton>
            <AnimatedButton
              onClick={processInvestment}
              variant="primary"
              size="lg"
              disabled={!agreementAccepted || !riskAcknowledged || isProcessing}
              loading={isProcessing}
              ripple={true}
            >
              {isProcessing
                ? t('investmentPage.actions.processing')
                : t('investmentPage.actions.confirmInvestment')}
            </AnimatedButton>
          </div>
        </ScrollReveal>
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div className="max-w-md mx-auto text-center">
      <ScrollReveal animation="scale" delay={0}>
        <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Clock className="w-12 h-12 text-white animate-spin" />
        </div>
      </ScrollReveal>

      <ScrollReveal animation="fade" delay={100}>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-3">
          Processing Investment
        </h2>
        <p className="text-gray-600 mb-6 text-lg">
          Please wait while we process your investment
        </p>
      </ScrollReveal>

      <ScrollReveal animation="slide-up" delay={200}>
        <div className="glass-modern p-6 rounded-xl">
          <p className="text-sm text-gray-700 font-medium mb-4">
            {processingMessage}
          </p>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full animate-pulse"
              style={{ width: '60%' }}
            ></div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="max-w-md mx-auto text-center">
      <ScrollReveal animation="scale" delay={0}>
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
      </ScrollReveal>

      <ScrollReveal animation="fade" delay={100}>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3">
          Investment Successful!
        </h2>
        <p className="text-gray-600 mb-6 text-lg">
          Your investment has been processed successfully
        </p>
      </ScrollReveal>

      <ScrollReveal animation="slide-up" delay={200}>
        <div className="glass-modern p-6 text-left mb-6">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">
            Investment Details
          </h3>
          <StaggeredList
            className="space-y-3"
            itemDelay={100}
            animation="slide-up"
          >
            <div className="flex justify-between p-3 glass-feature rounded-lg">
              <span className="text-gray-600 font-medium">Amount Invested</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(parseFloat(investmentAmount))}
              </span>
            </div>
            <div className="flex justify-between p-3 glass-feature rounded-lg">
              <span className="text-gray-600 font-medium">Transaction ID</span>
              <span className="font-bold text-gray-900">TXN-{Date.now()}</span>
            </div>
            <div className="flex justify-between p-3 glass-feature rounded-lg">
              <span className="text-gray-600 font-medium">Date</span>
              <span className="font-bold text-gray-900">
                {new Date().toLocaleDateString('id-ID')}
              </span>
            </div>
          </StaggeredList>
        </div>
      </ScrollReveal>

      <ScrollReveal animation="fade" delay={300}>
        <StaggeredList
          className="flex flex-col gap-3"
          itemDelay={100}
          animation="scale"
        >
          <Link href="/dashboard">
            <AnimatedButton
              variant="primary"
              size="lg"
              className="w-full"
              ripple={true}
            >
              View Dashboard
            </AnimatedButton>
          </Link>
          <Link href="/marketplace">
            <AnimatedButton variant="secondary" size="lg" className="w-full">
              Browse More Projects
            </AnimatedButton>
          </Link>
        </StaggeredList>
      </ScrollReveal>
    </div>
  );

  const renderFailedStep = () => (
    <div className="max-w-md mx-auto text-center">
      <ScrollReveal animation="scale" delay={0}>
        <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <XCircle className="w-12 h-12 text-white" />
        </div>
      </ScrollReveal>

      <ScrollReveal animation="fade" delay={100}>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-3">
          Investment Failed
        </h2>
        <p className="text-gray-600 mb-6 text-lg">
          There was an issue processing your investment
        </p>
      </ScrollReveal>

      <ScrollReveal animation="slide-up" delay={200}>
        <div className="glass-modern p-6 text-left mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">
                Payment could not be processed
              </h3>
              <p className="text-sm text-gray-600">
                This could be due to insufficient funds, network issues, or
                payment method restrictions.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal animation="fade" delay={300}>
        <StaggeredList
          className="flex flex-col gap-3"
          itemDelay={100}
          animation="scale"
        >
          <AnimatedButton
            onClick={() => setCurrentStep('payment')}
            variant="primary"
            size="lg"
            className="w-full"
            ripple={true}
          >
            Try Again
          </AnimatedButton>
          <Link href="/marketplace">
            <AnimatedButton variant="secondary" size="lg" className="w-full">
              {t('investmentPage.actions.backToMarketplace')}
            </AnimatedButton>
          </Link>
        </StaggeredList>
      </ScrollReveal>
    </div>
  );

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative overflow-hidden">
        {/* Fluid background shapes */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-20 animate-[float_3s_ease-in-out_infinite] blur-sm"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full opacity-15 animate-[float_4s_ease-in-out_infinite_reverse] blur-sm"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <p className="text-gray-600 font-medium">
            Loading investment details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition type="fade" duration={300} transitionKey={currentStep}>
      <ToastProvider />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 relative overflow-hidden">
        {/* Fluid background shapes */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-20 animate-[float_3s_ease-in-out_infinite] blur-sm"></div>
          <div className="absolute top-1/4 right-20 w-48 h-48 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full opacity-15 animate-[float_4s_ease-in-out_infinite_reverse] blur-sm"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-25 animate-[float_5s_ease-in-out_infinite] blur-sm"></div>
          <div className="absolute bottom-10 right-10 w-36 h-36 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full opacity-20 animate-[float_6s_ease-in-out_infinite_reverse] blur-sm"></div>
        </div>

        {/* Header */}
        <ScrollReveal animation="slide-down" delay={0}>
          <div className="glass-modern border-b border-white/20 relative z-10">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AnimatedButton
                    onClick={() => router.push(`/projects/${project.id}`)}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('investmentPage.actions.backToProject')}
                  </AnimatedButton>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                      Investment
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {project.name}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Main Content */}
        <ScrollReveal animation="slide-up" delay={100}>
          <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
            <div className="glass-modern p-8 shadow-xl">
              {renderStepIndicator()}

              {currentStep === 'identity' && renderIdentityStep()}
              {currentStep === 'amount' && renderAmountStep()}
              {currentStep === 'payment' && renderPaymentStep()}
              {currentStep === 'confirmation' && renderConfirmationStep()}
              {currentStep === 'processing' && renderProcessingStep()}
              {currentStep === 'success' && renderSuccessStep()}
              {currentStep === 'failed' && renderFailedStep()}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}
