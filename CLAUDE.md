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

**Factory Pattern**: Each project gets isolated contract deployment:

- **Core Infrastructure**: `ProjectFactory.sol`, `PlatformRegistry.sol`,
  `PlatformTreasury.sol`
- **Per-Project**: `ProjectToken.sol` (ERC-20), `Offering.sol`, `Treasury.sol`,
  `Governance.sol`
- **Security**: OpenZeppelin + UUPS proxy pattern for upgradeability

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

- **Factory Deployment**: Use `ProjectFactory.createProject()` for new projects
- **Proxy Pattern**: All project contracts are upgradeable via UUPS
- **Access Control**: OpenZeppelin `Ownable` + custom role-based permissions
- **Gas Optimization**: Target Arbitrum network for low-cost transactions

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

- **Firebase**: `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`,
  `FIREBASE_CLIENT_EMAIL`
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

- **Tokenization**: Each infrastructure project becomes an ERC-20 token
  representing fractional ownership
- **Profit Distribution**: Automated on-chain calculation and claiming mechanism
- **Governance**: Token holder voting on project decisions
- **Liquidity**: Secondary market trading on external DEX platforms

### Security Considerations

- Multi-signature wallets for admin functions
- Upgradeable contracts for future-proofing
- Comprehensive input validation on all user inputs
- Rate limiting and DDoS protection on API endpoints
