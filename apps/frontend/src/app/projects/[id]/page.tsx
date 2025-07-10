'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Building,
  Route,
  Zap,
  Droplets,
  Shield,
  FileText,
  Download,
  Calculator,
  AlertTriangle,
  Layers,
  Star,
  MessageSquare,
  Share2,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card } from '@/components/ui';

// Mock project data (same as marketplace but more detailed)
const mockProjectData = {
  '1': {
    id: '1',
    title: 'Jakarta-Bandung High-Speed Rail Extension',
    description:
      'Expansion of the existing high-speed rail network to connect Jakarta-Bandung with Surabaya, reducing travel time by 60%. This strategic infrastructure project will boost economic development across Java and provide efficient intercity transportation.',
    category: 'transportation',
    location: 'Jakarta - Surabaya',
    province: 'Jawa Barat',
    totalValue: 50000000000,
    targetAmount: 15000000000,
    raisedAmount: 8500000000,
    minimumInvestment: 1000000,
    expectedReturn: 12.5,
    duration: 25,
    startDate: '2024-03-15',
    endDate: '2049-03-15',
    status: 'active',
    investorCount: 1247,
    riskLevel: 'medium',
    image: '/images/projects/rail.jpg',
    highlights: [
      'Government backed',
      'Strategic location',
      'Proven technology',
    ],
    detailedDescription: `
      The Jakarta-Bandung High-Speed Rail Extension represents a transformative infrastructure project that will revolutionize intercity transportation across Java. Building upon the success of the existing Jakarta-Bandung high-speed rail line, this extension will create a comprehensive network connecting major economic centers.

      Key features include:
      • 350 km of new high-speed rail track
      • 8 new stations with modern facilities
      • Maximum speed of 350 km/h
      • Integration with existing transportation networks
      • Smart ticketing and passenger management systems

      The project will significantly reduce travel time between Jakarta and Surabaya from 10 hours to just 3.5 hours, making it a game-changer for business and leisure travel. Environmental benefits include reduced carbon emissions compared to road and air travel.
    `,
    financialProjections: {
      year1: { revenue: 2800000000, profit: 840000000, returnRate: 5.6 },
      year2: { revenue: 3200000000, profit: 1120000000, returnRate: 7.5 },
      year3: { revenue: 3600000000, profit: 1440000000, returnRate: 9.6 },
      year4: { revenue: 4000000000, profit: 1800000000, returnRate: 12.0 },
      year5: { revenue: 4400000000, profit: 2200000000, returnRate: 14.7 },
    },
    risks: [
      {
        level: 'Low',
        description: 'Construction delays due to weather',
        probability: 20,
      },
      {
        level: 'Medium',
        description: 'Technology integration challenges',
        probability: 15,
      },
      {
        level: 'Low',
        description: 'Government policy changes',
        probability: 10,
      },
      {
        level: 'Medium',
        description: 'Economic downturn affecting ridership',
        probability: 25,
      },
    ],
    legalDocuments: [
      { name: 'Project Prospectus', size: '2.4 MB', type: 'PDF' },
      { name: 'Environmental Impact Assessment', size: '8.7 MB', type: 'PDF' },
      { name: 'Government Concession Agreement', size: '1.2 MB', type: 'PDF' },
      { name: 'Financial Audit Report', size: '3.1 MB', type: 'PDF' },
      { name: 'Technical Specifications', size: '15.6 MB', type: 'PDF' },
    ],
    updates: [
      {
        date: '2024-01-15',
        title: 'Environmental clearance obtained',
        description: 'All environmental permits have been secured.',
      },
      {
        date: '2024-01-10',
        title: 'Construction milestone achieved',
        description: '25% of track laying completed ahead of schedule.',
      },
      {
        date: '2024-01-05',
        title: 'Technology partner announced',
        description:
          'Partnership with Japanese railway technology company confirmed.',
      },
    ],
    keyMetrics: {
      totalPassengers: 12000000,
      dailyCapacity: 50000,
      jobsCreated: 15000,
      carbonReduction: 180000,
    },
  },
  // Add more project data for other IDs...
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    const projectId = params.id as string;

    // Mock API call
    setTimeout(() => {
      const projectData =
        mockProjectData[projectId as keyof typeof mockProjectData];
      setProject(projectData);
      setLoading(false);
    }, 1000);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Project not found
          </h3>
          <p className="text-gray-600 mb-4">
            The project you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Button onClick={() => router.push('/marketplace')} variant="primary">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'coming_soon':
        return 'bg-blue-100 text-blue-800';
      case 'fully_funded':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transportation':
        return Route;
      case 'energy':
        return Zap;
      case 'water':
        return Droplets;
      case 'telecommunications':
        return Building;
      case 'buildings':
        return Building;
      default:
        return Building;
    }
  };

  const progressPercentage =
    (project.raisedAmount / project.targetAmount) * 100;
  const Icon = getCategoryIcon(project.category);

  const calculateReturns = () => {
    const amount = parseFloat(investmentAmount.replace(/[^\d]/g, ''));
    if (!amount || amount < project.minimumInvestment) return null;

    const annualReturn = (amount * project.expectedReturn) / 100;
    const totalReturn = annualReturn * project.duration;

    return {
      annual: annualReturn,
      total: totalReturn,
      finalValue: amount + totalReturn,
    };
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'financials', label: 'Financials', icon: BarChart3 },
    { id: 'risks', label: 'Risks', icon: Shield },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'updates', label: 'Updates', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/marketplace')}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Marketplace
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  Project Details
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="secondary" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project Image */}
            <div className="lg:col-span-2">
              <div className="aspect-video bg-gray-200 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}
                  >
                    {project.status === 'active' ? 'Active' : project.status}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm capitalize">
                      {project.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{project.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Investment Overview
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Expected Return</span>
                    <span className="font-semibold text-primary-600 text-lg">
                      {project.expectedReturn}% p.a.
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold">
                      {project.duration} years
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Min. Investment</span>
                    <span className="font-semibold">
                      {formatCurrency(project.minimumInvestment)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold">
                        {progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(progressPercentage, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{formatCurrency(project.raisedAmount)}</span>
                      <span>{formatCurrency(project.targetAmount)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Investors</span>
                      <span className="font-medium">
                        {project.investorCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Days remaining</span>
                      <span className="font-medium">245 days</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    onClick={() => setShowCalculator(!showCalculator)}
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Investment Calculator
                  </Button>

                  {project.status === 'active' && (
                    <Link href={`/invest/${project.id}`}>
                      <Button variant="primary" className="w-full">
                        Invest Now
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>

              {/* Investment Calculator */}
              {showCalculator && (
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Calculate Returns
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Investment Amount
                      </label>
                      <Input
                        type="text"
                        value={investmentAmount}
                        onChange={e => setInvestmentAmount(e.target.value)}
                        placeholder={`Min. ${formatCurrency(project.minimumInvestment)}`}
                      />
                    </div>

                    {calculateReturns() && (
                      <div className="bg-primary-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Annual Return
                          </span>
                          <span className="font-medium">
                            {formatCurrency(calculateReturns()!.annual)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Total Return
                          </span>
                          <span className="font-medium">
                            {formatCurrency(calculateReturns()!.total)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium text-gray-900">
                            Final Value
                          </span>
                          <span className="font-bold text-primary-600">
                            {formatCurrency(calculateReturns()!.finalValue)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Project Title and Description */}
          <div className="mt-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {project.title}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {project.description}
            </p>

            {/* Highlights */}
            <div className="mt-6 flex flex-wrap gap-2">
              {project.highlights.map((highlight: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Project Details
              </h2>
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-line text-gray-700">
                  {project.detailedDescription}
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Key Metrics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold text-primary-600">
                    {project.keyMetrics.totalPassengers.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Annual Passengers</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-primary-600">
                    {project.keyMetrics.dailyCapacity.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Daily Capacity</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-primary-600">
                    {project.keyMetrics.jobsCreated.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Jobs Created</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-primary-600">
                    {project.keyMetrics.carbonReduction.toLocaleString()}t
                  </div>
                  <div className="text-sm text-gray-600">CO2 Reduction</div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Financial Projections
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">
                  Revenue Projections
                </h3>
                <div className="space-y-3">
                  {Object.entries(project.financialProjections).map(
                    ([year, data]: [string, any]) => (
                      <div
                        key={year}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-600">
                          Year {year.slice(-1)}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(data.revenue)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">
                  Expected Returns
                </h3>
                <div className="space-y-3">
                  {Object.entries(project.financialProjections).map(
                    ([year, data]: [string, any]) => (
                      <div
                        key={year}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-600">
                          Year {year.slice(-1)}
                        </span>
                        <span className="font-medium text-primary-600">
                          {data.returnRate}%
                        </span>
                      </div>
                    )
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Risk Analysis
            </h2>
            <div className="space-y-4">
              {project.risks.map((risk: any, index: number) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            risk.level === 'Low'
                              ? 'bg-green-100 text-green-800'
                              : risk.level === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {risk.level} Risk
                        </span>
                        <span className="text-sm text-gray-500">
                          {risk.probability}% probability
                        </span>
                      </div>
                      <p className="text-gray-700">{risk.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Legal Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.legalDocuments.map((doc: any, index: number) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {doc.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {doc.type} • {doc.size}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'updates' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Project Updates
            </h2>
            <div className="space-y-6">
              {project.updates.map((update: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">
                        {update.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {update.date}
                      </span>
                    </div>
                    <p className="text-gray-700">{update.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
