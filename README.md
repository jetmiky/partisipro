# Partisipro: A Blockchain-based Platform for Public-Private Partnership (PPP) Funding

> [\!TIP]
>
> ### Quick Links
>
> Current development progress can be accessed on these quick links.
>
> - Frontend Platform: [https://partisipro.id](https://partisipro.id)
> - API Documentation:
>   [https://api-docs.partisipro.id](https://api-docs.partisipro.id)
> - Smart Contracts Deployment:
>   [View in Section 4.1](#41-deployed-smart-contracts)
> - [Repository Structure](#repository-structure)

## 1. Overview

**Partisipro** adalah platform untuk _tokenisasi_ dan transaksi investasi proyek
**Public-Private Partnership (PPP)** atau Kerjasama Pemerintah dan Badan Usaha
(KPBU), yang menghubungkan investor institusi pemilik proyek PPP dengan
masyarakat investor ritel melalui _teknologi blockchain_.

Dengan merepresentasikan investasi pada _Real-World Assets_ (RWA) sebagai token
digital, platform ini bertujuan untuk:

- **Democratize Investment**: Memungkinkan masyarakat umum untuk berpartisipasi
  dalam pendanaan infrastruktur strategis nasional.
- **Enhance Liquidity**: Menyediakan pasar sekunder bagi investor untuk
  memperdagangkan kepemilikan mereka.
- **Increase Transparency**: Memanfaatkan blockchain untuk akuntansi dana yang
  transparan dan distribusi profit yang otomatis.
- **Improve Efficiency**: Mengotomatisasi proses kompleks seperti pembayaran
  dividen dan tata kelola melalui _smart contracts_.

Platform ini dirancang dengan arsitektur hybrid _on-chain/off-chain_ untuk
memastikan _compliance_ terhadap regulasi, keamanan, dan _user experience_ yang
_smooth_ bagi pengguna _non-crypto native_.

## Live Deployments

- **Frontend Platform**: [https://partisipro.id](https://partisipro.id)
- **API Documentation**:
  [https://api-docs.partisipro.id](https://api-docs.partisipro.id)

## Repository Structure

Repository ini merupakan _monorepo_ dengan Turborepo yang berisi tiga platform
utama:

- **Frontend Platform**: `/apps/frontend` - NextJS 15, React 19, Tailwind CSS 4
- **Backend Platform**: `/apps/backend` - API server NestJS dan Firebase
- **Smart Contracts**: `/packages/contracts` - _Smart contract_ Hardhat dan
  Solidity

Baik backend maupun _smart contract_ menyertakan _testing suite_ komprehensif.

---

## 2. Core Business Process

Platform ini memfasilitasi siklus hidup proyek infrastruktur yang ditokenisasi
dari awal hingga akhir:

1.  **Project Origination (Off-Chain)**: Sebuah _Project Company_ (_Special
    Purpose Vehicle_ atau SPV) yang disetujui pemerintah menjalani proses _due
    diligence_ dengan administrator platform.
2.  **Tokenization & Primary Offering (On-Chain & Off-Chain)**: SPV yang
    disetujui menggunakan dashboard platform untuk mendefinisikan parameter
    tokenisasi proyek mereka. Platform kemudian melakukan _deployment_
    serangkaian _smart contract_ yang unik untuk proyek ini. Investor ritel
    membeli token selama _Initial Offering Period_ melalui _fiat (IDR) on-ramp_
    yang _compliant_.
3.  **Project Operation & Profit Distribution**: SPV mengoperasikan proyek
    infrastruktur (misalnya, jalan tol). Profit disetorkan (dalam bentuk fiat)
    ke dalam sistem platform. Kontrak _Treasury on-chain_ kemudian menghitung
    dan mengalokasikan porsi profit kepada pemegang token, yang dapat mengklaim
    pendapatan mereka.
4.  **Secondary Market Trading**: Investor dapat memperdagangkan token proyek
    mereka di _Decentralized Exchange (DEX)_ yang sudah mature dan terintegrasi,
    yang berada di luar cakupan platform ini.
5.  **End of Concession & Final Buyback**: Di akhir periode konsesi proyek,
    mekanisme _"burn-to-claim"_ diaktifkan, yang memungkinkan investor untuk
    menukarkan token mereka dengan nilai _buyback_ final secara transparan dan
    teratur.

---

## 3. System Architecture

Sistem ini menggunakan arsitektur hybrid untuk memanfaatkan kekuatan sistem
_off-chain_ dan _smart contract on-chain_. Diagram arsitektur utama adalah
**Cross-Functional Flowchart (Swimlane Diagram)** yang mengilustrasikan
interaksi antara semua aktor.

### 3.1. Off-Chain Components

- **Frontend Platform (Web Application)**: _Interface_ ramah pengguna yang
  dibangun dengan _framework_ NextJS dan Tailwind untuk investor dan SPV,
  membantu abstraksi kompleksitas blockchain.
- **Backend Platform (API and Middleware)**: _Central off-chain brain_, dibangun
  dengan NestJS dan Firebase, mengelola data pengguna, terintegrasi dengan
  layanan pihak ketiga, dan secara aman menyusun transaksi untuk ditandatangani
  oleh pengguna.
- **Third-Party Integrations**:
  - **KYC Providers**: Untuk verifikasi identitas pengguna yang wajib (misalnya,
    Verihubs, Sumsub).
  - **Payment Gateway**: Untuk _fiat (IDR) on-ramp_ dan _off-ramp_ yang
    _compliant_.
  - **Semi-Custodial Wallet Providers**: Untuk _onboarding_ pengguna yang smooth
    melalui login email/sosial (Web3Auth).

### 3.2. On-Chain Components (Smart Contracts)

- Logika _on-chain_ bersifat modular, aman, dan _upgradable_, di-_deploy_ di
  jaringan Layer-2 yang EVM-compatible (Arbitrum).

---

## 4\. Smart Contract Ecosystem

Arsitektur ini dibangun di atas serangkaian _core infrastructure contracts_ dan
kontrak spesifik proyek yang di-_deploy_ via _factory pattern_ menggunakan
standar revolusioner **ERC-3643 (T-REX)** untuk _compliance_ yang berfokus pada
identitas.

### 4.1. Deployed Smart Contracts

- **Network**: Arbitrum Sepolia Testnet (Chain ID: 421614)
- **Block Explorer**: [https://sepolia.arbiscan.io](https://sepolia.arbiscan.io)

#### Core Infrastructure Contracts

_Backbone platform, yang mengelola proyek, fee, dan deployment._

- **PlatformRegistry**:
  [`0xc27bDcdeA460de9A76f759e785521a5cb834B7a1`](<https://www.google.com/search?q=%5Bhttps://sepolia.arbiscan.io/address/0xc27bDcdeA460de9A76f759e785521a5cb834B7a1%5D(https://sepolia.arbiscan.io/address/0xc27bDcdeA460de9A76f759e785521a5cb834B7a1)>) -
  Otorisasi & konfigurasi SPV
- **PlatformTreasury**:
  [`0x53ab91a863B79824c4243EB258Ce9F23a0fAB89A`](<https://www.google.com/search?q=%5Bhttps://sepolia.arbiscan.io/address/0x53ab91a863B79824c4243EB258Ce9F23a0fAB89A%5D(https://sepolia.arbiscan.io/address/0x53ab91a863B79824c4243EB258Ce9F23a0fAB89A)>) -
  Pengumpulan _fee_ platform
- **ProjectFactory**:
  [`0xC3abeE18DCfE502b38d0657dAc04Af8a746913D1`](<https://www.google.com/search?q=%5Bhttps://sepolia.arbiscan.io/address/0xC3abeE18DCfE502b38d0657dAc04Af8a746913D1%5D(https://sepolia.arbiscan.io/address/0xC3abeE18DCfE502b38d0657dAc04Af8a746913D1)>) -
  _Deployment_ kontrak proyek

#### ERC-3643 Compliance Infrastructure

_Memastikan hanya pengguna terverifikasi KYC yang dapat berpartisipasi, sehingga
hanya perlu verifikasi satu kali untuk berinvestasi pada semua proyek._

- **ClaimTopicsRegistry**:
  [`0x2DbA5D6bdb79Aa318cB74300D62F54e7baB949f6`](<https://www.google.com/search?q=%5Bhttps://sepolia.arbiscan.io/address/0x2DbA5D6bdb79Aa318cB74300D62F54e7baB949f6%5D(https://sepolia.arbiscan.io/address/0x2DbA5D6bdb79Aa318cB74300D62F54e7baB949f6)>) -
  _Standard claim types_
- **TrustedIssuersRegistry**:
  [`0x812aA860f141D48E6c294AFD7ad6437a17051235`](<https://www.google.com/search?q=%5Bhttps://sepolia.arbiscan.io/address/0x812aA860f141D48E6c294AFD7ad6437a17051235%5D(https://sepolia.arbiscan.io/address/0x812aA860f141D48E6c294AFD7ad6437a17051235)>) -
  _Authorized KYC providers_
- **IdentityRegistry**:
  [`0x7f7ae1E07EedfEeeDd7A96ECA67dce85fe2A84eA`](<https://www.google.com/search?q=%5Bhttps://sepolia.arbiscan.io/address/0x7f7ae1E07EedfEeeDd7A96ECA67dce85fe2A84eA%5D(https://sepolia.arbiscan.io/address/0x7f7ae1E07EedfEeeDd7A96ECA67dce85fe2A84eA)>) -
  _Central identity management_

#### Project Contract Templates

_Reusable blueprints yang digunakan oleh Factory untuk meluncurkan proyek PPP
baru di platform._

- **ProjectToken**:
  [`0x1f8Fb3846541571a5E3ed05f311d4695f02dc8Cd`](<https://www.google.com/search?q=%5Bhttps://sepolia.arbiscan.io/address/0x1f8Fb3846541571a5E3ed05f311d4695f02dc8Cd%5D(https://sepolia.arbiscan.io/address/0x1f8Fb3846541571a5E3ed05f311d4695f02dc8Cd)>) -
  Token yang _compliant_ ERC-3643
- **ProjectOffering**:
  [`0x445b8Aa90eA5d2E80916Bc0f8ACc150d9b91634F`](<https://www.google.com/search?q=%5Bhttps://sepolia.arbiscan.io/address/0x445b8Aa90eA5d2E80916Bc0f8ACc150d9b91634F%5D(https://sepolia.arbiscan.io/address/0x445b8Aa90eA5d2E80916Bc0f8ACc150d9b91634F)>) -
  _Identity-verified token sales_
- **ProjectTreasury**:
  [`0x6662D1f5103dB37Cb72dE44b016c240167c44c35`](<https://www.google.com/search?q=%5Bhttps://sepolia.arbiscan.io/address/0x6662D1f5103dB37Cb72dE44b016c240167c44c35%5D(https://sepolia.arbiscan.io/address/0x6662D1f5103dB37Cb72dE44b016c240167c44c35)>) -
  Distribusi _profit_ spesifik proyek
- **ProjectGovernance**:
  [`0x1abd0E1e64258450e8F74f43Bc1cC47bfE6Efa23`](<https://www.google.com/search?q=%5Bhttps://sepolia.arbiscan.io/address/0x1abd0E1e64258450e8F74f43Bc1cC47bfE6Efa23%5D(https://sepolia.arbiscan.io/address/0x1abd0E1e64258450e8F74f43Bc1cC47bfE6Efa23)>) -
  _Token-weighted voting system_

### 4.2. ERC-3643 Identity-Centric Innovation

Platform ini mengimplementasikan standar **ERC-3643 (T-REX)**, menyediakan
**one-time KYC** yang revolusioner untuk partisipasi investasi di seluruh
proyek:

- **Before (ERC-20)**: Diperlukan verifikasi KYC untuk setiap proyek.
- **After (Tambahan ERC-3643)**: Verifikasi identitas satu kali untuk semua
  proyek di platform.
- **Impact**: Meningkatkan _user experience_ dan _regulatory compliance_.

---

## 5\. Technology Stack & Programming Languages

- **Blockchain**: EVM-compatible Layer-2 (**Arbitrum**) untuk skalabilitas dan
  _transaction fee_ yang rendah.
- **Smart Contracts**:
  - **Solidity** (Programming Language)
  - **OpenZeppelin Contracts**: Untuk standar keamanan dan _upgradability_ (UUPS
    Proxy Pattern).
  - **Hardhat**: _Framework_ untuk development, testing, dan deployment.
- **Backend**:
  - **Node.js** dengan **TypeScript** (Programming Language)
  - **NestJS**: _Framework_ API.
  - **Ethers.js**: _Library_ untuk interaksi blockchain.
- **Frontend**:
  - **TypeScript** (Programming Language)
  - **Next.js**: UI _framework_.
  - **Tailwind**: UI CSS _framework_.
  - **Wagmi**: _Hooks_ untuk konektivitas _wallet_.
- **AI & Machine Learning (Separate Code Repository)**:
  - **Python** (Programming Language)
  - **TensorFlow / PyTorch**: Untuk model analisis sentimen dan deteksi anomali.
  - **LLM APIs (e.g., Google AI Platform)**: Untuk RAG-based _chatbots_ dan
    peringkasan dokumen.

---

## 6\. Key Features & Mechanisms

- **Modular & Upgradable Contracts**: Memanfaatkan _factory_ dan _proxy
  patterns_ untuk keamanan, isolasi, dan logika yang _future-proof_.
- **Compliant Fiat Gateway**: Semua investasi dan pembayaran ditangani dalam
  fiat (IDR) melalui _payment gateway_ berlisensi untuk mematuhi hukum Rupiah
  Indonesia.
- **Automated Distributions**: Mekanisme distribusi profit dan _final buyback_
  dihitung secara transparan secara _on-chain_ dan diinisiasi oleh pengguna via
  model "klaim" (_pull model_).
- **Integrated KYC Enforcement**: Proses verifikasi KYC _off-chain_ yang wajib
  dilakukan di _application layer_ sebelum memulai aktivitas investasi.
- **Simplified User Onboarding**: Memanfaatkan _semi-custodial wallet_ untuk
  pengguna umum mendaftar dan berinteraksi dengan platform menggunakan
  credential Web2 yang umum digunakan seperti email atau akun sosial.
