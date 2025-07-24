'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileCheck,
  Coins,
  Building,
  TrendingUp,
  RefreshCw,
  Shield,
  Users,
  ArrowRight,
  MonitorCheck,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

const HowItWorks = () => {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  const steps = useMemo(
    () => [
      {
        icon: FileCheck,
        title: 'Originasi Proyek',
        description:
          'SPV proyek PPP (investor institusi) diseleksi dan diverifikasi oleh tim Partisipro.',
        details: [
          'Validasi kerangka hukum',
          'Analisis kelayakan finansial',
          'Verifikasi kepatuhan regulasi',
        ],
        color: 'from-primary-500 to-primary-600',
      },
      {
        icon: Coins,
        title: 'Tokenisasi Proyek',
        description:
          'Proyek diubah menjadi token digital menggunakan smart contract berbasis ERC-20 dan ERC-3643.',
        details: [
          'Token Proyek ERC-20 dan ERC-3643',
          'Deployment smart contract',
          'Struktur kepemilikan pecahan',
        ],
        color: 'from-financial-gold-500 to-financial-gold-600',
      },
      {
        icon: TrendingUp,
        title: 'Distribusi Token ke Publik',
        description:
          'Token proyek dijual kepada publik melalui off-chain dan dicatat pada on-chain.',
        details: [
          'Harga initial offering',
          'Investasi mulai dari Rp100.000',
          'Disertai proses verifikasi KYC',
        ],
        color: 'from-success-500 to-success-600',
      },
      {
        icon: RefreshCw,
        title: 'Operasi & Kupon Investasi',
        description:
          'Investor ritel menerima kupon otomatis dan dapat menjual token di pasar sekunder.',
        details: [
          'Distribusi imbal hasil via smart contract',
          'Likuiditas pasar sekunder',
          'Token diperdagangkan melalui DEX',
        ],
        color: 'from-accent-500 to-accent-600',
      },
    ],
    []
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Animate steps one by one
            steps.forEach((_, index) => {
              setTimeout(() => {
                setVisibleSteps(prev => [...prev, index]);
              }, index * 200);
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [steps]);

  const benefits = [
    {
      icon: Building,
      title: 'Solusi Investor Institusi',
      description:
        'Dapat mencairkan kepemilikan proyek PPP lebih awal, tanpa menunggu masa operasional selesai, tanpa gangguan terhadap struktur PPP.',
    },
    {
      icon: Users,
      title: 'Solusi Investor Retail',
      description:
        'Dapat berinvestasi dalam proyek KBPU secara terjangkau mulai dari Rp100.000,00 dengan transparansi penuh, kupon teratur, dan real-time 24/7.',
    },
    {
      icon: MonitorCheck,
      title: 'Diferensiasi Teknologi',
      description:
        'Didukung smart contract dan AI Agents untuk konsultasi dan rekomendasi proyek berbasis profil risiko investasi.',
    },
    {
      icon: Shield,
      title: 'Keamanan dan Regulasi',
      description:
        'Dibangun di atas blockchain Arbitrum (cepat, aman) serta terdaftar dan diawasi BI & OJK.',
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="section bg-gradient-modern overflow-safe"
    >
      <div className="container">
        {/* Key Benefits */}
        <div className="p-6 sm:p-8 md:p-12 mb-16 sm:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="gradient-text-modern text-responsive-2xl font-bold mb-4 text-indonesian-heading">
              Mengapa Memilih Partisipro?
            </h2>
            <p className="text-responsive-lg text-muted-foreground max-w-3xl mx-auto text-indonesian">
              Partisipro adalah platform tokenisasi dan transaksi investasi
              proyek Public-Private Partnership (PPP) atau Kerjasama Pemerintah
              dan Badan Usaha (KPBU), yang menghubungkan investor institusi
              pemilik proyek PPP dengan masyarakat investor ritel melalui
              teknologi blockchain.
            </p>
          </div>

          <div className="grid-responsive-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-700 ${
                  visibleSteps.length > 0
                    ? 'animate-fade-in opacity-100'
                    : 'opacity-0'
                }`}
                style={{ transitionDelay: `${800 + index * 150}ms` }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg mx-auto mb-4">
                  <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="text-responsive-lg font-semibold mb-3 text-indonesian-heading">
                  {benefit.title}
                </h4>
                <p className="text-muted-foreground text-responsive-sm text-indonesian">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="gradient-text-modern text-responsive-2xl mb-6 text-indonesian-heading">
            Cara Kerja Partisipro
          </h2>
          <p className="text-responsive-lg max-w-3xl mx-auto text-indonesian">
            Memahami proses pendanaan PPP berbasis blockchain: dari originasi
            proyek hingga pengembalian investasi
          </p>
        </div>

        {/* Process Steps */}
        <div className="mb-16 sm:mb-20">
          <div className="grid-responsive-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  visibleSteps.includes(index)
                    ? 'animate-slide-up opacity-100'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="card-modern card-modern-hover h-full group">
                  <div className="p-4 sm:p-6">
                    {/* Step Number & Icon */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div
                          className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200`}
                        >
                          <step.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-responsive-lg font-semibold mb-3 group-hover:text-primary-600 transition-colors text-indonesian-heading">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 text-responsive-sm text-indonesian">
                      {step.description}
                    </p>

                    {/* Details List */}
                    <ul className="space-responsive-sm">
                      {step.details.map((detail, detailIndex) => (
                        <li
                          key={detailIndex}
                          className="flex items-center gap-2 text-responsive-xs"
                        >
                          <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
                          <span className="text-indonesian">{detail}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Arrow for non-last items */}
                    {index < steps.length - 1 && (
                      <div className="desktop-only absolute -right-4 top-1/2 transform -translate-y-1/2 text-primary-300">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center pt-12 pb-6 sm:pt-16 sm:pb-12">
          <div
            className={`transition-all duration-700 ${
              visibleSteps.length > 2
                ? 'animate-scale-in opacity-100'
                : 'opacity-0 scale-95'
            }`}
          >
            <h3 className="text-responsive-xl font-bold mb-4 text-indonesian-heading">
              Siap Memulai Investasi?
            </h3>
            <p className="text-responsive-lg text-muted-foreground mb-6 max-w-xl mx-auto text-indonesian">
              Bergabunglah dengan ribuan investor yang sudah berpartisipasi
              dalam pembangunan infrastruktur Indonesia.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="btn-modern btn-modern-primary text-base py-4 px-6 sm:py-5 sm:px-8 min-w-[180px] sm:min-w-[200px] touch-target font-semibold hover-lift"
              >
                Daftar sebagai Investor
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>

              <Link
                href="/spv/apply"
                className="btn-modern btn-modern-primary text-base py-4 px-6 sm:py-5 sm:px-8 min-w-[180px] sm:min-w-[200px] touch-target font-semibold hover-lift"
              >
                Daftar sebagai SPV
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
