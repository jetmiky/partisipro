'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card } from '@/components/ui';

type InvestmentStep =
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

// Mock project data (simplified from project details)
const mockProjectData = {
  '1': {
    id: '1',
    title: 'Jakarta-Bandung High-Speed Rail Extension',
    expectedReturn: 12.5,
    duration: 25,
    minimumInvestment: 1000000,
    riskLevel: 'medium',
    status: 'active',
  },
};

export default function InvestmentFlowPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<InvestmentStep>('amount');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>('');
  const [processingMessage, setProcessingMessage] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

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

    // Mock API call
    setTimeout(() => {
      const projectData =
        mockProjectData[projectId as keyof typeof mockProjectData];
      setProject(projectData);
    }, 500);
  }, [params.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateReturns = () => {
    const amount = parseFloat(investmentAmount.replace(/[^\d]/g, ''));
    if (!amount || !project) return null;

    const annualReturn = (amount * project.expectedReturn) / 100;
    const totalReturn = annualReturn * project.duration;

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

  const simulatePayment = (result: 'success' | 'failed') => {
    setIsProcessing(true);
    setCurrentStep('processing');
    setProcessingMessage('Processing your investment...');

    setTimeout(() => {
      setProcessingMessage('Verifying payment details...');
    }, 1000);

    setTimeout(() => {
      setProcessingMessage('Allocating tokens...');
    }, 2000);

    setTimeout(() => {
      setIsProcessing(false);
      if (result === 'success') {
        setCurrentStep('success');
      } else {
        setCurrentStep('failed');
      }
    }, 3000);
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'amount', label: 'Amount' },
      { id: 'payment', label: 'Payment' },
      { id: 'confirmation', label: 'Confirmation' },
      { id: 'processing', label: 'Processing' },
      { id: 'success', label: 'Complete' },
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted =
            steps.findIndex(s => s.id === currentStep) > index;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isActive
                    ? 'border-primary-500 bg-primary-50'
                    : isCompleted
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 bg-gray-50'
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isActive
                      ? 'text-primary-500'
                      : isCompleted
                        ? 'text-white'
                        : 'text-gray-400'
                  }`}
                >
                  {index + 1}
                </span>
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
                  className={`w-8 h-0.5 mx-2 ${
                    isCompleted ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderAmountStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Investment Amount
        </h2>
        <p className="text-gray-600">
          Enter the amount you want to invest in this project
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Investment Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Amount
                </label>
                <Input
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
                <p className="text-sm text-gray-500 mt-1">
                  Minimum investment:{' '}
                  {formatCurrency(project?.minimumInvestment || 0)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1000000, 5000000, 10000000].map(amount => (
                  <Button
                    key={amount}
                    variant="secondary"
                    className="text-xs"
                    onClick={() => setInvestmentAmount(amount.toString())}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Investment Summary
            </h3>

            {calculateReturns() && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Investment Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(parseFloat(investmentAmount))}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Expected Annual Return</span>
                  <span className="font-semibold text-primary-600">
                    {project?.expectedReturn}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">
                    {project?.duration} years
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Annual Return</span>
                    <span className="font-semibold">
                      {formatCurrency(calculateReturns()!.annual)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Total Return</span>
                    <span className="font-semibold">
                      {formatCurrency(calculateReturns()!.total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-semibold text-gray-900">
                      Final Value
                    </span>
                    <span className="font-bold text-primary-600 text-lg">
                      {formatCurrency(calculateReturns()!.finalValue)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <Button
          onClick={handleNextStep}
          variant="primary"
          disabled={
            !investmentAmount ||
            parseFloat(investmentAmount) < (project?.minimumInvestment || 0)
          }
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Select Payment Method
        </h2>
        <p className="text-gray-600">
          Choose how you want to pay for your investment
        </p>
      </div>

      <div className="space-y-4">
        {paymentMethods.map(method => (
          <Card
            key={method.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedPaymentMethod === method.id
                ? 'border-primary-500 bg-primary-50'
                : 'hover:border-gray-300'
            }`}
            onClick={() => setSelectedPaymentMethod(method.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-lg ${
                    method.type === 'bank'
                      ? 'bg-blue-100'
                      : method.type === 'ewallet'
                        ? 'bg-green-100'
                        : 'bg-purple-100'
                  }`}
                >
                  {method.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{method.name}</h3>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {method.fee > 0 ? formatCurrency(method.fee) : 'Free'}
                </div>
                <div className="text-xs text-gray-500">
                  {method.processingTime}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <Button onClick={handleBackStep} variant="secondary">
          Back
        </Button>
        <Button
          onClick={handleNextStep}
          variant="primary"
          disabled={!selectedPaymentMethod}
        >
          Continue to Confirmation
        </Button>
      </div>
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
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Confirm Investment
          </h2>
          <p className="text-gray-600">
            Please review your investment details before proceeding
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Investment Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Project</span>
                <span className="font-medium">{project?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Investment Amount</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">{selectedMethod?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee</span>
                <span className="font-medium">
                  {formatCurrency(selectedMethod?.fee || 0)}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">
                    Total Amount
                  </span>
                  <span className="font-bold text-lg">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Terms and Conditions
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={agreementAccepted}
                  onChange={e => setAgreementAccepted(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="agreement" className="text-sm text-gray-700">
                  I agree to the{' '}
                  <Link
                    href="/legal"
                    className="text-primary-600 hover:underline"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/legal"
                    className="text-primary-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="risk"
                  checked={riskAcknowledged}
                  onChange={e => setRiskAcknowledged(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="risk" className="text-sm text-gray-700">
                  I understand the risks involved in this investment and
                  acknowledge that returns are not guaranteed
                </label>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-between mt-8">
          <Button onClick={handleBackStep} variant="secondary">
            Back
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={() => simulatePayment('success')}
              variant="primary"
              disabled={!agreementAccepted || !riskAcknowledged}
            >
              Confirm Investment
            </Button>
            <Button
              onClick={() => simulatePayment('failed')}
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              disabled={!agreementAccepted || !riskAcknowledged}
            >
              Simulate Failure
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div className="max-w-md mx-auto text-center">
      <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock className="w-10 h-10 text-primary-600 animate-spin" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Processing Investment
      </h2>
      <p className="text-gray-600 mb-6">
        Please wait while we process your investment
      </p>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-700">{processingMessage}</p>
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full animate-pulse"
            style={{ width: '60%' }}
          ></div>
        </div>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="max-w-md mx-auto text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Investment Successful!
      </h2>
      <p className="text-gray-600 mb-6">
        Your investment has been processed successfully
      </p>

      <Card className="p-6 text-left mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Investment Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Invested</span>
            <span className="font-medium">
              {formatCurrency(parseFloat(investmentAmount))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction ID</span>
            <span className="font-medium">TXN-{Date.now()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date</span>
            <span className="font-medium">
              {new Date().toLocaleDateString('id-ID')}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <Link href="/dashboard">
          <Button variant="primary" className="w-full">
            View Dashboard
          </Button>
        </Link>
        <Link href="/marketplace">
          <Button variant="secondary" className="w-full">
            Browse More Projects
          </Button>
        </Link>
      </div>
    </div>
  );

  const renderFailedStep = () => (
    <div className="max-w-md mx-auto text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-600" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Investment Failed
      </h2>
      <p className="text-gray-600 mb-6">
        There was an issue processing your investment
      </p>

      <Card className="p-6 text-left mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 mb-1">
              Payment could not be processed
            </h3>
            <p className="text-sm text-gray-600">
              This could be due to insufficient funds, network issues, or
              payment method restrictions.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => setCurrentStep('payment')}
          variant="primary"
          className="w-full"
        >
          Try Again
        </Button>
        <Link href="/marketplace">
          <Button variant="secondary" className="w-full">
            Back to Marketplace
          </Button>
        </Link>
      </div>
    </div>
  );

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading investment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push(`/projects/${project.id}`)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Project
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  Investment
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">{project.title}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {renderStepIndicator()}

          {currentStep === 'amount' && renderAmountStep()}
          {currentStep === 'payment' && renderPaymentStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}
          {currentStep === 'processing' && renderProcessingStep()}
          {currentStep === 'success' && renderSuccessStep()}
          {currentStep === 'failed' && renderFailedStep()}
        </div>
      </div>
    </div>
  );
}
