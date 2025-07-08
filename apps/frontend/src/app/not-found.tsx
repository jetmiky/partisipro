'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  ArrowLeft,
  Search,
  HelpCircle,
  Layers,
  AlertCircle,
} from 'lucide-react';

const NotFound = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const quickLinks = [
    {
      icon: Home,
      title: 'Beranda',
      description: 'Kembali ke halaman utama',
      href: '/',
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: Search,
      title: 'Jelajahi Proyek',
      description: 'Lihat proyek infrastruktur tersedia',
      href: '/projects',
      color: 'from-financial-gold-500 to-financial-gold-600',
    },
    {
      icon: HelpCircle,
      title: 'Pusat Bantuan',
      description: 'Temukan jawaban pertanyaan Anda',
      href: '/help',
      color: 'from-success-500 to-success-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 to-white flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-64 md:h-64 bg-primary-100 rounded-full animate-float opacity-20"></div>
        <div
          className="absolute top-3/4 right-1/4 w-32 h-32 md:w-48 md:h-48 bg-financial-gold-100 rounded-full animate-float opacity-20"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-24 h-24 md:w-32 md:h-32 bg-success-100 rounded-full animate-float opacity-20"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      <div className="container relative z-10 px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-4xl mx-auto">
          {/* Error Icon */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'animate-scale-in opacity-100' : 'opacity-0 scale-75'
            }`}
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white shadow-2xl mx-auto mb-8">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
          </div>

          {/* Error Code */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
            }`}
          >
            <h1 className="text-8xl sm:text-9xl font-bold text-gradient-modern mb-4">
              404
            </h1>
          </div>

          {/* Error Message */}
          <div
            className={`transition-all duration-1000 delay-400 ${
              isVisible
                ? 'animate-slide-up opacity-100'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-responsive-2xl font-bold text-foreground mb-6 text-indonesian-heading">
              Halaman Tidak Ditemukan
            </h2>
            <p className="text-responsive-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-indonesian">
              Maaf, halaman yang Anda cari tidak dapat ditemukan. Halaman
              mungkin telah dipindahkan, dihapus, atau URL yang Anda masukkan
              salah.
            </p>
          </div>

          {/* Action Buttons */}
          <div
            className={`transition-all duration-1000 delay-600 ${
              isVisible
                ? 'animate-slide-up opacity-100'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/"
                className="btn-modern btn-modern-primary touch-target"
              >
                <ArrowLeft className="w-5 h-5" />
                Kembali ke Beranda
              </Link>
              <Link
                href="/projects"
                className="btn-modern btn-modern-secondary touch-target"
              >
                Jelajahi Proyek
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div
            className={`transition-all duration-1000 delay-800 ${
              isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
            }`}
          >
            <h3 className="text-responsive-lg font-semibold text-foreground mb-6 text-indonesian-heading">
              Atau coba halaman lain:
            </h3>
            <div className="grid-responsive-3 max-w-3xl mx-auto">
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className={`glass-feature p-6 rounded-xl text-center group card-modern-hover transition-all duration-300 ${
                    isVisible
                      ? 'animate-slide-up opacity-100'
                      : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${1000 + index * 100}ms` }}
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${link.color} rounded-xl flex items-center justify-center text-white shadow-lg mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <link.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-responsive-base font-semibold mb-2 text-contrast-glass text-indonesian-heading">
                    {link.title}
                  </h4>
                  <p className="text-gray-700 text-responsive-sm text-indonesian">
                    {link.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Brand Footer */}
          <div
            className={`mt-16 transition-all duration-1000 delay-1200 ${
              isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="text-indonesian">
                Kembali ke platform investasi infrastruktur terdepan di
                Indonesia
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden mobile-hidden">
        <div
          className="absolute top-20 left-10 w-2 h-2 sm:w-3 sm:h-3 bg-primary-400 rounded-full animate-pulse"
          style={{ animationDelay: '0s' }}
        ></div>
        <div
          className="absolute top-40 right-20 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-financial-gold-400 rounded-full animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-3 h-3 sm:w-4 sm:h-4 bg-success-400 rounded-full animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-2 h-2 sm:w-3 sm:h-3 bg-accent-400 rounded-full animate-pulse"
          style={{ animationDelay: '3s' }}
        ></div>
      </div>
    </div>
  );
};

export default NotFound;
