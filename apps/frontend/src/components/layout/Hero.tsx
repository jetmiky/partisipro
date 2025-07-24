'use client';

import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Shield,
  Users,
  // ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-brand-hero">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-700/20 to-primary-800/30"></div>

        {/* Fluid Organic Shapes */}
        <div className="absolute inset-0 opacity-20 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-64 md:h-64 bg-white rounded-full animate-float blur-sm"></div>
          <div
            className="absolute top-3/4 right-1/4 w-32 h-32 md:w-48 md:h-48 bg-white/80 rounded-full animate-float blur-sm"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-24 h-24 md:w-32 md:h-32 bg-white/60 rounded-full animate-float blur-sm"
            style={{ animationDelay: '2s' }}
          ></div>
          <div
            className="absolute top-16 right-16 w-20 h-20 md:w-28 md:h-28 bg-white/40 rounded-full animate-float blur-sm"
            style={{ animationDelay: '3s' }}
          ></div>
        </div>
      </div>

      <div className="container relative z-10 px-6 sm:px-8 lg:py-40 lg:pb-20 lg:px-12">
        <div className="text-center text-white max-w-6xl mx-auto">
          {/* Main Headline */}
          <div
            className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-indonesian-heading mb-8 leading-tight">
              <span className="block animate-fade-in-up animate-delay-100">
                {t('hero.title')}
              </span>
              <span className="block bg-gradient-to-r from-financial-gold-400 via-financial-gold-300 to-success-400 bg-clip-text text-transparent animate-fade-in-up animate-delay-300">
                {t('hero.titleHighlight')}
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <div
            className={`transition-all duration-1000 delay-300 ${isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-8'}`}
          >
            <p className="text-base sm:text-xl text-white/95 max-w-4xl mx-auto mb-10 text-indonesian font-medium leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Video */}
          <div className="mb-10">
            <iframe
              className="mx-auto"
              width="560"
              height="315"
              src="https://www.youtube.com/embed/GfK_ttGq6Y8?si=yuEZr5m6XVGOZwM0"
              title="Partisipro"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {/* CTA Buttons */}
        <div
          className={`transition-all duration-1000 delay-700 ${isVisible ? 'animate-zoom-in' : 'opacity-0 scale-95'}`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-14">
            <Link
              href="/spv"
              className="btn-modern glass-hero text-white border-2 border-white/30 hover:border-white/50 text-base sm:text-lg py-4 px-6 sm:py-5 sm:px-8 min-w-[180px] sm:min-w-[200px] touch-target font-semibold hover-lift transition-all duration-300"
            >
              {t('hero.ctaTokenize')}
            </Link>
            <Link
              href="/investor"
              className="btn-modern btn-modern-primary text-base sm:text-lg py-4 px-6 sm:py-5 sm:px-8 min-w-[180px] sm:min-w-[200px] touch-target font-semibold hover-lift"
            >
              {t('hero.ctaInvest')}
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
          </div>
        </div>

        {/* Trust Indicators */}
        <div
          className={`transition-all duration-1000 delay-500 ${isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}
        >
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-12 text-sm sm:text-base">
            <div className="flex items-center gap-3 glass-hero px-4 sm:px-6 py-3 rounded-full hover-lift animate-fade-in-up animate-delay-700">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-success-400" />
              <span className="whitespace-nowrap text-white font-medium">
                {t('hero.trustIndicator1')}
              </span>
            </div>
            <div className="flex items-center gap-3 glass-hero px-4 sm:px-6 py-3 rounded-full hover-lift animate-fade-in-up animate-delay-1000">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-success-400" />
              <span className="whitespace-nowrap text-white font-medium">
                {t('hero.trustIndicator2')}
              </span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        {/* <div
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-1200 ${isVisible ? 'animate-bounce' : 'opacity-0'} mobile-hidden`}
        >
          <div className="flex flex-col items-center text-white/70">
            <span className="text-sm mb-2">Scroll untuk menjelajahi</span>
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </div>
        </div> */}
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
