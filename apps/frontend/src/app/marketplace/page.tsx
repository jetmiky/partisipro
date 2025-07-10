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
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card } from '@/components/ui';

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

  const renderProjectCard = (project: Project) => {
    const Icon = getCategoryIcon(project.category);
    const progressPercentage =
      (project.raisedAmount / project.targetAmount) * 100;

    return (
      <Card
        key={project.id}
        className="group hover:shadow-lg transition-shadow duration-300"
      >
        <div className="aspect-video bg-gray-100 rounded-t-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-4 left-4">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}
            >
              {getStatusLabel(project.status)}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4" />
              <span className="text-sm capitalize">{project.category}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="w-3 h-3" />
              <span>{project.location}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {project.title}
            </h3>
            <div
              className={`text-sm font-medium ${getRiskColor(project.riskLevel)}`}
            >
              {project.riskLevel} risk
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Expected Return</span>
              <span className="font-medium text-primary-600">
                {project.expectedReturn}% p.a.
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium">{project.duration} years</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Min. Investment</span>
              <span className="font-medium">
                {formatCurrency(project.minimumInvestment)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatCurrency(project.raisedAmount)}</span>
                <span>{formatCurrency(project.targetAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-2">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">
                  {project.investorCount} investors
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">
                  {new Date(project.startDate).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              <Link href={`/projects/${project.id}`} className="flex-1">
                <Button variant="primary" className="w-full">
                  View Details
                </Button>
              </Link>
              {project.status === 'active' && (
                <Link href={`/invest/${project.id}`}>
                  <Button variant="secondary">Invest Now</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  Partisipro
                </span>
              </Link>
              <div className="text-sm text-gray-500">
                Investment Marketplace
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-primary-600"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="text-gray-600 hover:text-primary-600"
              >
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Investment Marketplace
          </h1>
          <p className="text-gray-600">
            Discover and invest in Indonesian Public-Private Partnership
            projects
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search projects by name, location, or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                />
              </Button>

              <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province
                  </label>
                  <select
                    value={selectedProvince}
                    onChange={e => setSelectedProvince(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {provinces.map(province => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Level
                  </label>
                  <select
                    value={selectedRiskLevel}
                    onChange={e => setSelectedRiskLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-gray-600">
            {filteredProjects.length} projects found
          </div>
          <div className="flex items-center gap-4">
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Sort by: Featured</option>
              <option>Sort by: Expected Return</option>
              <option>Sort by: Duration</option>
              <option>Sort by: Min. Investment</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        <div
          className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }`}
        >
          {filteredProjects.map(project => renderProjectCard(project))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
