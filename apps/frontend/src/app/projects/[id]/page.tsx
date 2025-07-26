'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import type {
  Project,
  FinancialProjection,
  ProjectRisk,
  LegalDocument,
  ProjectUpdate,
} from '@/types';
import { Card } from '@/components/ui';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { ToastProvider, toast } from '@/components/ui/AnimatedNotification';
import Image from 'next/image';

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
  const { t } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    const projectId = '1';

    // Mock API call
    setTimeout(() => {
      const projectData =
        mockProjectData[projectId as keyof typeof mockProjectData];
      setProject(projectData as unknown as Project);
      setLoading(false);
    }, 1000);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Fluid Background Shapes */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 right-16"></div>
          <div className="fluid-shape-2 top-1/2 left-10"></div>
          <div className="fluid-shape-3 bottom-32 right-1/4"></div>
          <div className="fluid-shape-1 bottom-10 left-16"></div>
        </div>

        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <p className="text-primary-600 font-medium">
              {t('projectDetailPage.loading.title')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 right-16"></div>
          <div className="fluid-shape-2 top-1/2 left-10"></div>
          <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        </div>
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 feature-icon mx-auto mb-6 hover-scale">
              <AlertTriangle className="w-8 h-8 text-accent-500" />
            </div>
            <h3 className="text-xl font-semibold text-gradient mb-3">
              {t('projectDetailPage.notFound.title')}
            </h3>
            <p className="text-primary-600 mb-6 max-w-md">
              {t('projectDetailPage.notFound.description')}
            </p>
            <Button
              onClick={() => router.push('/marketplace')}
              className="btn-modern btn-modern-primary hover-lift"
            >
              {t('projectDetailPage.notFound.backToMarketplace')}
            </Button>
          </div>
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

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'active':
  //       return 'bg-gradient-to-r from-success-100 to-success-200 text-success-700';
  //     case 'coming_soon':
  //       return 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700';
  //     case 'fully_funded':
  //       return 'bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-700';
  //     case 'completed':
  //       return 'bg-gradient-to-r from-muted-100 to-muted-200 text-muted-700';
  //     default:
  //       return 'bg-gradient-to-r from-muted-100 to-muted-200 text-muted-700';
  //   }
  // };

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
    {
      id: 'overview',
      label: t('projectDetailPage.tabs.overview'),
      icon: BookOpen,
    },
    {
      id: 'financials',
      label: t('projectDetailPage.tabs.financials'),
      icon: BarChart3,
    },
    { id: 'risks', label: t('projectDetailPage.tabs.risks'), icon: Shield },
    {
      id: 'documents',
      label: t('projectDetailPage.tabs.documents'),
      icon: FileText,
    },
    {
      id: 'updates',
      label: t('projectDetailPage.tabs.updates'),
      icon: MessageSquare,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-10">
      {/* Toast Provider for notifications */}
      <ToastProvider />

      {/* Page Transition Wrapper */}
      <PageTransition type="fade" duration={300} transitionKey="project-detail">
        {/* Fluid Background Shapes */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 right-16"></div>
          <div className="fluid-shape-2 top-1/2 left-10"></div>
          <div className="fluid-shape-3 bottom-32 right-1/4"></div>
          <div className="fluid-shape-1 bottom-10 left-16"></div>
        </div>

        {/* Header */}
        <ScrollReveal animation="fade" delay={0}>
          <div className="glass-modern shadow-lg relative z-20">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AnimatedButton
                    onClick={() => {
                      router.push('/marketplace');
                      toast.info(t('projectDetailPage.navigation.title'), {
                        message: t(
                          'projectDetailPage.navigation.returningToMarketplace'
                        ),
                      });
                    }}
                    variant="secondary"
                    className="flex items-center gap-2"
                    ripple
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('projectDetailPage.navigation.backToMarketplace')}
                  </AnimatedButton>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center hover-scale transition-all duration-300">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-semibold text-gradient">
                      Project Details
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AnimatedButton
                    variant="secondary"
                    className="flex items-center gap-2"
                    ripple
                    onClick={() =>
                      toast.info(t('projectDetailPage.actions.shareProject'), {
                        message: 'Sharing project details...',
                      })
                    }
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </AnimatedButton>
                  <AnimatedButton
                    variant="secondary"
                    className="flex items-center gap-2"
                    ripple
                    onClick={() =>
                      toast.success('Project Saved', {
                        message: 'Project added to your saved projects',
                      })
                    }
                  >
                    <Star className="w-4 h-4" />
                    Save
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Hero Section */}
        <ScrollReveal animation="slide-up" delay={100}>
          <div className="glass-hero relative z-10 pb-10">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Project Image */}
                <div className="lg:col-span-2">
                  <div className="aspect-video glass-modern rounded-2xl relative overflow-hidden hover-lift transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <Image
                      src="https://images.pexels.com/photos/30732752/pexels-photo-30732752.jpeg"
                      alt="Project Preview"
                      width={4240}
                      height={2400}
                    />
                    <div className="absolute top-6 left-6">
                      <span
                        className={`px-4 py-2 rounded-xl text-sm font-semibold glass-feature backdrop-blur-md border border-white/20 text-warning-600 shadow-lg`}
                      >
                        Risiko Sedang
                      </span>
                    </div>
                    <div className="absolute bottom-6 left-6 text-white">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-base font-medium capitalize">
                          {project.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{project.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h1 className="text-4xl font-bold text-gradient mb-6">
                      {project.title}
                    </h1>
                    <p className="text-lg leading-relaxed mb-3">
                      {project.description}
                    </p>

                    {/* Highlights */}
                    <StaggeredList
                      className="flex flex-wrap gap-3"
                      itemDelay={100}
                    >
                      {project.highlights.map(
                        (highlight: string, index: number) => (
                          <span
                            key={index}
                            className="px-6 py-3 glass-modern rounded-xl text-sm font-semibold text-primary-700 hover-lift transition-all duration-300 border border-primary-200"
                          >
                            {highlight}
                          </span>
                        )
                      )}
                    </StaggeredList>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-6">
                  <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gradient">
                        Investment Overview
                      </h3>
                    </div>

                    <StaggeredList itemDelay={100}>
                      <div className="glass-modern rounded-xl p-4 hover-glow transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <span className="text-primary-600 font-medium">
                            Expected Return
                          </span>
                          <span className="font-bold text-gradient text-xl">
                            {project.expectedReturn}% p.a.
                          </span>
                        </div>
                      </div>

                      <div className="glass-modern rounded-xl p-4 hover-glow transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <span className="text-primary-600 font-medium">
                            Duration
                          </span>
                          <span className="font-bold text-primary-800">
                            {project.duration} years
                          </span>
                        </div>
                      </div>

                      <div className="glass-modern rounded-xl p-4 hover-glow transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <span className="text-primary-600 font-medium">
                            Min. Investment
                          </span>
                          <span className="font-bold text-primary-800">
                            {formatCurrency(project.minimumInvestment)}
                          </span>
                        </div>
                      </div>

                      <div className="glass-modern rounded-xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-primary-600 font-medium">
                            Funding Progress
                          </span>
                          <span className="font-bold text-gradient text-lg">
                            {progressPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gradient-to-r from-primary-100 to-primary-200 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-500 shadow-lg"
                            style={{
                              width: `${Math.min(progressPercentage, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-primary-600">
                          <span className="font-medium">
                            {formatCurrency(project.raisedAmount)}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(project.targetAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="glass-modern rounded-xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-primary-600 font-medium">
                            Investors
                          </span>
                          <span className="font-bold text-primary-800">
                            {project.investorCount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-primary-600 font-medium">
                            Days remaining
                          </span>
                          <span className="font-bold text-primary-800">
                            245 days
                          </span>
                        </div>
                      </div>
                    </StaggeredList>

                    <div className="mt-8 space-y-4">
                      <AnimatedButton
                        onClick={() => {
                          setShowCalculator(!showCalculator);
                          toast.info('Investment Calculator', {
                            message: showCalculator
                              ? 'Calculator closed'
                              : 'Calculator opened',
                          });
                        }}
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2"
                        ripple
                      >
                        <Calculator className="w-4 h-4" />
                        Investment Calculator
                      </AnimatedButton>

                      {project.status === 'active' && (
                        <Link href={`/invest/${project.id}`}>
                          <AnimatedButton
                            variant="primary"
                            size="lg"
                            className="w-full"
                            ripple
                            onClick={() =>
                              toast.info('Investment Flow', {
                                message: 'Starting investment process...',
                              })
                            }
                          >
                            {t('projectDetailPage.actions.investNow')}
                          </AnimatedButton>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Investment Calculator */}
                  {showCalculator && (
                    <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300 animate-fade-in-up">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                          <Calculator className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gradient">
                          {t('projectDetailPage.actions.calculateReturns')}
                        </h3>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <AnimatedInput
                            type="text"
                            label="Investment Amount"
                            value={investmentAmount}
                            onChange={e => setInvestmentAmount(e.target.value)}
                            placeholder={`Min. ${formatCurrency(project.minimumInvestment)}`}
                            className="glass-modern border-primary-200 focus:border-primary-400 focus:ring-primary-100 hover-glow transition-all duration-300"
                          />
                        </div>

                        {calculateReturns() && (
                          <div className="glass-hero rounded-xl p-6 space-y-4 animate-fade-in-up">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-primary-700">
                                Annual Return
                              </span>
                              <span className="font-bold text-gradient">
                                {formatCurrency(calculateReturns()!.annual)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-primary-700">
                                Total Return
                              </span>
                              <span className="font-bold text-gradient">
                                {formatCurrency(calculateReturns()!.total)}
                              </span>
                            </div>
                            <div className="border-t border-primary-200 pt-4">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-primary-800">
                                  Final Value
                                </span>
                                <span className="font-bold text-xl text-gradient">
                                  {formatCurrency(
                                    calculateReturns()!.finalValue
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Tabs Navigation */}
        <ScrollReveal animation="slide-up" delay={300}>
          <div className="glass-modern border-t border-primary-200 relative z-10">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex space-x-2 overflow-x-auto p-2">
                {tabs.map(tab => {
                  const TabIcon = tab.icon;
                  return (
                    <AnimatedButton
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        toast.info('Tab Changed', {
                          message: `Switched to ${tab.label} tab`,
                        });
                      }}
                      variant={activeTab === tab.id ? 'primary' : 'secondary'}
                      className={`flex items-center gap-3 py-4 px-6 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                          : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                      }`}
                      ripple
                    >
                      <TabIcon className="w-5 h-5" />
                      {tab.label}
                    </AnimatedButton>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'overview' && (
            <ScrollReveal animation="slide-up" delay={100}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-semibold text-gradient mb-4">
                    Project Details
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="whitespace-pre-line text-gray-700">
                      {project.detailedDescription}
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gradient mb-4">
                    Key Metrics
                  </h2>
                  <StaggeredList
                    className="grid grid-cols-2 gap-4"
                    itemDelay={100}
                  >
                    <Card className="glass-feature p-4 hover-lift transition-all duration-300">
                      <div className="text-2xl font-bold text-primary-600">
                        {project.keyMetrics?.totalPassengers?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Annual Passengers
                      </div>
                    </Card>
                    <Card className="glass-feature p-4 hover-lift transition-all duration-300">
                      <div className="text-2xl font-bold text-primary-600">
                        {project.keyMetrics?.dailyCapacity.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Daily Capacity
                      </div>
                    </Card>
                    <Card className="glass-feature p-4 hover-lift transition-all duration-300">
                      <div className="text-2xl font-bold text-primary-600">
                        {project.keyMetrics?.jobsCreated.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Jobs Created</div>
                    </Card>
                    <Card className="glass-feature p-4 hover-lift transition-all duration-300">
                      <div className="text-2xl font-bold text-primary-600">
                        {project.keyMetrics?.carbonReduction.toLocaleString()}t
                      </div>
                      <div className="text-sm text-gray-600">CO2 Reduction</div>
                    </Card>
                  </StaggeredList>
                </div>
              </div>
            </ScrollReveal>
          )}

          {activeTab === 'financials' && (
            <ScrollReveal animation="slide-up" delay={100}>
              <div>
                <h2 className="text-xl font-semibold text-gradient mb-6">
                  Financial Projections
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="glass-feature p-6 hover-lift transition-all duration-300">
                    <h3 className="font-medium text-gradient mb-4">
                      Revenue Projections
                    </h3>
                    <StaggeredList itemDelay={100}>
                      {Object.entries(project.financialProjections || {}).map(
                        ([year, data]: [string, FinancialProjection]) => (
                          <div
                            key={year}
                            className="flex justify-between items-center glass-modern p-3 rounded-lg hover-glow transition-all duration-300"
                          >
                            <span className="text-gray-600 font-medium">
                              Year {year.slice(-1)}
                            </span>
                            <span className="font-bold text-primary-600">
                              {formatCurrency(data.revenue)}
                            </span>
                          </div>
                        )
                      )}
                    </StaggeredList>
                  </Card>

                  <Card className="glass-feature p-6 hover-lift transition-all duration-300">
                    <h3 className="font-medium text-gradient mb-4">
                      Expected Returns
                    </h3>
                    <StaggeredList itemDelay={100}>
                      {Object.entries(project.financialProjections || {}).map(
                        ([year, data]: [string, FinancialProjection]) => (
                          <div
                            key={year}
                            className="flex justify-between items-center glass-modern p-3 rounded-lg hover-glow transition-all duration-300"
                          >
                            <span className="text-gray-600 font-medium">
                              Year {year.slice(-1)}
                            </span>
                            <span className="font-bold text-gradient text-lg">
                              {data.returnRate}%
                            </span>
                          </div>
                        )
                      )}
                    </StaggeredList>
                  </Card>
                </div>
              </div>
            </ScrollReveal>
          )}

          {activeTab === 'risks' && (
            <ScrollReveal animation="slide-up" delay={100}>
              <div>
                <h2 className="text-xl font-semibold text-gradient mb-6">
                  Risk Analysis
                </h2>
                <StaggeredList itemDelay={100}>
                  {project.risks?.map((risk: ProjectRisk, index: number) => (
                    <Card
                      key={index}
                      className="glass-feature p-6 hover-lift transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                risk.level === 'Low'
                                  ? 'bg-green-100 text-green-800'
                                  : risk.level === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {risk.level} Risk
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                              {risk.probability}% probability
                            </span>
                          </div>
                          <p className="text-gray-700">{risk.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </StaggeredList>
              </div>
            </ScrollReveal>
          )}

          {activeTab === 'documents' && (
            <ScrollReveal animation="slide-up" delay={100}>
              <div>
                <h2 className="text-xl font-semibold text-gradient mb-6">
                  Legal Documents
                </h2>
                <StaggeredList
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  itemDelay={100}
                >
                  {project.legalDocuments?.map(
                    (doc: LegalDocument, index: number) => (
                      <Card
                        key={index}
                        className="glass-feature p-6 hover-lift transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-primary-800">
                                {doc.name}
                              </h3>
                              <p className="text-sm text-primary-600">
                                {doc.type} • {doc.size}
                              </p>
                            </div>
                          </div>
                          <AnimatedButton
                            variant="secondary"
                            className="flex items-center gap-2"
                            ripple
                            onClick={() =>
                              toast.info('Document Download', {
                                message: `Downloading ${doc.name}...`,
                              })
                            }
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </AnimatedButton>
                        </div>
                      </Card>
                    )
                  )}
                </StaggeredList>
              </div>
            </ScrollReveal>
          )}

          {activeTab === 'updates' && (
            <ScrollReveal animation="slide-up" delay={100}>
              <div>
                <h2 className="text-xl font-semibold text-gradient mb-6">
                  Project Updates
                </h2>
                <StaggeredList className="space-y-6" itemDelay={100}>
                  {project.updates?.map(
                    (update: ProjectUpdate, index: number) => (
                      <div
                        key={index}
                        className="flex gap-4 glass-modern rounded-xl p-6 hover-lift transition-all duration-300"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-medium text-primary-800">
                              {update.title}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              {update.date}
                            </span>
                          </div>
                          <p className="text-base text-foreground">
                            {update.description}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </StaggeredList>
              </div>
            </ScrollReveal>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
