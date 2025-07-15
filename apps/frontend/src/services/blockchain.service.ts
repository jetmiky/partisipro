/**
 * Blockchain Service
 * Handles blockchain-related API calls to the backend
 */

import { apiClient } from '../lib/api-client';

export interface BlockchainTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  gasPrice: string;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  data?: any;
}

export interface ContractDeployment {
  id: string;
  projectId: string;
  contractType: string;
  contractAddress: string;
  transactionHash: string;
  deployedAt: string;
  deployedBy: string;
}

export interface DeployContractRequest {
  projectId: string;
  contractType: string;
  parameters?: any[];
  gasLimit?: number;
}

export interface GenerateSignatureRequest {
  investorAddress: string;
  amount: number;
  projectId: string;
  tokenAmount: number;
  nonce: string;
}

export interface SubmitTransactionRequest {
  contractAddress: string;
  transactionData: string;
  value?: string;
  gasLimit: number;
  gasPrice?: string;
}

export interface PlatformConfiguration {
  listingFee: string;
  managementFeeRate: string;
  minimumInvestment: string;
  maximumInvestment: string;
  isActive: boolean;
}

class BlockchainService {
  private readonly BASE_PATH = '/api/blockchain';

  /**
   * Deploy smart contract
   */
  async deployContract(
    request: DeployContractRequest
  ): Promise<ContractDeployment> {
    return apiClient.post(`${this.BASE_PATH}/deploy`, request);
  }

  /**
   * Generate authorization signature for investment
   */
  async generateAuthorizationSignature(
    request: GenerateSignatureRequest
  ): Promise<string> {
    const response = await apiClient.post<{ signature: string }>(
      `${this.BASE_PATH}/signature`,
      request
    );
    return response.signature;
  }

  /**
   * Submit transaction to blockchain
   */
  async submitTransaction(
    request: SubmitTransactionRequest
  ): Promise<BlockchainTransaction> {
    return apiClient.post(`${this.BASE_PATH}/transaction`, request);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<BlockchainTransaction | null> {
    try {
      return await apiClient.get(`${this.BASE_PATH}/transaction/${hash}`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get contract deployments for a project
   */
  async getProjectContracts(projectId: string): Promise<ContractDeployment[]> {
    return apiClient.get(`${this.BASE_PATH}/contracts/project/${projectId}`);
  }

  /**
   * Get all contract deployments
   */
  async getAllContracts(): Promise<ContractDeployment[]> {
    return apiClient.get(`${this.BASE_PATH}/contracts`);
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    address?: string,
    limit: number = 50,
    startAfter?: string
  ): Promise<BlockchainTransaction[]> {
    const params: Record<string, any> = { limit };
    if (address) params.address = address;
    if (startAfter) params.startAfter = startAfter;

    return apiClient.get(`${this.BASE_PATH}/transactions`, params);
  }

  /**
   * Check if investor is verified in IdentityRegistry
   */
  async isInvestorVerified(investorAddress: string): Promise<boolean> {
    const response = await apiClient.get<{ verified: boolean }>(
      `${this.BASE_PATH}/identity/verified/${investorAddress}`
    );
    return response.verified;
  }

  /**
   * Check if SPV is authorized in PlatformRegistry
   */
  async isSPVAuthorized(spvAddress: string): Promise<boolean> {
    const response = await apiClient.get<{ authorized: boolean }>(
      `${this.BASE_PATH}/spv/authorized/${spvAddress}`
    );
    return response.authorized;
  }

  /**
   * Get platform configuration
   */
  async getPlatformConfiguration(): Promise<PlatformConfiguration> {
    return apiClient.get(`${this.BASE_PATH}/platform/configuration`);
  }

  /**
   * Get blockchain network status
   */
  async getNetworkStatus(): Promise<{
    networkName: string;
    chainId: number;
    blockNumber: number;
    connected: boolean;
  }> {
    return apiClient.get(`${this.BASE_PATH}/network/status`);
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(request: {
    to: string;
    data: string;
    value?: string;
  }): Promise<{ gasEstimate: number; gasPrice: string }> {
    return apiClient.post(`${this.BASE_PATH}/gas/estimate`, request);
  }

  /**
   * Get current gas prices
   */
  async getGasPrices(): Promise<{
    slow: string;
    standard: string;
    fast: string;
  }> {
    return apiClient.get(`${this.BASE_PATH}/gas/prices`);
  }

  /**
   * Monitor transaction status
   */
  async monitorTransaction(
    hash: string
  ): Promise<AsyncIterable<BlockchainTransaction>> {
    // This would typically use Server-Sent Events or WebSocket
    // For now, we'll implement polling
    async function* pollTransaction() {
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals

      while (attempts < maxAttempts) {
        try {
          const tx = await apiClient.get<BlockchainTransaction>(
            `/api/blockchain/transaction/${hash}`
          );

          yield tx;

          if (tx.status === 'confirmed' || tx.status === 'failed') {
            break;
          }

          // Wait 5 seconds before next poll
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error polling transaction:', error);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    return pollTransaction();
  }

  /**
   * Get contract ABI by address
   */
  async getContractAbi(address: string): Promise<any[]> {
    return apiClient.get(`${this.BASE_PATH}/contract/${address}/abi`);
  }

  /**
   * Call contract view function
   */
  async callContractFunction(
    contractAddress: string,
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    return apiClient.post(`${this.BASE_PATH}/contract/call`, {
      contractAddress,
      functionName,
      args,
    });
  }

  /**
   * Get contract events
   */
  async getContractEvents(
    contractAddress: string,
    eventName?: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<any[]> {
    const params: Record<string, any> = {};
    if (eventName) params.eventName = eventName;
    if (fromBlock) params.fromBlock = fromBlock;
    if (toBlock) params.toBlock = toBlock;

    return apiClient.get(
      `${this.BASE_PATH}/contract/${contractAddress}/events`,
      params
    );
  }

  /**
   * Health check for blockchain connection
   */
  async healthCheck(): Promise<{
    connected: boolean;
    networkName: string;
    chainId: number;
    blockNumber: number;
    lastBlockTime: string;
  }> {
    return apiClient.get(`${this.BASE_PATH}/health`);
  }
}

// Create singleton instance
export const blockchainService = new BlockchainService();

// Export the class for potential custom instances
export { BlockchainService };
