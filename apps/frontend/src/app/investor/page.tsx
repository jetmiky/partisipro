'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  Clock,
  MessageCircle,
  Shield,
  CheckCircle,
  ArrowRight,
  FileCheck,
  Coins,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';

export default function SPVIndexPage() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  const steps = useMemo(
    () => [
      {
        icon: FileCheck,
        title: 'Daftar dan Verifikasi Akun',
        description:
          'Isi form profil data diri serta verifikasi identitas kependudukan investor.',
        details: [
          'Pendaftaran akun',
          'Profiling risiko investor',
          'Verifikasi data diri',
        ],
        color: 'from-primary-500 to-primary-600',
      },
      {
        icon: Coins,
        title: 'Jelajahi Proyek',
        description:
          'Jelajahi berbagai proyek PPP yang telah ditokenisasi pada platform Partisipro.',
        details: [
          'Tersedia berbagai jenis token PPP',
          'Simulasikan profit atau keuntungan',
          'Mulai dari Rp100.000',
        ],
        color: 'from-financial-gold-500 to-financial-gold-600',
      },
      {
        icon: TrendingUp,
        title: 'Pilih Proyek dan Mulai Investasi',
        description:
          'Pilih proyek sesuai preferensi atau rekomendasi AI Partisipro dan mulai berinvestasi.',
        details: [
          'Insight rekomendasi dari AI',
          'Aman dan transparan',
          'Available 24/7',
        ],
        color: 'from-success-500 to-success-600',
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
      icon: TrendingUp,
      title: 'Profit Kompetitif',
      description:
        'Imbal hasil yang kompetitif dengan distribusi kupon otomatis melalui smart contract.',
    },
    {
      icon: Clock,
      title: 'Pasar Sekunder',
      description:
        'Token bisa dijual kembali setiap saat sesuai keinginan melalui pasar sekunder (DEX).',
    },
    {
      icon: Lightbulb,
      title: 'AI Insights',
      description:
        'Dapatkan rekomendasi dari AI Partisipro sesuai dengan profil risiko dan preferensi investor.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-40 left-10"></div>
        <div className="fluid-shape-2 top-3/4 right-20"></div>
        <div className="fluid-shape-3 bottom-20 left-1/3"></div>
      </div>

      <Header dark />

      <main className="pt-20 relative z-10">
        {/* Hero Section */}
        <section className="gradient-brand-light py-16 md:py-24 relative">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-6">
                Investasi Proyek PPP
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Dukung pembangunan infrastruktur nasional sembari menikmati
                imbal hasil kupon rutin. Mulai investasi dalam kepemilikan
                proyek PPP dari Rp100.000 saja.
              </p>

              <div className="mb-8">
                <iframe
                  className="mx-auto"
                  width="560"
                  height="315"
                  src="https://www.youtube.com/embed/QI48Ka5uv28?si=W5E5xMyxHb_vVo2M"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link
                  href="/auth/signup"
                  className="btn-modern btn-modern-primary text-base py-4 px-6 sm:py-5 sm:px-8 min-w-[180px] sm:min-w-[200px] touch-target font-semibold hover-lift"
                >
                  Daftar sebagai Investor
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 glass-modern rounded-full px-4 py-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">Mudah dan Cepat</span>
                </div>
                <div className="flex items-center gap-2 glass-modern rounded-full px-4 py-2">
                  <Shield className="w-5 h-5 text-success-500" />
                  <span className="text-sm font-medium">
                    Data Aman & Terenkripsi
                  </span>
                </div>
                <div className="flex items-center gap-2 glass-modern rounded-full px-4 py-2">
                  <MessageCircle className="w-5 h-5 text-secondary-500" />
                  <span className="text-sm font-medium">
                    BI - OJK Compliance
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video */}
        {/* <section className="py-16 md:py-24">
          <div className="container">
            <div className="p-6 sm:p-8 md:p-12 mb-16 sm:mb-20">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="gradient-text-modern text-responsive-2xl font-bold mb-4 text-indonesian-heading">
                  Platform Demo Investasi Retail
                </h2>
              </div>

              <div>
                <video className="w-full" controls></video>
              </div>
            </div>
          </div>
        </section> */}

        <section
          id="how-it-works"
          ref={sectionRef}
          className="section bg-gradient-modern py-16 md:py-24"
        >
          <div className="container">
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="gradient-text-modern text-responsive-2xl mb-6 text-indonesian-heading">
                Langkah Praktis Investasi
              </h2>
              <p className="text-responsive-lg max-w-3xl mx-auto text-indonesian">
                Proses investasi pada berbagai proyek PPP dilakukan melalui
                Partisipro dengan mudah dan cepat.
              </p>
            </div>

            {/* Process Steps */}
            <div className="mb-16 sm:mb-20">
              <div className="grid-responsive-3">
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
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            {/* Benefits */}
            <div className="p-6 sm:p-8 md:p-12 mb-10 sm:mb-12">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="gradient-text-modern text-responsive-2xl font-bold mb-4 text-indonesian-heading">
                  Keuntungan Investasi Partisipro
                </h2>
                <p className="text-responsive-lg text-muted-foreground max-w-2xl mx-auto text-indonesian">
                  Platform kami menggabungkan yang terbaik dari investasi
                  pendanaan PPP tradisional dengan teknologi blockchain modern.
                </p>
              </div>

              <div className="grid-responsive-3">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="text-center transition-all duration-700"
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

            {/* CTA Buttons */}
            <div className="text-center pt-12 pb-6 sm:pt-16 sm:pb-12">
              <div className="transition-all duration-700">
                <h3 className="text-responsive-xl font-bold mb-4 text-indonesian-heading">
                  Mulai Investasi Sekarang
                </h3>
                <p className="text-responsive-md text-muted-foreground mb-6 max-w-xl mx-auto text-indonesian">
                  Raih peluang investasi berbagai proyek PPP dengan teknologi
                  blockchain terdepan dan kepatuhan penuh terhadap regulasi yang
                  berlaku.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/auth/signup"
                    className="btn-modern btn-modern-primary text-base py-4 px-6 sm:py-5 sm:px-8 min-w-[180px] sm:min-w-[200px] touch-target font-semibold hover-lift"
                  >
                    Daftar sebagai Investor
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
