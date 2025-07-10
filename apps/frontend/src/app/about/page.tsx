import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Shield,
  Users,
  Target,
  Globe,
  TrendingUp,
  Award,
  Building,
  ChartBar,
} from 'lucide-react';

export const metadata = {
  title:
    'Tentang Partisipro - Platform Investasi Infrastruktur Blockchain Indonesia',
  description:
    'Pelajari lebih lanjut tentang misi Partisipro untuk mendemokratisasi investasi infrastruktur di Indonesia melalui teknologi blockchain yang aman dan transparan.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16 md:py-24">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
                Tentang Partisipro
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                Mendemokratisasi investasi infrastruktur Indonesia melalui
                teknologi blockchain yang aman, transparan, dan patuh regulasi.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <Shield className="w-5 h-5 text-success-500" />
                  <span className="text-sm font-medium">
                    Bank Indonesia Compliant
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <Building className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">PPP Focused</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <TrendingUp className="w-5 h-5 text-secondary-500" />
                  <span className="text-sm font-medium">
                    Blockchain Technology
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="feature-icon">
                    <Target className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold">Misi Kami</h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Menciptakan platform investasi infrastruktur yang dapat
                  diakses oleh seluruh masyarakat Indonesia, memungkinkan
                  partisipasi dalam proyek-proyek Kemitraan Pemerintah dan Badan
                  Usaha (KPBU) melalui tokenisasi yang aman dan transparan.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Kami percaya bahwa setiap warga negara berhak berpartisipasi
                  dalam pembangunan infrastruktur nasional dan merasakan manfaat
                  ekonomi dari investasi tersebut.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="feature-icon">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold">Visi Kami</h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Menjadi platform terdepan dalam demokratisasi investasi
                  infrastruktur di Indonesia, menghubungkan investor ritel
                  dengan proyek-proyek strategis nasional melalui teknologi
                  blockchain yang inovatif.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Membangun ekosistem keuangan yang inklusif, transparan, dan
                  berkelanjutan untuk mendukung pertumbuhan ekonomi Indonesia.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Nilai-Nilai Kami
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Prinsip-prinsip yang mendasari setiap keputusan dan inovasi yang
                kami buat
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="feature-icon mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Keamanan</h3>
                <p className="text-muted-foreground">
                  Mengutamakan keamanan dana dan data investor melalui teknologi
                  blockchain terdepan
                </p>
              </div>

              <div className="text-center group">
                <div className="feature-icon mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Transparansi</h3>
                <p className="text-muted-foreground">
                  Memberikan visibilitas penuh terhadap investasi dan distribusi
                  keuntungan
                </p>
              </div>

              <div className="text-center group">
                <div className="feature-icon mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Kepercayaan</h3>
                <p className="text-muted-foreground">
                  Membangun kepercayaan melalui regulasi yang ketat dan praktik
                  terbaik industri
                </p>
              </div>

              <div className="text-center group">
                <div className="feature-icon mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Inovasi</h3>
                <p className="text-muted-foreground">
                  Terus berinovasi untuk memberikan pengalaman investasi yang
                  lebih baik
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why PPP */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Mengapa Fokus pada PPP?
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Public-Private Partnership (PPP) atau Kemitraan Pemerintah dan
                  Badan Usaha (KPBU) adalah skema pembiayaan infrastruktur yang
                  memungkinkan sektor swasta berpartisipasi dalam pembangunan
                  dan operasional proyek infrastruktur publik.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">
                        Dampak Ekonomi Tinggi
                      </h4>
                      <p className="text-muted-foreground">
                        Proyek infrastruktur memiliki dampak jangka panjang
                        terhadap pertumbuhan ekonomi
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">
                        Cashflow Predictable
                      </h4>
                      <p className="text-muted-foreground">
                        Proyek PPP memiliki kontrak jangka panjang dengan
                        pemerintah yang memberikan kepastian pendapatan
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">
                        Backed by Government
                      </h4>
                      <p className="text-muted-foreground">
                        Proyek infrastruktur didukung dan diawasi langsung oleh
                        pemerintah
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      IDR 500T+
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Kebutuhan Infrastruktur 2020-2024
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-secondary-600 mb-2">
                      30%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Target Partisipasi Swasta
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-accent-600 mb-2">
                      120+
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Proyek PPP Aktif
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-support-600 mb-2">
                      15-25%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Target Return Tahunan
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Teknologi Kami
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Platform yang dibangun dengan teknologi blockchain terdepan dan
                standar keamanan tinggi
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="feature-icon mb-4">
                  <ChartBar className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Arbitrum Blockchain
                </h3>
                <p className="text-muted-foreground mb-4">
                  Layer-2 Ethereum untuk transaksi cepat dan biaya rendah dengan
                  keamanan tingkat enterprise.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Gas fee rendah</li>
                  <li>• Transaksi cepat</li>
                  <li>• Kompatibel dengan Ethereum</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="feature-icon mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Contracts</h3>
                <p className="text-muted-foreground mb-4">
                  Kontrak pintar yang telah diaudit untuk mengotomatisasi
                  distribusi keuntungan dan governance.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• OpenZeppelin standards</li>
                  <li>• Multi-signature security</li>
                  <li>• Upgradeable architecture</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="feature-icon mb-4">
                  <Building className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Project Garuda IDR
                </h3>
                <p className="text-muted-foreground mb-4">
                  Stablecoin IDR yang patuh regulasi Bank Indonesia untuk semua
                  transaksi investasi.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 1:1 dengan Rupiah</li>
                  <li>• Regulasi compliant</li>
                  <li>• Instant settlement</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Siap Memulai Investasi Infrastruktur?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Bergabunglah dengan revolusi investasi infrastruktur Indonesia.
              Mulai dengan verifikasi KYC dan jelajahi peluang investasi yang
              tersedia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-light btn-lg">
                <Users className="w-5 h-5" />
                Mulai Investasi
              </button>
              <button className="btn btn-outline-light btn-lg">
                Pelajari Lebih Lanjut
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
