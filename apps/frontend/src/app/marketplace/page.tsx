'use client';

import { useState, useMemo } from 'react';
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

interface IdentityStatus {
  isVerified: boolean;
  kycStatus: 'approved' | 'pending' | 'rejected' | 'expired';
  claims: string[];
  eligibleForInvestment: boolean;
  riskProfileCompleted: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  category:
    | 'transportation'
    | 'energy'
    | 'water'
    | 'telecommunications'
    | 'buildings';
  location: string;
  province: string;
  totalValue: number;
  targetAmount: number;
  raisedAmount: number;
  minimumInvestment: number;
  expectedReturn: number;
  duration: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'coming_soon' | 'fully_funded' | 'completed';
  investorCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  image: string;
  highlights: string[];
}

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Jakarta-Bandung High-Speed Rail Extension',
    description:
      'Expansion of the existing high-speed rail network to connect Jakarta-Bandung with Surabaya, reducing travel time by 60%.',
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
  },
  {
    id: '2',
    title: 'Soekarno-Hatta Airport Terminal 4',
    description:
      'Construction of a new international terminal at Soekarno-Hatta Airport to handle 25 million passengers annually.',
    category: 'transportation',
    location: 'Tangerang, Banten',
    province: 'Banten',
    totalValue: 25000000000,
    targetAmount: 8000000000,
    raisedAmount: 7200000000,
    minimumInvestment: 500000,
    expectedReturn: 10.8,
    duration: 30,
    startDate: '2024-01-20',
    endDate: '2054-01-20',
    status: 'active',
    investorCount: 892,
    riskLevel: 'low',
    image: '/images/projects/airport.jpg',
    highlights: ['International traffic', 'Stable revenue', 'Low risk'],
  },
  {
    id: '3',
    title: 'Bali Renewable Energy Plant',
    description:
      "Solar and wind hybrid power plant to supply clean energy to Bali's growing tourism and residential needs.",
    category: 'energy',
    location: 'Buleleng, Bali',
    province: 'Bali',
    totalValue: 18000000000,
    targetAmount: 12000000000,
    raisedAmount: 2800000000,
    minimumInvestment: 750000,
    expectedReturn: 14.2,
    duration: 20,
    startDate: '2024-06-01',
    endDate: '2044-06-01',
    status: 'active',
    investorCount: 456,
    riskLevel: 'medium',
    image: '/images/projects/solar.jpg',
    highlights: ['ESG compliant', 'Growing demand', 'Government incentives'],
  },
  {
    id: '4',
    title: 'Jakarta Smart Water Management',
    description:
      'AI-powered water distribution system for Jakarta to reduce waste and improve water quality for 2 million households.',
    category: 'water',
    location: 'Jakarta',
    province: 'DKI Jakarta',
    totalValue: 8000000000,
    targetAmount: 5000000000,
    raisedAmount: 5000000000,
    minimumInvestment: 300000,
    expectedReturn: 9.5,
    duration: 15,
    startDate: '2023-12-01',
    endDate: '2038-12-01',
    status: 'fully_funded',
    investorCount: 1834,
    riskLevel: 'low',
    image: '/images/projects/water.jpg',
    highlights: ['Essential service', 'Smart technology', 'Stable returns'],
  },
  {
    id: '5',
    title: 'Surabaya 5G Network Infrastructure',
    description:
      'Deployment of 5G telecommunications infrastructure across Surabaya to support smart city initiatives.',
    category: 'telecommunications',
    location: 'Surabaya',
    province: 'Jawa Timur',
    totalValue: 12000000000,
    targetAmount: 7000000000,
    raisedAmount: 1200000000,
    minimumInvestment: 400000,
    expectedReturn: 13.8,
    duration: 18,
    startDate: '2024-08-15',
    endDate: '2042-08-15',
    status: 'coming_soon',
    investorCount: 0,
    riskLevel: 'high',
    image: '/images/projects/5g.jpg',
    highlights: [
      'Future technology',
      'High growth potential',
      'Government support',
    ],
  },
  {
    id: '6',
    title: 'Medan Hospital Complex',
    description:
      'State-of-the-art healthcare facility with 500 beds and advanced medical equipment serving North Sumatra.',
    category: 'buildings',
    location: 'Medan, North Sumatra',
    province: 'Sumatera Utara',
    totalValue: 15000000000,
    targetAmount: 9000000000,
    raisedAmount: 4500000000,
    minimumInvestment: 600000,
    expectedReturn: 11.2,
    duration: 22,
    startDate: '2024-04-01',
    endDate: '2046-04-01',
    status: 'active',
    investorCount: 723,
    riskLevel: 'medium',
    image: '/images/projects/hospital.jpg',
    highlights: ['Essential healthcare', 'Growing region', 'Stable demand'],
  },
];

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
  { id: 'all', label: 'All Risk Levels' },
  { id: 'low', label: 'Low Risk' },
  { id: 'medium', label: 'Medium Risk' },
  { id: 'high', label: 'High Risk' },
];

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // TODO: Mock identity status - replace with actual IdentityRegistry contract integration
  const identityStatus: IdentityStatus = {
    isVerified: true,
    kycStatus: 'approved',
    claims: ['KYC_APPROVED', 'INDONESIAN_RESIDENT', 'COMPLIANCE_VERIFIED'],
    eligibleForInvestment: true,
    riskProfileCompleted: true,
  };

  const filteredProjects = useMemo(() => {
    return mockProjects.filter(project => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || project.category === selectedCategory;
      const matchesProvince =
        selectedProvince === 'All Provinces' ||
        project.province === selectedProvince;
      const matchesRiskLevel =
        selectedRiskLevel === 'all' || project.riskLevel === selectedRiskLevel;

      return (
        matchesSearch && matchesCategory && matchesProvince && matchesRiskLevel
      );
    });
  }, [searchTerm, selectedCategory, selectedProvince, selectedRiskLevel]);

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'coming_soon':
        return 'Coming Soon';
      case 'fully_funded':
        return 'Fully Funded';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
    const progressPercentage =
      (project.raisedAmount / project.targetAmount) * 100;

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
              className={`px-4 py-2 rounded-full text-xs font-medium glass-modern border border-white/20 text-white ${getStatusColor(project.status)}`}
            >
              {getStatusLabel(project.status)}
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
              {project.title}
            </h3>
            <div className="glass-modern px-3 py-1 rounded-full">
              <span
                className={`text-xs font-medium ${getRiskColor(project.riskLevel)}`}
              >
                {project.riskLevel} risk
              </span>
            </div>
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
                  {project.duration} years
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
                  {formatCurrency(project.raisedAmount)}
                </span>
                <span>{formatCurrency(project.targetAmount)}</span>
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
                  {new Date(project.startDate).getFullYear()}
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
                      message: `Loading details for ${project.title}...`,
                    })
                  }
                >
                  View Details
                </AnimatedButton>
              </Link>
              {project.status === 'active' && (
                <Link href={`/invest/${project.id}`}>
                  <AnimatedButton
                    variant="secondary"
                    className="px-6"
                    ripple
                    onClick={() =>
                      toast.info('Investment Flow', {
                        message: `Starting investment for ${project.title}...`,
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
                    <h3 className="font-medium text-primary-700">
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

          {/* Empty State */}
          {filteredProjects.length === 0 && (
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
