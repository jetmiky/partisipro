'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';

type KYCStep = 'personal' | 'document' | 'verification' | 'complete';
type KYCStatus = 'pending' | 'processing' | 'success' | 'failed';

interface DocumentUpload {
  id: string;
  name: string;
  status: 'pending' | 'uploaded' | 'verified';
  required: boolean;
}

export default function KYCPage() {
  const [currentStep, setCurrentStep] = useState<KYCStep>('personal');
  const [kycStatus, setKycStatus] = useState<KYCStatus>('pending');
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

  const steps = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'document', label: 'Document Upload', icon: FileText },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'complete', label: 'Complete', icon: CheckCircle },
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
      'personal',
      'document',
      'verification',
      'complete',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleStepBack = () => {
    const stepOrder: KYCStep[] = [
      'personal',
      'document',
      'verification',
      'complete',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const simulateKYCProcess = (result: 'success' | 'failed') => {
    setIsLoading(true);
    setKycStatus('processing');

    setTimeout(() => {
      setKycStatus(result);
      setIsLoading(false);
      if (result === 'success') {
        setCurrentStep('complete');
      }
    }, 3000);
  };

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

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Identity Verification
        </h2>
        <p className="text-gray-600">
          We will now verify your identity using our third-party KYC provider.
        </p>
      </div>

      {kycStatus === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="font-medium text-blue-900">
              Ready for Verification
            </h3>
          </div>
          <p className="text-blue-800 mb-4">
            Your documents are ready for verification. This process typically
            takes 1-3 business days.
          </p>
          <p className="text-sm text-blue-700 mb-4">
            For testing purposes, you can simulate the verification result:
          </p>
          <div className="flex gap-3">
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
          </div>
        </div>
      )}

      {kycStatus === 'processing' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-yellow-600 mr-2 animate-spin" />
            <h3 className="font-medium text-yellow-900">
              Processing Verification
            </h3>
          </div>
          <p className="text-yellow-800">
            Your identity is being verified. Please wait...
          </p>
          <div className="mt-4 bg-yellow-200 rounded-full h-2">
            <div
              className="bg-yellow-600 h-2 rounded-full animate-pulse"
              style={{ width: '60%' }}
            ></div>
          </div>
        </div>
      )}

      {kycStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="font-medium text-green-900">
              Verification Successful
            </h3>
          </div>
          <p className="text-green-800">
            Your identity has been successfully verified. You can now start
            investing!
          </p>
        </div>
      )}

      {kycStatus === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <XCircle className="w-6 h-6 text-red-600 mr-2" />
            <h3 className="font-medium text-red-900">Verification Failed</h3>
          </div>
          <p className="text-red-800 mb-4">
            Your identity verification was unsuccessful. Please check your
            documents and try again.
          </p>
          <Button
            onClick={() => {
              setKycStatus('pending');
              setCurrentStep('document');
            }}
            variant="secondary"
          >
            Upload Documents Again
          </Button>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button onClick={handleStepBack} variant="secondary">
          Back
        </Button>
        {kycStatus === 'success' && (
          <Button onClick={handleStepNext} variant="primary">
            Complete KYC
          </Button>
        )}
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
          KYC Verification Complete!
        </h2>
        <p className="text-gray-600">
          Your identity has been successfully verified. You can now explore
          investment opportunities.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">What&apos;s Next?</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-gray-700">
              Browse available investment projects
            </span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-gray-700">
              Set up your investment preferences
            </span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-gray-700">
              Start investing in PPP projects
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
            <div className="text-sm text-gray-500">
              Step {steps.findIndex(s => s.id === currentStep) + 1} of{' '}
              {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {renderStepIndicator()}

          {currentStep === 'personal' && renderPersonalInfoStep()}
          {currentStep === 'document' && renderDocumentUploadStep()}
          {currentStep === 'verification' && renderVerificationStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
}
