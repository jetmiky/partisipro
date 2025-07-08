import {
  Layers,
  Mail,
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Github,
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    platform: [
      { name: 'Cara Kerja', href: '#how-it-works' },
      { name: 'Proyek Aktif', href: '#projects' },
      { name: 'Keamanan', href: '#security' },
      { name: 'Dokumentasi', href: '/docs' },
    ],
    company: [
      { name: 'Tentang Kami', href: '/about' },
      { name: 'Tim', href: '/team' },
      { name: 'Karir', href: '/careers' },
      { name: 'Pers', href: '/press' },
    ],
    legal: [
      { name: 'Kebijakan Privasi', href: '/privacy' },
      { name: 'Syarat Layanan', href: '/terms' },
      { name: 'Kepatuhan', href: '/compliance' },
      { name: 'Pengungkapan Risiko', href: '/risk-disclosure' },
    ],
    support: [
      { name: 'Pusat Bantuan', href: '/help' },
      { name: 'Hubungi Kami', href: '/contact' },
      { name: 'Dokumentasi API', href: '/api-docs' },
      { name: 'Status Halaman', href: '/status' },
    ],
  };

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'GitHub', icon: Github, href: '#' },
  ];

  return (
    <footer className="bg-secondary-900 text-white">
      <div className="container section-sm">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="feature-icon w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-gradient-gold">
                  Partisipro
                </div>
                <div className="text-xs text-secondary-400">
                  PPP Blockchain Platform
                </div>
              </div>
            </div>
            <p className="text-secondary-300 mb-6 max-w-sm text-indonesian">
              Mendemokratisasi investasi infrastruktur di Indonesia melalui
              teknologi blockchain dan integrasi Project Garuda IDR Stablecoin.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-secondary-400">
                <Mail className="w-4 h-4" />
                <span>contact@partisipro.com</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-400">
                <Phone className="w-4 h-4" />
                <span>+62 21 1234 5678</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-400">
                <MapPin className="w-4 h-4" />
                <span>Jakarta, Indonesia</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-indonesian-heading">
              Platform
            </h3>
            <ul className="space-y-2">
              {links.platform.map(link => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-indonesian-heading">
              Perusahaan
            </h3>
            <ul className="space-y-2">
              {links.company.map(link => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-indonesian-heading">
              Hukum
            </h3>
            <ul className="space-y-2">
              {links.legal.map(link => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-indonesian-heading">
              Dukungan
            </h3>
            <ul className="space-y-2">
              {links.support.map(link => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="border-t border-secondary-800 pt-8 mb-8">
          <div className="bg-secondary-800 rounded-lg p-4">
            <h4 className="font-semibold text-success-400 mb-2 text-indonesian-heading">
              Kepatuhan Regulasi
            </h4>
            <p className="text-sm text-secondary-300 text-indonesian">
              Partisipro beroperasi dengan mematuhi sepenuhnya regulasi Bank
              Indonesia dan pedoman otoritas jasa keuangan Indonesia (OJK).
              Semua transaksi dilakukan menggunakan Project Garuda IDR
              Stablecoin untuk kepatuhan regulasi.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-secondary-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-sm text-secondary-400 text-indonesian">
              © {currentYear} Partisipro. Semua hak dilindungi. Dibangun di
              atas blockchain Arbitrum.
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map(social => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-8 h-8 bg-secondary-800 rounded-lg flex items-center justify-center text-secondary-400 hover:text-white hover:bg-primary-600 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
