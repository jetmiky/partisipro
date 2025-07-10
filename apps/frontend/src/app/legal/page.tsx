'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Shield,
  FileText,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  Scale,
  Clock,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
} from 'lucide-react';

export default function LegalPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const legalSections = [
    {
      id: 'overview',
      title: 'Ringkasan Legal',
      icon: <Eye className="w-5 h-5" />,
      description: 'Ikhtisar regulasi dan compliance',
    },
    {
      id: 'terms',
      title: 'Syarat & Ketentuan',
      icon: <FileText className="w-5 h-5" />,
      description: 'Terms of service platform',
    },
    {
      id: 'privacy',
      title: 'Kebijakan Privasi',
      icon: <Shield className="w-5 h-5" />,
      description: 'Perlindungan data pengguna',
    },
    {
      id: 'compliance',
      title: 'Kepatuhan Regulasi',
      icon: <Scale className="w-5 h-5" />,
      description: 'Bank Indonesia & OJK compliance',
    },
    {
      id: 'risks',
      title: 'Peringatan Risiko',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Risiko investasi & disclaimer',
    },
    {
      id: 'documents',
      title: 'Dokumen Legal',
      icon: <Download className="w-5 h-5" />,
      description: 'Download dokumen legal',
    },
  ];

  const complianceItems = [
    {
      authority: 'Bank Indonesia',
      regulation: 'PBI No. 23/6/2021',
      title: 'Penyelenggara Teknologi Finansial',
      status: 'Compliant',
      description:
        'Registrasi sebagai penyelenggara teknologi finansial yang sah',
    },
    {
      authority: 'OJK',
      regulation: 'POJK No. 57/2020',
      title: 'Penawaran Efek Melalui Layanan Urun Dana',
      status: 'Compliant',
      description: 'Compliance dengan regulasi crowdfunding dan securities',
    },
    {
      authority: 'Kemenkeu',
      regulation: 'PMK No. 113/2020',
      title: 'Pajak Penghasilan atas Transaksi Digital',
      status: 'Compliant',
      description: 'Pemenuhan kewajiban perpajakan digital',
    },
    {
      authority: 'Kemenkominfo',
      regulation: 'PP No. 71/2019',
      title: 'Penyelenggaraan Sistem Elektronik',
      status: 'Compliant',
      description: 'Registrasi sistem elektronik dan perlindungan data',
    },
  ];

  const riskFactors = [
    {
      category: 'Risiko Investasi',
      risks: [
        'Nilai investasi dapat naik turun sesuai performa proyek',
        'Tidak ada jaminan keuntungan atau pengembalian modal',
        'Investasi infrastruktur memiliki horizon waktu yang panjang',
        'Risiko likuiditas pada secondary market',
      ],
    },
    {
      category: 'Risiko Teknologi',
      risks: [
        'Risiko keamanan smart contract meskipun telah diaudit',
        'Volatilitas network fee pada blockchain',
        'Risiko kehilangan akses wallet jika private key hilang',
        'Ketergantungan pada infrastruktur teknologi',
      ],
    },
    {
      category: 'Risiko Regulasi',
      risks: [
        'Perubahan regulasi dapat mempengaruhi operasional',
        'Risiko pembatasan akses dari otoritas regulasi',
        'Compliance cost yang meningkat seiring waktu',
        'Risiko legal dari evolusi regulasi blockchain',
      ],
    },
    {
      category: 'Risiko Proyek',
      risks: [
        'Risiko konstruksi dan operasional proyek infrastruktur',
        'Risiko politik dan perubahan kebijakan pemerintah',
        'Risiko force majeure dan bencana alam',
        'Risiko counterparty dari SPV/project company',
      ],
    },
  ];

  const faqItems = [
    {
      id: 'legal-entity',
      question: 'Apa status legal Partisipro?',
      answer:
        'Partisipro adalah platform teknologi finansial yang terdaftar di Bank Indonesia dan OJK. Kami beroperasi di bawah regulasi yang ketat untuk memastikan keamanan dan kepatuhan terhadap hukum Indonesia.',
    },
    {
      id: 'investor-protection',
      question: 'Bagaimana perlindungan investor?',
      answer:
        'Investor dilindungi melalui multiple layers: smart contracts yang diaudit, multi-signature wallets, segregated funds, insurance coverage, dan pengawasan regulasi yang ketat dari otoritas berwenang.',
    },
    {
      id: 'dispute-resolution',
      question: 'Bagaimana penyelesaian sengketa?',
      answer:
        'Sengketa diselesaikan melalui mediasi internal terlebih dahulu. Jika tidak berhasil, dapat dilanjutkan ke Badan Arbitrase Nasional Indonesia (BANI) atau pengadilan negeri sesuai dengan pilihan hukum yang berlaku.',
    },
    {
      id: 'tax-obligation',
      question: 'Bagaimana kewajiban pajak investor?',
      answer:
        'Investor bertanggung jawab atas kewajiban perpajakan sesuai dengan regulasi yang berlaku. Platform menyediakan laporan untuk membantu pemenuhan kewajiban pajak, namun disarankan berkonsultasi dengan konsultan pajak.',
    },
    {
      id: 'withdrawal-rights',
      question: 'Apakah ada hak untuk menarik investasi?',
      answer:
        'Setelah lock-up period berakhir, investor dapat menjual token mereka di secondary market. Untuk early withdrawal, berlaku term dan condition khusus dengan penalty yang telah ditetapkan.',
    },
  ];

  const legalDocuments = [
    {
      title: 'Syarat & Ketentuan Platform',
      description: 'Ketentuan lengkap penggunaan platform Partisipro',
      version: 'v2.1',
      date: '15 Desember 2024',
      size: '2.4 MB',
      format: 'PDF',
    },
    {
      title: 'Kebijakan Privasi',
      description: 'Perlindungan data dan informasi pengguna',
      version: 'v1.8',
      date: '10 Desember 2024',
      size: '1.1 MB',
      format: 'PDF',
    },
    {
      title: 'Risk Disclosure Statement',
      description: 'Peringatan risiko investasi dan disclaimer',
      version: 'v1.5',
      date: '8 Desember 2024',
      size: '890 KB',
      format: 'PDF',
    },
    {
      title: 'Smart Contract Audit Report',
      description: 'Laporan audit keamanan smart contracts',
      version: 'v1.3',
      date: '5 Desember 2024',
      size: '3.2 MB',
      format: 'PDF',
    },
    {
      title: 'Compliance Certificate',
      description: 'Sertifikat kepatuhan regulasi Bank Indonesia',
      version: 'v1.0',
      date: '1 Desember 2024',
      size: '1.5 MB',
      format: 'PDF',
    },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                Ringkasan Legal Framework
              </h3>
              <p className="text-muted-foreground mb-6">
                Partisipro beroperasi di bawah kerangka hukum yang ketat untuk
                memastikan perlindungan investor dan kepatuhan terhadap regulasi
                Indonesia dan internasional.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-success-50 border border-success-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-success-500" />
                  <h4 className="font-semibold text-success-800">
                    Fully Compliant
                  </h4>
                </div>
                <p className="text-success-700">
                  Platform telah memenuhi semua persyaratan regulasi Bank
                  Indonesia, OJK, dan otoritas terkait lainnya.
                </p>
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-8 h-8 text-primary-500" />
                  <h4 className="font-semibold text-primary-800">
                    Investor Protection
                  </h4>
                </div>
                <p className="text-primary-700">
                  Multiple layers of protection termasuk smart contracts audit,
                  insurance coverage, dan segregated funds.
                </p>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h4 className="font-semibold mb-4">Key Legal Principles</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Transparansi penuh dalam semua transaksi dan operasi
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Perlindungan data dan privasi pengguna sesuai standar
                    internasional
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Compliance dengan Anti-Money Laundering (AML) dan KYC
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>Audit berkala oleh pihak ketiga independen</span>
                </li>
              </ul>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                Syarat & Ketentuan Platform
              </h3>
              <p className="text-muted-foreground mb-6">
                Dengan menggunakan platform Partisipro, Anda setuju untuk
                terikat dengan syarat dan ketentuan berikut.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-semibold mb-3">
                  1. Definisi dan Interpretasi
                </h4>
                <p className="text-muted-foreground mb-4">
                  Platform mengacu pada aplikasi web dan mobile Partisipro
                  beserta semua layanan yang terkait.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>
                    • &quot;Platform&quot; berarti sistem teknologi Partisipro
                  </li>
                  <li>
                    • &quot;Pengguna&quot; berarti individu atau entitas yang
                    menggunakan platform
                  </li>
                  <li>
                    • &quot;SPV&quot; berarti Special Purpose Vehicle atau
                    project company
                  </li>
                  <li>
                    • &quot;Token&quot; berarti digital asset yang mewakili
                    kepemilikan proyek
                  </li>
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-semibold mb-3">2. Eligibilitas Pengguna</h4>
                <p className="text-muted-foreground mb-4">
                  Untuk menggunakan platform, pengguna harus memenuhi kriteria
                  berikut:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Berusia minimal 21 tahun atau telah menikah</li>
                  <li>• Warga negara Indonesia atau residen legal Indonesia</li>
                  <li>
                    • Telah menyelesaikan proses KYC dan verifikasi identitas
                  </li>
                  <li>• Memiliki rekening bank aktif atas nama sendiri</li>
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-semibold mb-3">3. Penggunaan Platform</h4>
                <p className="text-muted-foreground mb-4">
                  Pengguna setuju untuk menggunakan platform sesuai dengan
                  ketentuan yang berlaku:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>
                    • Tidak menggunakan platform untuk tujuan ilegal atau
                    melanggar hukum
                  </li>
                  <li>• Menjaga kerahasiaan informasi akun dan kredensial</li>
                  <li>• Tidak memanipulasi atau mengganggu sistem platform</li>
                  <li>
                    • Melaporkan aktivitas mencurigakan atau pelanggaran
                    keamanan
                  </li>
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-semibold mb-3">4. Investasi dan Risiko</h4>
                <p className="text-muted-foreground mb-4">
                  Pengguna memahami dan menerima risiko yang terkait dengan
                  investasi:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>
                    • Investasi tidak dijamin dan dapat mengalami kerugian
                  </li>
                  <li>
                    • Nilai investasi dapat berfluktuasi sesuai performa proyek
                  </li>
                  <li>• Tidak ada jaminan likuiditas pada secondary market</li>
                  <li>
                    • Platform tidak bertanggung jawab atas kerugian investasi
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">
                    Penting untuk Dibaca
                  </h4>
                  <p className="text-amber-700">
                    Dokumen lengkap Syarat & Ketentuan tersedia untuk diunduh.
                    Pastikan Anda membaca dan memahami seluruh ketentuan sebelum
                    menggunakan platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Kebijakan Privasi</h3>
              <p className="text-muted-foreground mb-6">
                Partisipro berkomitmen untuk melindungi privasi dan data
                personal pengguna sesuai dengan standar internasional dan
                regulasi Indonesia.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-semibold mb-3">Data Yang Kami Kumpulkan</h4>
                <p className="text-muted-foreground mb-4">
                  Kami mengumpulkan data yang diperlukan untuk memberikan
                  layanan terbaik:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>
                    • Data identitas untuk verifikasi KYC (nama, alamat, nomor
                    KTP)
                  </li>
                  <li>• Informasi kontak (email, nomor telepon)</li>
                  <li>• Data finansial (rekening bank, riwayat transaksi)</li>
                  <li>
                    • Data teknis (IP address, browser, device information)
                  </li>
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-semibold mb-3">Penggunaan Data</h4>
                <p className="text-muted-foreground mb-4">
                  Data pengguna digunakan untuk tujuan yang sah dan terbatas:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Verifikasi identitas dan compliance KYC/AML</li>
                  <li>• Pemrosesan transaksi investasi</li>
                  <li>• Komunikasi terkait layanan dan update penting</li>
                  <li>• Analisis untuk peningkatan layanan</li>
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-semibold mb-3">Perlindungan Data</h4>
                <p className="text-muted-foreground mb-4">
                  Kami menerapkan measures keamanan tingkat enterprise:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Enkripsi end-to-end untuk semua data sensitif</li>
                  <li>• Multi-factor authentication untuk akses admin</li>
                  <li>• Regular security audits dan penetration testing</li>
                  <li>• Compliance dengan ISO 27001 dan SOC 2</li>
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-semibold mb-3">Hak Pengguna</h4>
                <p className="text-muted-foreground mb-4">
                  Sesuai dengan GDPR dan regulasi data Indonesia, pengguna
                  memiliki hak:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Akses ke data personal yang kami simpan</li>
                  <li>• Koreksi data yang tidak akurat</li>
                  <li>• Penghapusan data dalam kondisi tertentu</li>
                  <li>• Portabilitas data ke penyedia layanan lain</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Data Protection Officer
                  </h4>
                  <p className="text-blue-700 mb-3">
                    Untuk pertanyaan terkait privasi dan perlindungan data,
                    hubungi DPO kami:
                  </p>
                  <p className="text-blue-700 text-sm">
                    Email: dpo@partisipro.com | Phone: +62 21 5588 9901
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Kepatuhan Regulasi</h3>
              <p className="text-muted-foreground mb-6">
                Partisipro mematuhi semua regulasi yang berlaku di Indonesia dan
                berkomitmen untuk menjaga standar compliance tertinggi.
              </p>
            </div>

            <div className="space-y-6">
              {complianceItems.map((item, index) => (
                <div key={index} className="bg-white border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {item.authority}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.regulation}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-success-50 text-success-700 px-3 py-1 rounded-full text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {item.status}
                    </div>
                  </div>
                  <h5 className="font-medium mb-2">{item.title}</h5>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-6">
              <h4 className="font-semibold mb-4">
                Ongoing Compliance Monitoring
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-2">Regular Audits</h5>
                  <p className="text-sm text-muted-foreground">
                    Audit berkala oleh pihak ketiga independen untuk memastikan
                    kepatuhan berkelanjutan.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Legal Updates</h5>
                  <p className="text-sm text-muted-foreground">
                    Monitoring aktif terhadap perubahan regulasi dan
                    implementasi update yang diperlukan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'risks':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Peringatan Risiko</h3>
              <p className="text-muted-foreground mb-6">
                Investasi pada platform Partisipro mengandung risiko. Pastikan
                Anda memahami semua risiko sebelum berinvestasi.
              </p>
            </div>

            <div className="bg-accent-50 border border-accent-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-8 h-8 text-accent-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-accent-800 mb-2">
                    Disclaimer Penting
                  </h4>
                  <p className="text-accent-700">
                    Investasi pada proyek infrastruktur memiliki risiko
                    kehilangan sebagian atau seluruh modal. Kinerja masa lalu
                    tidak menjamin kinerja masa depan. Konsultasikan dengan
                    penasihat keuangan sebelum membuat keputusan investasi.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {riskFactors.map((category, index) => (
                <div key={index} className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold mb-4 text-lg">
                    {category.category}
                  </h4>
                  <ul className="space-y-3">
                    {category.risks.map((risk, riskIndex) => (
                      <li key={riskIndex} className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 border rounded-lg p-6">
              <h4 className="font-semibold mb-4">Risk Mitigation Measures</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-2">Due Diligence</h5>
                  <p className="text-sm text-muted-foreground">
                    Semua proyek melalui proses due diligence yang ketat sebelum
                    listing.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Diversifikasi</h5>
                  <p className="text-sm text-muted-foreground">
                    Platform menyediakan berbagai pilihan proyek untuk
                    diversifikasi risiko.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Monitoring</h5>
                  <p className="text-sm text-muted-foreground">
                    Monitoring berkelanjutan terhadap performa dan risiko
                    proyek.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Insurance</h5>
                  <p className="text-sm text-muted-foreground">
                    Certain risks are covered by insurance policies where
                    applicable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Dokumen Legal</h3>
              <p className="text-muted-foreground mb-6">
                Download dokumen legal resmi untuk referensi dan arsip pribadi
                Anda.
              </p>
            </div>

            <div className="space-y-4">
              {legalDocuments.map((doc, index) => (
                <div
                  key={index}
                  className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="feature-icon">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-1">
                          {doc.title}
                        </h4>
                        <p className="text-muted-foreground mb-2">
                          {doc.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Version {doc.version}</span>
                          <span>•</span>
                          <span>{doc.date}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.format}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="btn btn-ghost btn-sm">
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button className="btn btn-primary btn-sm">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Document Updates
                  </h4>
                  <p className="text-blue-700 mb-3">
                    Dokumen legal dapat diperbarui sesuai dengan perubahan
                    regulasi. Pengguna akan dinotifikasi melalui email untuk
                    setiap update penting.
                  </p>
                  <p className="text-blue-700 text-sm">
                    Pastikan Anda selalu menggunakan versi terbaru dari dokumen
                    legal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
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
                Legal & Compliance
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                Framework hukum yang komprehensif untuk perlindungan investor
                dan kepatuhan regulasi
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <Scale className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">Fully Regulated</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <Shield className="w-5 h-5 text-success-500" />
                  <span className="text-sm font-medium">
                    Investor Protected
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
                  <FileText className="w-5 h-5 text-secondary-500" />
                  <span className="text-sm font-medium">
                    Transparent Documentation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Legal Navigation & Content */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <div className="sticky top-32">
                  <h3 className="font-semibold mb-4">Legal Topics</h3>
                  <nav className="space-y-2">
                    {legalSections.map(section => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                          activeSection === section.id
                            ? 'bg-primary-500 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {section.icon}
                        <div>
                          <div className="font-medium">{section.title}</div>
                          <div className="text-xs opacity-75">
                            {section.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl shadow-sm p-8">
                  {renderSectionContent()}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Pertanyaan umum terkait aspek legal dan compliance platform
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {faqItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedFaq(expandedFaq === item.id ? null : item.id)
                    }
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">{item.question}</span>
                    {expandedFaq === item.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedFaq === item.id && (
                    <div className="px-6 pb-4 text-muted-foreground">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Legal Contact Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 md:p-12 text-white">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Butuh Bantuan Legal?
                </h2>
                <p className="text-xl opacity-90 max-w-2xl mx-auto">
                  Tim legal kami siap membantu menjawab pertanyaan spesifik
                  terkait investasi dan compliance
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="feature-icon mx-auto mb-4">
                    <Mail className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-2">Legal Department</h3>
                  <p className="opacity-90 mb-4">
                    Pertanyaan legal dan compliance
                  </p>
                  <p className="text-lg font-medium">legal@partisipro.com</p>
                  <p className="text-sm opacity-75">Response dalam 24 jam</p>
                </div>

                <div className="text-center">
                  <div className="feature-icon mx-auto mb-4">
                    <Phone className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-2">Legal Hotline</h3>
                  <p className="opacity-90 mb-4">Konsultasi legal urgent</p>
                  <p className="text-lg font-medium">+62 21 5588 9902</p>
                  <p className="text-sm opacity-75">
                    Senin-Jumat 09:00-17:00 WIB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
