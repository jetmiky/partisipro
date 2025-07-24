'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Shield,
  Coins,
  FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FAQ = () => {
  const { t } = useTranslation('common');
  const [openItems, setOpenItems] = useState<number[]>([0]);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const faqCategories = [
    {
      icon: HelpCircle,
      title: t('faq.categories.general'),
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: Shield,
      title: t('faq.categories.security'),
      color: 'from-success-500 to-success-600',
    },
    {
      icon: Coins,
      title: t('faq.categories.investment'),
      color: 'from-financial-gold-500 to-financial-gold-600',
    },
    {
      icon: FileText,
      title: t('faq.categories.legal'),
      color: 'from-accent-500 to-accent-600',
    },
  ];

  const faqs = [
    {
      category: t('faq.categories.general'),
      question: t('faq.questions.whatIsPartisipro.question'),
      answer: t('faq.questions.whatIsPartisipro.answer'),
    },
    {
      category: t('faq.categories.general'),
      question: t('faq.questions.whyInvest.question'),
      answer: t('faq.questions.whyInvest.answer'),
    },
    {
      category: t('faq.categories.security'),
      question: t('faq.questions.howSafe.question'),
      answer: t('faq.questions.howSafe.answer'),
    },
    {
      category: t('faq.categories.investment'),
      question: t('faq.questions.minimumInvestment.question'),
      answer: t('faq.questions.minimumInvestment.answer'),
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
            <span>{t('faq.title')}</span>
          </div>
          <h2 className="text-responsive-2xl font-bold text-foreground mb-6 text-indonesian-heading">
            {t('faq.subtitle')}
            <span className="block gradient-text-modern">
              {t('faq.description')}
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
      </div>
    </section>
  );
};

export default FAQ;
