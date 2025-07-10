'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16 md:py-24">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
                Hubungi Kami
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                Tim support kami siap membantu Anda 24/7. Dapatkan jawaban atas
                pertanyaan investasi dan teknis.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">Response Cepat</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <Shield className="w-5 h-5 text-success-500" />
                  <span className="text-sm font-medium">
                    Data Aman & Terenkripsi
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <MessageCircle className="w-5 h-5 text-secondary-500" />
                  <span className="text-sm font-medium">Support 24/7</span>
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
                <h2 className="text-3xl font-bold mb-6">Kirim Pesan</h2>
                <p className="text-muted-foreground mb-8">
                  Isi formulir di bawah ini dan tim kami akan merespons dalam
                  waktu 2 jam selama jam kerja.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium mb-2"
                      >
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2"
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium mb-2"
                      >
                        Nomor Telepon
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        placeholder="+62 812 3456 7890"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium mb-2"
                      >
                        Kategori *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      >
                        <option value="">Pilih kategori</option>
                        <option value="investment">Pertanyaan Investasi</option>
                        <option value="kyc">Verifikasi KYC</option>
                        <option value="technical">Masalah Teknis</option>
                        <option value="security">Keamanan Akun</option>
                        <option value="partnership">Kemitraan SPV</option>
                        <option value="general">Pertanyaan Umum</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium mb-2"
                    >
                      Subjek *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Ringkasan singkat masalah atau pertanyaan"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium mb-2"
                    >
                      Pesan *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Jelaskan detail masalah atau pertanyaan Anda..."
                    ></textarea>
                  </div>

                  {submitStatus === 'success' && (
                    <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                      <p className="text-success-800">
                        ✅ Pesan berhasil dikirim! Tim kami akan merespons dalam
                        2 jam.
                      </p>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-4 bg-accent-50 border border-accent-200 rounded-lg">
                      <p className="text-accent-800">
                        ❌ Gagal mengirim pesan. Silakan coba lagi atau hubungi
                        kami melalui WhatsApp.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Mengirim...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Kirim Pesan
                      </div>
                    )}
                  </button>
                </form>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Informasi Kontak</h2>
                  <p className="text-muted-foreground mb-8">
                    Pilih channel komunikasi yang paling sesuai dengan kebutuhan
                    Anda.
                  </p>
                </div>

                {/* Contact Methods */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 transition-colors">
                    <div className="feature-icon">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">WhatsApp Support</h3>
                      <p className="text-muted-foreground mb-2">
                        Response tercepat untuk pertanyaan urgent
                      </p>
                      <p className="text-primary-600 font-medium">
                        +62 811 9988 7766
                      </p>
                      <p className="text-sm text-muted-foreground">
                        24/7 Available
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 transition-colors">
                    <div className="feature-icon">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email Support</h3>
                      <p className="text-muted-foreground mb-2">
                        Untuk pertanyaan detail dan dokumentasi
                      </p>
                      <p className="text-primary-600 font-medium">
                        support@partisipro.com
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Response dalam 2 jam
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 transition-colors">
                    <div className="feature-icon">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone Support</h3>
                      <p className="text-muted-foreground mb-2">
                        Konsultasi langsung dengan tim ahli
                      </p>
                      <p className="text-primary-600 font-medium">
                        021-5588-9900
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Senin-Jumat 08:00-17:00 WIB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 transition-colors">
                    <div className="feature-icon">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Office Address</h3>
                      <p className="text-muted-foreground mb-2">
                        Kunjungi kantor kami untuk konsultasi tatap muka
                      </p>
                      <p className="text-primary-600 font-medium">
                        Menara BCA Lt. 25
                        <br />
                        Jl. MH Thamrin No. 1<br />
                        Jakarta Pusat 10310
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Dengan perjanjian sebelumnya
                      </p>
                    </div>
                  </div>
                </div>

                {/* FAQ Quick Links */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary-500" />
                    Pertanyaan Umum
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <a href="#" className="text-primary-600 hover:underline">
                        Bagaimana cara memulai investasi?
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <a href="#" className="text-primary-600 hover:underline">
                        Proses verifikasi KYC membutuhkan waktu berapa lama?
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <a href="#" className="text-primary-600 hover:underline">
                        Bagaimana cara menarik keuntungan investasi?
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <a href="#" className="text-primary-600 hover:underline">
                        Apakah investasi di Partisipro aman?
                      </a>
                    </div>
                    <div className="text-center pt-3">
                      <a
                        href="#"
                        className="text-primary-600 hover:underline text-sm font-medium"
                      >
                        Lihat semua FAQ →
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
              <h2 className="text-3xl font-bold mb-4">Jam Operasional</h2>
              <p className="text-muted-foreground">
                Tim support kami tersedia untuk membantu Anda pada jam-jam
                berikut
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="feature-icon mx-auto mb-4">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="font-semibold mb-2">WhatsApp & Chat</h3>
                <p className="text-2xl font-bold text-success-600 mb-1">24/7</p>
                <p className="text-sm text-muted-foreground">Selalu tersedia</p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center">
                <div className="feature-icon mx-auto mb-4">
                  <Phone className="w-8 h-8" />
                </div>
                <h3 className="font-semibold mb-2">Phone Support</h3>
                <p className="text-lg font-bold text-primary-600 mb-1">
                  08:00 - 17:00 WIB
                </p>
                <p className="text-sm text-muted-foreground">Senin - Jumat</p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center">
                <div className="feature-icon mx-auto mb-4">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="font-semibold mb-2">Office Visit</h3>
                <p className="text-lg font-bold text-secondary-600 mb-1">
                  09:00 - 16:00 WIB
                </p>
                <p className="text-sm text-muted-foreground">
                  Dengan perjanjian
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
