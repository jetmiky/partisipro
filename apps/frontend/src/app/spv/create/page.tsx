/* eslint-disable no-case-declarations */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface ProjectFormData {
  // Basic Information
  projectName: string;
  projectType: string;
  location: string;
  description: string;

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
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    projectType: '',
    location: '',
    description: '',
    totalValue: 0,
    tokenSupply: 0,
    tokenPrice: 0,
    minimumInvestment: 0,
    offeringStart: '',
    offeringEnd: '',
    projectStart: '',
    projectEnd: '',
    businessPlan: null,
    feasibilityStudy: null,
    environmentalImpact: null,
    governmentApproval: null,
    expectedAnnualRevenue: 0,
    profitDistributionFrequency: 'quarterly',
    managementFeePercentage: 5,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const totalSteps = 4;
  const stepTitles = [
    'Basic Information',
    'Financial Parameters',
    'Timeline & Documentation',
    'Revenue Model & Review',
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
        if (projectStart <= offeringEnd) {
          newErrors.projectStart = 'Project start must be after offering end';
        }
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
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

    setIsSubmitting(true);

    // TODO: Replace with real ProjectFactory contract integration
    // console.log('Submitting project:', formData);

    try {
      // Simulate project creation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate success
      alert('Project created successfully! Redirecting to SPV dashboard...');
      window.location.href = '/spv/dashboard';
    } catch (error) {
      // console.error('Project creation failed:', error);
      alert('Project creation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Basic Project Information
        </h2>
        <p className="text-gray-600 mb-6">
          Provide the fundamental details about your infrastructure project.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <div className="space-y-2">
            <label htmlFor="projectName">Project Name</label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={e => updateFormData('projectName', e.target.value)}
              placeholder="e.g., Jakarta-Bandung High-Speed Rail"
            />
            {errors.projectName ? (
              <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Type
          </label>
          <select
            value={formData.projectType}
            onChange={e => updateFormData('projectType', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.projectType ? 'border-red-500' : 'border-gray-300'
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
            <p className="mt-1 text-sm text-red-600">{errors.projectType}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="location">Location</label>
          <Input
            id="location"
            value={formData.location}
            onChange={e => updateFormData('location', e.target.value)}
            placeholder="e.g., Jakarta, Indonesia"
          />
          {errors.location ? (
            <p className="mt-1 text-sm text-red-600">{errors.location}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Description
          </label>
          <textarea
            value={formData.description}
            onChange={e => updateFormData('description', e.target.value)}
            rows={4}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Provide a detailed description of the project, its purpose, and expected impact..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Financial Parameters
        </h2>
        <p className="text-gray-600 mb-6">
          Define the tokenization structure and investment parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="totalValue">Total Project Value (IDR)</label>
          <Input
            id="totalValue"
            type="number"
            value={formData.totalValue || ''}
            onChange={e =>
              updateFormData('totalValue', parseFloat(e.target.value) || 0)
            }
            placeholder="1000000000"
          />
          {errors.totalValue && (
            <p className="mt-1 text-sm text-red-600">{errors.totalValue}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="tokenSupply">Total Token Supply</label>
          <Input
            id="tokenSupply"
            type="number"
            value={formData.tokenSupply || ''}
            onChange={e =>
              updateFormData('tokenSupply', parseFloat(e.target.value) || 0)
            }
            placeholder="1000000"
          />
          {errors.tokenSupply && (
            <p className="mt-1 text-sm text-red-600">{errors.tokenSupply}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="tokenPrice">Token Price (IDR)</label>
          <Input
            id="tokenPrice"
            type="number"
            value={formData.tokenPrice || ''}
            onChange={e =>
              updateFormData('tokenPrice', parseFloat(e.target.value) || 0)
            }
            placeholder="1000"
          />
          {errors.tokenPrice && (
            <p className="mt-1 text-sm text-red-600">{errors.tokenPrice}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="minimumInvestment">Minimum Investment (IDR)</label>
          <Input
            id="minimumInvestment"
            type="number"
            value={formData.minimumInvestment || ''}
            onChange={e =>
              updateFormData(
                'minimumInvestment',
                parseFloat(e.target.value) || 0
              )
            }
            placeholder="100000"
          />
          {errors.minimumInvestment && (
            <p className="mt-1 text-sm text-red-600">
              {errors.minimumInvestment}
            </p>
          )}
        </div>
      </div>

      {/* Calculation Summary */}
      {formData.totalValue > 0 && formData.tokenSupply > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            Tokenization Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total Fundraising Target:</span>
              <p className="font-medium text-blue-900">
                IDR{' '}
                {(formData.tokenSupply * formData.tokenPrice).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-blue-700">Funding Percentage:</span>
              <p className="font-medium text-blue-900">
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Timeline & Documentation
        </h2>
        <p className="text-gray-600 mb-6">
          Set project timeline and upload required legal documents.
        </p>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="offeringStart">Token Offering Start Date</label>
          <Input
            id="offeringStart"
            type="date"
            value={formData.offeringStart}
            onChange={e => updateFormData('offeringStart', e.target.value)}
          />
          {errors.offeringStart && (
            <p className="mt-1 text-sm text-red-600">{errors.offeringStart}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="offeringEnd">Token Offering End Date</label>
          <Input
            id="offeringEnd"
            type="date"
            value={formData.offeringEnd}
            onChange={e => updateFormData('offeringEnd', e.target.value)}
          />
          {errors.offeringEnd && (
            <p className="mt-1 text-sm text-red-600">{errors.offeringEnd}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="projectStart">Project Construction Start</label>
          <Input
            id="projectStart"
            type="date"
            value={formData.projectStart}
            onChange={e => updateFormData('projectStart', e.target.value)}
          />
          {errors.projectStart && (
            <p className="mt-1 text-sm text-red-600">{errors.projectStart}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="projectEnd">Project Operation End</label>
          <Input
            id="projectEnd"
            type="date"
            value={formData.projectEnd}
            onChange={e => updateFormData('projectEnd', e.target.value)}
          />
          {errors.projectEnd && (
            <p className="mt-1 text-sm text-red-600">{errors.projectEnd}</p>
          )}
        </div>
      </div>

      {/* Document Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Required Documents
        </h3>

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
          <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                {doc.label}{' '}
                {doc.required && <span className="text-red-500">*</span>}
              </label>
              {formData[doc.key as keyof ProjectFormData] && (
                <span className="text-sm text-green-600">✓ Uploaded</span>
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
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Revenue Model & Final Review
        </h2>
        <p className="text-gray-600 mb-6">
          Define profit distribution parameters and review all project details.
        </p>
      </div>

      {/* Revenue Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label
            htmlFor="expectedAnnualRevenue"
            className="text-sm font-medium text-gray-700"
          >
            Expected Annual Revenue (IDR)
          </label>
          <Input
            id="expectedAnnualRevenue"
            type="number"
            value={formData.expectedAnnualRevenue || ''}
            onChange={e =>
              updateFormData(
                'expectedAnnualRevenue',
                parseFloat(e.target.value) || 0
              )
            }
            placeholder="500000000"
          />

          {errors.expectedAnnualRevenue && (
            <p className="mt-1 text-sm text-red-600">
              {errors.expectedAnnualRevenue}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profit Distribution Frequency
          </label>
          <select
            value={formData.profitDistributionFrequency}
            onChange={e =>
              updateFormData('profitDistributionFrequency', e.target.value)
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="semi-annually">Semi-Annually</option>
            <option value="annually">Annually</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="platformFee"
            className="text-sm font-medium text-gray-700"
          >
            Platform Management Fee (%)
          </label>
          <Input
            id="platformFee"
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
        </div>
      </div>

      {/* Project Summary */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Project Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Project Name:</span>
            <p className="font-medium">{formData.projectName}</p>
          </div>
          <div>
            <span className="text-gray-600">Type:</span>
            <p className="font-medium">{formData.projectType}</p>
          </div>
          <div>
            <span className="text-gray-600">Total Value:</span>
            <p className="font-medium">
              IDR {formData.totalValue.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Token Supply:</span>
            <p className="font-medium">
              {formData.tokenSupply.toLocaleString()} tokens
            </p>
          </div>
          <div>
            <span className="text-gray-600">Token Price:</span>
            <p className="font-medium">
              IDR {formData.tokenPrice.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Expected Annual Revenue:</span>
            <p className="font-medium">
              IDR {formData.expectedAnnualRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Project
          </h1>
          <p className="text-gray-600 mt-2">
            Tokenize your infrastructure project for public-private partnership
            funding
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index + 1 === currentStep
                      ? 'bg-primary-500 text-white'
                      : index + 1 < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index + 1 < currentStep ? '✓' : index + 1}
                </div>
                {index < stepTitles.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="p-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
            >
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                className="bg-primary-500 hover:bg-primary-600"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={submitProject}
                disabled={isSubmitting}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {isSubmitting ? 'Creating Project...' : 'Create Project'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
