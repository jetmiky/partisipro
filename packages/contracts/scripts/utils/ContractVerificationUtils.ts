import { ethers } from 'ethers';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface VerificationConfig {
  network: string;
  apiKey: string;
  apiUrl: string;
  explorerUrl: string;
}

export interface ContractVerificationData {
  address: string;
  contractName: string;
  constructorArgs: any[];
  sourceCode: string;
  compilerVersion: string;
  optimization: boolean;
  runs: number;
  evmVersion: string;
}

export interface VerificationResult {
  address: string;
  contractName: string;
  status: 'success' | 'failed' | 'pending';
  txHash?: string;
  explorerUrl?: string;
  error?: string;
  timestamp: string;
}

export interface VerificationReport {
  network: string;
  timestamp: string;
  totalContracts: number;
  successful: number;
  failed: number;
  pending: number;
  results: VerificationResult[];
  gasUsed: string;
  executionTime: number;
}

export class ContractVerificationUtils {
  private config: VerificationConfig;
  private provider: ethers.Provider;
  private verificationResults: VerificationResult[] = [];

  constructor(config: VerificationConfig, provider: ethers.Provider) {
    this.config = config;
    this.provider = provider;
  }

  /**
   * Load deployment data for verification
   */
  async loadDeploymentData(deploymentPath: string): Promise<ContractVerificationData[]> {
    if (!existsSync(deploymentPath)) {
      throw new Error(`Deployment file not found: ${deploymentPath}`);
    }

    const deploymentData = JSON.parse(readFileSync(deploymentPath, 'utf8'));
    const verificationData: ContractVerificationData[] = [];

    for (const [contractName, address] of Object.entries(deploymentData.contracts)) {
      const contractData = await this.extractContractData(contractName, address as string);
      verificationData.push(contractData);
    }

    return verificationData;
  }

  /**
   * Extract contract data from artifacts
   */
  private async extractContractData(contractName: string, address: string): Promise<ContractVerificationData> {
    const artifactPath = join(__dirname, `../../artifacts/contracts/core/${contractName}.sol/${contractName}.json`);
    
    if (!existsSync(artifactPath)) {
      throw new Error(`Artifact not found for contract: ${contractName}`);
    }

    const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
    const sourcePath = join(__dirname, `../../contracts/core/${contractName}.sol`);
    
    let sourceCode = '';
    if (existsSync(sourcePath)) {
      sourceCode = readFileSync(sourcePath, 'utf8');
    }

    // Get constructor arguments from deployment
    const constructorArgs = await this.getConstructorArgs(contractName, address);

    return {
      address,
      contractName,
      constructorArgs,
      sourceCode,
      compilerVersion: artifact.metadata?.compiler?.version || '0.8.20',
      optimization: true,
      runs: 200,
      evmVersion: 'paris',
    };
  }

  /**
   * Get constructor arguments from deployment transaction
   */
  private async getConstructorArgs(contractName: string, address: string): Promise<any[]> {
    try {
      // Get contract code
      const code = await this.provider.getCode(address);
      
      // For proxy contracts, constructor args are typically empty
      // For implementation contracts, we need to decode from deployment transaction
      if (contractName.includes('Upgradeable') || contractName.includes('Proxy')) {
        return []; // Proxy contracts typically have no constructor args
      }

      // Try to get deployment transaction
      const filter = {
        address: undefined,
        topics: [],
      };

      const logs = await this.provider.getLogs({
        ...filter,
        fromBlock: 0,
        toBlock: 'latest',
      });

      // Find contract creation transaction
      // This is a simplified approach - in practice, you'd need more sophisticated decoding
      return [];
    } catch (error) {
      console.warn(`Could not extract constructor args for ${contractName}:`, error);
      return [];
    }
  }

  /**
   * Verify contract on block explorer
   */
  async verifyContract(contractData: ContractVerificationData): Promise<VerificationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Verifying contract ${contractData.contractName} at ${contractData.address}...`);

      // Use Hardhat's built-in verification
      const verifyCommand = `npx hardhat verify --network ${this.config.network} ${contractData.address}`;
      
      const { stdout, stderr } = await execAsync(verifyCommand);
      
      if (stderr && !stderr.includes('Already verified')) {
        throw new Error(stderr);
      }

      const result: VerificationResult = {
        address: contractData.address,
        contractName: contractData.contractName,
        status: 'success',
        explorerUrl: `${this.config.explorerUrl}/address/${contractData.address}#code`,
        timestamp: new Date().toISOString(),
      };

      console.log(`✅ Contract ${contractData.contractName} verified successfully`);
      console.log(`🔗 Explorer URL: ${result.explorerUrl}`);

      this.verificationResults.push(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const result: VerificationResult = {
        address: contractData.address,
        contractName: contractData.contractName,
        status: 'failed',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };

      console.error(`❌ Contract ${contractData.contractName} verification failed: ${errorMessage}`);
      
      this.verificationResults.push(result);
      return result;
    }
  }

  /**
   * Verify multiple contracts in batch
   */
  async verifyBatch(contractsData: ContractVerificationData[]): Promise<VerificationResult[]> {
    const startTime = Date.now();
    console.log(`🔍 Starting batch verification of ${contractsData.length} contracts...`);

    const results: VerificationResult[] = [];
    
    for (const [index, contractData] of contractsData.entries()) {
      console.log(`\n📋 Verifying contract ${index + 1}/${contractsData.length}: ${contractData.contractName}`);
      
      try {
        const result = await this.verifyContract(contractData);
        results.push(result);
        
        // Add delay between verifications to avoid rate limits
        if (index < contractsData.length - 1) {
          console.log('⏳ Waiting 5 seconds before next verification...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`❌ Batch verification failed for ${contractData.contractName}:`, error);
        
        results.push({
          address: contractData.address,
          contractName: contractData.contractName,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    }

    const executionTime = Date.now() - startTime;
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(`\n📊 Batch verification completed:`);
    console.log(`   Total contracts: ${contractsData.length}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Execution time: ${executionTime}ms`);

    return results;
  }

  /**
   * Check verification status
   */
  async checkVerificationStatus(address: string): Promise<'verified' | 'not_verified' | 'pending'> {
    try {
      // Use etherscan API to check verification status
      const response = await fetch(
        `${this.config.apiUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${this.config.apiKey}`
      );
      
      const data: any = await response.json();
      
      if (data.status === '1' && data.result[0].SourceCode) {
        return 'verified';
      } else if (data.status === '0' && data.message.includes('pending')) {
        return 'pending';
      } else {
        return 'not_verified';
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      return 'not_verified';
    }
  }

  /**
   * Generate flattened source code for verification
   */
  async generateFlattenedSource(contractName: string): Promise<string> {
    try {
      const flattenCommand = `npx hardhat flatten contracts/core/${contractName}.sol`;
      const { stdout } = await execAsync(flattenCommand);
      
      // Remove duplicate SPDX-License-Identifier and pragma statements
      const lines = stdout.split('\n');
      const filteredLines = [];
      const seenLicenses = new Set();
      const seenPragmas = new Set();

      for (const line of lines) {
        if (line.includes('SPDX-License-Identifier')) {
          if (!seenLicenses.has(line.trim())) {
            seenLicenses.add(line.trim());
            filteredLines.push(line);
          }
        } else if (line.includes('pragma solidity')) {
          if (!seenPragmas.has(line.trim())) {
            seenPragmas.add(line.trim());
            filteredLines.push(line);
          }
        } else {
          filteredLines.push(line);
        }
      }

      return filteredLines.join('\n');
    } catch (error) {
      console.error(`Error flattening ${contractName}:`, error);
      throw error;
    }
  }

  /**
   * Automated verification with retry logic
   */
  async verifyWithRetry(
    contractData: ContractVerificationData,
    maxRetries: number = 3,
    retryDelay: number = 10000
  ): Promise<VerificationResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Verification attempt ${attempt}/${maxRetries} for ${contractData.contractName}`);
        
        const result = await this.verifyContract(contractData);
        
        if (result.status === 'success') {
          return result;
        } else if (result.status === 'pending') {
          console.log(`⏳ Verification pending, waiting ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        } else {
          lastError = new Error(result.error || 'Verification failed');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.log(`❌ Attempt ${attempt} failed: ${lastError.message}`);
        
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // All retries failed
    return {
      address: contractData.address,
      contractName: contractData.contractName,
      status: 'failed',
      error: lastError?.message || 'All verification attempts failed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate comprehensive verification report
   */
  generateVerificationReport(): VerificationReport {
    const successful = this.verificationResults.filter(r => r.status === 'success').length;
    const failed = this.verificationResults.filter(r => r.status === 'failed').length;
    const pending = this.verificationResults.filter(r => r.status === 'pending').length;

    const report: VerificationReport = {
      network: this.config.network,
      timestamp: new Date().toISOString(),
      totalContracts: this.verificationResults.length,
      successful,
      failed,
      pending,
      results: this.verificationResults,
      gasUsed: '0', // TODO: Calculate gas used for verification transactions
      executionTime: 0, // TODO: Calculate total execution time
    };

    const reportPath = join(__dirname, '../../reports/verification-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Contract Verification Report Generated');
    console.log('==========================================');
    console.log(`📝 Report saved to: ${reportPath}`);
    console.log(`🌐 Network: ${report.network}`);
    console.log(`📋 Total contracts: ${report.totalContracts}`);
    console.log(`✅ Successful: ${report.successful}`);
    console.log(`❌ Failed: ${report.failed}`);
    console.log(`⏳ Pending: ${report.pending}`);

    // Print individual results
    console.log('\n📋 Verification Results:');
    for (const result of this.verificationResults) {
      const statusIcon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⏳';
      console.log(`${statusIcon} ${result.contractName} (${result.address})`);
      
      if (result.explorerUrl) {
        console.log(`   🔗 ${result.explorerUrl}`);
      }
      
      if (result.error) {
        console.log(`   ❌ ${result.error}`);
      }
    }

    return report;
  }

  /**
   * Save verification session
   */
  saveVerificationSession(sessionName: string): string {
    const sessionData = {
      timestamp: new Date().toISOString(),
      sessionName,
      network: this.config.network,
      results: this.verificationResults,
    };

    const sessionPath = join(__dirname, `../../sessions/verification-${sessionName}.json`);
    writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));

    console.log(`💾 Verification session saved: ${sessionPath}`);
    return sessionPath;
  }

  /**
   * Load verification session
   */
  loadVerificationSession(sessionPath: string): void {
    if (!existsSync(sessionPath)) {
      throw new Error(`Session file not found: ${sessionPath}`);
    }

    const sessionData = JSON.parse(readFileSync(sessionPath, 'utf8'));
    this.verificationResults = sessionData.results || [];

    console.log(`📂 Verification session loaded: ${sessionData.sessionName}`);
    console.log(`📋 Verification results: ${this.verificationResults.length} entries`);
  }

  /**
   * Auto-verify deployment
   */
  async autoVerifyDeployment(deploymentPath: string): Promise<VerificationReport> {
    console.log('🤖 Starting automated deployment verification...');
    
    try {
      // Load deployment data
      const contractsData = await this.loadDeploymentData(deploymentPath);
      
      // Verify all contracts
      await this.verifyBatch(contractsData);
      
      // Generate report
      const report = this.generateVerificationReport();
      
      // Save session
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.saveVerificationSession(`auto-${timestamp}`);
      
      console.log('🎉 Automated verification completed!');
      return report;
    } catch (error) {
      console.error('❌ Automated verification failed:', error);
      throw error;
    }
  }
}

// Network configurations
export const NETWORK_CONFIGS: Record<string, VerificationConfig> = {
  arbitrumSepolia: {
    network: 'arbitrumSepolia',
    apiKey: process.env.ARBISCAN_API_KEY || '',
    apiUrl: 'https://api-sepolia.arbiscan.io/api',
    explorerUrl: 'https://sepolia.arbiscan.io',
  },
  arbitrumOne: {
    network: 'arbitrumOne',
    apiKey: process.env.ARBISCAN_API_KEY || '',
    apiUrl: 'https://api.arbiscan.io/api',
    explorerUrl: 'https://arbiscan.io',
  },
  ethereum: {
    network: 'ethereum',
    apiKey: process.env.ETHERSCAN_API_KEY || '',
    apiUrl: 'https://api.etherscan.io/api',
    explorerUrl: 'https://etherscan.io',
  },
  polygon: {
    network: 'polygon',
    apiKey: process.env.POLYGONSCAN_API_KEY || '',
    apiUrl: 'https://api.polygonscan.com/api',
    explorerUrl: 'https://polygonscan.com',
  },
};

export default ContractVerificationUtils;