'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  Lock,
  Eye,
  FileCheck,
  Award,
  CheckCircle,
  AlertTriangle,
  Globe,
  Building,
  Gavel,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const Security = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  const securityFeatures = useMemo(
    () => [
      {
        icon: Shield,
        title: 'Keamanan Blockchain',
        description:
          'Smart contract teraudit dan dibangun di atas Arbitrum untuk keamanan maksimal.',
        details: [
          'Audit smart contract berkala',
          'Multi-signature wallet',
          'Immutable transaction records',
        ],
        color: 'from-success-500 to-success-600',
      },
      {
        icon: FileCheck,
        title: 'Kepatuhan Bank Indonesia',
        description:
          'Sepenuhnya mematuhi regulasi Bank Indonesia dan menggunakan Project Garuda IDR Stablecoin.',
        details: [
          'Integrasi Project Garuda IDR',
          'Kepatuhan PBI (Peraturan BI)',
          'Laporan berkala ke regulator',
        ],
        color: 'from-primary-500 to-primary-600',
      },
      {
        icon: Eye,
        title: 'Transparansi Penuh',
        description:
          'Semua transaksi dan alur dana dapat diverifikasi secara real-time di blockchain.',
        details: [
          'Audit trail transparan',
          'Tracking dana real-time',
          'Laporan keuangan terbuka',
        ],
        color: 'from-financial-gold-500 to-financial-gold-600',
      },
      {
        icon: Lock,
        title: 'Proteksi Data',
        description:
          'Enkripsi tingkat enterprise untuk melindungi data pribadi dan transaksi investor.',
        details: [
          'Enkripsi end-to-end',
          'ISO 27001 compliance',
          'GDPR data protection',
        ],
        color: 'from-accent-500 to-accent-600',
      },
    ],
    []
  );

  const complianceItems = [
    {
      icon: Building,
      title: 'Bank Indonesia',
      description: 'Mematuhi Peraturan Bank Indonesia tentang Fintech',
      status: 'Aktif',
    },
    {
      icon: Gavel,
      title: 'Otoritas Jasa Keuangan',
      description: 'Terdaftar dan diawasi oleh OJK',
      status: 'Terdaftar',
    },
    {
      icon: Globe,
      title: 'Arbitrum Network',
      description: 'Infrastruktur blockchain yang diaudit',
      status: 'Terverifikasi',
    },
    {
      icon: Award,
      title: 'ISO 27001',
      description: 'Standar keamanan informasi internasional',
      status: 'Bersertifikat',
    },
  ];

  const riskDisclosures = [
    {
      title: 'Risiko Investasi',
      description:
        'Investasi infrastruktur memiliki risiko pasar dan operasional yang harus dipahami investor.',
    },
    {
      title: 'Risiko Teknologi',
      description:
        'Teknologi blockchain masih berkembang dan memiliki risiko teknis yang perlu dipertimbangkan.',
    },
    {
      title: 'Risiko Regulasi',
      description:
        'Perubahan regulasi dapat mempengaruhi operasional platform dan investasi.',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            securityFeatures.forEach((_, index) => {
              setTimeout(() => {
                setVisibleItems(prev => [...prev, index]);
              }, index * 200);
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
  }, [securityFeatures]);

  return (
    <section
      id="security"
      ref={sectionRef}
      className="section bg-gradient-to-b from-secondary-50/50 to-white overflow-safe"
    >
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success-50 rounded-full text-success-600 font-medium mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Keamanan & Kepatuhan</span>
          </div>
          <h2 className="text-responsive-2xl font-bold text-foreground mb-6 text-indonesian-heading">
            Investasi Aman dengan
            <span className="block gradient-text-modern">
              Kepatuhan Regulasi Penuh
            </span>
          </h2>
          <p className="text-responsive-lg max-w-3xl mx-auto text-muted-foreground text-indonesian">
            Platform kami dibangun dengan standar keamanan tertinggi dan
            mematuhi seluruh regulasi Bank Indonesia serta OJK untuk melindungi
            investasi Anda
          </p>
        </div>

        {/* Security Features */}
        <div className="grid-responsive-2 mb-16 sm:mb-20">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className={`transition-all duration-700 ${
                visibleItems.includes(index)
                  ? 'animate-slide-up opacity-100'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="card-modern card-modern-hover h-full group">
                <div className="p-6 sm:p-8">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>

                  <h3 className="text-responsive-lg font-bold mb-4 group-hover:text-primary-600 transition-colors text-indonesian-heading">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 text-responsive-sm text-indonesian">
                    {feature.description}
                  </p>

                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li
                        key={detailIndex}
                        className="flex items-center gap-2 text-responsive-xs"
                      >
                        <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
                        <span className="text-indonesian">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compliance Grid */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-responsive-2xl font-bold text-foreground mb-4 text-indonesian-heading">
              Sertifikasi & Kepatuhan
            </h3>
            <p className="text-responsive-lg text-muted-foreground max-w-2xl mx-auto text-indonesian">
              Partisipro beroperasi dengan lisensi dan sertifikasi dari
              regulator terpercaya
            </p>
          </div>

          <div className="grid-responsive-4">
            {complianceItems.map((item, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
                }`}
                style={{ transitionDelay: `${400 + index * 100}ms` }}
              >
                <div className="card-modern text-center p-6 group hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center text-white shadow-lg mx-auto mb-4">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h4 className="text-responsive-lg font-semibold mb-2 text-indonesian-heading">
                    {item.title}
                  </h4>
                  <p className="text-muted-foreground text-responsive-sm mb-3 text-indonesian">
                    {item.description}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-success-50 rounded-full text-success-600 font-medium text-xs">
                    <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Disclosure */}
        <div className="glass-feature rounded-2xl p-6 sm:p-8 mb-16 sm:mb-20 border-l-4 border-amber-500">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-responsive-2xl font-bold text-amber-900 mb-4 text-indonesian-heading text-shadow">
                Pengungkapan Risiko
              </h3>
              <p className="text-amber-800 text-responsive-lg text-indonesian font-medium">
                Sebagai platform investasi yang bertanggung jawab, kami
                mengungkapkan risiko-risiko berikut untuk memastikan Anda
                membuat keputusan investasi yang tepat:
              </p>
            </div>
          </div>

          <div className="grid-responsive-3">
            {riskDisclosures.map((risk, index) => (
              <div
                key={index}
                className={`bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200 hover:shadow-xl transition-all duration-300 ${
                  isVisible
                    ? 'animate-slide-up opacity-100'
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${600 + index * 100}ms` }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-600 font-bold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <h4 className="text-responsive-lg font-bold text-amber-900 text-indonesian-heading">
                    {risk.title}
                  </h4>
                </div>
                <p className="text-amber-800 text-responsive-sm text-indonesian leading-relaxed">
                  {risk.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-800 text-responsive-sm text-indonesian text-center font-medium">
              <strong>Catatan:</strong> Pastikan Anda memahami semua risiko
              sebelum berinvestasi. Konsultasikan dengan penasihat keuangan jika
              diperlukan.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div
            className={`transition-all duration-700 ${
              isVisible ? 'animate-scale-in opacity-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 sm:p-12 text-white bg-overlay-dark">
              <div className="text-center relative z-10">
                <h3 className="text-responsive-2xl font-bold mb-4 text-indonesian-heading text-shadow-lg">
                  Mulai Investasi dengan Aman
                </h3>
                <p className="text-responsive-lg text-white/95 mb-8 max-w-2xl mx-auto text-indonesian text-shadow">
                  Bergabunglah dengan ribuan investor yang sudah mempercayai
                  platform kami untuk investasi infrastruktur yang aman dan
                  transparan
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button className="btn-modern btn-modern-white touch-target">
                    Daftar Sekarang
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button className="btn-modern btn-modern-outline-white touch-target">
                    Baca Whitepaper
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;
