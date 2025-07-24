'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Coins,
  Shield,
  TrendingUp,
  Users,
  Zap,
  FileText,
  Lock,
  Globe,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Features = () => {
  const { t } = useTranslation('common');
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  const features = useMemo(
    () => [
      {
        icon: Coins,
        title: t('features.blockchain.title'),
        description: t('features.blockchain.description'),
        details: [
          'Token ERC-20 berbasis smart contract',
          'Kepemilikan fraksional transparan',
          'Likuiditas pasar sekunder',
        ],
        color: 'from-financial-gold-500 to-financial-gold-600',
      },
      {
        icon: Shield,
        title: t('features.compliance.title'),
        description: t('features.compliance.description'),
        details: [
          'Integrasi Project Garuda IDR',
          'Kepatuhan regulasi penuh',
          'Audit keamanan berkala',
        ],
        color: 'from-success-500 to-success-600',
      },
      {
        icon: TrendingUp,
        title: t('features.access.title'),
        description: t('features.access.description'),
        details: [
          'Investasi minimum rendah',
          'Akses 24/7 ke platform',
          'Diversifikasi portofolio mudah',
        ],
        color: 'from-primary-500 to-primary-600',
      },
      {
        icon: BarChart3,
        title: t('features.returns.title'),
        description: t('features.returns.description'),
        details: [
          'Tracking kinerja real-time',
          'Laporan transparan',
          'Analisis pasar mendalam',
        ],
        color: 'from-accent-500 to-accent-600',
      },
      {
        icon: Zap,
        title: 'Teknologi Arbitrum',
        description:
          'Dibangun di atas blockchain Arbitrum untuk transaksi cepat, aman, dan berbiaya rendah.',
        details: [
          'Transaksi cepat & murah',
          'Keamanan tingkat enterprise',
          'Skalabilitas optimal',
        ],
        color: 'from-primary-600 to-primary-700',
      },
      {
        icon: FileText,
        title: 'Transparansi Penuh',
        description:
          'Semua transaksi, distribusi keuntungan, dan laporan proyek tersedia secara transparan di blockchain.',
        details: [
          'Audit trail lengkap',
          'Pelaporan otomatis',
          'Verifikasi blockchain',
        ],
        color: 'from-secondary-600 to-secondary-700',
      },
    ],
    [t]
  );

  const keyBenefits = [
    {
      icon: Users,
      title: 'Komunitas Investor',
      description: '15,000+ investor aktif',
    },
    {
      icon: Lock,
      title: 'Keamanan Terjamin',
      description: 'Smart contract teraudit',
    },
    {
      icon: Globe,
      title: 'Akses Global',
      description: 'Platform 24/7 tersedia',
    },
    {
      icon: Sparkles,
      title: 'Inovasi Berkelanjutan',
      description: 'Fitur baru setiap kuartal',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleFeatures(prev => [...prev, index]);
              }, index * 150);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [features]);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="section bg-gradient-to-b from-white to-secondary-50/50 overflow-safe"
    >
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-600 font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>{t('features.title')}</span>
          </div>
          <h2 className="text-responsive-2xl font-bold text-foreground mb-6 text-indonesian-heading">
            Platform Investasi Infrastruktur
            <span className="block gradient-text-modern">Paling Canggih</span>
          </h2>
          <p className="text-responsive-lg max-w-3xl mx-auto text-muted-foreground text-indonesian">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid-responsive-3 mb-16 sm:mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`transition-all duration-700 ${
                visibleFeatures.includes(index)
                  ? 'animate-slide-up opacity-100'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="glass-feature card-modern-hover h-full group">
                <div className="p-6 sm:p-8">
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>

                  {/* Content */}
                  <h3 className="text-responsive-lg font-bold mb-4 group-hover:text-primary-600 transition-colors text-indonesian-heading text-contrast-glass">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 mb-6 text-responsive-sm text-indonesian">
                    {feature.description}
                  </p>

                  {/* Details List */}
                  <ul className="space-y-2 mb-6">
                    {feature.details.map((detail, detailIndex) => (
                      <li
                        key={detailIndex}
                        className="flex items-center gap-2 text-responsive-xs"
                      >
                        <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
                        <span className="text-indonesian text-gray-600">
                          {detail}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Learn More Link */}
                  <button className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors group-hover:gap-3">
                    <span>Pelajari Lebih Lanjut</span>
                    <ArrowRight className="w-4 h-4 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Benefits */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 sm:p-12 text-white bg-overlay-dark">
          <div className="text-center mb-8 sm:mb-12 relative z-10">
            <h3 className="text-responsive-2xl font-bold mb-4 text-indonesian-heading text-shadow-lg">
              Mengapa Partisipro Terdepan?
            </h3>
            <p className="text-responsive-lg text-white/95 max-w-2xl mx-auto text-indonesian text-shadow">
              Bergabunglah dengan platform investasi infrastruktur yang telah
              dipercaya ribuan investor di Indonesia
            </p>
          </div>

          <div className="grid-responsive-4 relative z-10">
            {keyBenefits.map((benefit, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-700 ${
                  visibleFeatures.length > 3
                    ? 'animate-fade-in opacity-100'
                    : 'opacity-0'
                }`}
                style={{ transitionDelay: `${600 + index * 150}ms` }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 glass-hero rounded-xl flex items-center justify-center text-white shadow-lg mx-auto mb-4">
                  <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="text-responsive-lg font-semibold mb-2 text-indonesian-heading text-shadow">
                  {benefit.title}
                </h4>
                <p className="text-white/90 text-responsive-sm text-indonesian text-shadow-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12 sm:mt-16">
          <div
            className={`transition-all duration-700 ${
              visibleFeatures.length > 4
                ? 'animate-scale-in opacity-100'
                : 'opacity-0 scale-95'
            }`}
          >
            <h3 className="text-responsive-xl font-bold mb-4 text-indonesian-heading">
              Mulai Investasi Hari Ini
            </h3>
            <p className="text-responsive-lg text-muted-foreground mb-6 max-w-xl mx-auto text-indonesian">
              Raih peluang investasi infrastruktur dengan teknologi blockchain
              terdepan dan kepatuhan regulasi penuh
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="btn-modern btn-modern-primary touch-target">
                Mulai Investasi
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button className="btn-modern btn-modern-secondary touch-target">
                Lihat Demo Platform
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
