'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Shield,
  HelpCircle,
  FileText,
  Send,
} from 'lucide-react';

export default function ContactPage() {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement actual form submission to support ticket system
    // Mock submission process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        message: '',
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-40 left-10"></div>
        <div className="fluid-shape-2 top-3/4 right-20"></div>
        <div className="fluid-shape-3 bottom-20 left-1/3"></div>
      </div>

      <Header />

      <main className="pt-24 relative z-10">
        {/* Hero Section */}
        <section className="gradient-brand-light py-16 md:py-24 relative">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
                {t('contact.title')}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                {t('contact.subtitle')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 glass-modern rounded-full px-4 py-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">
                    {t('contact.hero.fastResponse')}
                  </span>
                </div>
                <div className="flex items-center gap-2 glass-modern rounded-full px-4 py-2">
                  <Shield className="w-5 h-5 text-success-500" />
                  <span className="text-sm font-medium">
                    {t('contact.hero.secureData')}
                  </span>
                </div>
                <div className="flex items-center gap-2 glass-modern rounded-full px-4 py-2">
                  <MessageCircle className="w-5 h-5 text-secondary-500" />
                  <span className="text-sm font-medium">
                    {t('contact.hero.support247')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  {t('contact.form.title')}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {t('contact.form.description')}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium mb-2"
                      >
                        {t('contact.form.name')} *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        placeholder={t('contact.form.namePlaceholder')}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2"
                      >
                        {t('contact.form.email')} *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        placeholder={t('contact.form.emailPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium mb-2"
                      >
                        {t('contact.form.phone')}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        placeholder={t('contact.form.phonePlaceholder')}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium mb-2"
                      >
                        {t('contact.form.category')} *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      >
                        <option value="">
                          {t('contact.form.selectCategory')}
                        </option>
                        <option value="investment">
                          {t('contact.form.categories.investment')}
                        </option>
                        <option value="kyc">
                          {t('contact.form.categories.kyc')}
                        </option>
                        <option value="technical">
                          {t('contact.form.categories.technical')}
                        </option>
                        <option value="security">
                          {t('contact.form.categories.security')}
                        </option>
                        <option value="partnership">
                          {t('contact.form.categories.partnership')}
                        </option>
                        <option value="general">
                          {t('contact.form.categories.general')}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium mb-2"
                    >
                      {t('contact.form.subject')} *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder={t('contact.form.subjectPlaceholder')}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium mb-2"
                    >
                      {t('contact.form.message')} *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                      placeholder={t('contact.form.messagePlaceholder')}
                    ></textarea>
                  </div>

                  {submitStatus === 'success' && (
                    <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                      <p className="text-success-800">
                        {t('contact.form.successMessage')}
                      </p>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-4 bg-accent-50 border border-accent-200 rounded-lg">
                      <p className="text-accent-800">
                        {t('contact.form.errorMessage')}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-modern btn-modern-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t('contact.form.sending')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        {t('contact.form.sendMessage')}
                      </div>
                    )}
                  </button>
                </form>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-6">
                    {t('contact.info.title')}
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    {t('contact.info.description')}
                  </p>
                </div>

                {/* Contact Methods */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 glass-modern rounded-xl border border-gray-200 hover:border-primary-300 transition-colors">
                    <div className="feature-icon">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t('contact.methods.whatsapp.title')}
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        {t('contact.methods.whatsapp.description')}
                      </p>
                      <p className="text-primary-600 font-medium">
                        {t('contact.methods.whatsapp.number')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('contact.methods.whatsapp.availability')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 glass-modern rounded-xl border border-gray-200 hover:border-primary-300 transition-colors">
                    <div className="feature-icon">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t('contact.methods.email.title')}
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        {t('contact.methods.email.description')}
                      </p>
                      <p className="text-primary-600 font-medium">
                        {t('contact.methods.email.address')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('contact.methods.email.responseTime')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 glass-modern rounded-xl border border-gray-200 hover:border-primary-300 transition-colors">
                    <div className="feature-icon">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t('contact.methods.phone.title')}
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        {t('contact.methods.phone.description')}
                      </p>
                      <p className="text-primary-600 font-medium">
                        {t('contact.methods.phone.number')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('contact.methods.phone.hours')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 glass-modern rounded-xl border border-gray-200 hover:border-primary-300 transition-colors">
                    <div className="feature-icon">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t('contact.methods.office.title')}
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        {t('contact.methods.office.description')}
                      </p>
                      <p className="text-primary-600 font-medium">
                        {t('contact.methods.office.address')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('contact.methods.office.appointment')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* FAQ Quick Links */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary-500" />
                    {t('contact.faq.title')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <a href="#" className="text-primary-600 hover:underline">
                        {t('contact.faq.question1')}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <a href="#" className="text-primary-600 hover:underline">
                        {t('contact.faq.question2')}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <a href="#" className="text-primary-600 hover:underline">
                        {t('contact.faq.question3')}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <a href="#" className="text-primary-600 hover:underline">
                        {t('contact.faq.question4')}
                      </a>
                    </div>
                    <div className="text-center pt-3">
                      <a
                        href="#"
                        className="text-primary-600 hover:underline text-sm font-medium"
                      >
                        {t('contact.faq.viewAll')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Hours */}
        <section className="py-16 bg-gray-50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                {t('contact.hours.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('contact.hours.description')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="feature-icon mx-auto mb-4">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="font-semibold mb-2">
                  {t('contact.hours.whatsapp.title')}
                </h3>
                <p className="text-2xl font-bold text-success-600 mb-1">
                  {t('contact.hours.whatsapp.time')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('contact.hours.whatsapp.availability')}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center">
                <div className="feature-icon mx-auto mb-4">
                  <Phone className="w-8 h-8" />
                </div>
                <h3 className="font-semibold mb-2">
                  {t('contact.hours.phone.title')}
                </h3>
                <p className="text-lg font-bold text-primary-600 mb-1">
                  {t('contact.hours.phone.time')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('contact.hours.phone.days')}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center">
                <div className="feature-icon mx-auto mb-4">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="font-semibold mb-2">
                  {t('contact.hours.office.title')}
                </h3>
                <p className="text-lg font-bold text-secondary-600 mb-1">
                  {t('contact.hours.office.time')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('contact.hours.office.requirement')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
