/**
 * Centralized Mock Data for Presentation Mode
 * High-fidelity demo data for Indonesian PPP infrastructure projects
 */

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'spv' | 'investor';
  walletAddress: string;
  kycStatus: 'approved' | 'pending' | 'rejected';
  identityVerified: boolean;
  profileCompleted: boolean;
  createdAt: string;
  lastLoginAt: string;
  mfaEnabled: boolean;
  preferredLanguage: 'id' | 'en';
  investorType?: 'retail' | 'institutional';
  totalInvested?: number;
  portfolioValue?: number;
}

export interface MockProject {
  id: string;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  category: string;
  location: string;
  province: string;
  totalValue: number;
  tokenPrice: number;
  totalSupply: number;
  availableSupply: number;
  minimumInvestment: number;
  expectedReturn: number;
  projectDuration: number;
  status: 'draft' | 'active' | 'funded' | 'completed';
  spvName: string;
  spvAddress: string;
  contractAddress?: string;
  offeringStart: string;
  offeringEnd: string;
  fundedPercentage: number;
  investorCount: number;
  images: string[];
  documents: Array<{
    name: string;
    type: string;
    url: string;
    uploadDate: string;
  }>;
  keyMetrics: {
    irr: number;
    paybackPeriod: number;
    riskLevel: 'low' | 'medium' | 'high' | 'very-high';
    governmentSupport: boolean;
  };
  milestones: Array<{
    title: string;
    description: string;
    targetDate: string;
    completed: boolean;
    completedDate?: string;
  }>;
  profitDistributions: Array<{
    id: string;
    quarter: string;
    year: number;
    totalAmount: number;
    perTokenAmount: number;
    distributionDate: string;
    claimedPercentage: number;
  }>;
  governance: {
    totalProposals: number;
    activeProposals: number;
    votingPower: number;
  };
}

export interface MockInvestment {
  id: string;
  projectId: string;
  investorId: string;
  tokenAmount: number;
  investmentAmount: number;
  transactionHash: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  claimableReturns: number;
  totalReturns: number;
}

export interface MockGovernanceProposal {
  id: string;
  projectId: string;
  title: string;
  description: string;
  proposer: string;
  createdAt: string;
  votingStart: string;
  votingEnd: string;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotingPower: number;
  quorumReached: boolean;
  userVote?: 'for' | 'against' | 'abstain';
}

// Demo users for different roles
export const MOCK_USERS: MockUser[] = [
  {
    id: 'investor-rina',
    email: 'rina.investor@partisipro.com',
    name: 'Rina Sari Dewi',
    role: 'investor',
    walletAddress: '0x742d35Cc6634C0532925a3b8D8f46be5e7B7BF89',
    kycStatus: 'approved',
    identityVerified: true,
    profileCompleted: true,
    createdAt: '2024-06-15T10:30:00Z',
    lastLoginAt: '2025-01-22T09:15:00Z',
    mfaEnabled: true,
    preferredLanguage: 'id',
    investorType: 'retail',
    totalInvested: 125000000, // IDR 125 million
    portfolioValue: 132500000, // IDR 132.5 million (6% growth)
  },
  {
    id: 'spv-jakarta',
    email: 'project.manager@jakartamrt.co.id',
    name: 'Dr. Ahmad Susanto',
    role: 'spv',
    walletAddress: '0x8ba1f109551bD432803012645Hac136c7E24b2b5',
    kycStatus: 'approved',
    identityVerified: true,
    profileCompleted: true,
    createdAt: '2024-05-20T14:20:00Z',
    lastLoginAt: '2025-01-22T08:45:00Z',
    mfaEnabled: true,
    preferredLanguage: 'id',
  },
  {
    id: 'admin-platform',
    email: 'admin@partisipro.com',
    name: 'Platform Administrator',
    role: 'admin',
    walletAddress: '0x95cED938F7991cd0dFcb48F0a06a40FA1Ce26f60',
    kycStatus: 'approved',
    identityVerified: true,
    profileCompleted: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2025-01-22T10:00:00Z',
    mfaEnabled: true,
    preferredLanguage: 'en',
  },
];

// Mock PPP Infrastructure Projects
export const MOCK_PROJECTS: MockProject[] = [
  {
    id: 'jakarta-mrt-extension',
    name: 'Jakarta MRT Extension Phase 2',
    shortName: 'Jakarta MRT Ph.2',
    description:
      'Perluasan jalur MRT Jakarta dari Bundaran HI hingga Kota dengan teknologi terdepan',
    longDescription: `
      Proyek Jakarta MRT Extension Phase 2 merupakan kelanjutan dari kesuksesan Phase 1 yang akan menghubungkan
      Bundaran HI hingga Kota Tua. Proyek ini akan melayani 8 stasiun baru dengan kapasitas 24,000 penumpang per jam
      per arah. Dengan teknologi terbaru dan standar internasional, proyek ini akan mengurangi kemacetan Jakarta
      hingga 35% di koridor utara-selatan.
      
      Proyek ini mendapat dukungan penuh dari Pemerintah DKI Jakarta dan Bank Dunia sebagai mitra pendanaan strategis.
      Konstruksi dimulai Q2 2025 dengan target operasional Q4 2027.
    `,
    category: 'Transportation',
    location: 'Jakarta Pusat - Jakarta Utara',
    province: 'DKI Jakarta',
    totalValue: 15000000000000, // IDR 15 trillion
    tokenPrice: 1000000, // IDR 1 million per token
    totalSupply: 15000000, // 15 million tokens
    availableSupply: 3500000, // 3.5 million still available
    minimumInvestment: 5000000, // IDR 5 million minimum
    expectedReturn: 12.5, // 12.5% IRR
    projectDuration: 35, // 35 years concession
    status: 'active',
    spvName: 'PT Jakarta MRT Infrastructure',
    spvAddress: '0x8ba1f109551bD432803012645Hac136c7E24b2b5',
    contractAddress: '0x1234567890123456789012345678901234567890',
    offeringStart: '2025-01-15T00:00:00Z',
    offeringEnd: '2025-04-15T23:59:59Z',
    fundedPercentage: 76.7, // 11.5M of 15M tokens sold
    investorCount: 4823,
    images: [
      '/images/projects/jakarta-mrt-1.jpg',
      '/images/projects/jakarta-mrt-2.jpg',
      '/images/projects/jakarta-mrt-3.jpg',
    ],
    documents: [
      {
        name: 'Feasibility Study Report',
        type: 'PDF',
        url: '/documents/jakarta-mrt-feasibility.pdf',
        uploadDate: '2024-12-15T10:00:00Z',
      },
      {
        name: 'Environmental Impact Assessment',
        type: 'PDF',
        url: '/documents/jakarta-mrt-eia.pdf',
        uploadDate: '2024-12-20T14:30:00Z',
      },
      {
        name: 'Technical Specifications',
        type: 'PDF',
        url: '/documents/jakarta-mrt-tech.pdf',
        uploadDate: '2025-01-05T09:15:00Z',
      },
    ],
    keyMetrics: {
      irr: 12.5,
      paybackPeriod: 8.2,
      riskLevel: 'medium',
      governmentSupport: true,
    },
    milestones: [
      {
        title: 'Permitting & Licensing Complete',
        description:
          'All required permits and licenses obtained from government',
        targetDate: '2025-03-31',
        completed: true,
        completedDate: '2025-03-28',
      },
      {
        title: 'Land Acquisition Complete',
        description: 'All land required for construction acquired',
        targetDate: '2025-06-30',
        completed: false,
      },
      {
        title: 'Construction Phase 1 Start',
        description:
          'Begin construction of first segment (Bundaran HI - Monas)',
        targetDate: '2025-09-01',
        completed: false,
      },
      {
        title: 'Commercial Operation',
        description: 'Full commercial operation of all 8 stations',
        targetDate: '2027-12-31',
        completed: false,
      },
    ],
    profitDistributions: [
      {
        id: 'mrt-q4-2024',
        quarter: 'Q4',
        year: 2024,
        totalAmount: 75000000000, // IDR 75 billion
        perTokenAmount: 6500, // IDR 6,500 per token
        distributionDate: '2025-01-15T10:00:00Z',
        claimedPercentage: 89.3,
      },
    ],
    governance: {
      totalProposals: 3,
      activeProposals: 1,
      votingPower: 15.2, // 15.2% for our demo investor
    },
  },
  {
    id: 'surabaya-monorail',
    name: 'Surabaya Monorail Integrated System',
    shortName: 'Surabaya Monorail',
    description:
      'Sistem monorail terintegrasi untuk mengurangi kemacetan di Surabaya metropolitan area',
    longDescription: `
      Sistem Monorail Surabaya merupakan proyek transportasi mass rapid transit pertama di Jawa Timur yang akan
      melayani rute strategis dari Bandara Juanda hingga pusat kota Surabaya. Proyek ini menggunakan teknologi
      monorail modern dengan kapasitas 18,000 penumpang per jam per arah.
      
      Proyek ini akan terintegrasi penuh dengan sistem Bus Rapid Transit (BRT) yang sudah ada dan stasiun kereta
      api, menciptakan ekosistem transportasi publik yang komprehensif untuk 3.2 juta penduduk Surabaya Raya.
    `,
    category: 'Transportation',
    location: 'Surabaya - Sidoarjo',
    province: 'Jawa Timur',
    totalValue: 8500000000000, // IDR 8.5 trillion
    tokenPrice: 500000, // IDR 500K per token
    totalSupply: 17000000, // 17 million tokens
    availableSupply: 8200000, // 8.2 million available
    minimumInvestment: 2500000, // IDR 2.5 million minimum
    expectedReturn: 11.8, // 11.8% IRR
    projectDuration: 30, // 30 years concession
    status: 'active',
    spvName: 'PT Surabaya Monorail Transport',
    spvAddress: '0x1ba1f109551bD432803012645Hac136c7E24b2c6',
    contractAddress: '0x2234567890123456789012345678901234567891',
    offeringStart: '2025-02-01T00:00:00Z',
    offeringEnd: '2025-05-01T23:59:59Z',
    fundedPercentage: 51.8, // 8.8M of 17M tokens sold
    investorCount: 2156,
    images: [
      '/images/projects/surabaya-monorail-1.jpg',
      '/images/projects/surabaya-monorail-2.jpg',
    ],
    documents: [
      {
        name: 'Project Overview Presentation',
        type: 'PDF',
        url: '/documents/surabaya-monorail-overview.pdf',
        uploadDate: '2024-12-10T10:00:00Z',
      },
      {
        name: 'Traffic Impact Analysis',
        type: 'PDF',
        url: '/documents/surabaya-monorail-traffic.pdf',
        uploadDate: '2024-12-25T16:45:00Z',
      },
    ],
    keyMetrics: {
      irr: 11.8,
      paybackPeriod: 8.9,
      riskLevel: 'low',
      governmentSupport: true,
    },
    milestones: [
      {
        title: 'Design Development Complete',
        description: 'Detailed engineering design completed and approved',
        targetDate: '2025-05-31',
        completed: false,
      },
      {
        title: 'Construction Mobilization',
        description: 'Construction contractors mobilized and work begins',
        targetDate: '2025-08-15',
        completed: false,
      },
    ],
    profitDistributions: [],
    governance: {
      totalProposals: 1,
      activeProposals: 0,
      votingPower: 8.7,
    },
  },
  {
    id: 'bandung-smart-highway',
    name: 'Bandung Smart Highway Corridor',
    shortName: 'Bandung Smart Highway',
    description:
      'Jalan tol pintar dengan teknologi IoT dan sistem pembayaran digital terintegrasi',
    longDescription: `
      Bandung Smart Highway Corridor adalah proyek infrastruktur inovatif yang mengintegrasikan teknologi
      Internet of Things (IoT), sistem pembayaran digital, dan manajemen lalu lintas cerdas sepanjang 45 km
      dari Bandung hingga Cirebon.
      
      Proyek ini akan menjadi jalan tol pertama di Indonesia yang sepenuhnya digital dengan fitur dynamic
      pricing, automated toll collection, dan real-time traffic management system. Target traffic volume
      adalah 85,000 kendaraan per hari dengan proyeksi pendapatan IDR 245 miliar per tahun.
    `,
    category: 'Transportation',
    location: 'Bandung - Cirebon',
    province: 'Jawa Barat',
    totalValue: 6200000000000, // IDR 6.2 trillion
    tokenPrice: 750000, // IDR 750K per token
    totalSupply: 8266667, // ~8.27 million tokens
    availableSupply: 6200000, // 6.2 million available
    minimumInvestment: 3750000, // IDR 3.75 million minimum
    expectedReturn: 13.2, // 13.2% IRR
    projectDuration: 40, // 40 years concession
    status: 'active',
    spvName: 'PT Bandung Smart Infrastructure',
    spvAddress: '0x2ca1f109551bD432803012645Hac136c7E24b2d7',
    contractAddress: '0x3334567890123456789012345678901234567892',
    offeringStart: '2025-01-20T00:00:00Z',
    offeringEnd: '2025-03-20T23:59:59Z',
    fundedPercentage: 25.0, // 2.07M of 8.27M tokens sold
    investorCount: 892,
    images: [
      '/images/projects/bandung-highway-1.jpg',
      '/images/projects/bandung-highway-2.jpg',
      '/images/projects/bandung-highway-3.jpg',
    ],
    documents: [
      {
        name: 'Technology Integration Plan',
        type: 'PDF',
        url: '/documents/bandung-highway-tech.pdf',
        uploadDate: '2024-11-30T11:20:00Z',
      },
      {
        name: 'Revenue Projection Model',
        type: 'Excel',
        url: '/documents/bandung-highway-revenue.xlsx',
        uploadDate: '2025-01-10T13:15:00Z',
      },
    ],
    keyMetrics: {
      irr: 13.2,
      paybackPeriod: 7.8,
      riskLevel: 'high',
      governmentSupport: true,
    },
    milestones: [
      {
        title: 'Technology Partner Selection',
        description: 'IoT and smart traffic system vendors selected',
        targetDate: '2025-04-30',
        completed: false,
      },
      {
        title: 'Pilot Section Testing',
        description: '10km pilot section with full smart features operational',
        targetDate: '2026-06-30',
        completed: false,
      },
    ],
    profitDistributions: [],
    governance: {
      totalProposals: 2,
      activeProposals: 1,
      votingPower: 12.4,
    },
  },
  {
    id: 'bali-waste-energy',
    name: 'Bali Integrated Waste-to-Energy Plant',
    shortName: 'Bali WtE Plant',
    description:
      'Pembangkit listrik ramah lingkungan dari pengolahan sampah terintegrasi di Bali',
    longDescription: `
      Pembangkit Listrik Tenaga Sampah (PLTSa) Bali adalah proyek energi terbarukan yang mengolah 1,200 ton
      sampah per hari menjadi 35 MW listrik bersih. Proyek ini menggunakan teknologi incineration terdepan
      dari Jepang dengan standar emisi Euro 6.
      
      Selain menghasilkan listrik, proyek ini juga akan menyelesaikan masalah krisis sampah di Bali yang
      mencapai 4,000 ton per hari. Dengan integrasi sistem daur ulang dan kompos, proyek ini akan menjadi
      model circular economy terdepan di Asia Tenggara.
    `,
    category: 'Energy',
    location: 'Denpasar - Gianyar',
    province: 'Bali',
    totalValue: 4800000000000, // IDR 4.8 trillion
    tokenPrice: 600000, // IDR 600K per token
    totalSupply: 8000000, // 8 million tokens
    availableSupply: 7200000, // 7.2 million available
    minimumInvestment: 3000000, // IDR 3 million minimum
    expectedReturn: 14.5, // 14.5% IRR
    projectDuration: 25, // 25 years concession
    status: 'active',
    spvName: 'PT Bali Green Energy Solutions',
    spvAddress: '0x3da1f109551bD432803012645Hac136c7E24b2e8',
    contractAddress: '0x4434567890123456789012345678901234567893',
    offeringStart: '2025-02-15T00:00:00Z',
    offeringEnd: '2025-04-15T23:59:59Z',
    fundedPercentage: 10.0, // 800K of 8M tokens sold (recently launched)
    investorCount: 234,
    images: [
      '/images/projects/bali-waste-energy-1.jpg',
      '/images/projects/bali-waste-energy-2.jpg',
    ],
    documents: [
      {
        name: 'Environmental Compliance Certificate',
        type: 'PDF',
        url: '/documents/bali-wte-environmental.pdf',
        uploadDate: '2025-01-20T08:30:00Z',
      },
      {
        name: 'Technology Partnership Agreement',
        type: 'PDF',
        url: '/documents/bali-wte-tech-partnership.pdf',
        uploadDate: '2025-02-01T14:20:00Z',
      },
    ],
    keyMetrics: {
      irr: 14.5,
      paybackPeriod: 7.2,
      riskLevel: 'very-high',
      governmentSupport: true,
    },
    milestones: [
      {
        title: 'Equipment Procurement',
        description: 'Incineration and power generation equipment ordered',
        targetDate: '2025-06-30',
        completed: false,
      },
      {
        title: 'Site Preparation Complete',
        description: 'Land clearing and foundation work completed',
        targetDate: '2025-09-30',
        completed: false,
      },
    ],
    profitDistributions: [],
    governance: {
      totalProposals: 0,
      activeProposals: 0,
      votingPower: 5.8,
    },
  },
];

// Mock investments for the demo user (Rina)
export const MOCK_INVESTMENTS: MockInvestment[] = [
  {
    id: 'inv-1',
    projectId: 'jakarta-mrt-extension',
    investorId: 'investor-rina',
    tokenAmount: 75, // 75 tokens
    investmentAmount: 75000000, // IDR 75 million
    transactionHash: '0xabc123...',
    timestamp: '2025-01-16T10:30:00Z',
    status: 'completed',
    claimableReturns: 487500, // IDR 487,500 (75 tokens * IDR 6,500)
    totalReturns: 487500,
  },
  {
    id: 'inv-2',
    projectId: 'surabaya-monorail',
    investorId: 'investor-rina',
    tokenAmount: 100, // 100 tokens
    investmentAmount: 50000000, // IDR 50 million
    transactionHash: '0xdef456...',
    timestamp: '2025-02-03T14:15:00Z',
    status: 'completed',
    claimableReturns: 0, // No distributions yet
    totalReturns: 0,
  },
];

// Mock governance proposals
export const MOCK_GOVERNANCE_PROPOSALS: MockGovernanceProposal[] = [
  {
    id: 'prop-mrt-1',
    projectId: 'jakarta-mrt-extension',
    title: 'Proposal: Upgrade to Latest Train Control System',
    description: `
      This proposal seeks approval to upgrade the current Automatic Train Control (ATC) system to the latest
      Communications-Based Train Control (CBTC) technology. The upgrade will:
      
      - Increase train frequency from 3 minutes to 90 seconds during peak hours
      - Improve passenger capacity by 40%
      - Reduce operational costs by 15% through better energy efficiency
      - Enhance safety with predictive maintenance capabilities
      
      Total upgrade cost: IDR 125 billion
      Expected implementation: Q3 2025 - Q1 2026
      ROI improvement: Additional 2.3% IRR
    `,
    proposer: 'PT Jakarta MRT Infrastructure',
    createdAt: '2025-01-10T09:00:00Z',
    votingStart: '2025-01-15T00:00:00Z',
    votingEnd: '2025-01-29T23:59:59Z',
    status: 'active',
    votesFor: 1847293, // 1.85M tokens
    votesAgainst: 234187, // 234K tokens
    votesAbstain: 89420, // 89K tokens
    totalVotingPower: 11500000, // 11.5M tokens (total issued)
    quorumReached: true,
    userVote: undefined, // User hasn't voted yet
  },
  {
    id: 'prop-bandung-1',
    projectId: 'bandung-smart-highway',
    title: 'Proposal: Partnership with Local Tech Startup for IoT Development',
    description: `
      Proposal to partner with Bandung-based tech startup "SmartRoad Indonesia" for development of
      proprietary IoT sensors and traffic management algorithms. This partnership will:
      
      - Support local tech ecosystem and create 200+ high-tech jobs
      - Reduce technology costs by 30% compared to international vendors
      - Enable faster customization and maintenance
      - Generate additional IP revenue streams
      
      Partnership investment: IDR 45 billion
      Local content requirement: 75%
      Technology transfer program included
    `,
    proposer: 'PT Bandung Smart Infrastructure',
    createdAt: '2025-01-18T11:30:00Z',
    votingStart: '2025-01-22T00:00:00Z',
    votingEnd: '2025-02-05T23:59:59Z',
    status: 'active',
    votesFor: 312456, // 312K tokens
    votesAgainst: 87234, // 87K tokens
    votesAbstain: 45123, // 45K tokens
    totalVotingPower: 2066667, // 2.07M tokens (total issued)
    quorumReached: false,
    userVote: undefined,
  },
];

// Utility functions for mock data
export const getMockUserByRole = (
  role: 'admin' | 'spv' | 'investor'
): MockUser => {
  return MOCK_USERS.find(user => user.role === role) || MOCK_USERS[0];
};

export const getMockProjectById = (id: string): MockProject | undefined => {
  return MOCK_PROJECTS.find(project => project.id === id);
};

export const getMockInvestmentsByUserId = (
  userId: string
): MockInvestment[] => {
  return MOCK_INVESTMENTS.filter(
    investment => investment.investorId === userId
  );
};

export const getMockProposalsByProjectId = (
  projectId: string
): MockGovernanceProposal[] => {
  return MOCK_GOVERNANCE_PROPOSALS.filter(
    proposal => proposal.projectId === projectId
  );
};

export const calculatePortfolioSummary = (userId: string) => {
  const investments = getMockInvestmentsByUserId(userId);
  const totalInvested = investments.reduce(
    (sum, inv) => sum + inv.investmentAmount,
    0
  );
  const totalReturns = investments.reduce(
    (sum, inv) => sum + inv.totalReturns,
    0
  );
  const claimableReturns = investments.reduce(
    (sum, inv) => sum + inv.claimableReturns,
    0
  );
  const currentValue = totalInvested + totalReturns;
  const roi =
    totalInvested > 0
      ? ((currentValue - totalInvested) / totalInvested) * 100
      : 0;

  return {
    totalInvested,
    currentValue,
    totalReturns,
    claimableReturns,
    roi,
    projectCount: investments.length,
  };
};

// Default user for presentation mode (Rina the Investor)
export const PRESENTATION_USER = MOCK_USERS[0]; // Rina Sari Dewi
