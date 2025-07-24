import { Mail, Phone, MapPin, Twitter, Linkedin, Github } from 'lucide-react';
import Image from 'next/image';

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
    <footer className="bg-primary-900 text-white">
      <div className="container section-sm">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={20}
                  height={20}
                />
              </div>
              <div>
                <div className="text-xl font-bold text-white tracking-wider">
                  Partisipro
                </div>
                <div className="text-xs text-primary-300">
                  PPP Blockchain Platform
                </div>
              </div>
            </div>
            <p className="text-primary-200 mb-6 max-w-sm text-indonesian">
              Mendemokratisasi investasi infrastruktur di Indonesia melalui
              teknologi blockchain.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-primary-300">
                <Mail className="w-4 h-4" />
                <span>contact@partisipro.id</span>
              </div>
              <div className="flex items-center gap-2 text-primary-300">
                <Phone className="w-4 h-4" />
                <span>+62 21 1234 5678</span>
              </div>
              <div className="flex items-center gap-2 text-primary-300">
                <MapPin className="w-4 h-4" />
                <span>Jakarta, Indonesia</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold text-2xl text-white mb-4 text-indonesian-heading">
              Platform
            </h3>
            <ul className="space-y-2">
              {links.platform.map(link => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-2xl text-white mb-4 text-indonesian-heading">
              Perusahaan
            </h3>
            <ul className="space-y-2">
              {links.company.map(link => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-2xl text-white mb-4 text-indonesian-heading">
              Legal
            </h3>
            <ul className="space-y-2">
              {links.legal.map(link => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-2xl text-white mb-4 text-indonesian-heading">
              Support
            </h3>
            <ul className="space-y-2">
              {links.support.map(link => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="border-t border-primary-800 pt-8 mb-8">
          <div className="glass-light rounded-xl p-6">
            <h4 className="font-semibold text-primary-800 mb-2 text-3xl">
              Kepatuhan Regulasi
            </h4>
            <p className="text-sm text-primary-700 text-indonesian">
              Partisipro beroperasi dengan mematuhi sepenuhnya regulasi Bank
              Indonesia dan Otoritas Jasa Keuangan Indonesia (OJK).
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-sm text-primary-300 text-indonesian">
              © {currentYear} Partisipro. All Rights Reserved. Dibangun di atas
              blockchain Arbitrum.
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map(social => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-8 h-8 glass-light rounded-lg flex items-center justify-center text-primary-700 hover:text-white hover:bg-primary-600 transition-colors"
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
