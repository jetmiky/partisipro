# Partisipro Architecture Documentation

## Overview

Partisipro is a blockchain-based platform for Public Private Partnership (PPP)
funding that enables retail investors to participate in large-scale
infrastructure projects through tokenization.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (Arbitrum)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web3Auth      │    │   Firebase      │    │   ERC-3643      │
│   Integration   │    │   (Firestore)   │    │   Smart         │
│                 │    │   + Storage     │    │   Contracts     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Components

#### Frontend (Next.js)

- **Purpose**: User interface for investors and project creators
- **Key Features**:
  - Wallet connection and authentication
  - Project browsing and investment interface
  - Portfolio management
  - Real-time updates and notifications
- **Technology Stack**: Next.js, TypeScript, Tailwind CSS, Wagmi, RainbowKit

#### Backend (NestJS)

- **Purpose**: API server and business logic
- **Key Features**:
  - User authentication and authorization (Web3Auth + JWT)
  - Project management and validation
  - Blockchain transaction handling (ERC-3643 compliant)
  - Integration with external services (KYC, email, etc.)
  - Real-time WebSocket capabilities
- **Technology Stack**: NestJS, TypeScript, Firebase/Firestore, Redis, Ethers.js, SendGrid

#### Smart Contracts (Solidity)

- **Purpose**: On-chain logic and asset management with ERC-3643 compliance
- **Core Infrastructure** (3 contracts):
  - PlatformRegistry: SPV authorization and platform configuration
  - PlatformTreasury: Platform fee collection and management
  - ProjectFactory: Automated project contract deployment
- **ERC-3643 Compliance** (3 contracts):
  - ClaimTopicsRegistry: Standardized claim types (KYC, accreditation)
  - TrustedIssuersRegistry: Authorized KYC provider management
  - IdentityRegistry: Central identity and claims management
- **Per-Project Contracts** (4 contracts):
  - ProjectToken: ERC-3643 compliant tokens with identity verification
  - ProjectOffering: Token sales with identity-based compliance
  - ProjectTreasury: Profit distribution to verified holders
  - ProjectGovernance: Token-weighted voting for verified identities

#### Database (Firebase/Firestore)

- **Purpose**: Store off-chain data and user information with real-time capabilities
- **Key Collections**:
  - Users: User profiles with Web3Auth integration
  - Identity Registry: ERC-3643 identity verification status
  - Claims: Identity claims and verification records
  - Trusted Issuers: Authorized KYC providers
  - Projects: Project metadata and documentation
  - Investments: Investment tracking and portfolio data
  - Profit Distributions: Quarterly profit allocations
  - Governance Proposals: Token holder voting records
  - Notifications: Real-time system alerts
- **Additional Services**:
  - Firebase Storage: Document and file management
  - Firebase Auth: User authentication integration
  - Cloud Functions: Serverless backend processing

### Data Flow

1. **Project Creation Flow** (Enhanced with ERC-3643):

   ```
   SPV → Frontend → Backend → PlatformRegistry → ProjectFactory → Blockchain
   ```

2. **Investment Flow** (Identity-Centric):

   ```
   Investor → Frontend → IdentityRegistry → ProjectOffering → Blockchain
   ```

3. **Identity Verification Flow** (One-Time KYC):
   ```
   Investor → KYC Provider → TrustedIssuersRegistry → IdentityRegistry → Claims
   ```

4. **Profit Distribution Flow**:
   ```
   SPV → Backend → ProjectTreasury → Verified Token Holders
   ```

5. **Real-time Updates Flow**:
   ```
   Blockchain Events → Backend → WebSocket → Frontend → User Interface
   ```

## Security Considerations

### Smart Contract Security

- OpenZeppelin contracts for security standards
- Upgradeable contracts using UUPS proxy pattern
- Multi-signature wallets for admin functions
- Regular security audits and testing

### Backend Security

- JWT-based authentication
- Rate limiting and DDoS protection
- Input validation and sanitization
- Secure API endpoints with proper authorization

### Frontend Security

- Secure wallet integration
- XSS protection
- CSRF protection
- Secure communication with backend

## Deployment Architecture

### Development Environment

- Local development with Docker Compose
- Local blockchain network (Hardhat)
- Development database and Redis instance

### Staging Environment

- Arbitrum Sepolia testnet
- Staging database and services
- CI/CD pipeline testing

### Production Environment

- Arbitrum One mainnet
- Production database with replication
- Load balancers and CDN
- Monitoring and alerting systems

## Technology Choices

### Why Arbitrum?

- Low transaction costs
- Ethereum compatibility
- Fast finality
- Strong ecosystem support

### Why NestJS?

- TypeScript support
- Modular architecture
- Built-in dependency injection
- Excellent documentation

### Why Next.js?

- React-based with SSR/SSG support
- Great developer experience
- Built-in optimizations
- Easy deployment

## Scalability Considerations

### Database Scaling

- Firestore automatic scaling and replication
- Collection-based data partitioning
- Realtime database optimization
- Firebase Functions for serverless processing

### Application Scaling

- Horizontal scaling with load balancers
- Caching strategies (Redis)
- CDN for static assets
- Microservices architecture (future)

### Blockchain Scaling

- Layer 2 solution (Arbitrum)
- Batch transactions where possible
- Efficient smart contract design
- Gas optimization strategies

## Future Enhancements

### AI/ML Integration

- Sentiment analysis for project evaluation
- Anomaly detection for fraud prevention
- Predictive analytics for investment insights
- Automated customer support chatbots

### Additional Features

- Mobile application
- Advanced governance features
- Cross-chain compatibility
- DeFi integrations

### Performance Optimizations

- Database query optimization
- Frontend performance improvements
- Smart contract gas optimization
- Caching strategies

## Monitoring and Observability

### Metrics to Track

- Transaction success rates
- API response times
- User engagement metrics
- Smart contract gas usage
- Database performance

### Alerting

- Critical system failures
- Security incidents
- Performance degradation
- High error rates

### Logging

- Structured logging across all components
- Centralized log aggregation
- Log retention policies
- Security event logging
