# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Partisipro is a blockchain-based platform for Public Private Partnership (PPP)
funding that tokenizes large-scale infrastructure projects in Indonesia,
enabling retail investors to participate through fractional ownership. The
platform uses a hybrid on-chain/off-chain architecture with Indonesian Rupiah
(IDR) payments via licensed gateways for regulatory compliance.

### Core Business Model

1. **Project Origination**: Government-approved SPVs undergo due diligence
2. **Tokenization**: Factory pattern deploys isolated contract sets per project
3. **Primary Offering**: Initial token sales via Indonesian Rupiah (IDR)
   payments
4. **Operation**: Automated profit distribution through Treasury contracts
5. **Secondary Market**: DEX trading of project tokens
6. **Concession End**: Burn-to-claim mechanism for final buyback

## Architecture

### Monorepo Structure (Turborepo)

- **`apps/frontend/`**: Next.js 14 + Tailwind + Wagmi/Viem for Web3
- **`apps/backend/`**: NestJS + Firebase/Firestore for API and user management
- **`packages/contracts/`**: Hardhat + Solidity 0.8.20 for smart contracts
- **`packages/shared/`**: TypeScript utilities, types, and constants
- **`tools/`**: Docker configurations and setup scripts

### Smart Contract Architecture

**ERC-3643 Enhanced Factory Pattern**: Each project gets isolated contract
deployment with identity-centric compliance:

- **Core Infrastructure**: `PlatformRegistry.sol`, `PlatformTreasury.sol`,
  `ProjectFactory.sol`
- **ERC-3643 Compliance Infrastructure**: `ClaimTopicsRegistry.sol`,
  `TrustedIssuersRegistry.sol`, `IdentityRegistry.sol` - Standards-based
  identity verification system
- **Per-Project**: `ProjectToken.sol` (ERC-3643 compliant),
  `ProjectOffering.sol`, `ProjectTreasury.sol`, `ProjectGovernance.sol`
- **Security**: OpenZeppelin + AccessControl + ERC-3643 standard for regulatory
  compliance
- **Architecture**: 10 contracts total (7 original + 3 ERC-3643),
  production-ready compliance model

### Technology Stack

- **Blockchain**: Arbitrum (Sepolia testnet, One mainnet)
- **Frontend**: Next.js + TypeScript + Tailwind + Wagmi + Zustand
- **Backend**: NestJS + TypeScript + Firebase/Firestore + Redis + JWT
- **Contracts**: Solidity + Hardhat + OpenZeppelin + Chainlink

## Essential Commands

### Development Workflow

```bash
# Setup (run once)
./tools/scripts/setup-env.sh

# Development (all services)
npm run dev                    # Start all apps in development mode

# Individual services
npm run dev --workspace=@partisipro/frontend    # Frontend only
npm run dev --workspace=@partisipro/backend     # Backend only
npm run dev --workspace=@partisipro/contracts   # Local blockchain

# Build and Test
npm run build                  # Build all packages (Turborepo pipeline)
npm run test                   # Run all tests
npm run lint                   # Lint all code
npm run lint:fix              # Fix linting issues
npm run format                 # Format code (includes Solidity)
npm run type-check             # TypeScript validation
```

### Smart Contract Development

```bash
cd packages/contracts
npm run test                   # Run contract tests
npm run deploy:local           # Deploy to local Hardhat network
npm run deploy:sepolia         # Deploy to Arbitrum Sepolia testnet
npm run verify:sepolia         # Verify contracts on Arbiscan
npx hardhat console --network arbitrumSepolia  # Interactive console
```

### Database and Backend

```bash
cd apps/backend
npm run start:dev              # Backend with hot reload
npm run test:e2e               # End-to-end API tests
npm run test:cov               # Test coverage report
firebase emulators:start       # Start Firebase emulators for local development
firebase deploy                # Deploy to Firebase
```

### Git Workflow (Enforced by Husky)

```bash
npm run commit                 # Interactive conventional commits
# Commit types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, contract, deploy
```

## Key Configuration Files

- **`turbo.json`**: Build pipeline orchestration and caching
- **`packages/contracts/hardhat.config.ts`**: Blockchain networks and deployment
- **`.env.example`**: Required environment variables template
- **`commitlint.config.js`**: Conventional commits with blockchain-specific
  types
- **`tools/docker/docker-compose.yml`**: Full development stack

## Development Patterns

### Code Organization

- **Shared types**: Export from `packages/shared/src/types/`
- **Path aliases**: Use `@/` for relative imports within apps
- **Workspace imports**: Use `@partisipro/shared` across packages
- **Constants**: Network configs and contract addresses in
  `packages/shared/src/constants/`

### Smart Contract Conventions

- **Factory Deployment**: Use `ProjectFactory.createProject()` with listing fee
  payment and ERC-3643 compliance integration
- **ERC-3643 Compliance**: Identity-centric verification through
  IdentityRegistry, one-time KYC for all platform projects
- **Access Control**: Dual-layer system - PlatformRegistry for SPVs,
  IdentityRegistry for investor compliance
- **Fee Structure**: Dual-fee model (listing + management) with automatic
  platform treasury collection
- **Governance**: Token-weighted voting through ProjectGovernance.sol
- **Upgradeability**: Production-ready UUPS proxy pattern with Clone factory
- **Gas Optimization**: Target Arbitrum network for low-cost transactions
- **Standards Compliance**: Full ERC-3643 (T-REX) implementation for regulatory
  compliance

### Frontend Patterns

- **Web3 Integration**: Wagmi hooks + Viem for blockchain interactions
- **State Management**: Zustand for app state, React Hook Form + Zod for forms
- **Styling**: Tailwind with custom design system in `tailwind.config.js`
- **Components**: Reusable UI in `src/components/ui/`, business logic in
  `src/components/`

### Backend Patterns

- **Module Structure**: NestJS modules in `src/modules/` by feature
- **Database**: Firebase/Firestore NoSQL database with collection-based design
- **Authentication**: Web3Auth integration with Firebase Auth and JWT tokens
- **Security**: JWT auth, rate limiting, input validation with class-validator
- **Blockchain Integration**: Ethers.js service layer for contract interactions
- **Caching**: Redis for performance optimization and session management

## Environment Setup

### Required Environment Variables

- **Firebase**: `_FIREBASE_PROJECT_ID`, `_FIREBASE_PRIVATE_KEY`,
  `_FIREBASE_CLIENT_EMAIL`
- **Blockchain**: `ARBITRUM_SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `ARBISCAN_API_KEY`
- **Security**: `JWT_SECRET`
- **Services**: KYC provider keys, email service, Web3Auth API keys

### Networks

- **Development**: Local Hardhat network (chainId: 1337)
- **Testing**: Arbitrum Sepolia (chainId: 421614)
- **Production**: Arbitrum One (chainId: 42161)

## Project-Specific Context

### Indonesian Compliance Focus

- All transactions use **Indonesian Rupiah (IDR)** via licensed payment gateways
  for regulatory compliance
- KYC verification mandatory before any investment activity
- Platform designed for Indonesian PPP/KPBU infrastructure projects
- Web3Auth integration for seamless user onboarding without crypto complexity

### Key Business Logic

- **Tokenization**: Each infrastructure project becomes an ERC-3643 compliant
  token with identity-based transfer restrictions and voting capabilities
- **Identity-Centric Compliance**: One-time KYC verification for all platform
  projects through ERC-3643 standard implementation
- **Access Control**: Dual-layer system - SPV management via PlatformRegistry,
  investor compliance via IdentityRegistry with trusted claim issuers
- **Fee Management**: Automatic platform fee collection (listing + management
  fees) with transparent on-chain calculation
- **Profit Distribution**: Automated on-chain calculation with platform fee
  deduction and proportional distribution to verified token holders
- **Governance**: Token-weighted voting with proposal and execution mechanisms
  for verified identity holders only
- **Liquidity**: Secondary market trading on external DEX platforms with
  compliance verification at transfer level

### Security Considerations

- Multi-signature wallets for admin functions
- Upgradeable contracts for future-proofing
- Comprehensive input validation on all user inputs
- Rate limiting and DDoS protection on API endpoints

### ERC-3643 Enhanced Contracts Overview

#### Core Infrastructure (3 contracts)

1. **PlatformRegistry.sol** - Central access control and configuration for SPVs
2. **PlatformTreasury.sol** - Platform fee collection and management
3. **ProjectFactory.sol** - Factory pattern for project deployment with
   compliance integration

#### ERC-3643 Compliance Infrastructure (3 contracts)

4. **ClaimTopicsRegistry.sol** - Standardized claim types for compliance (KYC,
   accreditation, etc.)
5. **TrustedIssuersRegistry.sol** - Authorized claim issuers management and
   verification
6. **IdentityRegistry.sol** - Central identity and claims management for
   investor verification

#### Per-Project Contracts (4 contracts)

7. **ProjectToken.sol** - ERC-3643 compliant token with identity-based transfer
   restrictions
8. **ProjectOffering.sol** - Token sale with identity registry enforcement
9. **ProjectTreasury.sol** - Project-specific profit distribution to verified
   holders
10. **ProjectGovernance.sol** - Token-weighted voting mechanism for verified
    identities

## ERC-3643 Implementation Details

### Platform Transformation

The platform has been **successfully transformed** from an asset-centric to an
**identity-centric compliance model** through ERC-3643 (T-REX) standard
implementation:

- **Before**: Per-project investor whitelisting via PlatformRegistry
- **After**: One-time KYC verification for all platform projects via
  IdentityRegistry
- **Impact**: Dramatically improved user experience and regulatory compliance

### ERC-3643 Architecture

#### Claim-Based Verification System

- **Claim Topics**: Standardized verification types (KYC_APPROVED,
  ACCREDITED_INVESTOR, etc.)
- **Trusted Issuers**: Authorized KYC providers who can issue claims
- **Identity Registry**: Central claims management with verification status
  tracking

#### Contract Relationships

```
IdentityRegistry
├── ClaimTopicsRegistry (defines claim types)
├── TrustedIssuersRegistry (manages authorized issuers)
└── Claims Management (investor verification status)

ProjectToken (ERC-3643)
├── Transfer Compliance (checks IdentityRegistry)
├── Voting Rights (verified holders only)
└── Token Economics (standard ERC-20 functionality)
```

#### Key Benefits

- **One-Time KYC**: Investors verified once for all platform projects
- **Regulatory Compliance**: Industry-standard ERC-3643 framework
- **Scalability**: Centralized identity supports unlimited projects
- **User Experience**: Eliminated per-project compliance overhead

### Development Patterns

#### Identity Verification Flow

1. **KYC Issuer Setup**: Add trusted issuer to TrustedIssuersRegistry
2. **Investor Verification**: Issuer adds KYC claim to IdentityRegistry
3. **Token Transfers**: Automatic compliance verification before transfers
4. **Project Participation**: Verified status enables investment and governance

#### Contract Deployment Order

1. Deploy ClaimTopicsRegistry with admin
2. Deploy TrustedIssuersRegistry with ClaimTopicsRegistry address
3. Deploy IdentityRegistry with both registries
4. Grant necessary operator roles between contracts
5. Deploy ProjectFactory with IdentityRegistry integration

#### Testing Strategy

- **Unit Tests**: Individual contract functionality
- **Integration Tests**: Cross-contract interaction verification
- **Compliance Tests**: End-to-end identity verification workflows
- **Gas Optimization**: Target <400k gas per transaction sequence

### Migration Notes

#### Breaking Changes

- **ProjectFactory**: Now requires IdentityRegistry parameter in constructor
- **ProjectToken**: Enhanced with ERC-3643 compliance verification
- **ProjectOffering**: Uses IdentityRegistry instead of PlatformRegistry for
  investor verification

#### Backward Compatibility

- **ERC-20 Interface**: Fully preserved for DEX compatibility
- **Existing SPV System**: PlatformRegistry still manages SPV authorization
- **Fee Structure**: No changes to platform economics

## Business Process Flow Paths (ERC-3643 Model) - Frontend

### Identity-Centric Compliance Model

The platform has adopted the ERC-3643 standard, transforming from an
**asset-centric** to an **identity-centric** compliance model. This fundamental
change impacts all user journeys and workflows.

### Key Flow Changes:

- **One-Time KYC**: Users verify identity once for all investments (vs.
  per-project KYC)
- **Persistent Identity**: Central IdentityRegistry manages all compliance
- **Simplified Investment**: No per-project whitelisting required
- **Enhanced Admin Tools**: New identity management interfaces

### Core User Flow Paths:

#### Retail Investor Journey

```
/auth → /kyc → /identity → /marketplace → /projects/[id] → /invest/[id] → /dashboard
```

**Key Change**: One-time KYC creates persistent identity for all investments

#### SPV Project Creation

```
/spv/auth → /spv/dashboard → /spv/create → /spv/compliance
```

**Key Change**: Projects automatically link to central IdentityRegistry

#### Admin Identity Management

```
/admin/dashboard → /admin/identity → /admin/claims → /admin/compliance
```

**Key Change**: Centralized identity and compliance management

#### Profit Distribution

```
/dashboard → /claim (with automatic identity verification)
```

**Key Change**: Identity verification integrated into claiming process

# IMPORTANT NOTE

Altough the Administrator and SPVs intended to use Multi-Signature Wallet for
extra security, as this projet is still a prototype, do as follows:

- Blockchain Platform uses Single-Signature Wallet for Administrator and SPVs
- Backend Platform uses Single-Signature Wallet for Administrator and SPVs
- Frontend Platform uses Single-Signature Wallet for Administrator and SPVs, but
  still show views to connect Multi-Signature Wallet just for visual purposes
  only.
