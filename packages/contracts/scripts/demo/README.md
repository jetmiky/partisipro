# Demo Scripts

This directory contains demo scripts that showcase the complete functionality of
the Partisipro blockchain platform.

## Available Scripts

### 1. `full-demo.ts`

Complete end-to-end demonstration of the platform including:

- Platform deployment
- SPV registration and project creation
- Investor onboarding and investment
- Offering finalization and token claiming
- Governance voting
- Profit distribution

### 2. `project-lifecycle.ts`

Focused demonstration of the project lifecycle:

- Project creation by SPV
- Investment flow
- Offering finalization
- Token claiming

### 3. `governance-demo.ts`

Governance-focused demonstration:

- Token holder proposal creation
- Voting process
- Proposal execution

## Running the Scripts

### Prerequisites

1. Start a local Hardhat node:

   ```bash
   npx hardhat node
   ```

2. Deploy the contracts:
   ```bash
   npx hardhat run scripts/deploy/deploy-local.ts --network localhost
   ```

### Running Demos

```bash
# Complete demo
npx hardhat run scripts/demo/full-demo.ts --network localhost

# Project lifecycle demo
npx hardhat run scripts/demo/project-lifecycle.ts --network localhost

# Governance demo
npx hardhat run scripts/demo/governance-demo.ts --network localhost
```

## Demo Scenarios

### Full Demo Flow

1. **Platform Setup**: Deploy all contracts and configure roles
2. **SPV Onboarding**: Register SPV and create project
3. **Investor Onboarding**: Register investors and complete KYC
4. **Investment Phase**: Investors purchase tokens during offering
5. **Offering Completion**: Finalize offering and enable token claims
6. **Governance**: Token holders create and vote on proposals
7. **Profit Distribution**: Simulate profit distribution to investors

### Key Features Demonstrated

- ✅ Multi-signature wallet support for SPVs
- ✅ Registry-based access control
- ✅ Token offering with soft/hard caps
- ✅ Automated profit distribution
- ✅ Token-weighted governance
- ✅ Upgradeable contract architecture
- ✅ Gas-optimized operations

### Business Logic Validation

- ✅ Only authorized SPVs can create projects
- ✅ Only verified investors can participate
- ✅ Governance requires token ownership
- ✅ Profit distribution is proportional to holdings
- ✅ Platform fees are collected automatically
