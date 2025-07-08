'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Shield,
  Coins,
  TrendingUp,
  FileText,
  Clock,
  Users,
  ArrowRight,
} from 'lucide-react';

const FAQ = () => {
  const [openItems, setOpenItems] = useState<number[]>([0]);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const faqCategories = [
    {
      icon: HelpCircle,
      title: 'Umum',
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: Shield,
      title: 'Keamanan',
      color: 'from-success-500 to-success-600',
    },
    {
      icon: Coins,
      title: 'Investasi',
      color: 'from-financial-gold-500 to-financial-gold-600',
    },
    {
      icon: FileText,
      title: 'Legal',
      color: 'from-accent-500 to-accent-600',
    },
  ];

  const faqs = [
    {
      category: 'Umum',
      question: 'Apa itu Partisipro dan bagaimana cara kerjanya?',
      answer:
        'Partisipro adalah platform blockchain yang memungkinkan investor ritel berpartisipasi dalam proyek infrastruktur PPP (Public Private Partnership) melalui tokenisasi. Platform kami mengubah proyek infrastruktur menjadi token digital yang dapat diperdagangkan, memberikan akses investasi yang sebelumnya hanya tersedia untuk investor institusional.',
    },
    {
      category: 'Umum',
      question: 'Mengapa saya harus berinvestasi melalui Partisipro?',
      answer:
        'Partisipro menawarkan akses demokratis ke investasi infrastruktur dengan minimum investasi rendah, transparansi penuh melalui blockchain, kepatuhan regulasi Bank Indonesia, dan potensi return yang menarik dari proyek-proyek infrastruktur strategis Indonesia.',
    },
    {
      category: 'Keamanan',
      question: 'Seberapa aman investasi saya di platform ini?',
      answer:
        'Keamanan adalah prioritas utama kami. Platform Partisipro dibangun dengan smart contract yang telah diaudit, menggunakan blockchain Arbitrum yang aman, mematuhi regulasi Bank Indonesia, dan mengintegrasikan Project Garuda IDR Stablecoin untuk kepatuhan penuh.',
    },
    {
      category: 'Keamanan',
      question: 'Bagaimana data pribadi saya dilindungi?',
      answer:
        'Kami menggunakan enkripsi tingkat enterprise, mematuhi standar ISO 27001, dan menerapkan protokol keamanan berlapis. Data pribadi Anda disimpan sesuai dengan regulasi perlindungan data Indonesia dan tidak pernah dibagikan tanpa persetujuan.',
    },
    {
      category: 'Investasi',
      question: 'Berapa minimum investasi yang diperlukan?',
      answer:
        'Minimum investasi dimulai dari IDR 1 juta, memungkinkan investor retail untuk berpartisipasi dalam proyek infrastruktur skala besar. Tidak ada maksimum investasi, namun terdapat batas sesuai regulasi KYC untuk perlindungan investor.',
    },
    {
      category: 'Investasi',
      question: 'Bagaimana cara saya mendapatkan keuntungan?',
      answer:
        'Keuntungan diperoleh melalui dua cara: (1) Distribusi keuntungan berkala dari operasional proyek infrastruktur, dan (2) Potensi capital gain dari perdagangan token di pasar sekunder. Semua distribusi dilakukan otomatis melalui smart contract.',
    },
    {
      category: 'Investasi',
      question: 'Bisakah saya menjual investasi saya sebelum proyek selesai?',
      answer:
        'Ya, token Anda dapat diperdagangkan di pasar sekunder yang terintegrasi dengan platform kami. Ini memberikan likuiditas yang tidak tersedia di investasi infrastruktur tradisional. Namun, harga token dapat berfluktuasi sesuai kondisi pasar.',
    },
    {
      category: 'Legal',
      question: 'Apakah Partisipro memiliki izin resmi?',
      answer:
        'Ya, Partisipro beroperasi dengan izin dari regulator yang berwenang dan mematuhi seluruh regulasi Bank Indonesia serta OJK. Kami juga terdaftar sebagai penyelenggara fintech dan menggunakan Project Garuda IDR Stablecoin untuk kepatuhan penuh.',
    },
    {
      category: 'Legal',
      question: 'Bagaimana aspek pajak dari investasi ini?',
      answer:
        'Keuntungan dari investasi melalui Partisipro tunduk pada regulasi pajak Indonesia yang berlaku. Kami menyediakan laporan yang diperlukan untuk pelaporan pajak Anda. Disarankan untuk berkonsultasi dengan konsultan pajak untuk advice yang spesifik.',
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

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  const filterFAQs = (category: string) => {
    return faqs.filter(faq => faq.category === category);
  };

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="section bg-gradient-to-b from-primary-50/30 to-white overflow-safe"
    >
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-600 font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            <span>Pertanyaan Umum</span>
          </div>
          <h2 className="text-responsive-2xl font-bold text-foreground mb-6 text-indonesian-heading">
            Ada Pertanyaan?
            <span className="block gradient-text-modern">
              Kami Punya Jawabannya
            </span>
          </h2>
          <p className="text-responsive-lg max-w-3xl mx-auto text-muted-foreground text-indonesian">
            Temukan jawaban untuk pertanyaan yang paling sering diajukan tentang
            investasi infrastruktur blockchain melalui Partisipro
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div
              className={`transition-all duration-700 ${
                isVisible ? 'animate-slide-right opacity-100' : 'opacity-0'
              }`}
            >
              <h3 className="text-responsive-lg font-bold mb-6 text-indonesian-heading">
                Kategori
              </h3>
              <div className="space-y-3">
                {faqCategories.map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 glass-card rounded-xl border border-white/30 hover:border-primary-300 transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center text-white`}
                    >
                      <category.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-contrast-glass text-indonesian-heading">
                        {category.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {filterFAQs(category.title).length} pertanyaan
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div
              className={`transition-all duration-700 ${
                isVisible ? 'animate-slide-left opacity-100' : 'opacity-0'
              }`}
            >
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="glass-faq rounded-xl border border-white/30 overflow-hidden transition-all duration-300 hover:shadow-md"
                  >
                    <button
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-secondary-50 transition-colors"
                      onClick={() => toggleItem(index)}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-xs font-medium text-primary-600">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-contrast-glass mb-1 text-responsive-base text-indonesian-heading">
                            {faq.question}
                          </h4>
                          <div className="text-xs text-primary-600 font-medium">
                            {faq.category}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {openItems.includes(index) ? (
                          <ChevronUp className="w-5 h-5 text-secondary-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-secondary-600" />
                        )}
                      </div>
                    </button>

                    {openItems.includes(index) && (
                      <div className="px-6 pb-6 animate-slide-down">
                        <div className="pl-10 border-l-2 border-primary-100">
                          <p className="text-gray-700 text-responsive-sm leading-relaxed text-indonesian">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 sm:mt-20">
          <div
            className={`transition-all duration-700 ${
              isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
            }`}
          >
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 sm:p-12 text-white bg-overlay-dark">
              <div className="text-center mb-8 relative z-10">
                <h3 className="text-responsive-2xl font-bold mb-4 text-indonesian-heading text-shadow-lg">
                  Masih Ada Pertanyaan?
                </h3>
                <p className="text-responsive-lg text-white/95 max-w-2xl mx-auto text-indonesian text-shadow">
                  Tim customer support kami siap membantu Anda 24/7
                </p>
              </div>

              <div className="grid-responsive-4 mb-8 relative z-10">
                <div className="text-center">
                  <div className="w-12 h-12 glass-hero rounded-xl flex items-center justify-center text-white mx-auto mb-3">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold mb-1 text-shadow">
                    24/7
                  </div>
                  <div className="text-white/90 text-sm text-shadow-sm">
                    Dukungan Pelanggan
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 glass-hero rounded-xl flex items-center justify-center text-white mx-auto mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold mb-1 text-shadow">
                    15K+
                  </div>
                  <div className="text-white/90 text-sm text-shadow-sm">
                    Investor Puas
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 glass-hero rounded-xl flex items-center justify-center text-white mx-auto mb-3">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold mb-1 text-shadow">98%</div>
                  <div className="text-white/90 text-sm text-shadow-sm">
                    Tingkat Kepuasan
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 glass-hero rounded-xl flex items-center justify-center text-white mx-auto mb-3">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold mb-1 text-shadow">
                    &lt;1j
                  </div>
                  <div className="text-white/90 text-sm text-shadow-sm">
                    Waktu Respon
                  </div>
                </div>
              </div>

              <div className="text-center relative z-10">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button className="btn-modern btn-modern-white touch-target">
                    Hubungi Support
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button className="btn-modern btn-modern-outline-white touch-target">
                    Lihat Knowledge Base
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

export default FAQ;
