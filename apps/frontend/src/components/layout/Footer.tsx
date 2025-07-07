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
      { name: 'How It Works', href: '#how-it-works' },
      { name: 'Active Projects', href: '#projects' },
      { name: 'Security', href: '#security' },
      { name: 'Documentation', href: '/docs' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Team', href: '/team' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Compliance', href: '/compliance' },
      { name: 'Risk Disclosure', href: '/risk-disclosure' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'API Documentation', href: '/api-docs' },
      { name: 'Status Page', href: '/status' },
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
            <p className="text-secondary-300 mb-6 max-w-sm">
              Democratizing infrastructure investment in Indonesia through
              blockchain technology and Project Garuda IDR Stablecoin
              integration.
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
            <h3 className="font-semibold text-white mb-4">Platform</h3>
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
            <h3 className="font-semibold text-white mb-4">Company</h3>
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
            <h3 className="font-semibold text-white mb-4">Legal</h3>
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
            <h3 className="font-semibold text-white mb-4">Support</h3>
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
            <h4 className="font-semibold text-success-400 mb-2">
              Regulatory Compliance
            </h4>
            <p className="text-sm text-secondary-300">
              Partisipro operates in full compliance with Bank Indonesia
              regulations and Indonesian financial services authority (OJK)
              guidelines. All transactions are conducted using Project Garuda
              IDR Stablecoin for regulatory compliance.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-secondary-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-sm text-secondary-400">
              © {currentYear} Partisipro. All rights reserved. Built on
              Arbitrum blockchain.
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
