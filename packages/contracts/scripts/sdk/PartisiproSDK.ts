/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers, Contract, Provider, Signer } from 'ethers';
import { EventEmitter } from 'events';

// Import utilities
import ContractInteractionUtils from '../utils/ContractInteractionUtils';
import PlatformHealthMonitor from '../utils/PlatformHealthMonitor';
import OnChainAnalytics from '../utils/OnChainAnalytics';
import ComplianceReporting from '../utils/ComplianceReporting';

// Types and interfaces
export interface SDKConfig {
  network: 'arbitrumSepolia' | 'arbitrumOne' | 'localhost';
  rpcUrl: string;
  contracts: {
    PlatformRegistry: string;
    PlatformTreasury: string;
    IdentityRegistry: string;
    ClaimTopicsRegistry: string;
    TrustedIssuersRegistry: string;
    ProjectFactory: string;
    ProjectToken: string;
    ProjectOffering: string;
    ProjectTreasury: string;
    ProjectGovernance: string;
  };
  monitoring?: {
    enabled: boolean;
    checkInterval?: number;
    alertThresholds?: {
      responseTime: number;
      gasPrice: number;
      errorRate: number;
    };
  };
  analytics?: {
    enabled: boolean;
    reportingPeriod?: {
      start: number;
      end: number;
    };
  };
  compliance?: {
    enabled: boolean;
    regulatoryFramework?: string;
    thresholds?: {
      minimumComplianceScore: number;
      identityVerificationRate: number;
      transactionComplianceRate: number;
    };
  };
}

export interface TransactionOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  value?: bigint;
  nonce?: number;
}

export interface ProjectCreationParams {
  tokenName: string;
  tokenSymbol: string;
  totalSupply: bigint;
  offeringPrice: bigint;
  offeringDuration: number;
  projectMetadata: {
    name: string;
    description: string;
    location: string;
    category: string;
    expectedROI: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface IdentityVerificationData {
  userAddress: string;
  identityId: string;
  claims: Array<{
    topic: number;
    issuer: string;
    signature: string;
    data: string;
    validity?: number;
  }>;
}

export interface InvestmentData {
  projectAddress: string;
  amount: bigint;
  investorAddress: string;
  paymentMethod: 'crypto' | 'fiat';
  fiatCurrency?: string;
  fiatAmount?: number;
}

export interface GovernanceProposal {
  title: string;
  description: string;
  targets: string[];
  values: bigint[];
  calldatas: string[];
  proposalType: 'configuration' | 'upgrade' | 'treasury' | 'general';
}

export class PartisiproSDK extends EventEmitter {
  private config: SDKConfig;
  private provider: Provider;
  private signer?: Signer;
  private contracts: Map<string, Contract> = new Map();
  private contractUtils?: ContractInteractionUtils;
  private healthMonitor?: PlatformHealthMonitor;
  private analytics?: OnChainAnalytics;
  private compliance?: ComplianceReporting;
  private isInitialized = false;

  constructor(config: SDKConfig, signer?: Signer) {
    super();
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.signer = signer;
  }

  /**
   * Initialize the SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ SDK already initialized');
      return;
    }

    console.log('🚀 Initializing Partisipro SDK...');
    
    try {
      // Load contract ABIs and initialize contracts
      await this.loadContracts();
      
      // Initialize utilities
      if (this.signer) {
        this.contractUtils = new ContractInteractionUtils(this.provider, this.signer);
        
        // Load deployment configuration for utilities
        const deploymentConfig = await this.loadDeploymentConfiguration();
        
        // Initialize monitoring if enabled
        if (this.config.monitoring?.enabled) {
          await this.initializeMonitoring();
        }
        
        // Initialize analytics if enabled
        if (this.config.analytics?.enabled) {
          await this.initializeAnalytics();
        }
        
        // Initialize compliance if enabled
        if (this.config.compliance?.enabled) {
          await this.initializeCompliance();
        }
      }
      
      this.isInitialized = true;
      console.log('✅ Partisipro SDK initialized successfully');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ SDK initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load and initialize contracts
   */
  private async loadContracts(): Promise<void> {
    console.log('📋 Loading contracts...');
    
    // Load ABIs (in production, these would be loaded from artifacts)
    const contractABIs = await this.loadContractABIs();
    
    for (const [contractName, address] of Object.entries(this.config.contracts)) {
      try {
        const abi = contractABIs[contractName];
        if (!abi) {
          console.warn(`⚠️ ABI not found for ${contractName}`);
          continue;
        }
        
        const contract = new ethers.Contract(
          address,
          abi,
          this.signer || this.provider
        );
        
        this.contracts.set(contractName, contract);
        console.log(`✅ Loaded ${contractName} at ${address}`);
      } catch (error) {
        console.error(`❌ Failed to load ${contractName}:`, error);
      }
    }
  }

  /**
   * Load contract ABIs
   */
  private async loadContractABIs(): Promise<Record<string, any[]>> {
    // In production, this would load from artifacts or external source
    // For now, return minimal ABIs for demonstration
    return {
      PlatformRegistry: [
        'function registerSPV(address spvAddress) external',
        'function getPlatformConfig() external view returns (tuple)',
        'function activateEmergencyMode() external',
        'function deactivateEmergencyMode() external',
        'event SPVRegistered(address indexed spvAddress, uint256 timestamp)',
        'event EmergencyModeActivated(uint256 timestamp)',
      ],
      IdentityRegistry: [
        'function registerIdentity(address userAddress, string memory identityId, tuple[] memory claims) external',
        'function isVerified(address userAddress) external view returns (bool)',
        'function getClaims(address userAddress) external view returns (tuple[])',
        'event IdentityRegistered(address indexed userAddress, string identityId)',
        'event ClaimAdded(address indexed userAddress, uint256 indexed topic)',
      ],
      ProjectFactory: [
        'function createProject(string memory tokenName, string memory tokenSymbol, uint256 totalSupply, uint256 offeringPrice, uint256 offeringDuration) external payable',
        'function getProjectCount() external view returns (uint256)',
        'function getProjectAddress(uint256 projectId) external view returns (address)',
        'event ProjectCreated(uint256 indexed projectId, address indexed projectAddress, address indexed spv)',
      ],
      // Add more contract ABIs as needed
    };
  }

  /**
   * Load deployment configuration
   */
  private async loadDeploymentConfiguration(): Promise<any> {
    // In production, this would load from deployment files
    return {
      contracts: Array.from(this.contracts.entries()).map(([name, contract]) => ({
        name,
        address: contract.target as string,
        abi: [], // Would be loaded from artifacts
      })),
    };
  }

  /**
   * Initialize monitoring
   */
  private async initializeMonitoring(): Promise<void> {
    if (!this.config.monitoring?.enabled) return;
    
    console.log('📊 Initializing health monitoring...');
    
    const monitoringConfig = {
      checkInterval: this.config.monitoring.checkInterval || 30000,
      alertThresholds: this.config.monitoring.alertThresholds || {
        responseTime: 5000,
        gasPrice: 50,
        errorRate: 5,
      },
      contracts: Array.from(this.contracts.entries()).map(([name, contract]) => ({
        name,
        address: contract.target as string,
        abi: [], // Would be loaded from artifacts
      })),
      notifications: {},
    };
    
    this.healthMonitor = new PlatformHealthMonitor(this.provider, monitoringConfig);
    
    // Set up event listeners
    this.healthMonitor.on('healthUpdate', (status) => {
      this.emit('healthUpdate', status);
    });
    
    this.healthMonitor.on('error', (error) => {
      this.emit('monitoringError', error);
    });
  }

  /**
   * Initialize analytics
   */
  private async initializeAnalytics(): Promise<void> {
    if (!this.config.analytics?.enabled) return;
    
    console.log('📈 Initializing analytics...');
    
    const analyticsConfig = {
      contracts: Array.from(this.contracts.entries()).map(([name, contract]) => ({
        name,
        address: contract.target as string,
        abi: [], // Would be loaded from artifacts
        startBlock: 0,
      })),
      reportingPeriod: this.config.analytics.reportingPeriod || {
        start: 0,
        end: await this.provider.getBlockNumber(),
      },
      batchSize: 1000,
      cacheResults: true,
      includeEvents: true,
      includeFunctionCalls: true,
    };
    
    this.analytics = new OnChainAnalytics(this.provider, analyticsConfig);
  }

  /**
   * Initialize compliance reporting
   */
  private async initializeCompliance(): Promise<void> {
    if (!this.config.compliance?.enabled) return;
    
    console.log('📋 Initializing compliance reporting...');
    
    const complianceConfig = {
      contracts: Array.from(this.contracts.entries()).map(([name, contract]) => ({
        name,
        address: contract.target as string,
        abi: [], // Would be loaded from artifacts
        complianceRules: [],
      })),
      reportingPeriod: {
        start: 0,
        end: Date.now(),
      },
      regulatoryFramework: {
        country: 'Indonesia',
        regulations: ['Indonesian Capital Market Law', 'OJK Regulation No. 13/2022'],
        requirements: {},
      },
      thresholds: this.config.compliance.thresholds || {
        minimumComplianceScore: 85,
        identityVerificationRate: 95,
        transactionComplianceRate: 98,
        governanceParticipationRate: 30,
      },
      notifications: {},
    };
    
    this.compliance = new ComplianceReporting(this.provider, complianceConfig);
  }

  /**
   * Platform Management Methods
   */
  async registerSPV(spvAddress: string, options?: TransactionOptions): Promise<string> {
    this.ensureInitialized();
    
    const platformRegistry = this.contracts.get('PlatformRegistry');
    if (!platformRegistry) {
      throw new Error('PlatformRegistry contract not found');
    }
    
    console.log(`📝 Registering SPV: ${spvAddress}`);
    
    try {
      const tx = await platformRegistry.registerSPV(spvAddress, options || {});
      const receipt = await tx.wait();
      
      console.log(`✅ SPV registered successfully: ${receipt.hash}`);
      this.emit('spvRegistered', { spvAddress, transactionHash: receipt.hash });
      
      return receipt.hash;
    } catch (error) {
      console.error('❌ SPV registration failed:', error);
      throw error;
    }
  }

  async getPlatformConfig(): Promise<any> {
    this.ensureInitialized();
    
    const platformRegistry = this.contracts.get('PlatformRegistry');
    if (!platformRegistry) {
      throw new Error('PlatformRegistry contract not found');
    }
    
    return await platformRegistry.getPlatformConfig();
  }

  async activateEmergencyMode(): Promise<string> {
    this.ensureInitialized();
    
    const platformRegistry = this.contracts.get('PlatformRegistry');
    if (!platformRegistry) {
      throw new Error('PlatformRegistry contract not found');
    }
    
    console.log('🚨 Activating emergency mode...');
    
    try {
      const tx = await platformRegistry.activateEmergencyMode();
      const receipt = await tx.wait();
      
      console.log(`✅ Emergency mode activated: ${receipt.hash}`);
      this.emit('emergencyModeActivated', { transactionHash: receipt.hash });
      
      return receipt.hash;
    } catch (error) {
      console.error('❌ Emergency mode activation failed:', error);
      throw error;
    }
  }

  /**
   * Identity Management Methods
   */
  async registerIdentity(
    identityData: IdentityVerificationData,
    options?: TransactionOptions
  ): Promise<string> {
    this.ensureInitialized();
    
    const identityRegistry = this.contracts.get('IdentityRegistry');
    if (!identityRegistry) {
      throw new Error('IdentityRegistry contract not found');
    }
    
    console.log(`👤 Registering identity: ${identityData.userAddress}`);
    
    try {
      const tx = await identityRegistry.registerIdentity(
        identityData.userAddress,
        identityData.identityId,
        identityData.claims,
        options || {}
      );
      const receipt = await tx.wait();
      
      console.log(`✅ Identity registered successfully: ${receipt.hash}`);
      this.emit('identityRegistered', { 
        userAddress: identityData.userAddress,
        identityId: identityData.identityId,
        transactionHash: receipt.hash 
      });
      
      return receipt.hash;
    } catch (error) {
      console.error('❌ Identity registration failed:', error);
      throw error;
    }
  }

  async isIdentityVerified(userAddress: string): Promise<boolean> {
    this.ensureInitialized();
    
    const identityRegistry = this.contracts.get('IdentityRegistry');
    if (!identityRegistry) {
      throw new Error('IdentityRegistry contract not found');
    }
    
    return await identityRegistry.isVerified(userAddress);
  }

  async getIdentityClaims(userAddress: string): Promise<any[]> {
    this.ensureInitialized();
    
    const identityRegistry = this.contracts.get('IdentityRegistry');
    if (!identityRegistry) {
      throw new Error('IdentityRegistry contract not found');
    }
    
    return await identityRegistry.getClaims(userAddress);
  }

  /**
   * Project Management Methods
   */
  async createProject(
    projectParams: ProjectCreationParams,
    options?: TransactionOptions
  ): Promise<{ projectId: number; projectAddress: string; transactionHash: string }> {
    this.ensureInitialized();
    
    const projectFactory = this.contracts.get('ProjectFactory');
    if (!projectFactory) {
      throw new Error('ProjectFactory contract not found');
    }
    
    console.log(`🏗️ Creating project: ${projectParams.tokenName}`);
    
    try {
      const tx = await projectFactory.createProject(
        projectParams.tokenName,
        projectParams.tokenSymbol,
        projectParams.totalSupply,
        projectParams.offeringPrice,
        projectParams.offeringDuration,
        options || {}
      );
      const receipt = await tx.wait();
      
      // Parse the ProjectCreated event
      const projectCreatedEvent = receipt.logs.find((log: any) => 
        log.topics[0] === projectFactory.interface.getEventTopic('ProjectCreated')
      );
      
      if (!projectCreatedEvent) {
        throw new Error('ProjectCreated event not found in transaction receipt');
      }
      
      const decodedEvent = projectFactory.interface.parseLog(projectCreatedEvent);
      const projectId = decodedEvent.args.projectId.toNumber();
      const projectAddress = decodedEvent.args.projectAddress;
      
      console.log(`✅ Project created successfully: ID ${projectId}, Address ${projectAddress}`);
      this.emit('projectCreated', { 
        projectId,
        projectAddress,
        projectParams,
        transactionHash: receipt.hash 
      });
      
      return { projectId, projectAddress, transactionHash: receipt.hash };
    } catch (error) {
      console.error('❌ Project creation failed:', error);
      throw error;
    }
  }

  async getProjectCount(): Promise<number> {
    this.ensureInitialized();
    
    const projectFactory = this.contracts.get('ProjectFactory');
    if (!projectFactory) {
      throw new Error('ProjectFactory contract not found');
    }
    
    const count = await projectFactory.getProjectCount();
    return count.toNumber();
  }

  async getProjectAddress(projectId: number): Promise<string> {
    this.ensureInitialized();
    
    const projectFactory = this.contracts.get('ProjectFactory');
    if (!projectFactory) {
      throw new Error('ProjectFactory contract not found');
    }
    
    return await projectFactory.getProjectAddress(projectId);
  }

  /**
   * Investment Methods
   */
  async investInProject(
    investmentData: InvestmentData,
    options?: TransactionOptions
  ): Promise<string> {
    this.ensureInitialized();
    
    console.log(`💰 Investing in project: ${investmentData.projectAddress}`);
    
    // First, verify investor identity
    const isVerified = await this.isIdentityVerified(investmentData.investorAddress);
    if (!isVerified) {
      throw new Error('Investor identity not verified');
    }
    
    // Get project offering contract
    const projectOffering = new ethers.Contract(
      investmentData.projectAddress,
      ['function buyTokens(uint256 amount) external payable'],
      this.signer || this.provider
    );
    
    try {
      const tx = await projectOffering.buyTokens(investmentData.amount, {
        value: investmentData.amount,
        ...options,
      });
      const receipt = await tx.wait();
      
      console.log(`✅ Investment successful: ${receipt.hash}`);
      this.emit('investmentMade', { 
        projectAddress: investmentData.projectAddress,
        amount: investmentData.amount,
        investor: investmentData.investorAddress,
        transactionHash: receipt.hash 
      });
      
      return receipt.hash;
    } catch (error) {
      console.error('❌ Investment failed:', error);
      throw error;
    }
  }

  /**
   * Governance Methods
   */
  async createProposal(
    projectAddress: string,
    proposal: GovernanceProposal,
    options?: TransactionOptions
  ): Promise<string> {
    this.ensureInitialized();
    
    console.log(`🗳️ Creating proposal: ${proposal.title}`);
    
    // Get project governance contract
    const projectGovernance = new ethers.Contract(
      projectAddress,
      ['function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)'],
      this.signer || this.provider
    );
    
    try {
      const tx = await projectGovernance.propose(
        proposal.targets,
        proposal.values,
        proposal.calldatas,
        proposal.description,
        options || {}
      );
      const receipt = await tx.wait();
      
      console.log(`✅ Proposal created successfully: ${receipt.hash}`);
      this.emit('proposalCreated', { 
        projectAddress,
        proposal,
        transactionHash: receipt.hash 
      });
      
      return receipt.hash;
    } catch (error) {
      console.error('❌ Proposal creation failed:', error);
      throw error;
    }
  }

  async vote(
    projectAddress: string,
    proposalId: number,
    support: boolean,
    options?: TransactionOptions
  ): Promise<string> {
    this.ensureInitialized();
    
    console.log(`🗳️ Voting on proposal ${proposalId}: ${support ? 'FOR' : 'AGAINST'}`);
    
    // Get project governance contract
    const projectGovernance = new ethers.Contract(
      projectAddress,
      ['function castVote(uint256 proposalId, uint8 support) external returns (uint256)'],
      this.signer || this.provider
    );
    
    try {
      const tx = await projectGovernance.castVote(proposalId, support ? 1 : 0, options || {});
      const receipt = await tx.wait();
      
      console.log(`✅ Vote cast successfully: ${receipt.hash}`);
      this.emit('voteCast', { 
        projectAddress,
        proposalId,
        support,
        transactionHash: receipt.hash 
      });
      
      return receipt.hash;
    } catch (error) {
      console.error('❌ Vote casting failed:', error);
      throw error;
    }
  }

  /**
   * Monitoring and Analytics Methods
   */
  async startHealthMonitoring(): Promise<void> {
    if (!this.healthMonitor) {
      throw new Error('Health monitoring not initialized');
    }
    
    await this.healthMonitor.startMonitoring();
  }

  async stopHealthMonitoring(): Promise<void> {
    if (!this.healthMonitor) {
      throw new Error('Health monitoring not initialized');
    }
    
    this.healthMonitor.stopMonitoring();
  }

  async getCurrentHealthStatus(): Promise<any> {
    if (!this.healthMonitor) {
      throw new Error('Health monitoring not initialized');
    }
    
    return this.healthMonitor.getCurrentHealthStatus();
  }

  async generateAnalyticsReport(): Promise<any> {
    if (!this.analytics) {
      throw new Error('Analytics not initialized');
    }
    
    return await this.analytics.generateAnalyticsReport();
  }

  async generateComplianceReport(): Promise<any> {
    if (!this.compliance) {
      throw new Error('Compliance reporting not initialized');
    }
    
    return await this.compliance.generateComplianceReport();
  }

  /**
   * Utility Methods
   */
  async estimateGas(
    contractName: string,
    functionName: string,
    args: any[] = [],
    options?: TransactionOptions
  ): Promise<bigint> {
    this.ensureInitialized();
    
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }
    
    return await contract[functionName].estimateGas(...args, options || {});
  }

  async getCurrentGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || BigInt(0);
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getNetworkInfo(): Promise<any> {
    return await this.provider.getNetwork();
  }

  /**
   * Event Listeners
   */
  listenToContractEvents(contractName: string, eventName: string, callback: (event: any) => void): void {
    this.ensureInitialized();
    
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }
    
    contract.on(eventName, callback);
  }

  removeContractEventListener(contractName: string, eventName: string): void {
    this.ensureInitialized();
    
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }
    
    contract.removeAllListeners(eventName);
  }

  /**
   * Helper Methods
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
  }

  getContractAddress(contractName: string): string {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }
    
    return contract.target as string;
  }

  getContract(contractName: string): Contract | null {
    return this.contracts.get(contractName) || null;
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.healthMonitor) {
      this.healthMonitor.stopMonitoring();
    }
    
    // Remove all event listeners
    this.contracts.forEach(contract => {
      contract.removeAllListeners();
    });
    
    this.removeAllListeners();
    this.isInitialized = false;
    
    console.log('🧹 SDK cleanup completed');
  }
}

// Helper function to create SDK instance
export function createPartisiproSDK(config: SDKConfig, signer?: Signer): PartisiproSDK {
  return new PartisiproSDK(config, signer);
}

// Default configurations for different networks
export const NETWORK_CONFIGS = {
  arbitrumSepolia: {
    network: 'arbitrumSepolia' as const,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    contracts: {
      PlatformRegistry: '0xc27bDcdeA460de9A76f759e785521a5cb834B7a1',
      PlatformTreasury: '0x53ab91a863B79824c4243EB258Ce9F23a0fAB89A',
      IdentityRegistry: '0x7f7ae1E07EedfEeeDd7A96ECA67dce85fe2A84eA',
      ClaimTopicsRegistry: '0x2DbA5D6bdb79Aa318cB74300D62F54e7baB949f6',
      TrustedIssuersRegistry: '0x812aA860f141D48E6c294AFD7ad6437a17051235',
      ProjectFactory: '0xC3abeE18DCfE502b38d0657dAc04Af8a746913D1',
      ProjectToken: '0x1f8Fb3846541571a5E3ed05f311d4695f02dc8Cd',
      ProjectOffering: '0x445b8Aa90eA5d2E80916Bc0f8ACc150d9b91634F',
      ProjectTreasury: '0x6662D1f5103dB37Cb72dE44b016c240167c44c35',
      ProjectGovernance: '0x1abd0E1e64258450e8F74f43Bc1cC47bfE6Efa23',
    },
    monitoring: {
      enabled: true,
      checkInterval: 30000,
      alertThresholds: {
        responseTime: 5000,
        gasPrice: 50,
        errorRate: 5,
      },
    },
    analytics: {
      enabled: true,
      reportingPeriod: {
        start: 0,
        end: 0, // Will be set to current block
      },
    },
    compliance: {
      enabled: true,
      regulatoryFramework: 'Indonesia',
      thresholds: {
        minimumComplianceScore: 85,
        identityVerificationRate: 95,
        transactionComplianceRate: 98,
      },
    },
  },
  localhost: {
    network: 'localhost' as const,
    rpcUrl: 'http://localhost:8545',
    contracts: {
      // Localhost addresses would be set after deployment
      PlatformRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      PlatformTreasury: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      IdentityRegistry: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      ClaimTopicsRegistry: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      TrustedIssuersRegistry: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      ProjectFactory: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
      ProjectToken: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
      ProjectOffering: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
      ProjectTreasury: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
      ProjectGovernance: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    },
    monitoring: {
      enabled: false,
    },
    analytics: {
      enabled: false,
    },
    compliance: {
      enabled: false,
    },
  },
};

export default PartisiproSDK;