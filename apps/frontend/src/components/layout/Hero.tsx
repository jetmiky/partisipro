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
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-modern-primary">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-800/30 to-secondary-900/50"></div>

        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-10 overflow-hidden">
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

      <div className="container relative z-10 px-6 sm:px-8 lg:px-12">
        <div className="text-center text-white max-w-6xl mx-auto">
          {/* Main Headline */}
          <div
            className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-indonesian-heading mb-8 leading-tight">
              <span className="block text-shadow-dark">
                Demokratisasi Investasi
              </span>
              <span className="block bg-gradient-to-r from-financial-gold-400 via-financial-gold-300 to-success-400 bg-clip-text text-transparent drop-shadow-lg">
                Infrastruktur
              </span>
              <span className="block text-shadow-dark">di Indonesia</span>
            </h1>
          </div>

          {/* Subtitle */}
          <div
            className={`transition-all duration-1000 delay-300 ${isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-8'}`}
          >
            <p className="text-lg sm:text-xl md:text-2xl text-white/95 max-w-4xl mx-auto mb-10 text-indonesian text-shadow font-medium leading-relaxed">
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
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-12 text-sm sm:text-base">
              <div className="flex items-center gap-3 glass-hero px-4 sm:px-6 py-3 rounded-full">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-success-400" />
                <span className="whitespace-nowrap text-white font-medium text-shadow">
                  Bank Indonesia Compliant
                </span>
              </div>
              <div className="flex items-center gap-3 glass-hero px-4 sm:px-6 py-3 rounded-full">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-financial-gold-400" />
                <span className="whitespace-nowrap text-white font-medium text-shadow">
                  IDR Stablecoin Terintegrasi
                </span>
              </div>
              <div className="flex items-center gap-3 glass-hero px-4 sm:px-6 py-3 rounded-full">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
                <span className="whitespace-nowrap text-white font-medium text-shadow">
                  15K+ Investor Aktif
                </span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div
            className={`transition-all duration-1000 delay-700 ${isVisible ? 'animate-scale-in' : 'opacity-0 scale-95'}`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-14 overflow-safe-x">
              <button className="btn-modern btn-modern-primary text-base sm:text-lg py-4 px-8 sm:py-5 sm:px-10 min-w-[200px] sm:min-w-[240px] touch-target font-semibold">
                Jelajahi Proyek
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button className="btn-modern btn-modern-secondary text-base sm:text-lg py-4 px-8 sm:py-5 sm:px-10 min-w-[200px] sm:min-w-[240px] touch-target font-semibold">
                Cara Kerja
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div
            className={`transition-all duration-1000 delay-900 ${isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-8'}`}
          >
            <div className="grid-responsive-4 max-w-6xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="glass-hero p-6 sm:p-8 rounded-2xl text-center interactive-mobile card-modern-hover"
                  style={{ animationDelay: `${1.1 + index * 0.1}s` }}
                >
                  <div className="text-2xl sm:text-3xl font-bold text-financial-gold-400 mb-3 text-shadow">
                    {stat.value}
                    <span className="text-sm sm:text-base text-white/80 text-shadow-sm">
                      {stat.suffix}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base text-white/95 font-medium text-shadow">
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
          <div className="flex flex-col items-center text-white/70 text-shadow-sm">
            <span className="text-sm mb-2">Gulir untuk menjelajahi</span>
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden mobile-hidden">
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
