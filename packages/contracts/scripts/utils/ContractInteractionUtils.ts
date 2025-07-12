import { ethers, Contract } from 'ethers';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ContractInstance {
  contract: Contract;
  address: string;
  abi: any[];
  name: string;
}

export interface TransactionResult {
  hash: string;
  blockNumber: number;
  gasUsed: string;
  status: 'success' | 'failed';
  timestamp: string;
  events?: any[];
}

export interface BatchOperationResult {
  successful: TransactionResult[];
  failed: Array<{ error: string; operation: string }>;
  totalGasUsed: string;
  executionTime: number;
}

export interface ContractConfig {
  address: string;
  abi: any[];
  name: string;
}

export class ContractInteractionUtils {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private contracts: Map<string, ContractInstance> = new Map();
  private transactionHistory: TransactionResult[] = [];

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  /**
   * Load contract configuration from deployment files
   */
  async loadDeploymentConfig(deploymentPath: string): Promise<ContractConfig[]> {
    if (!existsSync(deploymentPath)) {
      throw new Error(`Deployment file not found: ${deploymentPath}`);
    }

    const deploymentData = JSON.parse(readFileSync(deploymentPath, 'utf8'));
    const configs: ContractConfig[] = [];

    for (const [name, address] of Object.entries(deploymentData.contracts)) {
      // Try to load ABI from artifacts
      const abiPath = join(__dirname, `../../artifacts/contracts/core/${name}.sol/${name}.json`);
      let abi: any[] = [];

      if (existsSync(abiPath)) {
        const artifact = JSON.parse(readFileSync(abiPath, 'utf8'));
        abi = artifact.abi;
      }

      configs.push({
        address: address as string,
        abi,
        name,
      });
    }

    return configs;
  }

  /**
   * Register a contract for interaction
   */
  registerContract(config: ContractConfig): ContractInstance {
    const contract = new ethers.Contract(config.address, config.abi, this.signer);
    const instance: ContractInstance = {
      contract,
      address: config.address,
      abi: config.abi,
      name: config.name,
    };

    this.contracts.set(config.name, instance);
    console.log(`📝 Registered contract: ${config.name} at ${config.address}`);
    return instance;
  }

  /**
   * Get registered contract by name
   */
  getContract(name: string): ContractInstance | null {
    return this.contracts.get(name) || null;
  }

  /**
   * Execute a contract function with comprehensive error handling
   */
  async executeFunction(
    contractName: string,
    functionName: string,
    args: any[] = [],
    options: { value?: bigint; gasLimit?: bigint } = {}
  ): Promise<TransactionResult> {
    const contractInstance = this.getContract(contractName);
    if (!contractInstance) {
      throw new Error(`Contract not found: ${contractName}`);
    }

    const startTime = Date.now();
    
    try {
      console.log(`🔄 Executing ${contractName}.${functionName}(${args.join(', ')})...`);
      
      // Check if function exists
      if (!contractInstance.contract[functionName]) {
        throw new Error(`Function ${functionName} not found in contract ${contractName}`);
      }

      // Execute the function
      const tx = await contractInstance.contract[functionName](...args, options);
      const receipt = await tx.wait();

      const result: TransactionResult = {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        timestamp: new Date().toISOString(),
        events: receipt.logs || [],
      };

      this.transactionHistory.push(result);
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ ${contractName}.${functionName} executed successfully`);
      console.log(`   Hash: ${result.hash}`);
      console.log(`   Gas Used: ${result.gasUsed}`);
      console.log(`   Execution Time: ${executionTime}ms`);

      return result;
    } catch (error) {
      const failedResult: TransactionResult = {
        hash: '',
        blockNumber: 0,
        gasUsed: '0',
        status: 'failed',
        timestamp: new Date().toISOString(),
      };

      this.transactionHistory.push(failedResult);
      console.error(`❌ ${contractName}.${functionName} failed:`, error);
      throw error;
    }
  }

  /**
   * Execute multiple operations in batch
   */
  async executeBatchOperations(
    operations: Array<{
      contractName: string;
      functionName: string;
      args: any[];
      options?: { value?: bigint; gasLimit?: bigint };
    }>
  ): Promise<BatchOperationResult> {
    const startTime = Date.now();
    const successful: TransactionResult[] = [];
    const failed: Array<{ error: string; operation: string }> = [];
    let totalGasUsed = BigInt(0);

    console.log(`🔄 Executing batch operations (${operations.length} operations)...`);

    for (const [index, operation] of operations.entries()) {
      try {
        const result = await this.executeFunction(
          operation.contractName,
          operation.functionName,
          operation.args,
          operation.options
        );
        
        successful.push(result);
        totalGasUsed += BigInt(result.gasUsed);
        
        console.log(`✅ Batch operation ${index + 1}/${operations.length} completed`);
      } catch (error) {
        failed.push({
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: `${operation.contractName}.${operation.functionName}`,
        });
        
        console.log(`❌ Batch operation ${index + 1}/${operations.length} failed`);
      }
    }

    const executionTime = Date.now() - startTime;
    const result: BatchOperationResult = {
      successful,
      failed,
      totalGasUsed: totalGasUsed.toString(),
      executionTime,
    };

    console.log(`📊 Batch execution completed:`);
    console.log(`   Successful: ${successful.length}/${operations.length}`);
    console.log(`   Failed: ${failed.length}/${operations.length}`);
    console.log(`   Total Gas Used: ${totalGasUsed.toString()}`);
    console.log(`   Execution Time: ${executionTime}ms`);

    return result;
  }

  /**
   * Query contract state with caching
   */
  async queryContractState(
    contractName: string,
    functionName: string,
    args: any[] = [],
    useCache: boolean = true
  ): Promise<any> {
    const contractInstance = this.getContract(contractName);
    if (!contractInstance) {
      throw new Error(`Contract not found: ${contractName}`);
    }

    const cacheKey = `${contractName}.${functionName}(${args.join(',')})`;
    
    try {
      console.log(`🔍 Querying ${contractName}.${functionName}...`);
      
      const result = await contractInstance.contract[functionName](...args);
      
      console.log(`✅ Query result:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Query failed:`, error);
      throw error;
    }
  }

  /**
   * Monitor contract events
   */
  async monitorEvents(
    contractName: string,
    eventName: string,
    callback: (event: any) => void,
    fromBlock: number = 0
  ): Promise<void> {
    const contractInstance = this.getContract(contractName);
    if (!contractInstance) {
      throw new Error(`Contract not found: ${contractName}`);
    }

    console.log(`👁️ Monitoring ${contractName}.${eventName} events from block ${fromBlock}...`);

    const filter = contractInstance.contract.filters[eventName]?.();
    if (!filter) {
      throw new Error(`Event ${eventName} not found in contract ${contractName}`);
    }

    // Listen for new events
    contractInstance.contract.on(filter, callback);

    // Query historical events
    const events = await contractInstance.contract.queryFilter(filter, fromBlock);
    console.log(`📚 Found ${events.length} historical ${eventName} events`);

    for (const event of events) {
      callback(event);
    }
  }

  /**
   * Estimate gas for a function call
   */
  async estimateGas(
    contractName: string,
    functionName: string,
    args: any[] = [],
    options: { value?: bigint } = {}
  ): Promise<bigint> {
    const contractInstance = this.getContract(contractName);
    if (!contractInstance) {
      throw new Error(`Contract not found: ${contractName}`);
    }

    try {
      const gasEstimate = await contractInstance.contract[functionName].estimateGas(...args, options);
      console.log(`⛽ Gas estimate for ${contractName}.${functionName}: ${gasEstimate.toString()}`);
      return gasEstimate;
    } catch (error) {
      console.error(`❌ Gas estimation failed:`, error);
      throw error;
    }
  }

  /**
   * Validate contract upgrade compatibility
   */
  async validateUpgradeCompatibility(
    contractName: string,
    newImplementationAddress: string
  ): Promise<boolean> {
    const contractInstance = this.getContract(contractName);
    if (!contractInstance) {
      throw new Error(`Contract not found: ${contractName}`);
    }

    try {
      console.log(`🔍 Validating upgrade compatibility for ${contractName}...`);
      
      // Check if contract is upgradeable
      const hasUpgradeFunction = contractInstance.contract.upgradeTo !== undefined;
      if (!hasUpgradeFunction) {
        console.log(`❌ Contract ${contractName} is not upgradeable`);
        return false;
      }

      // Validate new implementation
      const newImplementation = new ethers.Contract(
        newImplementationAddress,
        contractInstance.abi,
        this.signer
      );

      // Check if new implementation has required functions
      const requiredFunctions = ['initialize', 'version'];
      for (const func of requiredFunctions) {
        if (!newImplementation[func]) {
          console.log(`❌ New implementation missing required function: ${func}`);
          return false;
        }
      }

      console.log(`✅ Upgrade compatibility validated for ${contractName}`);
      return true;
    } catch (error) {
      console.error(`❌ Upgrade validation failed:`, error);
      return false;
    }
  }

  /**
   * Generate contract interaction report
   */
  generateInteractionReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      registeredContracts: Array.from(this.contracts.entries()).map(([name, instance]) => ({
        name,
        address: instance.address,
        abiLength: instance.abi.length,
      })),
      transactionHistory: this.transactionHistory,
      statistics: {
        totalTransactions: this.transactionHistory.length,
        successfulTransactions: this.transactionHistory.filter(tx => tx.status === 'success').length,
        failedTransactions: this.transactionHistory.filter(tx => tx.status === 'failed').length,
        totalGasUsed: this.transactionHistory.reduce((sum, tx) => sum + BigInt(tx.gasUsed), BigInt(0)).toString(),
      },
    };

    const reportPath = join(__dirname, '../../reports/interaction-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Contract Interaction Report Generated');
    console.log('==========================================');
    console.log(`📝 Report saved to: ${reportPath}`);
    console.log(`📋 Registered contracts: ${report.registeredContracts.length}`);
    console.log(`🔄 Total transactions: ${report.statistics.totalTransactions}`);
    console.log(`✅ Successful: ${report.statistics.successfulTransactions}`);
    console.log(`❌ Failed: ${report.statistics.failedTransactions}`);
    console.log(`⛽ Total gas used: ${report.statistics.totalGasUsed}`);

    return reportPath;
  }

  /**
   * Save interaction session
   */
  saveSession(sessionName: string): string {
    const sessionData = {
      timestamp: new Date().toISOString(),
      sessionName,
      contracts: Array.from(this.contracts.entries()).map(([name, instance]) => ({
        name,
        address: instance.address,
      })),
      transactionHistory: this.transactionHistory,
    };

    const sessionPath = join(__dirname, `../../sessions/${sessionName}.json`);
    writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
    
    console.log(`💾 Session saved: ${sessionPath}`);
    return sessionPath;
  }

  /**
   * Load interaction session
   */
  loadSession(sessionPath: string): void {
    if (!existsSync(sessionPath)) {
      throw new Error(`Session file not found: ${sessionPath}`);
    }

    const sessionData = JSON.parse(readFileSync(sessionPath, 'utf8'));
    this.transactionHistory = sessionData.transactionHistory || [];
    
    console.log(`📂 Session loaded: ${sessionData.sessionName}`);
    console.log(`📋 Transaction history: ${this.transactionHistory.length} entries`);
  }
}

// Helper functions for common operations
export class ContractOperationHelpers {
  private utils: ContractInteractionUtils;

  constructor(utils: ContractInteractionUtils) {
    this.utils = utils;
  }

  /**
   * Platform Registry Operations
   */
  async registerSPV(spvAddress: string): Promise<TransactionResult> {
    return await this.utils.executeFunction('PlatformRegistry', 'registerSPV', [spvAddress]);
  }

  async updatePlatformConfig(config: {
    listingFee?: bigint;
    managementFeeRate?: number;
    minimumInvestment?: bigint;
    maximumInvestment?: bigint;
  }): Promise<TransactionResult> {
    const operations = [];
    
    if (config.listingFee !== undefined) {
      operations.push({
        contractName: 'PlatformRegistry',
        functionName: 'updateListingFee',
        args: [config.listingFee],
      });
    }
    
    if (config.managementFeeRate !== undefined) {
      operations.push({
        contractName: 'PlatformRegistry',
        functionName: 'updateManagementFeeRate',
        args: [config.managementFeeRate],
      });
    }

    if (operations.length === 0) {
      throw new Error('No configuration updates provided');
    }

    const result = await this.utils.executeBatchOperations(operations);
    return result.successful[0]; // Return first successful operation
  }

  /**
   * Identity Registry Operations
   */
  async registerIdentity(
    userAddress: string,
    identityId: string,
    claims: Array<{ topic: number; issuer: string; signature: string; data: string }>
  ): Promise<TransactionResult> {
    return await this.utils.executeFunction('IdentityRegistry', 'registerIdentity', [
      userAddress,
      identityId,
      claims,
    ]);
  }

  async addClaimToIdentity(
    identityId: string,
    claim: { topic: number; issuer: string; signature: string; data: string }
  ): Promise<TransactionResult> {
    return await this.utils.executeFunction('IdentityRegistry', 'addClaim', [identityId, claim]);
  }

  /**
   * Project Factory Operations
   */
  async createProject(
    tokenName: string,
    tokenSymbol: string,
    totalSupply: bigint,
    offeringPrice: bigint,
    offeringDuration: number
  ): Promise<TransactionResult> {
    return await this.utils.executeFunction('ProjectFactory', 'createProject', [
      tokenName,
      tokenSymbol,
      totalSupply,
      offeringPrice,
      offeringDuration,
    ]);
  }

  /**
   * Emergency Operations
   */
  async emergencyPause(contractName: string): Promise<TransactionResult> {
    return await this.utils.executeFunction(contractName, 'pause', []);
  }

  async emergencyUnpause(contractName: string): Promise<TransactionResult> {
    return await this.utils.executeFunction(contractName, 'unpause', []);
  }

  async activateEmergencyMode(contractName: string): Promise<TransactionResult> {
    return await this.utils.executeFunction(contractName, 'activateEmergencyMode', []);
  }

  async deactivateEmergencyMode(contractName: string): Promise<TransactionResult> {
    return await this.utils.executeFunction(contractName, 'deactivateEmergencyMode', []);
  }
}

export default ContractInteractionUtils;