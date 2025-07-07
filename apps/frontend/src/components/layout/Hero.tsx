'use client';

import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Users,
  ChevronDown,
} from 'lucide-react';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { value: '2.5M+', label: 'Total Nilai Infrastruktur', suffix: 'IDR' },
    { value: '15K+', label: 'Investor Aktif', suffix: '' },
    { value: '12', label: 'Proyek Aktif', suffix: '' },
    { value: '99.9%', label: 'Uptime Platform', suffix: '' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-safe">
      {/* Background */}
      <div className="absolute inset-0 gradient-modern-primary">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-800/30 to-secondary-900/50"></div>

        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-10 overflow-safe">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-64 md:h-64 bg-white rounded-full animate-float"></div>
          <div
            className="absolute top-3/4 right-1/4 w-32 h-32 md:w-48 md:h-48 bg-success-500 rounded-full animate-float"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-24 h-24 md:w-32 md:h-32 bg-financial-gold-400 rounded-full animate-float"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>
      </div>

      <div className="container relative z-10">
        <div className="text-center text-white overflow-safe-x">
          {/* Main Headline */}
          <div
            className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}
          >
            <h1 className="text-responsive-3xl font-bold text-indonesian-heading mb-6">
              Demokratisasi Investasi
              <span className="block gradient-text-modern">Infrastruktur</span>
              di Indonesia
            </h1>
          </div>

          {/* Subtitle */}
          <div
            className={`transition-all duration-1000 delay-300 ${isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-8'}`}
          >
            <p className="text-responsive-lg text-white/90 max-w-4xl mx-auto mb-8 text-indonesian content-width-full">
              Platform blockchain pertama untuk pendanaan Public Private
              Partnership, memungkinkan investor ritel berpartisipasi dalam
              proyek infrastruktur skala besar melalui kepemilikan pecahan yang
              tertoken.
            </p>
          </div>

          {/* Trust Indicators */}
          <div
            className={`transition-all duration-1000 delay-500 ${isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-8'}`}
          >
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-10 text-xs sm:text-sm md:text-base overflow-safe-x">
              <div className="flex items-center gap-2 glass-modern px-3 sm:px-4 py-2 rounded-full">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-success-400" />
                <span className="whitespace-nowrap">
                  Bank Indonesia Compliant
                </span>
              </div>
              <div className="flex items-center gap-2 glass-modern px-3 sm:px-4 py-2 rounded-full">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-financial-gold-400" />
                <span className="whitespace-nowrap">
                  IDR Stablecoin Terintegrasi
                </span>
              </div>
              <div className="flex items-center gap-2 glass-modern px-3 sm:px-4 py-2 rounded-full">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
                <span className="whitespace-nowrap">15K+ Investor Aktif</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div
            className={`transition-all duration-1000 delay-700 ${isVisible ? 'animate-scale-in' : 'opacity-0 scale-95'}`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 overflow-safe-x">
              <button className="btn-modern btn-modern-primary text-sm sm:text-base py-3 px-6 sm:py-4 sm:px-8 min-w-[180px] sm:min-w-[200px] touch-target">
                Jelajahi Proyek
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button className="btn-modern btn-modern-secondary text-sm sm:text-base py-3 px-6 sm:py-4 sm:px-8 min-w-[180px] sm:min-w-[200px] touch-target">
                Cara Kerja
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div
            className={`transition-all duration-1000 delay-900 ${isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-8'}`}
          >
            <div className="grid-responsive-4 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="glass-modern p-4 sm:p-6 rounded-2xl text-center interactive-mobile"
                  style={{ animationDelay: `${1.1 + index * 0.1}s` }}
                >
                  <div className="text-responsive-xl font-bold text-financial-gold-400 mb-2">
                    {stat.value}
                    <span className="text-xs sm:text-sm text-white/60">
                      {stat.suffix}
                    </span>
                  </div>
                  <div className="text-responsive-xs text-white/80 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-1200 ${isVisible ? 'animate-bounce' : 'opacity-0'} mobile-hidden`}
        >
          <div className="flex flex-col items-center text-white/60">
            <span className="text-sm mb-2">Gulir untuk menjelajahi</span>
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-safe mobile-hidden">
        <div
          className="absolute top-20 left-10 w-2 h-2 sm:w-3 sm:h-3 bg-financial-gold-400 rounded-full animate-pulse"
          style={{ animationDelay: '0s' }}
        ></div>
        <div
          className="absolute top-40 right-20 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-3 h-3 sm:w-4 sm:h-4 bg-success-400 rounded-full animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-2 h-2 sm:w-3 sm:h-3 bg-primary-400 rounded-full animate-pulse"
          style={{ animationDelay: '3s' }}
        ></div>
      </div>
    </section>
  );
};

export default Hero;
