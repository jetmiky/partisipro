'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Home,
  AlertTriangle,
  HelpCircle,
  Layers,
  Bug,
  ArrowRight,
} from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const Error = ({ error, reset }: ErrorProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Log error to monitoring service
    // TODO: Replace with proper error logging service
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Application error:', error);
    }
  }, [error]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      reset();
    }, 1000);
  };

  const troubleshootingSteps = [
    {
      icon: RefreshCw,
      title: 'Muat Ulang Halaman',
      description: 'Coba muat ulang halaman untuk mengatasi masalah sementara',
      action: 'Muat Ulang',
      onClick: handleRetry,
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: Home,
      title: 'Kembali ke Beranda',
      description: 'Mulai dari awal dengan kembali ke halaman utama',
      action: 'Ke Beranda',
      href: '/',
      color: 'from-success-500 to-success-600',
    },
    {
      icon: HelpCircle,
      title: 'Hubungi Support',
      description: 'Tim teknis kami siap membantu mengatasi masalah ini',
      action: 'Hubungi Support',
      href: '/contact',
      color: 'from-financial-gold-500 to-financial-gold-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-64 md:h-64 bg-red-100 rounded-full animate-float opacity-20"></div>
        <div
          className="absolute top-3/4 right-1/4 w-32 h-32 md:w-48 md:h-48 bg-orange-100 rounded-full animate-float opacity-20"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-24 h-24 md:w-32 md:h-32 bg-amber-100 rounded-full animate-float opacity-20"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      <div className="container relative z-10 px-6 sm:px-8 lg:py-10 lg:px-12">
        <div className="text-center max-w-4xl mx-auto">
          {/* Error Icon */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'animate-scale-in opacity-100' : 'opacity-0 scale-75'
            }`}
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-4xl flex items-center justify-center text-white shadow-2xl mx-auto mb-8">
              <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
          </div>

          {/* Error Code */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
            }`}
          >
            <h1 className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-4">
              500
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
              Terjadi Kesalahan Server
            </h2>
            <p className="text-responsive-md text-muted-foreground mb-8 max-w-2xl mx-auto text-indonesian">
              Maaf, terjadi kesalahan internal pada server kami. Tim teknis
              sudah diberitahu dan sedang menangani masalah ini. Silakan coba
              lagi dalam beberapa saat.
            </p>
          </div>

          {/* Error Details */}
          {process.env.NODE_ENV === 'development' && error.digest && (
            <div
              className={`transition-all duration-1000 delay-500 ${
                isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
              }`}
            >
              <div className="glass-feature p-4 rounded-lg mb-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    Error ID:
                  </span>
                </div>
                <code className="text-xs text-gray-600 break-all">
                  {error.digest}
                </code>
              </div>
            </div>
          )}

          {/* Troubleshooting Steps */}
          <div
            className={`transition-all duration-1000 delay-600 ${
              isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
            }`}
          >
            <div className="grid-responsive-3 max-w-4xl mx-auto mb-12">
              {troubleshootingSteps.map((step, index) => (
                <div
                  key={index}
                  className={`glass-feature p-6 rounded-xl text-center group card-modern-hover transition-all duration-300 ${
                    isVisible
                      ? 'animate-slide-up opacity-100'
                      : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${800 + index * 100}ms` }}
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white shadow-lg mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-responsive-base font-semibold mb-2 text-contrast-glass text-indonesian-heading">
                    {step.title}
                  </h4>
                  <p className="text-gray-700 text-responsive-sm text-indonesian mb-4">
                    {step.description}
                  </p>
                  {step.onClick ? (
                    <button
                      onClick={step.onClick}
                      disabled={isRetrying}
                      className={`btn-modern ${
                        index === 0
                          ? 'btn-modern-primary'
                          : 'btn-modern-secondary'
                      } touch-target w-full ${isRetrying ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isRetrying && index === 0 ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Memuat...
                        </>
                      ) : (
                        <>
                          {step.action}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={step.href!}
                      className={`btn-modern ${
                        index === 1
                          ? 'btn-modern-primary'
                          : 'btn-modern-secondary'
                      } touch-target w-full inline-flex items-center justify-center gap-2`}
                    >
                      {step.action}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Brand Footer */}
          <div
            className={`transition-all duration-1000 delay-1200 ${
              isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="text-indonesian">
                Partisipro - Platform investasi infrastruktur terpercaya
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden mobile-hidden">
        <div
          className="absolute top-20 left-10 w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full animate-pulse"
          style={{ animationDelay: '0s' }}
        ></div>
        <div
          className="absolute top-40 right-20 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-3 h-3 sm:w-4 sm:h-4 bg-amber-400 rounded-full animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-2 h-2 sm:w-3 sm:h-3 bg-red-300 rounded-full animate-pulse"
          style={{ animationDelay: '3s' }}
        ></div>
      </div>
    </div>
  );
};

export default Error;
