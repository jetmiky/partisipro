# Partisipro: A Blockchain-based Platform for Public Private Partnership Funding

## 1. Overview

**Partisipro** is a pioneering financial technology platform designed to bridge
the gap between public private partenrship (PPP) projects financing and retail
investors through blockchain technology. The project's core mission is to
tokenize large-scale Public-Private Partnership (PPP or KPBU) projects in
Indonesia, allowing for fractional ownership and creating a liquid secondary
market for these traditionally illiquid assets.

By representing investment in Real-World Assets (RWA) as digital tokens, this
platform aims to:

- **Democratize Investment**: Enable the general public to participate in
  funding strategic national infrastructure.
- **Enhance Liquidity**: Provide a secondary market for investors to trade their
  holdings.
- **Increase Transparency**: Utilize blockchain for transparent accounting of
  funds and automated profit distribution.
- **Improve Efficiency**: Automate complex processes like dividend payouts and
  governance through smart contracts.

The platform is designed with a hybrid on-chain/off-chain architecture to ensure
regulatory compliance, security, and a seamless user experience for non-crypto
native users.

---

## 2. Core Business Process

The platform facilitates the end-to-end lifecycle of a tokenized infrastructure
project:

1.  **Project Origination (Off-Chain)**: A government-approved Project Company
    (SPV) undergoes a due diligence process with the platform administrators.
2.  **Tokenization & Primary Offering (On-Chain & Off-Chain)**: The approved SPV
    uses the platform's secure dashboard to define the parameters of their
    project tokenization. The platform then deploys a unique set of smart
    contracts for this project. Retail investors purchase tokens during an
    Initial Offering Period via a compliant fiat (IDR) on-ramp.
3.  **Project Operation & Profit Distribution**: The SPV operates the
    infrastructure project (e.g., a toll road). Profits are deposited (in fiat)
    into the platform's system. The on-chain Treasury contract then calculates
    and allocates profit shares to token holders, who can claim their earnings.
4.  **Secondary Market Trading**: Investors can trade their project tokens on an
    integrated, established Decentralized Exchange (DEX), which is outside of
    this platform scope.
5.  **End of Concession & Final Buyback**: At the end of the project's
    concession period, a "burn-to-claim" mechanism is activated, allowing
    investors to exchange their tokens for a final buyback value in a
    transparent and orderly manner.

---

## 3. System Architecture

The system utilizes a hybrid architecture to leverage the strengths of both
off-chain systems and on-chain smart contracts. The master architectural diagram
is a **Cross-Functional Flowchart (Swimlane Diagram)** illustrating the
interaction between all actors.

### 3.1. Off-Chain Components

- **Frontend Platform (Web Application)**: A user-friendly interface built with
  NextJS and Tailwind for both investors and SPVs. It abstracts away blockchain
  complexity.
- **Backend Platform (API and Middleware)**: The central off-chain brain, built
  with NestJS and Firebase. It manages user data, integrates with third-party
  services, and securely constructs transactions to be signed by users.
- **Third-Party Integrations**:
  - **KYC Providers**: For mandatory user identity verification (e.g., Verihubs,
    Sumsub).
  - **Payment Gateway**: For compliant fiat (IDR) on-ramp and off-ramp.
  - **Semi-Custodial Wallet Providers**: For seamless user onboarding via
    email/social logins (e.g., Web3Auth, Privy).

### 3.2. On-Chain Components (Smart Contracts)

- The on-chain logic is modular, secure, and upgradable, deployed on an
  EVM-compatible Layer-2 network.

---

## 4. Smart Contract Ecosystem

The architecture is built on a set of core infrastructure contracts and
project-specific contracts deployed via a factory pattern.

### 4.1. Core Infrastructure Contracts

- `ProjectFactory.sol`: A singleton factory contract responsible for deploying a
  new, isolated set of contracts for each KPBU project.
- `PlatformRegistry.sol`: An on-chain access control list that manages addresses
  of whitelisted SPVs authorized to create projects.
- `PlatformTreasury.sol`: The platform's main treasury contract for collecting
  and managing platform revenue (e.g., listing fees).

### 4.2. Project-Specific Contract Set (Deployed per Project)

- `ProjectToken.sol`: The asset itself (ERC-20/ERC-721), representing fractional
  ownership of a specific project.
- `Offering.sol`: Manages the Initial Project Token Offering (the primary market
  sale).
- `Treasury.sol`: The project's dedicated vault. It receives funds, manages
  profit distribution, and facilitates the final buyback.
- `Governance.sol`: An on-chain governance module for proposal creation and
  voting by token holders.

---

## 5. Technology Stack & Programming Languages

- **Blockchain**: EVM-compatible Layer-2 (**Arbitrum**) for scalability and low
  transaction fees.
- **Smart Contracts**:
  - **Solidity** (Programming Language)
  - **OpenZeppelin Contracts**: For security standards and upgradability (UUPS
    Proxy Pattern).
  - **Hardhat**: Development, testing, and deployment framework.
- **Backend**:
  - **Node.js** with **TypeScript** (Programming Language)
  - **NestJS**: API framework.
  - **Ethers.js**: Library for blockchain interaction.
- **Frontend**:
  - **TypeScript** (Programming Language)
  - **Next.js**: UI framework.
  - **Tailwind**: UI CSS framework.
  - **Wagmi**: Hooks for wallet connectivity.
- **AI & Machine Learning (Future Features)**:
  - **Python** (Programming Language)
  - **TensorFlow / PyTorch**: For sentiment analysis and anomaly detection
    models.
  - **LLM APIs (e.g., Google AI Platform)**: For RAG-based chatbots and document
    summarization.

---

## 6. Key Features & Mechanisms

- **Modular & Upgradable Contracts**: Utilizes the factory and proxy patterns
  for security, isolation, and future-proof logic.
- **Compliant Fiat Gateway**: All investments and payouts are handled in fiat
  (IDR) via licensed payment gateways to comply with Indonesian currency laws.
- **Automated Distributions**: Profit distribution and final buyback mechanisms
  are calculated transparently on-chain and initiated by users via a "claim"
  model.
- **Integrated KYC Enforcement**: A mandatory, off-chain KYC process is enforced
  at the application layer before any investment activity is permitted.
- **Simplified User Onboarding**: Leverages semi-custodial wallets to allow
  mainstream users to sign up and interact with the platform using familiar Web2
  credentials like email or social accounts.
