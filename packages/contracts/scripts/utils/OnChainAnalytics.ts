import { ethers, Contract } from 'ethers';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface AnalyticsMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  blockNumber: number;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface TransactionAnalytics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalGasUsed: string;
  averageGasUsed: string;
  totalFees: string;
  averageFees: string;
  transactionsByContract: Record<string, number>;
  transactionsByFunction: Record<string, number>;
  hourlyTransactions: Record<string, number>;
  dailyTransactions: Record<string, number>;
}

export interface PlatformUsageAnalytics {
  totalProjects: number;
  activeProjects: number;
  totalInvestors: number;
  activeInvestors: number;
  totalInvestmentVolume: string;
  averageInvestmentSize: string;
  totalProfitDistributed: string;
  totalGovernanceProposals: number;
  totalVotes: number;
  voterParticipationRate: number;
  identityVerificationRate: number;
  claimIssuanceRate: number;
}

export interface ContractAnalytics {
  contractName: string;
  address: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalGasUsed: string;
  averageGasPerCall: string;
  mostCalledFunctions: Array<{
    functionName: string;
    callCount: number;
    gasUsed: string;
  }>;
  eventsCounts: Record<string, number>;
  dailyUsage: Record<string, number>;
}

export interface AnalyticsReport {
  timestamp: string;
  network: string;
  blockNumber: number;
  reportPeriod: {
    start: string;
    end: string;
    duration: number;
  };
  transactionAnalytics: TransactionAnalytics;
  platformUsageAnalytics: PlatformUsageAnalytics;
  contractAnalytics: ContractAnalytics[];
  keyMetrics: AnalyticsMetric[];
  trends: {
    transactionGrowth: number;
    userGrowth: number;
    volumeGrowth: number;
    governanceParticipation: number;
  };
}

export interface AnalyticsConfig {
  contracts: Array<{
    name: string;
    address: string;
    abi: any[];
    startBlock: number;
  }>;
  reportingPeriod: {
    start: number; // block number
    end: number; // block number
  };
  batchSize: number;
  cacheResults: boolean;
  includeEvents: boolean;
  includeFunctionCalls: boolean;
}

export class OnChainAnalytics {
  private provider: ethers.Provider;
  private config: AnalyticsConfig;
  private contracts: Map<string, Contract> = new Map();
  private analyticsCache: Map<string, any> = new Map();
  private metricsHistory: AnalyticsMetric[] = [];

  constructor(provider: ethers.Provider, config: AnalyticsConfig) {
    this.provider = provider;
    this.config = config;
    this.initializeContracts();
  }

  /**
   * Initialize contracts for analytics
   */
  private initializeContracts(): void {
    for (const contractConfig of this.config.contracts) {
      try {
        const contract = new ethers.Contract(
          contractConfig.address,
          contractConfig.abi,
          this.provider
        );
        this.contracts.set(contractConfig.name, contract);
        console.log(`📊 Initialized analytics for ${contractConfig.name}`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${contractConfig.name}:`, error);
      }
    }
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateAnalyticsReport(): Promise<AnalyticsReport> {
    console.log('📊 Generating comprehensive analytics report...');
    
    const startTime = Date.now();
    const currentBlock = await this.provider.getBlockNumber();
    
    try {
      // Collect all analytics data
      const [
        transactionAnalytics,
        platformUsageAnalytics,
        contractAnalytics,
        keyMetrics,
        trends
      ] = await Promise.all([
        this.generateTransactionAnalytics(),
        this.generatePlatformUsageAnalytics(),
        this.generateContractAnalytics(),
        this.generateKeyMetrics(),
        this.generateTrends(),
      ]);

      const report: AnalyticsReport = {
        timestamp: new Date().toISOString(),
        network: (await this.provider.getNetwork()).name,
        blockNumber: currentBlock,
        reportPeriod: {
          start: new Date(this.config.reportingPeriod.start).toISOString(),
          end: new Date(this.config.reportingPeriod.end).toISOString(),
          duration: this.config.reportingPeriod.end - this.config.reportingPeriod.start,
        },
        transactionAnalytics,
        platformUsageAnalytics,
        contractAnalytics,
        keyMetrics,
        trends,
      };

      const executionTime = Date.now() - startTime;
      console.log(`✅ Analytics report generated in ${executionTime}ms`);
      
      return report;
    } catch (error) {
      console.error('❌ Analytics report generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate transaction analytics
   */
  private async generateTransactionAnalytics(): Promise<TransactionAnalytics> {
    console.log('📈 Analyzing transaction data...');
    
    const analytics: TransactionAnalytics = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalGasUsed: '0',
      averageGasUsed: '0',
      totalFees: '0',
      averageFees: '0',
      transactionsByContract: {},
      transactionsByFunction: {},
      hourlyTransactions: {},
      dailyTransactions: {},
    };

    let totalGasUsed = BigInt(0);
    let totalFees = BigInt(0);

    // Analyze transactions for each contract
    for (const [contractName, contract] of this.contracts) {
      try {
        const contractConfig = this.config.contracts.find(c => c.name === contractName);
        if (!contractConfig) continue;

        // Get all transaction receipts for this contract
        const filter = {
          address: contract.target as string,
          fromBlock: contractConfig.startBlock,
          toBlock: this.config.reportingPeriod.end,
        };

        const logs = await this.provider.getLogs(filter);
        
        for (const log of logs) {
          analytics.totalTransactions++;
          
          // Get transaction receipt
          const receipt = await this.provider.getTransactionReceipt(log.transactionHash);
          
          if (receipt) {
            if (receipt.status === 1) {
              analytics.successfulTransactions++;
            } else {
              analytics.failedTransactions++;
            }

            // Add gas usage
            totalGasUsed += receipt.gasUsed;
            
            // Calculate fees
            const gasPrice = receipt.gasPrice || BigInt(0);
            const fee = receipt.gasUsed * gasPrice;
            totalFees += fee;

            // Track by contract
            analytics.transactionsByContract[contractName] = 
              (analytics.transactionsByContract[contractName] || 0) + 1;

            // Track by time (hourly/daily)
            const block = await this.provider.getBlock(log.blockNumber);
            if (block) {
              const date = new Date(block.timestamp * 1000);
              const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
              const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              
              analytics.hourlyTransactions[hourKey] = (analytics.hourlyTransactions[hourKey] || 0) + 1;
              analytics.dailyTransactions[dayKey] = (analytics.dailyTransactions[dayKey] || 0) + 1;
            }
          }
        }
        
        // Analyze function calls
        const functionCalls = await this.analyzeFunctionCalls(contractName, contract);
        for (const [functionName, count] of Object.entries(functionCalls)) {
          analytics.transactionsByFunction[`${contractName}.${functionName}`] = count;
        }
        
      } catch (error) {
        console.error(`❌ Failed to analyze transactions for ${contractName}:`, error);
      }
    }

    // Calculate averages
    analytics.totalGasUsed = totalGasUsed.toString();
    analytics.averageGasUsed = analytics.totalTransactions > 0 
      ? (totalGasUsed / BigInt(analytics.totalTransactions)).toString()
      : '0';
    
    analytics.totalFees = totalFees.toString();
    analytics.averageFees = analytics.totalTransactions > 0 
      ? (totalFees / BigInt(analytics.totalTransactions)).toString()
      : '0';

    console.log(`📊 Transaction analysis complete: ${analytics.totalTransactions} transactions`);
    return analytics;
  }

  /**
   * Generate platform usage analytics
   */
  private async generatePlatformUsageAnalytics(): Promise<PlatformUsageAnalytics> {
    console.log('📊 Analyzing platform usage...');
    
    const analytics: PlatformUsageAnalytics = {
      totalProjects: 0,
      activeProjects: 0,
      totalInvestors: 0,
      activeInvestors: 0,
      totalInvestmentVolume: '0',
      averageInvestmentSize: '0',
      totalProfitDistributed: '0',
      totalGovernanceProposals: 0,
      totalVotes: 0,
      voterParticipationRate: 0,
      identityVerificationRate: 0,
      claimIssuanceRate: 0,
    };

    try {
      // Platform Registry Analytics
      const platformRegistry = this.contracts.get('PlatformRegistry');
      if (platformRegistry) {
        // Get total projects (from ProjectCreated events)
        const projectCreatedFilter = platformRegistry.filters.ProjectCreated?.();
        if (projectCreatedFilter) {
          const projectEvents = await platformRegistry.queryFilter(projectCreatedFilter);
          analytics.totalProjects = projectEvents.length;
        }

        // Get platform configuration
        try {
          const config = await platformRegistry.getPlatformConfig();
          analytics.totalInvestmentVolume = config.totalInvestmentVolume?.toString() || '0';
        } catch (error) {
          console.log('Platform config not available');
        }
      }

      // Identity Registry Analytics
      const identityRegistry = this.contracts.get('IdentityRegistry');
      if (identityRegistry) {
        // Get total verified identities
        const identityRegisteredFilter = identityRegistry.filters.IdentityRegistered?.();
        if (identityRegisteredFilter) {
          const identityEvents = await identityRegistry.queryFilter(identityRegisteredFilter);
          analytics.totalInvestors = identityEvents.length;
        }

        // Get claim issuance rate
        const claimAddedFilter = identityRegistry.filters.ClaimAdded?.();
        if (claimAddedFilter) {
          const claimEvents = await identityRegistry.queryFilter(claimAddedFilter);
          analytics.claimIssuanceRate = analytics.totalInvestors > 0 
            ? (claimEvents.length / analytics.totalInvestors) * 100
            : 0;
        }
      }

      // Project Governance Analytics
      const projectGovernance = this.contracts.get('ProjectGovernance');
      if (projectGovernance) {
        // Get total proposals
        const proposalCreatedFilter = projectGovernance.filters.ProposalCreated?.();
        if (proposalCreatedFilter) {
          const proposalEvents = await projectGovernance.queryFilter(proposalCreatedFilter);
          analytics.totalGovernanceProposals = proposalEvents.length;
        }

        // Get total votes
        const voteCastFilter = projectGovernance.filters.VoteCast?.();
        if (voteCastFilter) {
          const voteEvents = await projectGovernance.queryFilter(voteCastFilter);
          analytics.totalVotes = voteEvents.length;
        }

        // Calculate voter participation rate
        analytics.voterParticipationRate = analytics.totalInvestors > 0
          ? (analytics.totalVotes / analytics.totalInvestors) * 100
          : 0;
      }

      // Project Treasury Analytics
      const projectTreasury = this.contracts.get('ProjectTreasury');
      if (projectTreasury) {
        // Get total profit distributed
        const profitDistributedFilter = projectTreasury.filters.ProfitDistributed?.();
        if (profitDistributedFilter) {
          const profitEvents = await projectTreasury.queryFilter(profitDistributedFilter);
          let totalDistributed = BigInt(0);
          
          for (const event of profitEvents) {
            // Extract amount from event data
            try {
              const amount = (event as any).args?.amount || BigInt(0);
              totalDistributed += amount;
            } catch (error) {
              console.log('Could not parse profit distribution amount');
            }
          }
          
          analytics.totalProfitDistributed = totalDistributed.toString();
        }
      }

      // Calculate additional metrics
      analytics.identityVerificationRate = analytics.totalInvestors > 0 
        ? (analytics.totalInvestors / Math.max(analytics.totalInvestors, 1)) * 100
        : 0;

      analytics.averageInvestmentSize = analytics.totalInvestors > 0
        ? (BigInt(analytics.totalInvestmentVolume) / BigInt(analytics.totalInvestors)).toString()
        : '0';

      console.log(`📊 Platform usage analysis complete`);
      return analytics;
    } catch (error) {
      console.error('❌ Platform usage analysis failed:', error);
      return analytics;
    }
  }

  /**
   * Generate contract-specific analytics
   */
  private async generateContractAnalytics(): Promise<ContractAnalytics[]> {
    console.log('📊 Analyzing contract-specific metrics...');
    
    const contractAnalytics: ContractAnalytics[] = [];

    for (const [contractName, contract] of this.contracts) {
      try {
        const analytics: ContractAnalytics = {
          contractName,
          address: contract.target as string,
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          totalGasUsed: '0',
          averageGasPerCall: '0',
          mostCalledFunctions: [],
          eventsCounts: {},
          dailyUsage: {},
        };

        // Get contract configuration
        const contractConfig = this.config.contracts.find(c => c.name === contractName);
        if (!contractConfig) continue;

        // Analyze function calls
        const functionCallAnalytics = await this.analyzeFunctionCalls(contractName, contract);
        
        // Analyze events
        const eventAnalytics = await this.analyzeContractEvents(contractName, contract);
        analytics.eventsCounts = eventAnalytics;

        // Calculate totals
        analytics.totalCalls = Object.values(functionCallAnalytics).reduce((sum, count) => sum + count, 0);
        
        // Get most called functions
        const sortedFunctions = Object.entries(functionCallAnalytics)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([functionName, callCount]) => ({
            functionName,
            callCount,
            gasUsed: '0', // TODO: Calculate gas used per function
          }));

        analytics.mostCalledFunctions = sortedFunctions;

        contractAnalytics.push(analytics);
      } catch (error) {
        console.error(`❌ Failed to analyze contract ${contractName}:`, error);
      }
    }

    console.log(`📊 Contract analytics complete for ${contractAnalytics.length} contracts`);
    return contractAnalytics;
  }

  /**
   * Analyze function calls for a contract
   */
  private async analyzeFunctionCalls(contractName: string, contract: Contract): Promise<Record<string, number>> {
    const functionCalls: Record<string, number> = {};
    
    try {
      // Get all logs for this contract
      const contractConfig = this.config.contracts.find(c => c.name === contractName);
      if (!contractConfig) return functionCalls;

      const filter = {
        address: contract.target as string,
        fromBlock: contractConfig.startBlock,
        toBlock: this.config.reportingPeriod.end,
      };

      const logs = await this.provider.getLogs(filter);
      
      // For each transaction, try to decode the function call
      for (const log of logs) {
        try {
          const tx = await this.provider.getTransaction(log.transactionHash);
          if (tx && tx.data) {
            // Try to decode the function call
            const functionSignature = tx.data.slice(0, 10);
            
            // Map function signatures to names (simplified approach)
            const functionName = this.getFunctionNameFromSignature(functionSignature, contract);
            if (functionName) {
              functionCalls[functionName] = (functionCalls[functionName] || 0) + 1;
            }
          }
        } catch (error) {
          // Skip if we can't decode the transaction
        }
      }
    } catch (error) {
      console.error(`❌ Failed to analyze function calls for ${contractName}:`, error);
    }

    return functionCalls;
  }

  /**
   * Analyze contract events
   */
  private async analyzeContractEvents(contractName: string, contract: Contract): Promise<Record<string, number>> {
    const eventCounts: Record<string, number> = {};
    
    try {
      const contractConfig = this.config.contracts.find(c => c.name === contractName);
      if (!contractConfig) return eventCounts;

      // Get all events for this contract
      const filter = {
        address: contract.target as string,
        fromBlock: contractConfig.startBlock,
        toBlock: this.config.reportingPeriod.end,
      };

      const logs = await this.provider.getLogs(filter);
      
      for (const log of logs) {
        try {
          // Try to decode the event
          const eventName = this.getEventNameFromLog(log, contract);
          if (eventName) {
            eventCounts[eventName] = (eventCounts[eventName] || 0) + 1;
          }
        } catch (error) {
          // Skip if we can't decode the event
        }
      }
    } catch (error) {
      console.error(`❌ Failed to analyze events for ${contractName}:`, error);
    }

    return eventCounts;
  }

  /**
   * Generate key metrics
   */
  private async generateKeyMetrics(): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];
    const currentBlock = await this.provider.getBlockNumber();
    
    // Add key performance indicators
    metrics.push({
      name: 'Total Contracts',
      value: this.config.contracts.length,
      unit: 'contracts',
      timestamp: new Date().toISOString(),
      blockNumber: currentBlock,
      period: 'daily',
    });

    metrics.push({
      name: 'Active Contracts',
      value: this.contracts.size,
      unit: 'contracts',
      timestamp: new Date().toISOString(),
      blockNumber: currentBlock,
      period: 'daily',
    });

    // Add metrics to history
    this.metricsHistory.push(...metrics);
    
    return metrics;
  }

  /**
   * Generate trend analysis
   */
  private async generateTrends(): Promise<AnalyticsReport['trends']> {
    // Simple trend analysis (would be more sophisticated in production)
    return {
      transactionGrowth: 0, // TODO: Calculate from historical data
      userGrowth: 0,
      volumeGrowth: 0,
      governanceParticipation: 0,
    };
  }

  /**
   * Helper function to get function name from signature
   */
  private getFunctionNameFromSignature(signature: string, contract: Contract): string | null {
    // This is a simplified approach - in production, you'd use ABI to decode
    // For now, we'll return a placeholder
    return `function_${signature}`;
  }

  /**
   * Helper function to get event name from log
   */
  private getEventNameFromLog(log: any, contract: Contract): string | null {
    // This is a simplified approach - in production, you'd use ABI to decode
    // For now, we'll return a placeholder
    return `event_${log.topics[0]}`;
  }

  /**
   * Save analytics report
   */
  saveAnalyticsReport(report: AnalyticsReport): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(__dirname, `../../reports/analytics-${timestamp}.json`);
    
    // Ensure reports directory exists
    const reportsDir = join(__dirname, '../../reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Also save as latest report
    const latestPath = join(reportsDir, 'latest-analytics.json');
    writeFileSync(latestPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Analytics Report Saved');
    console.log('==========================');
    console.log(`📝 Report saved to: ${reportPath}`);
    console.log(`📝 Latest report: ${latestPath}`);
    console.log(`🌐 Network: ${report.network}`);
    console.log(`📊 Total transactions: ${report.transactionAnalytics.totalTransactions}`);
    console.log(`👥 Total investors: ${report.platformUsageAnalytics.totalInvestors}`);
    console.log(`🏗️ Total projects: ${report.platformUsageAnalytics.totalProjects}`);
    console.log(`💰 Total investment volume: ${ethers.formatEther(report.platformUsageAnalytics.totalInvestmentVolume)} ETH`);

    return reportPath;
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(metricName: string, period: 'hourly' | 'daily' | 'weekly' | 'monthly'): AnalyticsMetric[] {
    return this.metricsHistory.filter(m => m.name === metricName && m.period === period);
  }
}

// Default analytics configuration
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  contracts: [], // To be populated with actual contracts
  reportingPeriod: {
    start: 0, // To be set based on deployment
    end: 0, // To be set to current block
  },
  batchSize: 1000,
  cacheResults: true,
  includeEvents: true,
  includeFunctionCalls: true,
};

export default OnChainAnalytics;