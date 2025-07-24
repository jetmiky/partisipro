'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Users,
  Building,
  Route,
  Zap,
  Droplets,
  Layers,
  Grid,
  List,
  ChevronDown,
  Shield,
  CheckCircle,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { ToastProvider, toast } from '@/components/ui/AnimatedNotification';
import { mockApiClient } from '@/lib/mock-api-client';
import { MOCK_PROJECTS, type MockProject } from '@/lib/mock-data';

interface IdentityStatus {
  isVerified: boolean;
  kycStatus: 'approved' | 'pending' | 'rejected' | 'expired';
  claims: string[];
  eligibleForInvestment: boolean;
  riskProfileCompleted: boolean;
}

// Use MockProject from centralized mock data
type Project = MockProject;

// Projects will be loaded from centralized mock API

const categories = [
  { id: 'all', label: 'All Projects', icon: Grid },
  { id: 'transportation', label: 'Transportation', icon: Route },
  { id: 'energy', label: 'Energy', icon: Zap },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'telecommunications', label: 'Telecommunications', icon: Building },
  { id: 'buildings', label: 'Buildings', icon: Building },
];

const provinces = [
  'All Provinces',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Banten',
  'Bali',
  'Sumatera Utara',
  'Sumatera Barat',
  'Kalimantan Timur',
];

const riskLevels = [
  { id: 'all', label: 'Semua Risiko' },
  { id: 'low', label: 'Risiko Rendah' },
  { id: 'medium', label: 'Risiko Sedang' },
  { id: 'high', label: 'Risiko Tinggi' },
  { id: 'very-high', label: 'Risiko Sangat Tinggi' },
];

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Load projects from mock API in presentation mode
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const response = await mockApiClient.getProjects();
        setProjects(response.data);
      } catch (error) {
        // Error loading projects, fallback to static data
        // Fallback to static mock data
        setProjects(MOCK_PROJECTS);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // TODO: Mock identity status - replace with actual IdentityRegistry contract integration
  const identityStatus: IdentityStatus = {
    isVerified: true,
    kycStatus: 'approved',
    claims: ['KYC_APPROVED', 'INDONESIAN_RESIDENT', 'COMPLIANCE_VERIFIED'],
    eligibleForInvestment: true,
    riskProfileCompleted: true,
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || project.category === selectedCategory;
      const matchesProvince =
        selectedProvince === 'All Provinces' ||
        project.province === selectedProvince;
      const matchesRiskLevel =
        selectedRiskLevel === 'all' ||
        project.keyMetrics.riskLevel === selectedRiskLevel;

      return (
        matchesSearch && matchesCategory && matchesProvince && matchesRiskLevel
      );
    });
  }, [
    projects,
    searchTerm,
    selectedCategory,
    selectedProvince,
    selectedRiskLevel,
  ]);

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
  //       return 'bg-green-100 text-green-800';
  //     case 'coming_soon':
  //       return 'bg-blue-100 text-blue-800';
  //     case 'fully_funded':
  //       return 'bg-purple-100 text-purple-800';
  //     case 'completed':
  //       return 'bg-gray-100 text-gray-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  // const getStatusLabel = (status: string) => {
  //   switch (status) {
  //     case 'active':
  //       return 'Active';
  //     case 'coming_soon':
  //       return 'Coming Soon';
  //     case 'fully_funded':
  //       return 'Fully Funded';
  //     case 'completed':
  //       return 'Completed';
  //     default:
  //       return 'Unknown';
  //   }
  // };

  // const getRiskColor = (risk: string) => {
  //   switch (risk) {
  //     case 'low':
  //       return 'text-green-600';
  //     case 'medium':
  //       return 'text-yellow-600';
  //     case 'high':
  //       return 'text-red-600';
  //     case 'very-high':
  //       return 'text-red-900';
  //     default:
  //       return 'text-gray-600';
  //   }
  // };

  const getRiskBackgroundColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-600';
      case 'high':
        return 'bg-red-600';
      case 'very-high':
        return 'bg-red-800';
      default:
        return 'bg-gray-600';
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

  const EligibilityIndicator = () => {
    if (!identityStatus.isVerified) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 glass-modern rounded-full text-xs">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Identity Required</span>
        </div>
      );
    }

    if (!identityStatus.eligibleForInvestment) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-error-100 rounded-full text-xs">
          <AlertTriangle className="w-3 h-3 text-error-500" />
          <span className="text-error-600">Not Eligible</span>
        </div>
      );
    }

    const minimumMet = identityStatus.eligibleForInvestment;
    const riskProfile = identityStatus.riskProfileCompleted;

    if (minimumMet && riskProfile) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-success-100 rounded-full text-xs hover-scale">
          <CheckCircle className="w-3 h-3 text-success-500" />
          <span className="text-success-600">Eligible to Invest</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 px-3 py-1 bg-warning-100 rounded-full text-xs">
        <Shield className="w-3 h-3 text-warning-500" />
        <span className="text-warning-600">
          Additional Verification Required
        </span>
      </div>
    );
  };

  const renderProjectCard = (project: Project) => {
    const Icon = getCategoryIcon(project.category);

    // Map MockProject properties to expected format
    const raisedAmount =
      (project.totalSupply - project.availableSupply) * project.tokenPrice;
    const targetAmount = project.totalSupply * project.tokenPrice;
    const progressPercentage = (raisedAmount / targetAmount) * 100;

    // Map MockProject status to expected format
    const mapStatus = (status: string) => {
      switch (status) {
        case 'draft':
          return 'coming_soon';
        case 'active':
          return 'active';
        case 'funded':
          return 'fully_funded';
        case 'completed':
          return 'completed';
        default:
          return 'active';
      }
    };
    const mappedStatus = mapStatus(project.status);

    return (
      <Card
        key={project.id}
        className="glass-modern group hover:glass-feature hover-lift transition-all duration-500 border-primary-100 overflow-hidden"
      >
        <div className="aspect-video gradient-brand-hero rounded-t-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Floating organic shapes for visual interest */}
          <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full animate-float"></div>
          <div
            className="absolute bottom-8 right-8 w-8 h-8 bg-white/5 rounded-full animate-float"
            style={{ animationDelay: '1s' }}
          ></div>

          <div className="absolute top-4 left-4">
            <span
              className={`px-4 py-2 rounded-full border-0 shadow text-xs font-medium glass-modern text-white ${getRiskBackgroundColor(project.keyMetrics.riskLevel)}`}
            >
              {/* {getStatusLabel(mappedStatus)} */}
              {
                riskLevels.find(r => r.id === project.keyMetrics.riskLevel)
                  ?.label
              }
            </span>
          </div>
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium capitalize">
                {project.category}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{project.location}</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-foreground group-hover:text-gradient transition-all text-lg leading-tight">
              {project.name}
            </h3>
            {/* <div className="glass-modern px-3 py-1 rounded-full">
              <span
                className={`text-xs font-medium ${getRiskColor(project.keyMetrics.riskLevel)}`}
              >
                {
                  riskLevels.find(r => r.id === project.keyMetrics.riskLevel)
                    ?.label
                }
              </span>
            </div> */}
          </div>

          <div className="flex items-center justify-between mb-4">
            <EligibilityIndicator />
            <div className="flex items-center gap-1 glass-modern px-3 py-1 rounded-full">
              <Shield className="w-3 h-3 text-primary-500" />
              <span className="text-xs text-primary-600 font-medium">
                ERC-3643 Protected
              </span>
            </div>
          </div>

          <p className="text-muted-foreground text-sm mb-6 line-clamp-2 leading-relaxed">
            {project.description}
          </p>

          <div className="space-y-4">
            <div className="glass-modern rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Expected Return</span>
                <span className="font-semibold text-gradient text-lg">
                  {project.expectedReturn}% p.a.
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-primary-700">
                  {project.projectDuration} years
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Min. Investment</span>
                <span className="font-medium text-primary-700">
                  {formatCurrency(project.minimumInvestment)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Funding Progress</span>
                <span className="font-semibold text-primary-600">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 h-3 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">
                  {formatCurrency(raisedAmount)}
                </span>
                <span>{formatCurrency(targetAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-3 border-t border-primary-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <Users className="w-3 h-3 text-primary-600" />
                </div>
                <span className="text-primary-600 font-medium">
                  {project.investorCount} investors
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-3 h-3 text-primary-600" />
                </div>
                <span className="text-primary-600 font-medium">
                  {new Date(project.offeringStart).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-primary-200">
            <div className="flex gap-3">
              <Link href={`/projects/${project.id}`} className="flex-1">
                <AnimatedButton
                  variant="primary"
                  className="w-full"
                  ripple
                  onClick={() =>
                    toast.info('Project Details', {
                      message: `Loading details for ${project.name}...`,
                    })
                  }
                >
                  View Details
                </AnimatedButton>
              </Link>
              {mappedStatus === 'active' && (
                <Link href={`/invest/${project.id}`}>
                  <AnimatedButton
                    variant="secondary"
                    className="px-6"
                    ripple
                    onClick={() =>
                      toast.info('Investment Flow', {
                        message: `Starting investment for ${project.name}...`,
                      })
                    }
                  >
                    Invest Now
                  </AnimatedButton>
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Toast Provider for notifications */}
      <ToastProvider />

      {/* Page Transition Wrapper */}
      <PageTransition type="fade" duration={300} transitionKey="marketplace">
        {/* Fluid Background Shapes */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 right-16"></div>
          <div className="fluid-shape-2 top-1/2 left-10"></div>
          <div className="fluid-shape-3 bottom-32 right-1/4"></div>
          <div className="fluid-shape-1 bottom-10 left-16"></div>
        </div>

        {/* Header */}
        <ScrollReveal animation="fade" delay={0}>
          <div className="glass-header backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link
                    href="/"
                    className="flex items-center gap-3 hover-scale animate-fade-in-up"
                  >
                    <div className="w-8 h-8 feature-icon">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-semibold text-gradient">
                      Partisipro
                    </span>
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    Investment Marketplace
                  </div>
                </div>
                <nav className="flex items-center gap-4">
                  <Link href="/dashboard" className="nav-link">
                    Dashboard
                  </Link>
                  <Link href="/profile" className="nav-link">
                    Profile
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          {/* Page Header */}
          <ScrollReveal animation="slide-up" delay={100}>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gradient mb-2">
                Investment Marketplace
              </h1>
              <p className="text-muted-foreground">
                Discover and invest in Indonesian Public-Private Partnership
                projects
              </p>
            </div>
          </ScrollReveal>

          {/* Identity Status Banner */}
          <ScrollReveal animation="slide-up" delay={200}>
            <div className="glass-feature rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-success-500" />
                  <div>
                    <h3 className="text-xl font-medium text-primary-700">
                      Identity Verified
                    </h3>
                    <p className="text-sm text-primary-600">
                      Your ERC-3643 identity is verified and you can invest in
                      all available projects
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-success-500" />
                    <span className="text-primary-600">KYC Approved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-success-500" />
                    <span className="text-primary-600">
                      {identityStatus.claims.length} Claims Active
                    </span>
                  </div>
                  <Link href="/identity">
                    <AnimatedButton
                      variant="secondary"
                      size="sm"
                      className="hover-lift"
                      onClick={() =>
                        toast.info('Identity Management', {
                          message: 'Navigating to identity management page...',
                        })
                      }
                    >
                      Manage Identity
                    </AnimatedButton>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Search and Filters */}
          <ScrollReveal animation="slide-up" delay={300}>
            <div className="glass-feature rounded-2xl p-8 mb-8">
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <AnimatedInput
                    placeholder="Search projects by name, location, or description..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-12"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <AnimatedButton
                    onClick={() => setShowFilters(!showFilters)}
                    variant="secondary"
                    className="flex items-center gap-2"
                    ripple
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                    />
                  </AnimatedButton>

                  <div className="flex items-center gap-1 glass-modern rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 rounded-lg transition-all hover-scale ${
                        viewMode === 'grid'
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'text-primary-400 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 rounded-lg transition-all hover-scale ${
                        viewMode === 'list'
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'text-primary-400 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="mt-8 pt-6 border-t border-primary-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-3">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 glass-modern rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 hover-glow transition-all"
                      >
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-3">
                        Province
                      </label>
                      <select
                        value={selectedProvince}
                        onChange={e => setSelectedProvince(e.target.value)}
                        className="w-full px-4 py-3 glass-modern rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 hover-glow transition-all"
                      >
                        {provinces.map(province => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-3">
                        Risk Level
                      </label>
                      <select
                        value={selectedRiskLevel}
                        onChange={e => setSelectedRiskLevel(e.target.value)}
                        className="w-full px-4 py-3 glass-modern rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 hover-glow transition-all"
                      >
                        {riskLevels.map(risk => (
                          <option key={risk.id} value={risk.id}>
                            {risk.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Results Summary */}
          <ScrollReveal animation="fade" delay={400}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span className="text-primary-700 font-medium">
                  {filteredProjects.length} projects found
                </span>
              </div>
              <div className="flex items-center gap-4">
                <select className="px-4 py-3 glass-modern rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 hover-glow transition-all">
                  <option>Sort by: Featured</option>
                  <option>Sort by: Expected Return</option>
                  <option>Sort by: Duration</option>
                  <option>Sort by: Min. Investment</option>
                </select>
              </div>
            </div>
          </ScrollReveal>

          {/* Projects Grid */}
          {loading ? (
            <ScrollReveal animation="fade" delay={500}>
              <div className="text-center py-16">
                <div className="w-20 h-20 feature-icon mx-auto mb-6 hover-scale animate-spin">
                  <Search className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-gradient mb-3">
                  Loading Indonesian Infrastructure Projects...
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Fetching the latest PPP investment opportunities from our
                  platform
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <StaggeredList
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                  : 'space-y-6'
              }
              itemDelay={100}
            >
              {filteredProjects.map(project => (
                <div key={project.id} className="card-micro">
                  {renderProjectCard(project)}
                </div>
              ))}
            </StaggeredList>
          )}

          {/* Empty State */}
          {!loading && filteredProjects.length === 0 && (
            <ScrollReveal animation="fade" delay={500}>
              <div className="text-center py-16">
                <div className="w-20 h-20 feature-icon mx-auto mb-6 hover-scale">
                  <Search className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-gradient mb-3">
                  No projects found
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Try adjusting your search criteria or filters to discover more
                  infrastructure investment opportunities
                </p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
