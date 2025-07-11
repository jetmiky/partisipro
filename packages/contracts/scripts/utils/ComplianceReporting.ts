import { ethers, Contract } from 'ethers';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface ComplianceMetric {
  name: string;
  value: number | string | boolean;
  unit?: string;
  status: 'compliant' | 'non_compliant' | 'warning';
  requirement: string;
  timestamp: string;
  blockNumber: number;
}

export interface IdentityComplianceData {
  totalIdentities: number;
  verifiedIdentities: number;
  expiredClaims: number;
  pendingVerifications: number;
  claimTypes: Record<string, number>;
  trustedIssuers: string[];
  complianceRate: number;
  identityBreakdown: {
    individual: number;
    institutional: number;
    accreditedInvestors: number;
    kycVerified: number;
  };
}

export interface TransactionComplianceData {
  totalTransactions: number;
  compliantTransactions: number;
  rejectedTransactions: number;
  bypassedTransactions: number;
  complianceRate: number;
  rejectionReasons: Record<string, number>;
  restrictedCountries: string[];
  sanctionedAddresses: string[];
}

export interface GovernanceComplianceData {
  totalProposals: number;
  compliantProposals: number;
  quorumMet: number;
  votingParticipation: number;
  delegationRate: number;
  governanceTokenDistribution: {
    topHolders: Array<{
      address: string;
      percentage: number;
      tokens: string;
    }>;
    giniCoefficient: number;
  };
}

export interface PlatformComplianceData {
  platformStatus: 'active' | 'paused' | 'emergency';
  emergencyModeActivations: number;
  adminActions: number;
  upgrades: number;
  pauseEvents: number;
  feeCompliance: {
    listingFees: string;
    managementFees: string;
    totalFeesCollected: string;
    feeDistribution: Record<string, string>;
  };
  accessControl: {
    totalRoles: number;
    activeAdmins: number;
    activeSPVs: number;
    roleAssignments: Record<string, number>;
  };
}

export interface ComplianceReport {
  timestamp: string;
  network: string;
  blockNumber: number;
  reportPeriod: {
    start: string;
    end: string;
    duration: number;
  };
  overallComplianceScore: number;
  identityCompliance: IdentityComplianceData;
  transactionCompliance: TransactionComplianceData;
  governanceCompliance: GovernanceComplianceData;
  platformCompliance: PlatformComplianceData;
  complianceMetrics: ComplianceMetric[];
  violations: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    timestamp: string;
    blockNumber: number;
    resolved: boolean;
  }>;
  recommendations: string[];
  regulatoryUpdates: Array<{
    regulation: string;
    updateDate: string;
    impact: 'low' | 'medium' | 'high';
    actionRequired: boolean;
    description: string;
  }>;
}

export interface ComplianceConfig {
  contracts: Array<{
    name: string;
    address: string;
    abi: any[];
    complianceRules: string[];
  }>;
  reportingPeriod: {
    start: number;
    end: number;
  };
  regulatoryFramework: {
    country: string;
    regulations: string[];
    requirements: Record<string, any>;
  };
  thresholds: {
    minimumComplianceScore: number;
    identityVerificationRate: number;
    transactionComplianceRate: number;
    governanceParticipationRate: number;
  };
  notifications: {
    email?: string;
    webhook?: string;
    regulatoryContacts?: string[];
  };
}

export class ComplianceReporting {
  private provider: ethers.Provider;
  private config: ComplianceConfig;
  private contracts: Map<string, Contract> = new Map();
  private complianceHistory: ComplianceReport[] = [];
  private violations: Map<string, any> = new Map();

  constructor(provider: ethers.Provider, config: ComplianceConfig) {
    this.provider = provider;
    this.config = config;
    this.initializeContracts();
  }

  /**
   * Initialize contracts for compliance monitoring
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
        console.log(`📋 Initialized compliance monitoring for ${contractConfig.name}`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${contractConfig.name}:`, error);
      }
    }
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(): Promise<ComplianceReport> {
    console.log('📋 Generating comprehensive compliance report...');
    
    const startTime = Date.now();
    const currentBlock = await this.provider.getBlockNumber();
    
    try {
      // Collect all compliance data
      const [
        identityCompliance,
        transactionCompliance,
        governanceCompliance,
        platformCompliance,
        complianceMetrics,
        violations,
      ] = await Promise.all([
        this.analyzeIdentityCompliance(),
        this.analyzeTransactionCompliance(),
        this.analyzeGovernanceCompliance(),
        this.analyzePlatformCompliance(),
        this.generateComplianceMetrics(),
        this.detectViolations(),
      ]);

      // Calculate overall compliance score
      const overallComplianceScore = this.calculateOverallComplianceScore(
        identityCompliance,
        transactionCompliance,
        governanceCompliance,
        platformCompliance
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        identityCompliance,
        transactionCompliance,
        governanceCompliance,
        platformCompliance,
        violations
      );

      // Check for regulatory updates
      const regulatoryUpdates = await this.checkRegulatoryUpdates();

      const report: ComplianceReport = {
        timestamp: new Date().toISOString(),
        network: (await this.provider.getNetwork()).name,
        blockNumber: currentBlock,
        reportPeriod: {
          start: new Date(this.config.reportingPeriod.start).toISOString(),
          end: new Date(this.config.reportingPeriod.end).toISOString(),
          duration: this.config.reportingPeriod.end - this.config.reportingPeriod.start,
        },
        overallComplianceScore,
        identityCompliance,
        transactionCompliance,
        governanceCompliance,
        platformCompliance,
        complianceMetrics,
        violations,
        recommendations,
        regulatoryUpdates,
      };

      // Store in history
      this.complianceHistory.push(report);
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ Compliance report generated in ${executionTime}ms`);
      console.log(`📊 Overall compliance score: ${overallComplianceScore}%`);
      
      return report;
    } catch (error) {
      console.error('❌ Compliance report generation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze identity compliance (ERC-3643)
   */
  private async analyzeIdentityCompliance(): Promise<IdentityComplianceData> {
    console.log('🔍 Analyzing identity compliance...');
    
    const compliance: IdentityComplianceData = {
      totalIdentities: 0,
      verifiedIdentities: 0,
      expiredClaims: 0,
      pendingVerifications: 0,
      claimTypes: {},
      trustedIssuers: [],
      complianceRate: 0,
      identityBreakdown: {
        individual: 0,
        institutional: 0,
        accreditedInvestors: 0,
        kycVerified: 0,
      },
    };

    try {
      const identityRegistry = this.contracts.get('IdentityRegistry');
      if (!identityRegistry) {
        console.log('⚠️ IdentityRegistry not found');
        return compliance;
      }

      // Get all identity registration events
      const identityRegisteredFilter = identityRegistry.filters.IdentityRegistered?.();
      if (identityRegisteredFilter) {
        const identityEvents = await identityRegistry.queryFilter(identityRegisteredFilter);
        compliance.totalIdentities = identityEvents.length;
        
        // Analyze each identity
        for (const event of identityEvents) {
          try {
            const identityAddress = event.args?.userAddress;
            if (identityAddress) {
              // Check if identity is verified
              const isVerified = await identityRegistry.isVerified(identityAddress);
              if (isVerified) {
                compliance.verifiedIdentities++;
              }
              
              // Get claims for this identity
              const claims = await identityRegistry.getClaims(identityAddress);
              
              // Analyze claims
              for (const claim of claims) {
                const claimTopic = claim.topic.toString();
                compliance.claimTypes[claimTopic] = (compliance.claimTypes[claimTopic] || 0) + 1;
                
                // Check if claim is expired
                const currentTime = Math.floor(Date.now() / 1000);
                if (claim.validity && claim.validity < currentTime) {
                  compliance.expiredClaims++;
                }
                
                // Categorize by claim type
                if (claimTopic === '1') { // KYC_APPROVED
                  compliance.identityBreakdown.kycVerified++;
                } else if (claimTopic === '2') { // ACCREDITED_INVESTOR
                  compliance.identityBreakdown.accreditedInvestors++;
                } else if (claimTopic === '3') { // INSTITUTIONAL_INVESTOR
                  compliance.identityBreakdown.institutional++;
                } else {
                  compliance.identityBreakdown.individual++;
                }
              }
            }
          } catch (error) {
            console.error('Error analyzing identity:', error);
          }
        }
      }

      // Get trusted issuers
      const trustedIssuersRegistry = this.contracts.get('TrustedIssuersRegistry');
      if (trustedIssuersRegistry) {
        const trustedIssuers = await trustedIssuersRegistry.getTrustedIssuers();
        compliance.trustedIssuers = trustedIssuers;
      }

      // Calculate compliance rate
      compliance.complianceRate = compliance.totalIdentities > 0
        ? (compliance.verifiedIdentities / compliance.totalIdentities) * 100
        : 0;

      console.log(`📊 Identity compliance analysis complete: ${compliance.complianceRate}% compliance rate`);
      return compliance;
    } catch (error) {
      console.error('❌ Identity compliance analysis failed:', error);
      return compliance;
    }
  }

  /**
   * Analyze transaction compliance
   */
  private async analyzeTransactionCompliance(): Promise<TransactionComplianceData> {
    console.log('🔍 Analyzing transaction compliance...');
    
    const compliance: TransactionComplianceData = {
      totalTransactions: 0,
      compliantTransactions: 0,
      rejectedTransactions: 0,
      bypassedTransactions: 0,
      complianceRate: 0,
      rejectionReasons: {},
      restrictedCountries: [],
      sanctionedAddresses: [],
    };

    try {
      // Analyze all token transfers
      const projectToken = this.contracts.get('ProjectToken');
      if (projectToken) {
        const transferFilter = projectToken.filters.Transfer?.();
        if (transferFilter) {
          const transferEvents = await projectToken.queryFilter(transferFilter);
          compliance.totalTransactions = transferEvents.length;
          
          for (const event of transferEvents) {
            const from = event.args?.from;
            const to = event.args?.to;
            
            // Check if transfer was compliant
            try {
              const identityRegistry = this.contracts.get('IdentityRegistry');
              if (identityRegistry) {
                const fromVerified = await identityRegistry.isVerified(from);
                const toVerified = await identityRegistry.isVerified(to);
                
                if (fromVerified && toVerified) {
                  compliance.compliantTransactions++;
                } else {
                  compliance.rejectedTransactions++;
                  compliance.rejectionReasons['identity_not_verified'] = 
                    (compliance.rejectionReasons['identity_not_verified'] || 0) + 1;
                }
              }
            } catch (error) {
              compliance.rejectedTransactions++;
              compliance.rejectionReasons['verification_failed'] = 
                (compliance.rejectionReasons['verification_failed'] || 0) + 1;
            }
          }
        }
      }

      // Calculate compliance rate
      compliance.complianceRate = compliance.totalTransactions > 0
        ? (compliance.compliantTransactions / compliance.totalTransactions) * 100
        : 0;

      console.log(`📊 Transaction compliance analysis complete: ${compliance.complianceRate}% compliance rate`);
      return compliance;
    } catch (error) {
      console.error('❌ Transaction compliance analysis failed:', error);
      return compliance;
    }
  }

  /**
   * Analyze governance compliance
   */
  private async analyzeGovernanceCompliance(): Promise<GovernanceComplianceData> {
    console.log('🔍 Analyzing governance compliance...');
    
    const compliance: GovernanceComplianceData = {
      totalProposals: 0,
      compliantProposals: 0,
      quorumMet: 0,
      votingParticipation: 0,
      delegationRate: 0,
      governanceTokenDistribution: {
        topHolders: [],
        giniCoefficient: 0,
      },
    };

    try {
      const projectGovernance = this.contracts.get('ProjectGovernance');
      if (projectGovernance) {
        // Get all proposals
        const proposalCreatedFilter = projectGovernance.filters.ProposalCreated?.();
        if (proposalCreatedFilter) {
          const proposalEvents = await projectGovernance.queryFilter(proposalCreatedFilter);
          compliance.totalProposals = proposalEvents.length;
          
          // Analyze each proposal
          for (const event of proposalEvents) {
            const proposalId = event.args?.proposalId;
            if (proposalId) {
              try {
                const proposalData = await projectGovernance.getProposal(proposalId);
                
                // Check if proposal met quorum
                const quorum = await projectGovernance.quorum(proposalData.snapshot);
                if (proposalData.forVotes.gte(quorum)) {
                  compliance.quorumMet++;
                }
                
                // Check if proposal is compliant with governance rules
                if (this.isProposalCompliant(proposalData)) {
                  compliance.compliantProposals++;
                }
              } catch (error) {
                console.error('Error analyzing proposal:', error);
              }
            }
          }
        }

        // Get voting participation
        const voteCastFilter = projectGovernance.filters.VoteCast?.();
        if (voteCastFilter) {
          const voteEvents = await projectGovernance.queryFilter(voteCastFilter);
          
          // Calculate unique voters
          const uniqueVoters = new Set();
          for (const event of voteEvents) {
            uniqueVoters.add(event.args?.voter);
          }
          
          // Get total token holders
          const projectToken = this.contracts.get('ProjectToken');
          if (projectToken) {
            const totalSupply = await projectToken.totalSupply();
            const totalHolders = await this.getTotalTokenHolders(projectToken);
            
            compliance.votingParticipation = totalHolders > 0
              ? (uniqueVoters.size / totalHolders) * 100
              : 0;
          }
        }
      }

      console.log(`📊 Governance compliance analysis complete`);
      return compliance;
    } catch (error) {
      console.error('❌ Governance compliance analysis failed:', error);
      return compliance;
    }
  }

  /**
   * Analyze platform compliance
   */
  private async analyzePlatformCompliance(): Promise<PlatformComplianceData> {
    console.log('🔍 Analyzing platform compliance...');
    
    const compliance: PlatformComplianceData = {
      platformStatus: 'active',
      emergencyModeActivations: 0,
      adminActions: 0,
      upgrades: 0,
      pauseEvents: 0,
      feeCompliance: {
        listingFees: '0',
        managementFees: '0',
        totalFeesCollected: '0',
        feeDistribution: {},
      },
      accessControl: {
        totalRoles: 0,
        activeAdmins: 0,
        activeSPVs: 0,
        roleAssignments: {},
      },
    };

    try {
      const platformRegistry = this.contracts.get('PlatformRegistry');
      if (platformRegistry) {
        // Check platform status
        const config = await platformRegistry.getPlatformConfig();
        compliance.platformStatus = config.platformActive ? 'active' : 'paused';
        
        // Get emergency mode activations
        const emergencyFilter = platformRegistry.filters.EmergencyModeActivated?.();
        if (emergencyFilter) {
          const emergencyEvents = await platformRegistry.queryFilter(emergencyFilter);
          compliance.emergencyModeActivations = emergencyEvents.length;
        }

        // Get pause events
        const pauseFilter = platformRegistry.filters.Paused?.();
        if (pauseFilter) {
          const pauseEvents = await platformRegistry.queryFilter(pauseFilter);
          compliance.pauseEvents = pauseEvents.length;
        }

        // Get fee information
        compliance.feeCompliance.listingFees = config.listingFee?.toString() || '0';
        compliance.feeCompliance.managementFees = config.managementFeeRate?.toString() || '0';
      }

      // Get platform treasury information
      const platformTreasury = this.contracts.get('PlatformTreasury');
      if (platformTreasury) {
        const balance = await this.provider.getBalance(platformTreasury.target as string);
        compliance.feeCompliance.totalFeesCollected = balance.toString();
      }

      console.log(`📊 Platform compliance analysis complete`);
      return compliance;
    } catch (error) {
      console.error('❌ Platform compliance analysis failed:', error);
      return compliance;
    }
  }

  /**
   * Generate compliance metrics
   */
  private async generateComplianceMetrics(): Promise<ComplianceMetric[]> {
    const metrics: ComplianceMetric[] = [];
    const currentBlock = await this.provider.getBlockNumber();
    
    // Identity verification rate metric
    const identityRegistry = this.contracts.get('IdentityRegistry');
    if (identityRegistry) {
      try {
        const totalIdentities = await identityRegistry.getTotalIdentities();
        const verifiedIdentities = await identityRegistry.getVerifiedIdentities();
        const verificationRate = totalIdentities > 0 ? (verifiedIdentities / totalIdentities) * 100 : 0;
        
        metrics.push({
          name: 'Identity Verification Rate',
          value: Math.round(verificationRate * 100) / 100,
          unit: '%',
          status: verificationRate >= this.config.thresholds.identityVerificationRate ? 'compliant' : 'non_compliant',
          requirement: `Minimum ${this.config.thresholds.identityVerificationRate}% identity verification rate`,
          timestamp: new Date().toISOString(),
          blockNumber: currentBlock,
        });
      } catch (error) {
        console.error('Error generating identity verification metric:', error);
      }
    }

    // Transaction compliance rate metric
    metrics.push({
      name: 'Transaction Compliance Rate',
      value: 95, // Placeholder - would be calculated from actual data
      unit: '%',
      status: 'compliant',
      requirement: `Minimum ${this.config.thresholds.transactionComplianceRate}% transaction compliance rate`,
      timestamp: new Date().toISOString(),
      blockNumber: currentBlock,
    });

    // Governance participation rate metric
    metrics.push({
      name: 'Governance Participation Rate',
      value: 25, // Placeholder - would be calculated from actual data
      unit: '%',
      status: 'warning',
      requirement: `Minimum ${this.config.thresholds.governanceParticipationRate}% governance participation rate`,
      timestamp: new Date().toISOString(),
      blockNumber: currentBlock,
    });

    return metrics;
  }

  /**
   * Detect compliance violations
   */
  private async detectViolations(): Promise<ComplianceReport['violations']> {
    const violations: ComplianceReport['violations'] = [];
    
    // Check for identity verification violations
    const identityRegistry = this.contracts.get('IdentityRegistry');
    if (identityRegistry) {
      try {
        const expiredClaims = await identityRegistry.getExpiredClaims();
        if (expiredClaims.length > 0) {
          violations.push({
            severity: 'medium',
            type: 'identity_verification',
            description: `${expiredClaims.length} expired identity claims detected`,
            timestamp: new Date().toISOString(),
            blockNumber: await this.provider.getBlockNumber(),
            resolved: false,
          });
        }
      } catch (error) {
        console.error('Error checking identity violations:', error);
      }
    }

    // Check for transaction violations
    const projectToken = this.contracts.get('ProjectToken');
    if (projectToken) {
      try {
        const restrictedTransfers = await this.detectRestrictedTransfers(projectToken);
        if (restrictedTransfers.length > 0) {
          violations.push({
            severity: 'high',
            type: 'transaction_restriction',
            description: `${restrictedTransfers.length} restricted transfers detected`,
            timestamp: new Date().toISOString(),
            blockNumber: await this.provider.getBlockNumber(),
            resolved: false,
          });
        }
      } catch (error) {
        console.error('Error checking transaction violations:', error);
      }
    }

    return violations;
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallComplianceScore(
    identityCompliance: IdentityComplianceData,
    transactionCompliance: TransactionComplianceData,
    governanceCompliance: GovernanceComplianceData,
    platformCompliance: PlatformComplianceData
  ): number {
    // Weighted scoring system
    const weights = {
      identity: 0.4,
      transaction: 0.3,
      governance: 0.2,
      platform: 0.1,
    };

    const identityScore = identityCompliance.complianceRate;
    const transactionScore = transactionCompliance.complianceRate;
    const governanceScore = governanceCompliance.votingParticipation;
    const platformScore = platformCompliance.platformStatus === 'active' ? 100 : 0;

    const overallScore = 
      (identityScore * weights.identity) +
      (transactionScore * weights.transaction) +
      (governanceScore * weights.governance) +
      (platformScore * weights.platform);

    return Math.round(overallScore * 100) / 100;
  }

  /**
   * Generate compliance recommendations
   */
  private generateRecommendations(
    identityCompliance: IdentityComplianceData,
    transactionCompliance: TransactionComplianceData,
    governanceCompliance: GovernanceComplianceData,
    platformCompliance: PlatformComplianceData,
    violations: ComplianceReport['violations']
  ): string[] {
    const recommendations: string[] = [];

    // Identity recommendations
    if (identityCompliance.complianceRate < this.config.thresholds.identityVerificationRate) {
      recommendations.push('Increase identity verification rate by implementing automated KYC processes');
    }

    if (identityCompliance.expiredClaims > 0) {
      recommendations.push('Implement automated claim renewal system to prevent expired claims');
    }

    // Transaction recommendations
    if (transactionCompliance.complianceRate < this.config.thresholds.transactionComplianceRate) {
      recommendations.push('Enhance transaction compliance by implementing stricter identity verification');
    }

    // Governance recommendations
    if (governanceCompliance.votingParticipation < this.config.thresholds.governanceParticipationRate) {
      recommendations.push('Increase governance participation through voting incentives and delegation mechanisms');
    }

    // Violation-based recommendations
    if (violations.length > 0) {
      recommendations.push('Address identified compliance violations through automated remediation systems');
    }

    return recommendations;
  }

  /**
   * Check for regulatory updates
   */
  private async checkRegulatoryUpdates(): Promise<ComplianceReport['regulatoryUpdates']> {
    // In a real implementation, this would check external regulatory databases
    // For now, return placeholder data
    return [
      {
        regulation: 'Indonesian Capital Market Law',
        updateDate: '2024-01-15',
        impact: 'medium',
        actionRequired: true,
        description: 'Updated requirements for digital asset tokenization',
      },
      {
        regulation: 'OJK Regulation No. 13/2022',
        updateDate: '2024-02-01',
        impact: 'high',
        actionRequired: true,
        description: 'New compliance requirements for cryptocurrency exchanges',
      },
    ];
  }

  /**
   * Helper functions
   */
  private isProposalCompliant(proposalData: any): boolean {
    // Implement proposal compliance checks
    return true; // Placeholder
  }

  private async getTotalTokenHolders(contract: Contract): Promise<number> {
    // Implement token holder counting logic
    return 100; // Placeholder
  }

  private async detectRestrictedTransfers(contract: Contract): Promise<any[]> {
    // Implement restricted transfer detection
    return []; // Placeholder
  }

  /**
   * Save compliance report
   */
  saveComplianceReport(report: ComplianceReport): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(__dirname, `../../reports/compliance-${timestamp}.json`);
    
    // Ensure reports directory exists
    const reportsDir = join(__dirname, '../../reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Also save as latest report
    const latestPath = join(reportsDir, 'latest-compliance.json');
    writeFileSync(latestPath, JSON.stringify(report, null, 2));

    console.log('\n📋 Compliance Report Saved');
    console.log('===========================');
    console.log(`📝 Report saved to: ${reportPath}`);
    console.log(`📝 Latest report: ${latestPath}`);
    console.log(`🌐 Network: ${report.network}`);
    console.log(`📊 Overall compliance score: ${report.overallComplianceScore}%`);
    console.log(`🔍 Identity compliance: ${report.identityCompliance.complianceRate}%`);
    console.log(`💸 Transaction compliance: ${report.transactionCompliance.complianceRate}%`);
    console.log(`🗳️ Governance participation: ${report.governanceCompliance.votingParticipation}%`);
    console.log(`🚨 Violations detected: ${report.violations.length}`);
    console.log(`💡 Recommendations: ${report.recommendations.length}`);

    return reportPath;
  }

  /**
   * Get compliance history
   */
  getComplianceHistory(limit: number = 10): ComplianceReport[] {
    return this.complianceHistory.slice(-limit);
  }

  /**
   * Get current compliance status
   */
  getCurrentComplianceStatus(): ComplianceReport | null {
    return this.complianceHistory[this.complianceHistory.length - 1] || null;
  }
}

// Default compliance configuration for Indonesian regulations
export const INDONESIAN_COMPLIANCE_CONFIG: ComplianceConfig = {
  contracts: [], // To be populated with actual contracts
  reportingPeriod: {
    start: 0,
    end: 0,
  },
  regulatoryFramework: {
    country: 'Indonesia',
    regulations: [
      'Indonesian Capital Market Law',
      'OJK Regulation No. 13/2022',
      'Bank Indonesia Regulation No. 23/6/PBI/2021',
    ],
    requirements: {
      identityVerification: 'mandatory',
      transactionReporting: 'required',
      governanceStandards: 'recommended',
    },
  },
  thresholds: {
    minimumComplianceScore: 85,
    identityVerificationRate: 95,
    transactionComplianceRate: 98,
    governanceParticipationRate: 30,
  },
  notifications: {
    // To be configured based on requirements
  },
};

export default ComplianceReporting;