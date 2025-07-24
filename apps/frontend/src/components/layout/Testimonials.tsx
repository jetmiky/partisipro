'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Star,
  Quote,
  Building,
  TrendingUp,
  Users,
  ArrowLeft,
  ArrowRight,
  Play,
  Award,
  CheckCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Testimonials = () => {
  const { t } = useTranslation('common');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const testimonials = [
    {
      name: t('testimonials.testimonial1.name'),
      role: t('testimonials.testimonial1.role'),
      company: 'Jakarta',
      image: '/placeholder-avatar.jpg',
      rating: 5,
      content: t('testimonials.testimonial1.text'),
      investment: 'IDR 50 juta',
      returns: '12.5%',
      duration: '18 bulan',
    },
    {
      name: 'Dr. Sarah Wijaya',
      role: 'Dokter & Investor',
      company: 'Surabaya',
      image: '/placeholder-avatar.jpg',
      rating: 5,
      content:
        'Sebagai profesional yang sibuk, saya menghargai kemudahan dan transparansi platform ini. Dashboard analytics membantu saya memantau investasi dengan mudah.',
      investment: 'IDR 100 juta',
      returns: '15.2%',
      duration: '24 bulan',
    },
    {
      name: 'Ahmad Rahman',
      role: 'Pengusaha',
      company: 'Bandung',
      image: '/placeholder-avatar.jpg',
      rating: 5,
      content:
        'Partisipro memberikan diversifikasi yang saya butuhkan. Investasi infrastruktur melalui blockchain memberikan likuiditas yang tidak tersedia di investasi tradisional.',
      investment: 'IDR 250 juta',
      returns: '18.7%',
      duration: '12 bulan',
    },
  ];

  const caseStudies = [
    {
      title: 'Proyek Jalan Tol Jakarta-Bandung',
      description: 'Tokenisasi pertama proyek infrastruktur skala besar',
      metrics: {
        totalValue: 'IDR 2.5 T',
        investors: '1,200+',
        returns: '14.8%',
        duration: '36 bulan',
      },
      status: 'Selesai',
      icon: Building,
    },
    {
      title: 'Pembangkit Listrik Tenaga Surya',
      description: 'Proyek energi terbarukan dengan teknologi terdepan',
      metrics: {
        totalValue: 'IDR 850 M',
        investors: '650+',
        returns: '16.2%',
        duration: '48 bulan',
      },
      status: 'Aktif',
      icon: TrendingUp,
    },
    {
      title: 'Sistem Transportasi Massal',
      description: 'Modernisasi transportasi publik Jakarta',
      metrics: {
        totalValue: 'IDR 1.8 T',
        investors: '2,100+',
        returns: '13.5%',
        duration: '60 bulan',
      },
      status: 'Pembangunan',
      icon: Users,
    },
  ];

  const trustIndicators = [
    {
      icon: Award,
      title: 'Penghargaan Fintech Terbaik',
      description: '2024 Indonesia Fintech Awards',
    },
    {
      icon: CheckCircle,
      title: '99.9% Uptime',
      description: 'Reliability platform tertinggi',
    },
    {
      icon: Users,
      title: '15,000+ Investor',
      description: 'Terpercaya ribuan investor',
    },
    {
      icon: TrendingUp,
      title: 'ROI Rata-rata 15.3%',
      description: 'Return on investment superior',
    },
  ];

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

  const nextTestimonial = () => {
    setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      prev => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="section bg-gradient-to-b from-white to-primary-50/30 overflow-safe"
    >
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-600 font-medium mb-4">
            <Star className="w-4 h-4 fill-current" />
            <span>{t('testimonials.title')}</span>
          </div>
          <h2 className="text-responsive-2xl font-bold text-foreground mb-6 text-indonesian-heading">
            Cerita Sukses
            <span className="block gradient-text-modern">
              Investor Partisipro
            </span>
          </h2>
          <p className="text-responsive-lg max-w-3xl mx-auto text-muted-foreground text-indonesian">
            {t('testimonials.subtitle')}
          </p>
        </div>

        {/* Main Testimonial Carousel */}
        <div className="mb-16 sm:mb-20">
          <div
            className={`transition-all duration-700 ${
              isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
            }`}
          >
            <div className="relative glass-testimonial rounded-2xl shadow-xl p-8 sm:p-12 max-w-4xl mx-auto">
              <div className="absolute top-6 left-6 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Quote className="w-6 h-6 text-primary-600" />
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Testimonial Content */}
                <div>
                  {/* Rating */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map(
                      (_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 text-yellow-400 fill-current"
                        />
                      )
                    )}
                  </div>

                  {/* Content */}
                  <blockquote className="text-responsive-lg text-contrast-glass mb-6 text-indonesian italic">
                    &ldquo;{testimonials[currentTestimonial].content}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="mb-6">
                    <div className="font-bold text-responsive-lg text-contrast-glass text-indonesian-heading">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-gray-600 text-responsive-sm">
                      {testimonials[currentTestimonial].role} •{' '}
                      {testimonials[currentTestimonial].company}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {testimonials.map((_, index) => (
                        <button
                          key={index}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentTestimonial
                              ? 'bg-primary-600'
                              : 'bg-secondary-300'
                          }`}
                          onClick={() => setCurrentTestimonial(index)}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={prevTestimonial}
                        className="w-10 h-10 bg-secondary-100 hover:bg-secondary-200 rounded-full flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextTestimonial}
                        className="w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Investment Stats */}
                <div className="glass-hero rounded-xl p-6">
                  <h4 className="font-bold text-contrast-glass mb-4 text-indonesian-heading">
                    Data Investasi
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-indonesian">
                        Total Investasi
                      </span>
                      <span className="font-bold text-primary-600">
                        {testimonials[currentTestimonial].investment}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-indonesian">
                        Return
                      </span>
                      <span className="font-bold text-success-600">
                        +{testimonials[currentTestimonial].returns}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-indonesian">
                        Durasi
                      </span>
                      <span className="font-bold text-gray-800">
                        {testimonials[currentTestimonial].duration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Case Studies */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-responsive-2xl font-bold text-foreground mb-4 text-indonesian-heading">
              Studi Kasus Proyek
            </h3>
            <p className="text-responsive-lg text-muted-foreground max-w-2xl mx-auto text-indonesian">
              Proyek-proyek infrastruktur yang telah berhasil dibiayai melalui
              platform Partisipro
            </p>
          </div>

          <div className="grid-responsive-3">
            {caseStudies.map((study, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isVisible
                    ? 'animate-slide-up opacity-100'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${300 + index * 150}ms` }}
              >
                <div className="card-modern card-modern-hover h-full group">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white">
                        <study.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground text-indonesian-heading">
                          {study.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              study.status === 'Selesai'
                                ? 'bg-success-500'
                                : study.status === 'Aktif'
                                  ? 'bg-primary-500'
                                  : 'bg-yellow-500'
                            }`}
                          ></div>
                          <span className="text-xs text-muted-foreground">
                            {study.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-6 text-responsive-sm text-indonesian">
                      {study.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-2xl font-bold text-primary-600">
                          {study.metrics.totalValue}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Nilai
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-success-600">
                          {study.metrics.investors}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Investor
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-financial-gold-600">
                          {study.metrics.returns}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ROI Tahunan
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-accent-600">
                          {study.metrics.duration}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Durasi
                        </div>
                      </div>
                    </div>

                    <button className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors">
                      <Play className="w-4 h-4" />
                      <span>Lihat Detail Proyek</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid-responsive-4">
          {trustIndicators.map((indicator, index) => (
            <div
              key={index}
              className={`transition-all duration-700 ${
                isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDelay: `${600 + index * 100}ms` }}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg mx-auto mb-4">
                  <indicator.icon className="w-6 h-6" />
                </div>
                <h4 className="text-responsive-lg font-semibold mb-2 text-indonesian-heading">
                  {indicator.title}
                </h4>
                <p className="text-muted-foreground text-responsive-sm text-indonesian">
                  {indicator.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
