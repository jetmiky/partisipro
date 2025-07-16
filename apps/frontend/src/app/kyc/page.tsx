'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Upload,
  User,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Layers,
  UserCheck,
  Award,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Eye,
  Zap,
  Globe,
  Timer,
  Building,
  Smartphone,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useKYCWebSocket } from '@/hooks/useWebSocket';
import {
  kycService,
  KYCProvider,
  KYCSession,
  KYCInitiationRequest,
  KYCAnalytics,
  KYCErrorHandling,
} from '@/services';

// Simple toast replacement for now
const toast = {
  success: (message: string) => {
    alert(`✅ ${message}`);
  },
  error: (message: string) => {
    alert(`❌ ${message}`);
  },
  info: (message: string) => {
    alert(`ℹ️ ${message}`);
  },
};

type KYCStep =
  | 'intro'
  | 'provider'
  | 'personal'
  | 'document'
  | 'verification'
  | 'processing'
  | 'identity'
  | 'complete';
type KYCStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'success'
  | 'manual_review'
  | 'approved'
  | 'retry_required';

interface DocumentUpload {
  id: string;
  name: string;
  status: 'pending' | 'uploaded' | 'verified';
  required: boolean;
}

interface IdentityClaim {
  id: string;
  type: string;
  description: string;
  value: string;
  issuer: string;
  status: 'pending' | 'issued' | 'verified';
}

export default function KYCPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<KYCStep>('intro');
  const [kycStatus, setKycStatus] = useState<KYCStatus>('pending');
  const [selectedProvider, setSelectedProvider] = useState<KYCProvider | null>(null);
  const [kycSession, setKycSession] = useState<KYCSession | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Real API state
  const [providers, setProviders] = useState<KYCProvider[]>([]);
  const [currentKYCStatus, setCurrentKYCStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<any>(null);

  // WebSocket integration for real-time KYC updates
  const { kycStatus: liveKycStatus, verificationProgress, isConnected: wsConnected } = useKYCWebSocket();
  
  // Claims issuance state
  const [claimsIssuance, setClaimsIssuance] = useState<{
    issuanceStatus: 'pending' | 'processing' | 'completed' | 'failed';
    transactionHash?: string;
    claimsToIssue: Array<{
      type: string;
      value: string;
      issuer: string;
    }>;
  } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    address: '',
    occupation: '',
    sourceOfFunds: '',
  });

  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      id: 'ktp',
      name: 'KTP (Indonesian ID Card)',
      status: 'pending',
      required: true,
    },
    { id: 'selfie', name: 'Selfie with ID', status: 'pending', required: true },
    {
      id: 'proof_address',
      name: 'Proof of Address',
      status: 'pending',
      required: true,
    },
    {
      id: 'bank_statement',
      name: 'Bank Statement',
      status: 'pending',
      required: false,
    },
  ]);

  const [identityClaims, setIdentityClaims] = useState<IdentityClaim[]>([
    {
      id: '1',
      type: 'KYC_APPROVED',
      description: 'Know Your Customer verification completed',
      value: 'true',
      issuer: 'Verihubs Indonesia',
      status: 'pending',
    },
    {
      id: '2',
      type: 'INDONESIAN_RESIDENT',
      description: 'Verified Indonesian resident status',
      value: 'true',
      issuer: 'Verihubs Indonesia',
      status: 'pending',
    },
    {
      id: '3',
      type: 'COMPLIANCE_VERIFIED',
      description: 'AML and sanctions screening completed',
      value: 'true',
      issuer: 'Partisipro Platform',
      status: 'pending',
    },
  ]);

  // Real-time KYC status updates via WebSocket
  useEffect(() => {
    if (liveKycStatus) {
      console.log('🆔 Real-time KYC status update:', liveKycStatus);
      setKycSession(liveKycStatus);
      
      // Update step based on status
      if (liveKycStatus.status === 'completed') {
        setKycStatus('success');
        setCurrentStep('identity');
      } else if (liveKycStatus.status === 'failed') {
        setKycStatus('failed');
      } else if (liveKycStatus.status === 'processing') {
        setKycStatus('processing');
        setCurrentStep('processing');
      }
      
      // Stop polling since we're getting real-time updates
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        setPollingActive(false);
      }
    }
  }, [liveKycStatus]);

  // Update progress indicator with real-time data
  useEffect(() => {
    if (verificationProgress > 0) {
      console.log('📊 KYC verification progress:', verificationProgress);
      // Update any progress bars or indicators here
    }
  }, [verificationProgress]);

  // Check authentication and load KYC data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?redirectTo=/kyc');
      return;
    }

    loadKYCData();
  }, [isAuthenticated, router]);

  const loadKYCData = async () => {
    try {
      setIsLoading(true);
      
      // Load providers and current KYC status in parallel
      const [providersResult, statusResult] = await Promise.all([
        kycService.getProviders(),
        kycService.getCurrentKYCStatus(),
      ]);

      setProviders(providersResult);
      setCurrentKYCStatus(statusResult);
      
      // Set current status based on API response
      if (statusResult.hasActiveSession) {
        setKycSession(statusResult.currentSession || null);
        setKycStatus(statusResult.currentSession?.status || 'pending');
        // Set appropriate step based on session status
        if (statusResult.currentSession?.status === 'completed') {
          setCurrentStep('complete');
        } else if (statusResult.currentSession?.status === 'processing') {
          setCurrentStep('processing');
        } else {
          setCurrentStep('verification');
        }
      } else if (statusResult.latestResults?.overall === 'approved') {
        setCurrentStep('complete');
        setKycStatus('approved');
      }
    } catch (error: any) {
      console.error('Failed to load KYC data:', error);
      toast.error('Failed to load KYC data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateKYC = async () => {
    if (!selectedProvider || !user) return;

    try {
      setSubmitting(true);
      
      const request: KYCInitiationRequest = {
        provider: selectedProvider.id,
        level: 'advanced',
        investorType: 'retail',
        personalInfo: {
          firstName: formData.fullName.split(' ')[0] || '',
          lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          dateOfBirth: '', // Would be collected in form
          nationality: 'ID',
          residenceCountry: 'ID',
          phoneNumber: formData.phoneNumber,
        },
        preferredLanguage: 'id',
      };

      const result = await kycService.initiateKYC(request);
      setKycSession({
        id: result.sessionId,
        userId: user.id || '',
        provider: selectedProvider.id,
        status: 'pending',
        level: 'advanced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: result.expiresAt,
        sessionUrl: result.sessionUrl,
        webhookEvents: [],
        documents: [],
        checks: [],
      });
      
      toast.success('KYC verification initiated successfully');
      setCurrentStep('verification');
      
      // Start polling for status updates
      startStatusPolling(result.sessionId);
    } catch (error: any) {
      console.error('Failed to initiate KYC:', error);
      toast.error('Failed to initiate KYC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const startStatusPolling = (sessionId: string) => {
    setPollingActive(true);
    
    const pollStatus = async () => {
      try {
        const session = await kycService.getSessionStatus(sessionId);
        setKycSession(session);
        setKycStatus(session.status);
        
        if (session.status === 'completed' || session.status === 'failed') {
          setPollingActive(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          
          if (session.status === 'completed') {
            setCurrentStep('identity');
            toast.success('KYC verification completed successfully!');
          } else {
            toast.error('KYC verification failed. Please try again.');
          }
        }
      } catch (error) {
        console.error('Failed to poll KYC status:', error);
      }
    };
    
    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(pollStatus, 5000);
    
    // Also poll immediately
    pollStatus();
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KYC data...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'intro', label: 'Introduction', icon: AlertCircle },
    { id: 'provider', label: 'KYC Provider', icon: Building },
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'document', label: 'Document Upload', icon: FileText },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'processing', label: 'Processing', icon: Timer },
    { id: 'identity', label: 'Identity Registry', icon: UserCheck },
    { id: 'complete', label: 'Complete', icon: CheckCircle },
  ];

  // Mock KYC providers data  
  const kycProviders: KYCProvider[] = [
    {
      id: 'verihubs',
      name: 'Verihubs Indonesia',
      description: 'Leading Indonesian KYC provider with government integration',
      processingTime: '2-5 minutes',
      accuracy: 98.5,
      isAvailable: true,
      regions: ['Indonesia'],
      supportedDocuments: ['KTP', 'Passport', 'SIM', 'Selfie'],
      features: [
        'Real-time verification',
        'Government database check',
        'Biometric matching',
        'AML screening',
      ],
      pricing: {
        basic: 25000,
        premium: 50000,
        currency: 'IDR',
      },
      languages: ['Indonesian', 'English'],
      logo: '/logos/verihubs.png',
    },
    {
      id: 'sumsub',
      name: 'Sum&Substance',
      description: 'Global KYC platform with advanced AI verification',
      processingTime: '1-3 minutes',
      accuracy: 99.5,
      isAvailable: true,
      regions: ['Indonesia', 'Singapore', 'Malaysia', 'Thailand'],
      supportedDocuments: ['ID Card', 'Passport', 'Driving License', 'Selfie'],
      features: [
        'AI-powered verification',
        'Liveness detection',
        'Global AML database',
        '99.5% accuracy',
      ],
      pricing: {
        basic: 30000,
        premium: 60000,
        currency: 'IDR',
      },
      languages: ['Indonesian', 'English', 'Thai', 'Malay'],
      logo: '/logos/sumsub.png',
    },
    {
      id: 'jumio',
      name: 'Jumio Netverify',
      description: 'Enterprise-grade identity verification with machine learning',
      processingTime: '30 seconds - 2 minutes',
      accuracy: 99.1,
      isAvailable: true,
      regions: ['Indonesia', 'Global coverage'],
      supportedDocuments: ['ID Card', 'Passport', 'Driving License', 'Selfie'],
      features: [
        'Instant verification',
        'Fraud detection',
        'Identity extraction',
        'Global reach',
      ],
      pricing: {
        basic: 35000,
        premium: 70000,
        currency: 'IDR',
      },
      languages: ['Indonesian', 'English'],
      logo: '/logos/jumio.png',
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDocumentUpload = (documentId: string) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === documentId ? { ...doc, status: 'uploaded' } : doc
      )
    );
  };

  const handleStepNext = () => {
    const stepOrder: KYCStep[] = [
      'intro',
      'provider',
      'personal',
      'document',
      'verification',
      'processing',
      'identity',
      'complete',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleStepBack = () => {
    const stepOrder: KYCStep[] = [
      'intro',
      'provider',
      'personal',
      'document',
      'verification',
      'processing',
      'identity',
      'complete',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  // Enhanced KYC processing with provider integration



  // Enhanced error handling
  const handleKYCError = (errorCode: string, retryable: boolean = true) => {
    const errorData = {
      errorCode,
      errorType: 'provider',
      message: `KYC verification failed: ${errorCode}`,
      userMessage: 'There was an issue with your verification. Please try again.',
      retryable,
      suggestedAction: retryable ? 'retry' : 'contact_support',
      supportReference: `REF-${Date.now()}`,
    };

    setError(errorData);
    setKycStatus('failed');
  };

  const retryKYCProcess = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setKycStatus('pending');
    if (kycSession) {
      startStatusPolling(kycSession.id);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const simulateKYCProcess = (
    result: 'success' | 'failed' | 'manual_review'
  ) => {
    if (!kycSession) return;

    setCurrentStep('processing');

    if (result === 'success') {
      startStatusPolling(kycSession.id);
    } else if (result === 'failed') {
      setTimeout(() => {
        handleKYCError('VERIFICATION_FAILED', true);
      }, 2000);
    } else if (result === 'manual_review') {
      setTimeout(() => {
        setKycStatus('manual_review');
        setKycSession(prev =>
          prev ? { ...prev, status: 'processing', updatedAt: new Date().toISOString() } : null
        );
      }, 2000);
    }
  };

  const renderIntroStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          One-Time Identity Verification
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Complete your identity verification once and gain access to all
          investment opportunities on the Partisipro platform. This process
          creates a permanent identity record that eliminates the need for
          per-project verification.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <UserCheck className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-blue-900">
            What is ERC-3643 Identity Registry?
          </h3>
        </div>
        <p className="text-blue-800 mb-4">
          Our platform uses the ERC-3643 standard for identity management. This
          means your identity verification creates a permanent, secure record on
          the blockchain that can be used across all platform services.
        </p>
        <div className="space-y-3">
          <div className="flex items-center text-blue-800">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
            <span>One-time verification for all investments</span>
          </div>
          <div className="flex items-center text-blue-800">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
            <span>Secure blockchain-based identity storage</span>
          </div>
          <div className="flex items-center text-blue-800">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
            <span>Claims-based verification system</span>
          </div>
          <div className="flex items-center text-blue-800">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
            <span>Instant access to all platform features</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
          <h3 className="text-lg font-semibold text-yellow-900">
            What You&apos;ll Need
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center text-yellow-800">
            <FileText className="w-5 h-5 text-yellow-600 mr-3" />
            <span>Indonesian ID Card (KTP)</span>
          </div>
          <div className="flex items-center text-yellow-800">
            <Camera className="w-5 h-5 text-yellow-600 mr-3" />
            <span>Selfie with ID for verification</span>
          </div>
          <div className="flex items-center text-yellow-800">
            <FileText className="w-5 h-5 text-yellow-600 mr-3" />
            <span>Proof of address document</span>
          </div>
          <div className="flex items-center text-yellow-800">
            <Clock className="w-5 h-5 text-yellow-600 mr-3" />
            <span>5-10 minutes of your time</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Verification Process Steps
        </h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Personal Information
              </h4>
              <p className="text-sm text-gray-600">
                Provide your basic personal details
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Document Upload</h4>
              <p className="text-sm text-gray-600">
                Upload clear photos of your documents
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Third-Party Verification
              </h4>
              <p className="text-sm text-gray-600">
                Our KYC provider verifies your identity
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold">4</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Identity Registry Creation
              </h4>
              <p className="text-sm text-gray-600">
                Your verified identity is stored on the blockchain
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold">5</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Complete Access</h4>
              <p className="text-sm text-gray-600">
                Start investing in all platform projects
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <Button onClick={handleStepNext} variant="primary" className="px-8">
          Start Identity Verification
        </Button>
      </div>
    </div>
  );

  const renderIdentityStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCheck className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Identity Registry Created
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your identity has been successfully verified and registered on the
          blockchain. The following claims have been issued to your identity.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-green-600 mr-3" />
          <h3 className="text-lg font-semibold text-green-900">
            Identity Claims Issued
          </h3>
        </div>
        <p className="text-green-800 mb-4">
          Your identity now contains verified claims that enable access to all
          platform features. These claims are permanently stored and can be used
          for future investments.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Identity Claims
        </h3>
        {identityClaims.map(claim => (
          <div
            key={claim.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {claim.type.replace('_', ' ')}
                </h4>
                <p className="text-sm text-gray-600">{claim.description}</p>
                <p className="text-xs text-gray-500">
                  Issued by: {claim.issuer}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ISSUED
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <UserCheck className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-blue-900">
            What This Means for You
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center text-blue-800">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
            <span>You can now invest in any project on the platform</span>
          </div>
          <div className="flex items-center text-blue-800">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
            <span>
              No additional verification required for future investments
            </span>
          </div>
          <div className="flex items-center text-blue-800">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
            <span>
              Your identity is secure and portable across the platform
            </span>
          </div>
          <div className="flex items-center text-blue-800">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
            <span>Access to governance features and profit claiming</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button onClick={handleStepBack} variant="secondary">
          Back
        </Button>
        <Button onClick={handleStepNext} variant="primary">
          Complete Setup
        </Button>
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isActive
                  ? 'border-primary-500 bg-primary-50'
                  : isCompleted
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300 bg-gray-50'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive
                    ? 'text-primary-500'
                    : isCompleted
                      ? 'text-white'
                      : 'text-gray-400'
                }`}
              />
            </div>
            <span
              className={`ml-2 text-sm font-medium ${
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
                className={`w-12 h-0.5 mx-4 ${
                  isCompleted ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderPersonalInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Personal Information
        </h2>
        <p className="text-gray-600">
          Please provide your personal details as they appear on your ID.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID Number (KTP) <span className="text-red-500">*</span>
          </label>
          <Input
            name="idNumber"
            value={formData.idNumber}
            onChange={handleInputChange}
            placeholder="Enter your KTP number"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <Input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="+62 812 3456 7890"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Occupation <span className="text-red-500">*</span>
          </label>
          <select
            name="occupation"
            value={formData.occupation}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Select occupation</option>
            <option value="employee">Employee</option>
            <option value="entrepreneur">Entrepreneur</option>
            <option value="professional">Professional</option>
            <option value="student">Student</option>
            <option value="retiree">Retiree</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <Input
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Enter your complete address"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source of Funds <span className="text-red-500">*</span>
          </label>
          <select
            name="sourceOfFunds"
            value={formData.sourceOfFunds}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Select source of funds</option>
            <option value="salary">Salary</option>
            <option value="business">Business Income</option>
            <option value="investment">Investment Returns</option>
            <option value="savings">Savings</option>
            <option value="inheritance">Inheritance</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button
          onClick={handleStepNext}
          variant="primary"
          disabled={
            !formData.fullName ||
            !formData.idNumber ||
            !formData.phoneNumber ||
            !formData.occupation ||
            !formData.address ||
            !formData.sourceOfFunds
          }
        >
          Next: Upload Documents
        </Button>
      </div>
    </div>
  );

  const renderDocumentUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Document Upload
        </h2>
        <p className="text-gray-600">
          Upload clear, readable photos of your documents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documents.map(doc => (
          <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">{doc.name}</h3>
                <p className="text-sm text-gray-500">
                  {doc.required ? 'Required' : 'Optional'}
                </p>
              </div>
              <div
                className={`px-2 py-1 rounded text-xs font-medium ${
                  doc.status === 'uploaded'
                    ? 'bg-primary-100 text-primary-800'
                    : doc.status === 'verified'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {doc.status === 'uploaded'
                  ? 'Uploaded'
                  : doc.status === 'verified'
                    ? 'Verified'
                    : 'Pending'}
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {doc.status === 'uploaded' ? (
                <div className="text-primary-600">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">
                    Document uploaded successfully
                  </p>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs">PNG, JPG up to 10MB</p>
                  <Button
                    onClick={() => handleDocumentUpload(doc.id)}
                    variant="secondary"
                    className="mt-3"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Upload {doc.name}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-6">
        <Button onClick={handleStepBack} variant="secondary">
          Back
        </Button>
        <Button
          onClick={handleStepNext}
          variant="primary"
          disabled={documents
            .filter(d => d.required)
            .some(d => d.status === 'pending')}
        >
          Next: Verification
        </Button>
      </div>
    </div>
  );

  // New Provider Selection Step
  const renderProviderSelectionStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Choose Your KYC Provider
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select a trusted verification provider to complete your identity
          verification. Each provider offers different features and processing
          times.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(provider => (
          <div
            key={provider.id}
            className={`border rounded-lg p-6 cursor-pointer transition-all duration-200 ${
              selectedProvider?.id === provider.id
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => setSelectedProvider(provider)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">
                    {provider.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {provider.name}
                  </h3>
                  <div className="flex items-center mt-1">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        provider.isAvailable
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                    <span className="text-xs text-gray-500 capitalize">
                      {provider.isAvailable ? 'available' : 'unavailable'}
                    </span>
                  </div>
                </div>
              </div>
              {selectedProvider?.id === provider.id && (
                <CheckCircle className="w-5 h-5 text-primary-600" />
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4">{provider.description}</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Processing Time:</span>
                <span className="font-medium text-gray-900">
                  {provider.processingTime}
                </span>
              </div>

              <div>
                <span className="text-sm text-gray-500 block mb-2">
                  Features:
                </span>
                <div className="flex flex-wrap gap-1">
                  {provider.features.slice(0, 2).map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                  {provider.features.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{provider.features.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProvider && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <div className="flex items-center mb-4">
            <Eye className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-900">
              {selectedProvider.name} - Detailed Features
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                Supported Documents:
              </h4>
              <ul className="space-y-1">
                {selectedProvider.supportedDocuments.map((docType, index) => (
                  <li key={index} className="flex items-center text-blue-800">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                    <span>{docType}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-blue-900 mb-2">All Features:</h4>
              <ul className="space-y-1">
                {selectedProvider.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-blue-800">
                    <Zap className="w-4 h-4 text-blue-600 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <div className="flex items-center mb-2">
              <Globe className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">
                Supported Countries:
              </span>
            </div>
            <p className="text-blue-800">
              {selectedProvider.regions.join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button onClick={handleStepBack} variant="secondary">
          Back
        </Button>
        <Button
          onClick={async () => {
            if (selectedProvider) {
              await handleInitiateKYC();
            }
          }}
          variant="primary"
          disabled={!selectedProvider}
        >
          Continue with {selectedProvider?.name || 'Selected Provider'}
        </Button>
      </div>
    </div>
  );

  // Enhanced Processing Step
  const renderProcessingStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Timer className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Processing Your Verification
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {selectedProvider?.name} is now verifying your identity using advanced
          AI and machine learning. This process typically takes{' '}
          {selectedProvider?.processingTime}.
        </p>
      </div>

      {/* Real-time Status Display */}
      {kycSession && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">
                  {selectedProvider?.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedProvider?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Session ID: {kycSession.id.slice(-8)}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {pollingActive && (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mr-2" />
              )}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  kycSession.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : kycSession.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {kycSession.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Verification Checks:</h4>
            {kycSession.checks.map(check => (
              <div
                key={check.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      check.status === 'completed'
                        ? 'bg-green-100'
                        : check.status === 'processing'
                          ? 'bg-yellow-100'
                          : check.status === 'failed'
                            ? 'bg-red-100'
                            : 'bg-gray-100'
                    }`}
                  >
                    {check.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : check.status === 'processing' ? (
                      <Clock className="w-5 h-5 text-yellow-600 animate-spin" />
                    ) : check.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 capitalize">
                      {check.type.replace('_', ' ')} Check
                    </h5>
                    {check.result?.score && (
                      <p className="text-sm text-gray-500">
                        Score: {(check.result.score * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    check.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : check.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : check.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claims Issuance Status */}
      {claimsIssuance && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Lock className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-900">
              Issuing Identity Claims
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">Claims Issuance Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  claimsIssuance.issuanceStatus === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : claimsIssuance.issuanceStatus === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                }`}
              >
                {claimsIssuance.issuanceStatus}
              </span>
            </div>

            {claimsIssuance.transactionHash && (
              <div className="flex items-center justify-between">
                <span className="text-blue-800">Transaction Hash:</span>
                <span className="text-blue-600 font-mono text-sm">
                  {claimsIssuance.transactionHash}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-blue-900 mb-2">Claims to Issue:</h4>
            <div className="space-y-2">
              {claimsIssuance.claimsToIssue.map((claim, index) => (
                <div key={index} className="flex items-center">
                  <Award className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-blue-800">
                    {claim.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Test Controls */}
      {kycStatus === 'pending' && kycSession && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">
            Testing Controls (Demo Mode)
          </h3>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => simulateKYCProcess('success')}
              variant="primary"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Simulate Success
            </Button>
            <Button
              onClick={() => simulateKYCProcess('failed')}
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Simulate Failure
            </Button>
            <Button
              onClick={() => simulateKYCProcess('manual_review')}
              variant="primary"
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              Manual Review
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <XCircle className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-red-900">
              Verification Error
            </h3>
          </div>

          <p className="text-red-800 mb-4">{error.userMessage}</p>

          <div className="space-y-2 text-sm text-red-700">
            <div className="flex justify-between">
              <span>Error Code:</span>
              <span className="font-mono">{error.errorCode}</span>
            </div>
            <div className="flex justify-between">
              <span>Support Reference:</span>
              <span className="font-mono">{error.supportReference}</span>
            </div>
          </div>

          {error.retryable && (
            <div className="mt-4 flex gap-3">
              <Button
                onClick={retryKYCProcess}
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Verification (Attempt {retryCount + 1})
              </Button>
              <Button
                onClick={() => setCurrentStep('document')}
                variant="secondary"
              >
                Upload New Documents
              </Button>
            </div>
          )}
        </div>
      )}

      {kycStatus === 'manual_review' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Eye className="w-6 h-6 text-orange-600 mr-3" />
            <h3 className="text-lg font-semibold text-orange-900">
              Manual Review Required
            </h3>
          </div>
          <p className="text-orange-800 mb-4">
            Your verification requires manual review by our compliance team.
            This typically takes 1-2 business days. You will receive an email
            notification once complete.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                // Simulate manual review completion
                setTimeout(() => {
                  simulateKYCProcess('success');
                }, 2000);
              }}
              variant="primary"
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Timer className="w-4 h-4 mr-2" />
              Simulate Review Complete
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button onClick={handleStepBack} variant="secondary">
          Back
        </Button>
        {kycStatus === 'success' && (
          <Button onClick={handleStepNext} variant="primary">
            <ArrowRight className="w-4 h-4 mr-2" />
            View Identity Claims
          </Button>
        )}
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Ready for Verification
        </h2>
        <p className="text-gray-600">
          Your documents and information are ready for {selectedProvider?.name}{' '}
          verification.
        </p>
      </div>

      {selectedProvider && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">
                {selectedProvider.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">
                {selectedProvider.name}
              </h3>
              <p className="text-sm text-blue-700">
                Processing Time: {selectedProvider.processingTime}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-blue-100 rounded-lg">
              <Smartphone className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-blue-900">
                Mobile Optimized
              </p>
            </div>
            <div className="text-center p-3 bg-blue-100 rounded-lg">
              <Lock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-blue-900">
                Bank-Level Security
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">
          Verification Process:
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold text-sm">1</span>
            </div>
            <span className="text-gray-700">
              Document authenticity verification
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold text-sm">2</span>
            </div>
            <span className="text-gray-700">Facial similarity matching</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold text-sm">3</span>
            </div>
            <span className="text-gray-700">Liveness detection</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold text-sm">4</span>
            </div>
            <span className="text-gray-700">AML and sanctions screening</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button onClick={handleStepBack} variant="secondary">
          Back
        </Button>
        <Button onClick={handleStepNext} variant="primary">
          <ExternalLink className="w-4 h-4 mr-2" />
          Start Verification
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Identity Registry Setup Complete!
        </h2>
        <p className="text-gray-600">
          Your ERC-3643 identity has been successfully created and verified. You
          now have permanent access to all platform features.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-green-600 mr-3" />
          <h3 className="font-medium text-green-900">
            Your Identity is Now Active
          </h3>
        </div>
        <p className="text-green-800 mb-4">
          Your blockchain-based identity contains verified claims that enable
          seamless access to all investment opportunities without additional
          verification.
        </p>
        <div className="text-center">
          <Link href="/identity" className="inline-block">
            <Button
              variant="secondary"
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              View Your Identity Status
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">What&apos;s Next?</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-gray-700">
              Browse available investment projects (no additional verification
              needed)
            </span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-gray-700">
              Invest in any project with one-click approval
            </span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-gray-700">
              Access governance features and profit claiming
            </span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-gray-700">
              Manage your identity claims and verification status
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <Link href="/marketplace">
          <Button variant="primary">Browse Projects</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="secondary">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Partisipro
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {selectedProvider && (
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center mr-2">
                    <span className="text-white font-bold text-xs">
                      {selectedProvider.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {selectedProvider.name}
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-500">
                Step {steps.findIndex(s => s.id === currentStep) + 1} of{' '}
                {steps.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {renderStepIndicator()}

          {currentStep === 'intro' && renderIntroStep()}
          {currentStep === 'provider' && renderProviderSelectionStep()}
          {currentStep === 'personal' && renderPersonalInfoStep()}
          {currentStep === 'document' && renderDocumentUploadStep()}
          {currentStep === 'verification' && renderVerificationStep()}
          {currentStep === 'processing' && renderProcessingStep()}
          {currentStep === 'identity' && renderIdentityStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
}
