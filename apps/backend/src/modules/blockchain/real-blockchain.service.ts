import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../../common/services/firebase.service';
import {
  DeployContractDto,
  GenerateSignatureDto,
  SubmitTransactionDto,
} from './dto';
import {
  // ethers,
  JsonRpcProvider,
  Wallet,
  Contract,
  parseEther,
  solidityPackedKeccak256,
  getBytes,
} from 'ethers';
import {
  BlockchainTransaction,
  ContractDeployment,
} from './blockchain.service';

// Contract ABIs (will be loaded dynamically)
const CONTRACT_ABIS = {
  PlatformRegistry: [
    // Platform Registry ABI - key methods
    'function isAuthorizedSPV(address spv) view returns (bool)',
    'function getPlatformConfiguration() view returns (tuple(uint256 listingFee, uint256 managementFeeRate, uint256 minimumInvestment, uint256 maximumInvestment, bool isActive))',
    'function registerSPV(address spv)',
    'function deactivateSPV(address spv)',
    'event SPVRegistered(address indexed spv, uint256 timestamp)',
    'event SPVDeactivated(address indexed spv, uint256 timestamp)',
  ],

  PlatformTreasury: [
    // Platform Treasury ABI - key methods
    'function collectListingFee(string memory projectId) payable',
    'function collectManagementFee(string memory projectId, uint256 amount)',
    'event FeeCollected(string indexed projectId, string feeType, uint256 amount)',
    'event WithdrawalExecuted(address indexed to, uint256 amount)',
  ],

  ProjectFactory: [
    // Project Factory ABI - key methods
    'function createProject(string memory projectId, tuple(string name, string symbol, uint256 totalSupply) memory params) payable returns (address, address, address, address)',
    'event ProjectCreated(string indexed projectId, address indexed spv, address token, address offering, address treasury, address governance)',
  ],

  IdentityRegistry: [
    // Identity Registry ABI - key methods
    'function isVerified(address identity) view returns (bool)',
    'function registerIdentity(address identity, address managementKey)',
    'function addClaim(address identity, uint256 topic, address issuer, bytes memory data)',
    'function getClaim(address identity, uint256 topic) view returns (tuple(uint256 topic, address issuer, bytes data, bool exists))',
    'event IdentityRegistered(address indexed identity, address indexed managementKey)',
    'event ClaimAdded(address indexed identity, uint256 indexed topic, address indexed issuer)',
  ],

  ClaimTopicsRegistry: [
    // Claim Topics Registry ABI - key methods
    'function addClaimTopic(uint256 topic, string memory description)',
    'function isClaimTopicRequired(uint256 topic) view returns (bool)',
    'function getClaimTopicDescription(uint256 topic) view returns (string memory)',
  ],

  TrustedIssuersRegistry: [
    // Trusted Issuers Registry ABI - key methods
    'function addTrustedIssuer(address issuer, uint256[] memory claimTopics)',
    'function isTrustedIssuer(address issuer) view returns (bool)',
    'function isTrustedIssuerForTopic(address issuer, uint256 topic) view returns (bool)',
  ],
};

@Injectable()
export class RealBlockchainService {
  private readonly logger = new Logger(RealBlockchainService.name);
  private readonly TRANSACTIONS_COLLECTION = 'blockchain_transactions';
  private readonly CONTRACTS_COLLECTION = 'deployed_contracts';
  private readonly EVENTS_COLLECTION = 'blockchain_events';

  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private chainId: number;

  // Contract addresses on Arbitrum Sepolia
  private readonly CONTRACT_ADDRESSES = {
    PLATFORM_REGISTRY:
      process.env.CONTRACT_PLATFORM_REGISTRY ||
      '0xc27bDcdeA460de9A76f759e785521a5cb834B7a1',
    PLATFORM_TREASURY:
      process.env.CONTRACT_PLATFORM_TREASURY ||
      '0x53ab91a863B79824c4243EB258Ce9F23a0fAB89A',
    PROJECT_FACTORY:
      process.env.CONTRACT_PROJECT_FACTORY ||
      '0xC3abeE18DCfE502b38d0657dAc04Af8a746913D1',
    IDENTITY_REGISTRY:
      process.env.CONTRACT_IDENTITY_REGISTRY ||
      '0x7f7ae1E07EedfEeeDd7A96ECA67dce85fe2A84eA',
    CLAIM_TOPICS_REGISTRY:
      process.env.CONTRACT_CLAIM_TOPICS_REGISTRY ||
      '0x2DbA5D6bdb79Aa318cB74300D62F54e7baB949f6',
    TRUSTED_ISSUERS_REGISTRY:
      process.env.CONTRACT_TRUSTED_ISSUERS_REGISTRY ||
      '0x812aA860f141D48E6c294AFD7ad6437a17051235',
    // Template contracts
    PROJECT_TOKEN:
      process.env.CONTRACT_PROJECT_TOKEN ||
      '0x1f8Fb3846541571a5E3ed05f311d4695f02dc8Cd',
    PROJECT_OFFERING:
      process.env.CONTRACT_PROJECT_OFFERING ||
      '0x445b8Aa90eA5d2E80916Bc0f8ACc150d9b91634F',
    PROJECT_TREASURY:
      process.env.CONTRACT_PROJECT_TREASURY ||
      '0x6662D1f5103dB37Cb72dE44b016c240167c44c35',
    PROJECT_GOVERNANCE:
      process.env.CONTRACT_PROJECT_GOVERNANCE ||
      '0x1abd0E1e64258450e8F74f43Bc1cC47bfE6Efa23',
  };

  // Contract instances
  private platformRegistry: Contract;
  private platformTreasury: Contract;
  private projectFactory: Contract;
  private identityRegistry: Contract;
  private claimTopicsRegistry: Contract;
  private trustedIssuersRegistry: Contract;

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService
  ) {
    this.initializeProvider();
  }

  /**
   * Initialize blockchain provider and contracts
   */
  private async initializeProvider(): Promise<void> {
    try {
      // Initialize provider
      const rpcUrl =
        this.configService.get<string>('BLOCKCHAIN_RPC_URL') ||
        'https://sepolia-rollup.arbitrum.io/rpc';
      this.provider = new JsonRpcProvider(rpcUrl);

      // Initialize wallet
      const privateKey = this.configService.get<string>(
        'BLOCKCHAIN_PRIVATE_KEY'
      );
      if (!privateKey || privateKey === 'your_private_key_here') {
        this.logger.warn('No private key configured - read-only mode');
        this.wallet = null;
      } else {
        this.wallet = new Wallet(privateKey, this.provider);
      }

      // Get chain ID
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);

      this.logger.log(
        `Connected to blockchain network: ${network.name} (Chain ID: ${this.chainId})`
      );

      // Initialize contract instances
      await this.initializeContracts();

      // Start event listening
      await this.startEventListening();
    } catch (error) {
      this.logger.error('Failed to initialize blockchain provider:', error);
      throw error;
    }
  }

  /**
   * Initialize contract instances
   */
  private async initializeContracts(): Promise<void> {
    try {
      // Core infrastructure contracts
      this.platformRegistry = new Contract(
        this.CONTRACT_ADDRESSES.PLATFORM_REGISTRY,
        CONTRACT_ABIS.PlatformRegistry,
        this.wallet || this.provider
      );

      this.platformTreasury = new Contract(
        this.CONTRACT_ADDRESSES.PLATFORM_TREASURY,
        CONTRACT_ABIS.PlatformTreasury,
        this.wallet || this.provider
      );

      this.projectFactory = new Contract(
        this.CONTRACT_ADDRESSES.PROJECT_FACTORY,
        CONTRACT_ABIS.ProjectFactory,
        this.wallet || this.provider
      );

      // ERC-3643 compliance contracts
      this.identityRegistry = new Contract(
        this.CONTRACT_ADDRESSES.IDENTITY_REGISTRY,
        CONTRACT_ABIS.IdentityRegistry,
        this.wallet || this.provider
      );

      this.claimTopicsRegistry = new Contract(
        this.CONTRACT_ADDRESSES.CLAIM_TOPICS_REGISTRY,
        CONTRACT_ABIS.ClaimTopicsRegistry,
        this.wallet || this.provider
      );

      this.trustedIssuersRegistry = new Contract(
        this.CONTRACT_ADDRESSES.TRUSTED_ISSUERS_REGISTRY,
        CONTRACT_ABIS.TrustedIssuersRegistry,
        this.wallet || this.provider
      );

      this.logger.log('Smart contracts initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize contracts:', error);
      throw error;
    }
  }

  /**
   * Start listening to blockchain events
   */
  private async startEventListening(): Promise<void> {
    try {
      // Listen to ProjectFactory events
      this.projectFactory.on(
        'ProjectCreated',
        async (
          projectId: string,
          spvAddress: string,
          tokenAddress: string,
          offeringAddress: string,
          treasuryAddress: string,
          governanceAddress: string,
          event: any
        ) => {
          this.logger.log(`ProjectCreated event: ${projectId}`);
          await this.handleProjectCreatedEvent({
            projectId,
            spvAddress,
            tokenAddress,
            offeringAddress,
            treasuryAddress,
            governanceAddress,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });
        }
      );

      // Listen to IdentityRegistry events
      this.identityRegistry.on(
        'IdentityRegistered',
        async (identity: string, managementKey: string, event: any) => {
          this.logger.log(`IdentityRegistered event: ${identity}`);
          await this.handleIdentityRegisteredEvent({
            identity,
            managementKey,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });
        }
      );

      // Listen to PlatformTreasury events
      this.platformTreasury.on(
        'FeeCollected',
        async (
          projectId: string,
          feeType: string,
          amount: bigint,
          event: any
        ) => {
          this.logger.log(
            `FeeCollected event: ${projectId} - ${feeType} - ${amount}`
          );
          await this.handleFeeCollectedEvent({
            projectId,
            feeType,
            amount: amount.toString(),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });
        }
      );

      this.logger.log('Blockchain event listeners started');
    } catch (error) {
      this.logger.error('Failed to start event listening:', error);
    }
  }

  /**
   * Deploy smart contract (Real implementation)
   */
  async deployContract(
    deployContractDto: DeployContractDto,
    deployedBy: string
  ): Promise<ContractDeployment> {
    if (!this.wallet) {
      throw new Error('Wallet not configured - cannot deploy contracts');
    }

    this.logger.log(
      `Deploying contract: ${deployContractDto.contractType} for project: ${deployContractDto.projectId}`
    );

    try {
      // For this implementation, we'll use the ProjectFactory to create project contracts
      // This is the actual production flow
      if (deployContractDto.contractType === 'PROJECT_CONTRACTS') {
        return await this.deployProjectContracts(deployContractDto, deployedBy);
      } else {
        throw new Error(
          `Unsupported contract type: ${deployContractDto.contractType}`
        );
      }
    } catch (error) {
      this.logger.error('Contract deployment failed:', error);
      throw error;
    }
  }

  /**
   * Deploy project contracts using ProjectFactory
   */
  private async deployProjectContracts(
    deployContractDto: DeployContractDto,
    deployedBy: string
  ): Promise<ContractDeployment> {
    try {
      // Prepare project parameters from the parameters array
      const [name, symbol, totalSupply] = deployContractDto.parameters || [
        'DefaultProject',
        'DP',
        '1000000',
      ];
      const projectParams = {
        name: name as string,
        symbol: symbol as string,
        totalSupply: parseEther(totalSupply.toString()),
        // Add other parameters as needed
      };

      // Estimate gas
      const gasEstimate = await this.projectFactory.createProject.estimateGas(
        deployContractDto.projectId,
        projectParams
      );

      this.logger.log(`Estimated gas for project creation: ${gasEstimate}`);

      // Submit transaction
      const tx = await this.projectFactory.createProject(
        deployContractDto.projectId,
        projectParams,
        {
          gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
        }
      );

      this.logger.log(`Project creation transaction submitted: ${tx.hash}`);

      // Create deployment record
      const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deployment: ContractDeployment = {
        id: deploymentId,
        projectId: deployContractDto.projectId,
        contractType: deployContractDto.contractType,
        contractAddress: 'pending', // Will be updated when transaction confirms
        transactionHash: tx.hash,
        deployedAt: new Date(),
        deployedBy,
      };

      // Save deployment record
      await this.firebaseService.setDocument(
        this.CONTRACTS_COLLECTION,
        deploymentId,
        deployment
      );

      // Create transaction record
      await this.createTransactionRecord({
        hash: tx.hash,
        from: deployedBy,
        to: this.CONTRACT_ADDRESSES.PROJECT_FACTORY,
        value: '0',
        gasUsed: 0, // Will be updated when confirmed
        gasPrice: tx.gasPrice?.toString() || '0',
        status: 'pending',
        data: {
          type: 'contract_deployment',
          contractType: deployContractDto.contractType,
          projectId: deployContractDto.projectId,
          deploymentId,
        },
      });

      return deployment;
    } catch (error) {
      this.logger.error('Project contract deployment failed:', error);
      throw error;
    }
  }

  /**
   * Generate authorization signature for investments
   */
  async generateAuthorizationSignature(
    generateSignatureDto: GenerateSignatureDto
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured - cannot generate signatures');
    }

    this.logger.log(
      `Generating authorization signature for investment: ${generateSignatureDto.projectId}`
    );

    try {
      // Create message hash for signature
      const messageHash = solidityPackedKeccak256(
        ['address', 'uint256', 'string', 'uint256', 'string'],
        [
          generateSignatureDto.investorAddress,
          generateSignatureDto.amount,
          generateSignatureDto.projectId,
          generateSignatureDto.tokenAmount,
          generateSignatureDto.nonce,
        ]
      );

      // Sign the message
      const signature = await this.wallet.signMessage(getBytes(messageHash));

      this.logger.log(
        `Authorization signature generated for project: ${generateSignatureDto.projectId}`
      );

      return signature;
    } catch (error) {
      this.logger.error('Signature generation failed:', error);
      throw error;
    }
  }

  /**
   * Submit transaction to blockchain
   */
  async submitTransaction(
    submitTransactionDto: SubmitTransactionDto,
    submittedBy: string
  ): Promise<BlockchainTransaction> {
    if (!this.wallet) {
      throw new Error('Wallet not configured - cannot submit transactions');
    }

    this.logger.log(
      `Submitting transaction to contract: ${submitTransactionDto.contractAddress}`
    );

    try {
      // Create transaction object
      const tx = {
        to: submitTransactionDto.contractAddress,
        data: submitTransactionDto.transactionData,
        value: submitTransactionDto.value || '0',
        gasLimit: submitTransactionDto.gasLimit,
        gasPrice: submitTransactionDto.gasPrice,
      };

      // Submit transaction
      const txResponse = await this.wallet.sendTransaction(tx);

      this.logger.log(`Transaction submitted: ${txResponse.hash}`);

      // Create transaction record
      const transaction = await this.createTransactionRecord({
        hash: txResponse.hash,
        from: submittedBy,
        to: submitTransactionDto.contractAddress,
        value: submitTransactionDto.value?.toString() || '0',
        gasUsed: 0, // Will be updated when confirmed
        gasPrice: txResponse.gasPrice?.toString() || '0',
        status: 'pending',
        data: {
          transactionData: submitTransactionDto.transactionData,
          gasLimit: submitTransactionDto.gasLimit,
        },
      });

      return transaction;
    } catch (error) {
      this.logger.error('Transaction submission failed:', error);
      throw error;
    }
  }

  /**
   * Get transaction by hash from blockchain
   */
  async getTransactionByHash(
    hash: string
  ): Promise<BlockchainTransaction | null> {
    try {
      // First check our database
      const docs = await this.firebaseService.getDocumentsByField(
        this.TRANSACTIONS_COLLECTION,
        'hash',
        hash
      );

      if (docs.docs.length > 0) {
        const transaction = docs.docs[0].data() as BlockchainTransaction;

        // If transaction is still pending, check blockchain for updates
        if (transaction.status === 'pending') {
          await this.updateTransactionStatus(transaction);
        }

        return transaction;
      }

      // If not in our database, fetch from blockchain
      const txReceipt = await this.provider.getTransactionReceipt(hash);
      if (txReceipt) {
        return this.createTransactionFromReceipt(txReceipt);
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get transaction:', error);
      return null;
    }
  }

  /**
   * Get contract deployments for a project
   */
  async getProjectContracts(projectId: string): Promise<ContractDeployment[]> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.CONTRACTS_COLLECTION,
      'projectId',
      projectId
    );

    return docs.docs.map(doc => doc.data() as ContractDeployment);
  }

  /**
   * Check if investor is verified in IdentityRegistry
   */
  async isInvestorVerified(investorAddress: string): Promise<boolean> {
    try {
      return await this.identityRegistry.isVerified(investorAddress);
    } catch (error) {
      this.logger.error('Failed to check investor verification:', error);
      return false;
    }
  }

  /**
   * Check if SPV is authorized in PlatformRegistry
   */
  async isSPVAuthorized(spvAddress: string): Promise<boolean> {
    try {
      return await this.platformRegistry.isAuthorizedSPV(spvAddress);
    } catch (error) {
      this.logger.error('Failed to check SPV authorization:', error);
      return false;
    }
  }

  /**
   * Get platform configuration
   */
  async getPlatformConfiguration(): Promise<any> {
    try {
      const config = await this.platformRegistry.getPlatformConfiguration();
      return {
        listingFee: config.listingFee.toString(),
        managementFeeRate: config.managementFeeRate.toString(),
        minimumInvestment: config.minimumInvestment.toString(),
        maximumInvestment: config.maximumInvestment.toString(),
        isActive: config.isActive,
      };
    } catch (error) {
      this.logger.error('Failed to get platform configuration:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async createTransactionRecord(
    transactionData: Partial<BlockchainTransaction>
  ): Promise<BlockchainTransaction> {
    const transaction: BlockchainTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hash: transactionData.hash,
      from: transactionData.from,
      to: transactionData.to,
      value: transactionData.value || '0',
      gasUsed: transactionData.gasUsed || 0,
      gasPrice: transactionData.gasPrice || '0',
      blockNumber: transactionData.blockNumber || 0,
      status: transactionData.status || 'pending',
      timestamp: new Date(),
      data: transactionData.data,
    };

    await this.firebaseService.setDocument(
      this.TRANSACTIONS_COLLECTION,
      transaction.id,
      transaction
    );

    return transaction;
  }

  private async updateTransactionStatus(
    transaction: BlockchainTransaction
  ): Promise<void> {
    try {
      const txReceipt = await this.provider.getTransactionReceipt(
        transaction.hash
      );

      if (txReceipt) {
        await this.firebaseService.updateDocument(
          this.TRANSACTIONS_COLLECTION,
          transaction.id,
          {
            status: txReceipt.status === 1 ? 'confirmed' : 'failed',
            blockNumber: txReceipt.blockNumber,
            gasUsed: txReceipt.gasUsed.toString(),
          }
        );
      }
    } catch (error) {
      this.logger.error('Failed to update transaction status:', error);
    }
  }

  private createTransactionFromReceipt(receipt: any): BlockchainTransaction {
    return {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hash: receipt.hash,
      from: receipt.from,
      to: receipt.to,
      value: '0',
      gasUsed: Number(receipt.gasUsed),
      gasPrice: '0',
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      timestamp: new Date(),
    };
  }

  /**
   * Event handlers
   */
  private async handleProjectCreatedEvent(eventData: any): Promise<void> {
    try {
      // Update deployment record with actual contract addresses
      const docs = await this.firebaseService.getDocumentsByField(
        this.CONTRACTS_COLLECTION,
        'transactionHash',
        eventData.transactionHash
      );

      if (docs.docs.length > 0) {
        const deployment = docs.docs[0].data() as ContractDeployment;
        await this.firebaseService.updateDocument(
          this.CONTRACTS_COLLECTION,
          deployment.id,
          {
            contractAddress: eventData.tokenAddress, // Use token address as main contract
            data: {
              tokenAddress: eventData.tokenAddress,
              offeringAddress: eventData.offeringAddress,
              treasuryAddress: eventData.treasuryAddress,
              governanceAddress: eventData.governanceAddress,
            },
          }
        );
      }

      // Store event
      await this.storeBlockchainEvent('ProjectCreated', eventData);
    } catch (error) {
      this.logger.error('Failed to handle ProjectCreated event:', error);
    }
  }

  private async handleIdentityRegisteredEvent(eventData: any): Promise<void> {
    try {
      await this.storeBlockchainEvent('IdentityRegistered', eventData);
    } catch (error) {
      this.logger.error('Failed to handle IdentityRegistered event:', error);
    }
  }

  private async handleFeeCollectedEvent(eventData: any): Promise<void> {
    try {
      await this.storeBlockchainEvent('FeeCollected', eventData);
    } catch (error) {
      this.logger.error('Failed to handle FeeCollected event:', error);
    }
  }

  private async storeBlockchainEvent(
    eventType: string,
    eventData: any
  ): Promise<void> {
    const event = {
      type: eventType,
      data: eventData,
      timestamp: new Date(),
    };

    await this.firebaseService.setDocument(
      this.EVENTS_COLLECTION,
      `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event
    );
  }
}
