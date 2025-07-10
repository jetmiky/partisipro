'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Shield,
  Users,
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  Building,
  FileText,
  Wallet,
  DollarSign,
  Lock,
  Globe,
  Zap,
  Eye,
  Award,
  MessageCircle,
} from 'lucide-react';

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<'investor' | 'spv' | 'admin'>(
    'investor'
  );
  const [activeStep, setActiveStep] = useState(0);

  const investorSteps = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Daftar & Verifikasi',
      description: 'Daftar dengan email/sosial media dan selesaikan KYC',
      details: [
        'Login dengan Web3Auth (email/Google/social)',
        'Verifikasi identitas dengan KYC provider',
        'Whitelist wallet address otomatis',
        'Akses penuh ke platform',
      ],
      duration: '5-15 menit',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Jelajahi Proyek',
      description: 'Browse marketplace dan pilih proyek infrastruktur',
      details: [
        'Lihat daftar proyek PPP yang tersedia',
        'Analisis detail proyek dan risiko',
        'Baca dokumen legal dan kontrak',
        'Gunakan AI assistant untuk analisis',
      ],
      duration: '10-30 menit',
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Investasi IDR',
      description: 'Investasi dengan Rupiah melalui payment gateway',
      details: [
        'Pilih jumlah investasi dalam IDR',
        'Bayar melalui payment gateway terpercaya',
        'Sistem generates authorization voucher',
        'Token otomatis mint ke wallet Anda',
      ],
      duration: '2-5 menit',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Kelola Portfolio',
      description: 'Monitor investasi dan performa proyek',
      details: [
        'Dashboard portfolio real-time',
        'Tracking performa dan ROI',
        'Notifikasi distribusi keuntungan',
        'Analytics dan reporting',
      ],
      duration: 'Ongoing',
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: 'Claim Keuntungan',
      description: 'Terima pembagian keuntungan secara otomatis',
      details: [
        'SPV deposit keuntungan ke Treasury',
        'Smart contract hitung pembagian',
        'Klaim keuntungan dalam IDR',
        'Transfer langsung ke rekening bank',
      ],
      duration: '1-2 menit',
    },
  ];

  const spvSteps = [
    {
      icon: <Building className="w-8 h-8" />,
      title: 'Aplikasi SPV',
      description: 'Submit proposal proyek untuk due diligence',
      details: [
        'Siapkan dokumentasi proyek lengkap',
        'Submit ke Platform Administrator',
        'Proses due diligence dan evaluasi',
        'Approval dan whitelist multi-sig wallet',
      ],
      duration: '2-4 minggu',
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Tokenisasi Proyek',
      description: 'Buat parameter tokenisasi dan deploy smart contracts',
      details: [
        'Login dengan multi-signature wallet',
        'Isi form parameter tokenisasi',
        'Smart contract deployment otomatis',
        'Project listing di marketplace',
      ],
      duration: '1-2 hari',
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Fundraising',
      description: 'Initial offering periode untuk investor',
      details: [
        'Marketing dan promosi proyek',
        'Investor beli token selama offering',
        'Funds terkumpul di escrow',
        'Finalisasi offering dan fund transfer',
      ],
      duration: '2-12 minggu',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Operasi Proyek',
      description: 'Jalankan proyek infrastruktur',
      details: [
        'Konstruksi dan implementasi',
        'Operasional dan maintenance',
        'Generate revenue dari proyek',
        'Periodic reporting ke investor',
      ],
      duration: '5-30 tahun',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Distribusi Keuntungan',
      description: 'Deposit keuntungan untuk investor',
      details: [
        'Deposit profit dalam IDR',
        'Platform verifikasi dan record',
        'Smart contract calculate shares',
        'Investor claim keuntungan',
      ],
      duration: 'Bulanan/Quarterly',
    },
  ];

  const adminSteps = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'SPV Approval',
      description: 'Evaluasi dan approve aplikasi SPV',
      details: [
        'Review dokumentasi proyek',
        'Due diligence dan risk assessment',
        'Whitelist SPV multi-sig wallet',
        'Grant project creation privileges',
      ],
      duration: '1-3 minggu',
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: 'Project Oversight',
      description: 'Monitor dan supervisi semua proyek',
      details: [
        'Real-time project monitoring',
        'Compliance dan regulatory check',
        'Risk management dan mitigation',
        'Intervention tools bila diperlukan',
      ],
      duration: 'Ongoing',
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Fee Management',
      description: 'Kelola fee platform dan revenue',
      details: [
        'Set platform fees (listing, management)',
        'Collect revenue dari Treasury',
        'Revenue tracking dan analytics',
        'Fee optimization dan adjustment',
      ],
      duration: 'Monthly',
    },
  ];

  const getCurrentSteps = () => {
    switch (activeTab) {
      case 'investor':
        return investorSteps;
      case 'spv':
        return spvSteps;
      case 'admin':
        return adminSteps;
      default:
        return investorSteps;
    }
  };

  const blockchainFeatures = [
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Keamanan Tingkat Enterprise',
      description:
        'Multi-signature wallets dan smart contracts yang telah diaudit',
      details: [
        'OpenZeppelin security standards',
        'Multi-sig wallet untuk admin functions',
        'Upgradeable proxy pattern',
        'Regular security audits',
      ],
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: 'Transparansi Penuh',
      description: 'Semua transaksi dan distribusi tercatat di blockchain',
      details: [
        'Immutable transaction records',
        'Real-time profit distribution',
        'Open source smart contracts',
        'Public audit trail',
      ],
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Arbitrum Network',
      description: 'Layer-2 Ethereum untuk transaksi cepat dan murah',
      details: [
        'Gas fees sangat rendah',
        'Transaksi instant confirmation',
        'Ethereum security inheritance',
        'Scalable infrastructure',
      ],
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Regulasi Compliant',
      description: 'Patuh regulasi Bank Indonesia dan standar internasional',
      details: [
        'Bank Indonesia approved',
        'KYC/AML compliance',
        'Project Garuda IDR integration',
        'Legal framework compliance',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16 md:py-24">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
                Cara Kerja Platform
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                Memahami proses investasi infrastruktur melalui teknologi
                blockchain yang aman dan transparan
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <CheckCircle className="w-5 h-5 text-success-500" />
                  <span className="text-sm font-medium">Proses Sederhana</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <Shield className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">Aman & Transparan</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <Clock className="w-5 h-5 text-secondary-500" />
                  <span className="text-sm font-medium">
                    Mulai dalam 5 Menit
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Journey Tabs */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Pilih Peran Anda
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Setiap pengguna memiliki journey yang berbeda dalam platform
                Partisipro
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setActiveTab('investor');
                    setActiveStep(0);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === 'investor'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Users className="w-5 h-5 inline mr-2" />
                  Investor
                </button>
                <button
                  onClick={() => {
                    setActiveTab('spv');
                    setActiveStep(0);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === 'spv'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Building className="w-5 h-5 inline mr-2" />
                  SPV/Proyek
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin');
                    setActiveStep(0);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === 'admin'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Shield className="w-5 h-5 inline mr-2" />
                  Admin
                </button>
              </div>
            </div>

            {/* Process Steps */}
            <div className="max-w-6xl mx-auto">
              {/* Timeline */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                  {getCurrentSteps().map((step, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center relative"
                    >
                      <button
                        onClick={() => setActiveStep(index)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                          activeStep === index
                            ? 'bg-primary-500 text-white shadow-lg scale-110'
                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                        }`}
                      >
                        {step.icon}
                      </button>
                      <div className="text-center mt-3">
                        <div
                          className={`text-sm font-medium ${
                            activeStep === index
                              ? 'text-primary-600'
                              : 'text-gray-600'
                          }`}
                        >
                          Step {index + 1}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {step.duration}
                        </div>
                      </div>
                      {index < getCurrentSteps().length - 1 && (
                        <div className="absolute top-8 left-16 w-full h-0.5 bg-gray-200 hidden lg:block">
                          <div
                            className={`h-full transition-all duration-500 ${
                              activeStep > index
                                ? 'bg-primary-500'
                                : 'bg-gray-200'
                            }`}
                            style={{
                              width: activeStep > index ? '100%' : '0%',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Step Details */}
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="feature-icon mb-6">
                      {getCurrentSteps()[activeStep].icon}
                    </div>
                    <h3 className="text-3xl font-bold mb-4">
                      {getCurrentSteps()[activeStep].title}
                    </h3>
                    <p className="text-xl text-muted-foreground mb-6">
                      {getCurrentSteps()[activeStep].description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-primary-600 mb-6">
                      <Clock className="w-4 h-4" />
                      <span>
                        Estimasi waktu: {getCurrentSteps()[activeStep].duration}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Detail Proses:</h4>
                    <ul className="space-y-3">
                      {getCurrentSteps()[activeStep].details.map(
                        (detail, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">
                              {detail}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blockchain Technology */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Teknologi Blockchain
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Platform dibangun dengan teknologi blockchain terdepan untuk
                keamanan dan transparansi maksimal
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {blockchainFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="feature-icon mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Flow Diagram */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Alur Investasi End-to-End
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Dari pendaftaran hingga penarikan keuntungan, semua proses
                terintegrasi dalam satu platform
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {/* On-Chain Process */}
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold mb-6 text-primary-800">
                    On-Chain Process
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                      <span className="text-sm">Smart Contract Deployment</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                      <span className="text-sm">Token Minting</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                      <span className="text-sm">Profit Distribution</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">4</span>
                      </div>
                      <span className="text-sm">Governance Voting</span>
                    </div>
                  </div>
                </div>

                {/* Off-Chain Process */}
                <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold mb-6 text-secondary-800">
                    Off-Chain Process
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                      <span className="text-sm">KYC Verification</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                      <span className="text-sm">IDR Payment Gateway</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                      <span className="text-sm">Project Due Diligence</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">4</span>
                      </div>
                      <span className="text-sm">Bank Account Settlement</span>
                    </div>
                  </div>
                </div>

                {/* Integration Layer */}
                <div className="bg-gradient-to-br from-success-50 to-support-100 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold mb-6 text-success-800">
                    Integration Layer
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                      <span className="text-sm">Web3Auth SDK</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                      <span className="text-sm">Authorization Voucher</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                      <span className="text-sm">Event Monitoring</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">4</span>
                      </div>
                      <span className="text-sm">Real-time Sync</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Pertanyaan Umum
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Jawaban untuk pertanyaan yang sering diajukan tentang cara kerja
                platform
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold mb-3">
                  Apakah saya perlu memahami blockchain?
                </h3>
                <p className="text-muted-foreground">
                  Tidak! Platform dirancang untuk user yang tidak familiar
                  dengan crypto. Semua kompleksitas blockchain tersembunyi di
                  balik interface yang sederhana.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold mb-3">
                  Bagaimana keamanan dana saya?
                </h3>
                <p className="text-muted-foreground">
                  Dana Anda dilindungi oleh smart contracts yang telah diaudit,
                  multi-signature wallets, dan regulasi Bank Indonesia yang
                  ketat.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold mb-3">
                  Berapa minimum investasi?
                </h3>
                <p className="text-muted-foreground">
                  Minimum investasi mulai dari IDR 1 juta, memungkinkan
                  partisipasi investor retail dalam proyek infrastruktur besar.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold mb-3">
                  Kapan saya bisa menarik keuntungan?
                </h3>
                <p className="text-muted-foreground">
                  Keuntungan didistribusikan secara periodik sesuai dengan
                  jadwal proyek, umumnya quarterly atau semi-annual.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Siap Memulai Journey Investasi Anda?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Bergabunglah dengan platform investasi infrastruktur terdepan di
              Indonesia. Mulai dengan verifikasi KYC yang mudah dan cepat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-light btn-lg">
                <Users className="w-5 h-5" />
                Mulai Investasi
              </button>
              <button className="btn btn-outline-light btn-lg">
                <MessageCircle className="w-5 h-5" />
                Konsultasi Gratis
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
