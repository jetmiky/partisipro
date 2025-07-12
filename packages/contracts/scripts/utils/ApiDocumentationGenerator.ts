import { ethers } from 'ethers';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface ContractFunction {
  name: string;
  inputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  stateMutability: string;
  description: string;
  examples: Array<{
    title: string;
    code: string;
    description: string;
  }>;
  gasEstimate?: string;
  requirements?: string[];
  events?: string[];
}

export interface ContractEvent {
  name: string;
  inputs: Array<{
    name: string;
    type: string;
    indexed: boolean;
    description: string;
  }>;
  description: string;
  examples: Array<{
    title: string;
    code: string;
    description: string;
  }>;
}

export interface ContractDocumentation {
  contractName: string;
  address: string;
  description: string;
  purpose: string;
  features: string[];
  functions: ContractFunction[];
  events: ContractEvent[];
  constants: Array<{
    name: string;
    type: string;
    value: string;
    description: string;
  }>;
  gasOptimization: {
    averageGasUsage: Record<string, string>;
    optimizationTips: string[];
  };
  security: {
    accessControl: string[];
    securityFeatures: string[];
    auditStatus: string;
  };
  integration: {
    dependencies: string[];
    interfaces: string[];
    upgradeability: string;
  };
}

export interface APIDocumentation {
  title: string;
  version: string;
  description: string;
  network: string;
  lastUpdated: string;
  contracts: ContractDocumentation[];
  quickStart: {
    installation: string[];
    basicUsage: string[];
    examples: Array<{
      title: string;
      description: string;
      code: string;
    }>;
  };
  sdkReference: {
    classes: Array<{
      name: string;
      description: string;
      methods: Array<{
        name: string;
        parameters: string[];
        returns: string;
        description: string;
        example: string;
      }>;
    }>;
  };
  troubleshooting: {
    commonErrors: Array<{
      error: string;
      cause: string;
      solution: string;
    }>;
    faq: Array<{
      question: string;
      answer: string;
    }>;
  };
}

export interface DocumentationConfig {
  contracts: Array<{
    name: string;
    address: string;
    abi: any[];
    description: string;
    features: string[];
  }>;
  output: {
    formats: ('json' | 'markdown' | 'html')[];
    outputDir: string;
  };
  includeGasEstimates: boolean;
  includeExamples: boolean;
  includeDiagrams: boolean;
}

export class ApiDocumentationGenerator {
  private config: DocumentationConfig;
  private provider: ethers.Provider;
  private contractDescriptions: Map<string, any> = new Map();

  constructor(config: DocumentationConfig, provider: ethers.Provider) {
    this.config = config;
    this.provider = provider;
    this.initializeContractDescriptions();
  }

  /**
   * Initialize contract descriptions and metadata
   */
  private initializeContractDescriptions(): void {
    // Platform Registry
    this.contractDescriptions.set('PlatformRegistry', {
      purpose: 'Central registry for SPV management and platform configuration',
      features: [
        'SPV registration and authorization',
        'Platform configuration management', 
        'Emergency mode controls',
        'Access control and permissions',
        'Fee management',
        'Activity monitoring'
      ],
      gasOptimization: {
        averageGasUsage: {
          'registerSPV': '150000',
          'updatePlatformConfig': '100000',
          'activateEmergencyMode': '80000',
        },
        optimizationTips: [
          'Batch SPV registrations to reduce gas costs',
          'Use view functions for configuration queries',
          'Monitor gas price before configuration updates'
        ]
      },
      security: {
        accessControl: ['DEFAULT_ADMIN_ROLE', 'OPERATOR_ROLE'],
        securityFeatures: ['Emergency pause', 'Role-based access', 'Activity tracking'],
        auditStatus: 'Internal review completed'
      }
    });

    // Platform Treasury
    this.contractDescriptions.set('PlatformTreasury', {
      purpose: 'Secure treasury management for platform fees and emergency operations',
      features: [
        'Fee collection and management',
        'Emergency withdrawal capabilities',
        'Circuit breaker patterns',
        'Daily withdrawal limits',
        'Multi-signature support',
        'Automated fee distribution'
      ],
      gasOptimization: {
        averageGasUsage: {
          'collectFees': '120000',
          'emergencyWithdraw': '200000',
          'updateWithdrawalLimits': '90000',
        },
        optimizationTips: [
          'Batch fee collections',
          'Use emergency functions only when necessary',
          'Monitor withdrawal limits to avoid reverts'
        ]
      },
      security: {
        accessControl: ['DEFAULT_ADMIN_ROLE', 'EMERGENCY_ROLE'],
        securityFeatures: ['Emergency controls', 'Withdrawal limits', 'Circuit breakers'],
        auditStatus: 'Internal review completed'
      }
    });

    // Identity Registry
    this.contractDescriptions.set('IdentityRegistry', {
      purpose: 'ERC-3643 compliant identity management for investor verification',
      features: [
        'Identity registration and verification',
        'Claim management and validation',
        'Automated claim expiration',
        'Batch operations support',
        'Compliance monitoring',
        'KYC integration'
      ],
      gasOptimization: {
        averageGasUsage: {
          'registerIdentity': '180000',
          'addClaim': '120000',
          'updateClaim': '100000',
          'batchRegisterIdentities': '150000',
        },
        optimizationTips: [
          'Use batch operations for multiple registrations',
          'Implement claim auto-renewal to reduce gas costs',
          'Cache verification results for frequently accessed identities'
        ]
      },
      security: {
        accessControl: ['DEFAULT_ADMIN_ROLE', 'AGENT_ROLE'],
        securityFeatures: ['Claim validation', 'Expiration management', 'Batch processing'],
        auditStatus: 'ERC-3643 standard compliance verified'
      }
    });

    // Project Factory
    this.contractDescriptions.set('ProjectFactory', {
      purpose: 'Factory pattern for deploying isolated project contract sets',
      features: [
        'Project deployment with listing fees',
        'Identity registry integration',
        'Automated contract linking',
        'Project configuration management',
        'Event emission for tracking',
        'Upgradeable implementations'
      ],
      gasOptimization: {
        averageGasUsage: {
          'createProject': '2500000',
          'updateImplementations': '150000',
        },
        optimizationTips: [
          'Deploy multiple projects in batches if possible',
          'Use CREATE2 for predictable addresses',
          'Monitor implementation updates for gas efficiency'
        ]
      },
      security: {
        accessControl: ['DEFAULT_ADMIN_ROLE', 'FACTORY_ROLE'],
        securityFeatures: ['Implementation validation', 'Access control', 'Project isolation'],
        auditStatus: 'Factory pattern security verified'
      }
    });

    // Add descriptions for other contracts...
  }

  /**
   * Generate complete API documentation
   */
  async generateCompleteDocumentation(): Promise<APIDocumentation> {
    console.log('📚 Generating complete API documentation...');
    
    const startTime = Date.now();
    
    try {
      // Generate documentation for each contract
      const contractDocs: ContractDocumentation[] = [];
      
      for (const contractConfig of this.config.contracts) {
        const contractDoc = await this.generateContractDocumentation(contractConfig);
        contractDocs.push(contractDoc);
      }

      // Generate SDK reference
      const sdkReference = this.generateSDKReference();
      
      // Generate troubleshooting guide
      const troubleshooting = this.generateTroubleshooting();
      
      // Generate quick start guide
      const quickStart = this.generateQuickStart();

      const apiDoc: APIDocumentation = {
        title: 'Partisipro Blockchain Platform API Documentation',
        version: '1.0.0',
        description: 'Complete API documentation for the Partisipro blockchain platform smart contracts',
        network: (await this.provider.getNetwork()).name,
        lastUpdated: new Date().toISOString(),
        contracts: contractDocs,
        quickStart,
        sdkReference,
        troubleshooting,
      };

      const executionTime = Date.now() - startTime;
      console.log(`✅ API documentation generated in ${executionTime}ms`);
      
      return apiDoc;
    } catch (error) {
      console.error('❌ API documentation generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate documentation for a single contract
   */
  private async generateContractDocumentation(contractConfig: any): Promise<ContractDocumentation> {
    console.log(`📄 Generating documentation for ${contractConfig.name}...`);
    
    const contractMeta = this.contractDescriptions.get(contractConfig.name);
    
    // Parse ABI to extract functions and events
    const functions = await this.parseFunctions(contractConfig.abi, contractConfig.name);
    const events = await this.parseEvents(contractConfig.abi, contractConfig.name);
    const constants = await this.parseConstants(contractConfig.abi, contractConfig.name);

    const documentation: ContractDocumentation = {
      contractName: contractConfig.name,
      address: contractConfig.address,
      description: contractConfig.description,
      purpose: contractMeta?.purpose || 'Smart contract for platform operations',
      features: contractMeta?.features || [],
      functions,
      events,
      constants,
      gasOptimization: contractMeta?.gasOptimization || {
        averageGasUsage: {},
        optimizationTips: []
      },
      security: contractMeta?.security || {
        accessControl: [],
        securityFeatures: [],
        auditStatus: 'Pending'
      },
      integration: {
        dependencies: this.getContractDependencies(contractConfig.name),
        interfaces: this.getContractInterfaces(contractConfig.name),
        upgradeability: this.getUpgradeabilityInfo(contractConfig.name),
      },
    };

    return documentation;
  }

  /**
   * Parse contract functions from ABI
   */
  private async parseFunctions(abi: any[], contractName: string): Promise<ContractFunction[]> {
    const functions: ContractFunction[] = [];
    
    for (const item of abi) {
      if (item.type === 'function') {
        const func: ContractFunction = {
          name: item.name,
          inputs: item.inputs?.map((input: any) => ({
            name: input.name,
            type: input.type,
            description: this.getParameterDescription(contractName, item.name, input.name)
          })) || [],
          outputs: item.outputs?.map((output: any) => ({
            name: output.name || 'return',
            type: output.type,
            description: this.getReturnDescription(contractName, item.name, output.name)
          })) || [],
          stateMutability: item.stateMutability,
          description: this.getFunctionDescription(contractName, item.name),
          examples: this.getFunctionExamples(contractName, item.name),
          gasEstimate: this.getGasEstimate(contractName, item.name),
          requirements: this.getFunctionRequirements(contractName, item.name),
          events: this.getFunctionEvents(contractName, item.name),
        };
        
        functions.push(func);
      }
    }
    
    return functions;
  }

  /**
   * Parse contract events from ABI
   */
  private async parseEvents(abi: any[], contractName: string): Promise<ContractEvent[]> {
    const events: ContractEvent[] = [];
    
    for (const item of abi) {
      if (item.type === 'event') {
        const event: ContractEvent = {
          name: item.name,
          inputs: item.inputs?.map((input: any) => ({
            name: input.name,
            type: input.type,
            indexed: input.indexed || false,
            description: this.getEventParameterDescription(contractName, item.name, input.name)
          })) || [],
          description: this.getEventDescription(contractName, item.name),
          examples: this.getEventExamples(contractName, item.name),
        };
        
        events.push(event);
      }
    }
    
    return events;
  }

  /**
   * Parse contract constants
   */
  private async parseConstants(abi: any[], contractName: string): Promise<ContractDocumentation['constants']> {
    const constants: ContractDocumentation['constants'] = [];
    
    // Add common constants based on contract type
    if (contractName === 'PlatformRegistry') {
      constants.push({
        name: 'DEFAULT_ADMIN_ROLE',
        type: 'bytes32',
        value: '0x00',
        description: 'Default admin role for access control'
      });
    }
    
    return constants;
  }

  /**
   * Generate SDK reference documentation
   */
  private generateSDKReference(): APIDocumentation['sdkReference'] {
    return {
      classes: [
        {
          name: 'ContractInteractionUtils',
          description: 'Utility class for interacting with smart contracts',
          methods: [
            {
              name: 'executeFunction',
              parameters: ['contractName: string', 'functionName: string', 'args: any[]'],
              returns: 'Promise<TransactionResult>',
              description: 'Execute a contract function with comprehensive error handling',
              example: `
const utils = new ContractInteractionUtils(provider, signer);
const result = await utils.executeFunction('PlatformRegistry', 'registerSPV', [spvAddress]);
              `.trim()
            },
            {
              name: 'executeBatchOperations',
              parameters: ['operations: BatchOperation[]'],
              returns: 'Promise<BatchOperationResult>',
              description: 'Execute multiple contract operations in batch',
              example: `
const operations = [
  { contractName: 'PlatformRegistry', functionName: 'registerSPV', args: [spv1] },
  { contractName: 'PlatformRegistry', functionName: 'registerSPV', args: [spv2] }
];
const result = await utils.executeBatchOperations(operations);
              `.trim()
            }
          ]
        },
        {
          name: 'PlatformHealthMonitor',
          description: 'Real-time health monitoring for platform contracts',
          methods: [
            {
              name: 'startMonitoring',
              parameters: [],
              returns: 'Promise<void>',
              description: 'Start real-time health monitoring',
              example: `
const monitor = new PlatformHealthMonitor(provider, config);
await monitor.startMonitoring();
              `.trim()
            },
            {
              name: 'generateHealthReport',
              parameters: [],
              returns: 'string',
              description: 'Generate comprehensive health report',
              example: `
const reportPath = monitor.generateHealthReport();
console.log('Health report saved to:', reportPath);
              `.trim()
            }
          ]
        }
      ]
    };
  }

  /**
   * Generate troubleshooting guide
   */
  private generateTroubleshooting(): APIDocumentation['troubleshooting'] {
    return {
      commonErrors: [
        {
          error: 'Transaction reverted with reason: "AccessControl: account is missing role"',
          cause: 'Attempting to call a function without proper role permissions',
          solution: 'Ensure the calling account has the required role. Use grantRole() to assign roles.'
        },
        {
          error: 'Transaction reverted with reason: "Pausable: paused"',
          cause: 'Contract is in paused state and non-emergency functions are disabled',
          solution: 'Wait for contract to be unpaused by admin or use emergency functions if available.'
        },
        {
          error: 'Transaction reverted with reason: "Identity not verified"',
          cause: 'Attempting to perform action with unverified identity',
          solution: 'Complete KYC verification process through IdentityRegistry before attempting the action.'
        },
        {
          error: 'Gas estimation failed',
          cause: 'Transaction would revert or requires more gas than estimated',
          solution: 'Check transaction parameters and increase gas limit. Verify all requirements are met.'
        }
      ],
      faq: [
        {
          question: 'How do I register a new SPV?',
          answer: 'Use the PlatformRegistry.registerSPV() function with admin permissions. The SPV address must be a valid wallet address and will require payment of the listing fee.'
        },
        {
          question: 'What is the difference between paused and emergency mode?',
          answer: 'Paused mode disables all non-emergency functions. Emergency mode allows emergency functions but may restrict normal operations. Both are used for different security scenarios.'
        },
        {
          question: 'How can I optimize gas costs?',
          answer: 'Use batch operations when possible, monitor gas prices, and consider transaction timing. View functions don\'t require gas.'
        },
        {
          question: 'How do I verify an identity?',
          answer: 'Use the IdentityRegistry.registerIdentity() function with appropriate claims from trusted issuers. KYC verification is typically required.'
        }
      ]
    };
  }

  /**
   * Generate quick start guide
   */
  private generateQuickStart(): APIDocumentation['quickStart'] {
    return {
      installation: [
        'npm install ethers',
        'npm install @openzeppelin/contracts',
        'Set up environment variables for RPC URL and private key'
      ],
      basicUsage: [
        'Initialize provider and signer',
        'Load contract ABIs and addresses',
        'Create contract instances',
        'Call contract functions',
        'Handle transaction results'
      ],
      examples: [
        {
          title: 'Basic Contract Interaction',
          description: 'Connect to a contract and call a view function',
          code: `
import { ethers } from 'ethers';

// Initialize provider
const provider = new ethers.JsonRpcProvider('YOUR_RPC_URL');
const signer = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

// Connect to contract
const contract = new ethers.Contract(contractAddress, abi, signer);

// Call view function
const result = await contract.getPlatformConfig();
console.log('Platform config:', result);
          `.trim()
        },
        {
          title: 'Register New SPV',
          description: 'Register a new SPV with the platform',
          code: `
// Register SPV (requires admin role)
const spvAddress = '0x1234567890123456789012345678901234567890';
const tx = await platformRegistry.registerSPV(spvAddress);
const receipt = await tx.wait();

console.log('SPV registered:', receipt.transactionHash);
          `.trim()
        },
        {
          title: 'Monitor Contract Events',
          description: 'Listen for contract events in real-time',
          code: `
// Listen for SPV registration events
contract.on('SPVRegistered', (spvAddress, timestamp, event) => {
  console.log('New SPV registered:', spvAddress);
  console.log('Timestamp:', timestamp);
  console.log('Transaction:', event.transactionHash);
});
          `.trim()
        }
      ]
    };
  }

  /**
   * Helper methods for generating descriptions
   */
  private getFunctionDescription(contractName: string, functionName: string): string {
    const descriptions: Record<string, Record<string, string>> = {
      'PlatformRegistry': {
        'registerSPV': 'Register a new Special Purpose Vehicle (SPV) with the platform',
        'updatePlatformConfig': 'Update platform configuration parameters',
        'activateEmergencyMode': 'Activate emergency mode to restrict platform operations',
        'deactivateEmergencyMode': 'Deactivate emergency mode to restore normal operations',
        'pause': 'Pause all non-emergency contract functions',
        'unpause': 'Unpause contract functions',
        'getPlatformConfig': 'Get current platform configuration',
        'isSPVRegistered': 'Check if an address is a registered SPV',
        'getEmergencyStatus': 'Get current emergency mode status',
      },
      'IdentityRegistry': {
        'registerIdentity': 'Register a new identity with verification claims',
        'addClaim': 'Add a new claim to an existing identity',
        'updateClaim': 'Update an existing claim',
        'removeClaim': 'Remove a claim from an identity',
        'isVerified': 'Check if an identity is verified',
        'getClaims': 'Get all claims for an identity',
        'batchRegisterIdentities': 'Register multiple identities in a single transaction',
      },
      // Add more descriptions as needed
    };
    
    return descriptions[contractName]?.[functionName] || 'Contract function for platform operations';
  }

  private getParameterDescription(contractName: string, functionName: string, paramName: string): string {
    // Return parameter descriptions based on contract and function
    const commonDescriptions: Record<string, string> = {
      'spvAddress': 'The wallet address of the SPV to register',
      'userAddress': 'The wallet address of the user',
      'identityId': 'Unique identifier for the identity',
      'claimTopic': 'The topic/type of the claim',
      'amount': 'The amount in wei',
      'recipient': 'The address to receive funds',
    };
    
    return commonDescriptions[paramName] || `Parameter for ${functionName}`;
  }

  private getReturnDescription(contractName: string, functionName: string, returnName: string): string {
    return `Return value from ${functionName}`;
  }

  private getEventDescription(contractName: string, eventName: string): string {
    const descriptions: Record<string, Record<string, string>> = {
      'PlatformRegistry': {
        'SPVRegistered': 'Emitted when a new SPV is registered',
        'PlatformConfigUpdated': 'Emitted when platform configuration is updated',
        'EmergencyModeActivated': 'Emitted when emergency mode is activated',
        'EmergencyModeDeactivated': 'Emitted when emergency mode is deactivated',
      },
      'IdentityRegistry': {
        'IdentityRegistered': 'Emitted when a new identity is registered',
        'ClaimAdded': 'Emitted when a claim is added to an identity',
        'ClaimUpdated': 'Emitted when a claim is updated',
        'ClaimRemoved': 'Emitted when a claim is removed',
      },
    };
    
    return descriptions[contractName]?.[eventName] || 'Contract event emission';
  }

  private getEventParameterDescription(contractName: string, eventName: string, paramName: string): string {
    return `Parameter in ${eventName} event`;
  }

  private getFunctionExamples(contractName: string, functionName: string): ContractFunction['examples'] {
    // Return code examples for functions
    return [
      {
        title: `Basic ${functionName} Usage`,
        code: `const result = await contract.${functionName}();`,
        description: `Basic usage example for ${functionName}`
      }
    ];
  }

  private getEventExamples(contractName: string, eventName: string): ContractEvent['examples'] {
    return [
      {
        title: `Listen for ${eventName}`,
        code: `contract.on('${eventName}', (event) => { console.log(event); });`,
        description: `Example of listening for ${eventName} events`
      }
    ];
  }

  private getGasEstimate(contractName: string, functionName: string): string {
    const contractMeta = this.contractDescriptions.get(contractName);
    return contractMeta?.gasOptimization?.averageGasUsage?.[functionName] || 'Variable';
  }

  private getFunctionRequirements(contractName: string, functionName: string): string[] {
    // Return requirements based on function
    const requirements: string[] = [];
    
    if (functionName.includes('register') || functionName.includes('update')) {
      requirements.push('Requires appropriate role permissions');
    }
    
    if (functionName.includes('emergency')) {
      requirements.push('Requires emergency role');
    }
    
    return requirements;
  }

  private getFunctionEvents(contractName: string, functionName: string): string[] {
    // Return events emitted by function
    const events: string[] = [];
    
    if (functionName === 'registerSPV') {
      events.push('SPVRegistered');
    }
    
    return events;
  }

  private getContractDependencies(contractName: string): string[] {
    const dependencies: Record<string, string[]> = {
      'PlatformRegistry': ['PlatformTreasury'],
      'ProjectFactory': ['PlatformRegistry', 'IdentityRegistry'],
      'ProjectToken': ['IdentityRegistry'],
      'ProjectOffering': ['ProjectToken', 'IdentityRegistry'],
    };
    
    return dependencies[contractName] || [];
  }

  private getContractInterfaces(contractName: string): string[] {
    const interfaces: Record<string, string[]> = {
      'PlatformRegistry': ['IAccessControl', 'IPausable', 'IUUPSUpgradeable'],
      'IdentityRegistry': ['IERC3643', 'IAccessControl', 'IUUPSUpgradeable'],
      'ProjectToken': ['IERC20', 'IERC3643', 'IAccessControl'],
    };
    
    return interfaces[contractName] || [];
  }

  private getUpgradeabilityInfo(contractName: string): string {
    const upgradeableContracts = [
      'PlatformRegistry',
      'PlatformTreasury',
      'IdentityRegistry',
      'ProjectGovernance',
      'ProjectTreasury'
    ];
    
    return upgradeableContracts.includes(contractName) ? 'UUPS Upgradeable' : 'Not Upgradeable';
  }

  /**
   * Save documentation in multiple formats
   */
  async saveDocumentation(apiDoc: APIDocumentation): Promise<string[]> {
    const savedFiles: string[] = [];
    
    // Ensure output directory exists
    if (!existsSync(this.config.output.outputDir)) {
      mkdirSync(this.config.output.outputDir, { recursive: true });
    }
    
    // Save JSON format
    if (this.config.output.formats.includes('json')) {
      const jsonPath = join(this.config.output.outputDir, 'api-documentation.json');
      writeFileSync(jsonPath, JSON.stringify(apiDoc, null, 2));
      savedFiles.push(jsonPath);
    }
    
    // Save Markdown format
    if (this.config.output.formats.includes('markdown')) {
      const markdownPath = join(this.config.output.outputDir, 'api-documentation.md');
      const markdownContent = this.generateMarkdownDocumentation(apiDoc);
      writeFileSync(markdownPath, markdownContent);
      savedFiles.push(markdownPath);
    }
    
    // Save HTML format
    if (this.config.output.formats.includes('html')) {
      const htmlPath = join(this.config.output.outputDir, 'api-documentation.html');
      const htmlContent = this.generateHTMLDocumentation(apiDoc);
      writeFileSync(htmlPath, htmlContent);
      savedFiles.push(htmlPath);
    }
    
    console.log('\n📚 API Documentation Generated');
    console.log('===============================');
    console.log(`📝 Title: ${apiDoc.title}`);
    console.log(`📊 Version: ${apiDoc.version}`);
    console.log(`🌐 Network: ${apiDoc.network}`);
    console.log(`📋 Contracts documented: ${apiDoc.contracts.length}`);
    console.log(`📄 Output formats: ${this.config.output.formats.join(', ')}`);
    console.log(`📁 Output directory: ${this.config.output.outputDir}`);
    console.log('\n📄 Generated files:');
    savedFiles.forEach(file => console.log(`  - ${file}`));
    
    return savedFiles;
  }

  /**
   * Generate Markdown documentation
   */
  private generateMarkdownDocumentation(apiDoc: APIDocumentation): string {
    let markdown = `# ${apiDoc.title}\n\n`;
    markdown += `**Version:** ${apiDoc.version}  \n`;
    markdown += `**Network:** ${apiDoc.network}  \n`;
    markdown += `**Last Updated:** ${apiDoc.lastUpdated}  \n\n`;
    markdown += `${apiDoc.description}\n\n`;
    
    // Table of Contents
    markdown += `## Table of Contents\n\n`;
    markdown += `- [Quick Start](#quick-start)\n`;
    markdown += `- [Contracts](#contracts)\n`;
    apiDoc.contracts.forEach(contract => {
      markdown += `  - [${contract.contractName}](#${contract.contractName.toLowerCase()})\n`;
    });
    markdown += `- [SDK Reference](#sdk-reference)\n`;
    markdown += `- [Troubleshooting](#troubleshooting)\n\n`;
    
    // Quick Start
    markdown += `## Quick Start\n\n`;
    markdown += `### Installation\n\n`;
    apiDoc.quickStart.installation.forEach(step => {
      markdown += `- ${step}\n`;
    });
    markdown += `\n### Basic Usage\n\n`;
    apiDoc.quickStart.basicUsage.forEach(step => {
      markdown += `- ${step}\n`;
    });
    markdown += `\n`;
    
    // Contracts
    markdown += `## Contracts\n\n`;
    apiDoc.contracts.forEach(contract => {
      markdown += `### ${contract.contractName}\n\n`;
      markdown += `**Address:** \`${contract.address}\`\n\n`;
      markdown += `${contract.description}\n\n`;
      markdown += `**Purpose:** ${contract.purpose}\n\n`;
      
      if (contract.features.length > 0) {
        markdown += `**Features:**\n`;
        contract.features.forEach(feature => {
          markdown += `- ${feature}\n`;
        });
        markdown += `\n`;
      }
      
      // Functions
      if (contract.functions.length > 0) {
        markdown += `#### Functions\n\n`;
        contract.functions.forEach(func => {
          markdown += `##### ${func.name}\n\n`;
          markdown += `${func.description}\n\n`;
          markdown += `**Parameters:**\n`;
          if (func.inputs.length > 0) {
            func.inputs.forEach(input => {
              markdown += `- \`${input.name}\` (${input.type}): ${input.description}\n`;
            });
          } else {
            markdown += `- None\n`;
          }
          markdown += `\n**Returns:**\n`;
          if (func.outputs.length > 0) {
            func.outputs.forEach(output => {
              markdown += `- \`${output.name}\` (${output.type}): ${output.description}\n`;
            });
          } else {
            markdown += `- None\n`;
          }
          markdown += `\n`;
        });
      }
      
      // Events
      if (contract.events.length > 0) {
        markdown += `#### Events\n\n`;
        contract.events.forEach(event => {
          markdown += `##### ${event.name}\n\n`;
          markdown += `${event.description}\n\n`;
          markdown += `**Parameters:**\n`;
          event.inputs.forEach(input => {
            markdown += `- \`${input.name}\` (${input.type}${input.indexed ? ', indexed' : ''}): ${input.description}\n`;
          });
          markdown += `\n`;
        });
      }
    });
    
    return markdown;
  }

  /**
   * Generate HTML documentation
   */
  private generateHTMLDocumentation(apiDoc: APIDocumentation): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${apiDoc.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .contract { margin-bottom: 40px; }
        .function, .event { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .code { background-color: #f4f4f4; padding: 10px; border-radius: 3px; font-family: monospace; }
        .parameter { margin-left: 20px; }
        h1 { color: #333; }
        h2 { color: #666; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        h3 { color: #888; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${apiDoc.title}</h1>
        <p><strong>Version:</strong> ${apiDoc.version}</p>
        <p><strong>Network:</strong> ${apiDoc.network}</p>
        <p><strong>Last Updated:</strong> ${apiDoc.lastUpdated}</p>
        <p>${apiDoc.description}</p>
    </div>
    
    <h2>Contracts</h2>
`;
    
    apiDoc.contracts.forEach(contract => {
      html += `
    <div class="contract">
        <h3>${contract.contractName}</h3>
        <p><strong>Address:</strong> <code>${contract.address}</code></p>
        <p>${contract.description}</p>
        <p><strong>Purpose:</strong> ${contract.purpose}</p>
        
        <h4>Functions</h4>
`;
      
      contract.functions.forEach(func => {
        html += `
        <div class="function">
            <h5>${func.name}</h5>
            <p>${func.description}</p>
            <p><strong>Parameters:</strong></p>
            <ul>
`;
        func.inputs.forEach(input => {
          html += `                <li><code>${input.name}</code> (${input.type}): ${input.description}</li>\n`;
        });
        
        html += `
            </ul>
            <p><strong>Returns:</strong></p>
            <ul>
`;
        func.outputs.forEach(output => {
          html += `                <li><code>${output.name}</code> (${output.type}): ${output.description}</li>\n`;
        });
        
        html += `
            </ul>
        </div>
`;
      });
      
      html += `
    </div>
`;
    });
    
    html += `
</body>
</html>`;
    
    return html;
  }
}

// Default documentation configuration
export const DEFAULT_DOCUMENTATION_CONFIG: DocumentationConfig = {
  contracts: [], // To be populated with actual contracts
  output: {
    formats: ['json', 'markdown', 'html'],
    outputDir: './docs/api',
  },
  includeGasEstimates: true,
  includeExamples: true,
  includeDiagrams: false,
};

export default ApiDocumentationGenerator;