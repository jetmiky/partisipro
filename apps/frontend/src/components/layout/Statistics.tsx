'use client';

import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Users,
  Building,
  Shield,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface StatisticProps {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  description: string;
  color: string;
  duration?: number;
}

const AnimatedCounter = ({
  value,
  suffix,
  duration = 2000,
}: {
  value: number;
  suffix: string;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOutCubic * value);

      setCount(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, value, duration]);

  return (
    <div
      ref={countRef}
      className="text-responsive-2xl font-bold text-financial-gold-400 mb-2 text-shadow"
    >
      {count.toLocaleString()}
      {suffix}
    </div>
  );
};

const Statistic = ({
  icon: Icon,
  value,
  suffix,
  label,
  description,
  color,
  duration,
}: StatisticProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const statRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (statRef.current) {
      observer.observe(statRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={statRef}
      className={`transition-all duration-700 ${
        isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="glass-feature text-center p-6 sm:p-8 rounded-2xl group card-modern-hover h-full">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white shadow-lg mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <AnimatedCounter value={value} suffix={suffix} duration={duration} />

        <div className="text-responsive-lg font-semibold mb-4 text-contrast-glass text-indonesian-heading text-shadow">
          {label}
        </div>

        <p className="text-gray-700 text-responsive-sm text-indonesian">
          {description}
        </p>
      </div>
    </div>
  );
};

const Statistics = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const statistics = [
    {
      icon: TrendingUp,
      value: 2500000000,
      suffix: '',
      label: 'Total Nilai Infrastruktur (IDR)',
      description:
        'Nilai gabungan dari semua proyek infrastruktur yang tersedia di platform kami',
      color: 'from-financial-gold-500 to-financial-gold-600',
      duration: 2500,
    },
    {
      icon: Users,
      value: 15420,
      suffix: '+',
      label: 'Investor Aktif',
      description:
        'Investor terverifikasi yang berpartisipasi dalam pendanaan infrastruktur PPP',
      color: 'from-primary-500 to-primary-600',
      duration: 2000,
    },
    {
      icon: Building,
      value: 12,
      suffix: '',
      label: 'Proyek Aktif',
      description:
        'Proyek infrastruktur yang saat ini tersedia untuk investasi',
      color: 'from-accent-500 to-accent-600',
      duration: 1500,
    },
    {
      icon: Shield,
      value: 99.9,
      suffix: '%',
      label: 'Waktu Aktif Platform',
      description:
        'Infrastruktur blockchain yang handal dengan keamanan tingkat enterprise',
      color: 'from-success-500 to-success-600',
      duration: 1800,
    },
  ];

  return (
    <section
      id="statistics"
      ref={sectionRef}
      className="section bg-gradient-to-b from-white to-secondary-50/50 overflow-safe"
    >
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-financial-gold-50 rounded-full text-financial-gold-600 font-medium mb-4">
            <BarChart3 className="w-4 h-4" />
            <span>Statistik Platform</span>
          </div>
          <h2 className="text-responsive-2xl font-bold text-foreground mb-6 text-indonesian-heading">
            Statistik Platform
            <span className="block gradient-text-modern">Partisipro</span>
          </h2>
          <p className="text-responsive-lg max-w-3xl mx-auto text-muted-foreground text-indonesian">
            Metrik real-time yang menunjukkan pertumbuhan dan kehandalan
            platform blockchain pendanaan PPP terdepan di Indonesia
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid-responsive-4 mb-16 sm:mb-20">
          {statistics.map((stat, index) => (
            <div
              key={index}
              style={{ animationDelay: `${index * 150}ms` }}
              className={`transition-all duration-700 ${
                isVisible
                  ? 'animate-slide-up opacity-100'
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <Statistic {...stat} />
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 sm:p-12 text-white bg-overlay-dark">
          <div className="text-center mb-8 sm:mb-12 relative z-10">
            <h3 className="text-responsive-2xl font-bold mb-4 text-indonesian-heading text-shadow-lg">
              Mengapa Angka Ini Penting?
            </h3>
            <p className="text-responsive-lg text-white/95 max-w-2xl mx-auto text-indonesian text-shadow">
              Platform kami telah mengubah cara Indonesia berinvestasi dalam
              infrastruktur
            </p>
          </div>

          <div className="grid-responsive-2 relative z-10">
            <div className="glass-hero p-6 sm:p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-financial-gold-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-responsive-lg font-bold text-indonesian-heading text-shadow">
                  Dampak Pasar
                </h4>
              </div>
              <p className="text-white/90 text-responsive-sm text-indonesian text-shadow-sm">
                Platform kami telah mendemokratisasi akses investasi
                infrastruktur, memungkinkan investor ritel berpartisipasi dalam
                proyek yang sebelumnya hanya tersedia untuk investor
                institusional.
              </p>
            </div>

            <div className="glass-hero p-6 sm:p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-success-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-responsive-lg font-bold text-indonesian-heading text-shadow">
                  Keunggulan Teknologi
                </h4>
              </div>
              <p className="text-white/90 text-responsive-sm text-indonesian text-shadow-sm">
                Dibangun di atas blockchain Arbitrum dengan keamanan tingkat
                enterprise, memastikan transaksi yang cepat, handal, dan
                berbiaya efektif untuk semua pengguna.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Statistics;
