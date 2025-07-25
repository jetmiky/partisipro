import { useState, useEffect } from 'react';
import { Menu, X, Shield } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  dark?: boolean;
}

const Header = ({ dark = false }: HeaderProps) => {
  const { t } = useTranslation('common');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (window) {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const navigation = [
    { name: t('navigation.howItWorks'), href: '/how-it-works' },
    { name: t('navigation.projects'), href: '/marketplace' },
    { name: t('navigation.about'), href: '/about' },
    { name: t('navigation.contact'), href: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-header' : 'glass-subtle'
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Image src="/images/logo.png" alt="Logo" width={20} height={20} />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-xl md:text-2xl font-bold ${dark || isScrolled ? 'text-primary-900' : 'text-contrast-overlay'}`}
              >
                Partisipro
              </span>
              <span
                className={`text-xs hidden md:block ${dark || isScrolled ? 'text-primary-600' : 'text-white/80'}`}
              >
                PPP - Blockchain Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map(item => (
              <a
                key={item.name}
                href={item.href}
                className={`font-medium transition-colors duration-200 ${dark || isScrolled ? 'text-primary-600 hover:text-primary-800' : 'text-white/90 hover:text-white'}`}
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              className={`btn btn-sm transition-all duration-200 ${dark || isScrolled ? 'btn-ghost' : 'glass-hero text-white/90 hover:text-white hover:glass-modern border-white/30'}`}
              href="/auth/signin"
            >
              {t('navigation.signIn')}
            </Link>
            <Link className="btn btn-primary btn-sm shadow-lg" href="/investor">
              <Shield className="w-4 h-4" />
              {t('navigation.getStarted')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 transition-colors ${dark || isScrolled ? 'text-primary-600 hover:text-primary-800' : 'text-white/90 hover:text-white'}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden animate-slide-down">
            <div className="glass-modern border-t border-primary-200/30">
              <nav className="px-4 py-6 space-y-4">
                {navigation.map(item => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block text-primary-800 hover:text-primary-900 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}

                <div className="pt-4 border-t border-primary-200/30">
                  <Link
                    className="btn btn-ghost w-full mb-2"
                    href="/auth/signin"
                  >
                    {t('navigation.signIn')}
                  </Link>
                  <Link
                    className="btn btn-primary btn-sm shadow-lg w-full"
                    href="/investor"
                  >
                    <Shield className="w-4 h-4" />
                    {t('navigation.getStarted')}
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Trust Indicators Bar */}
      {/* {!isMenuOpen && (
        <div
          className={`border-t ${dark || isScrolled ? 'border-primary-200/50 bg-primary-50/50' : 'border-white/20 glass-subtle border-b-transparent'} backdrop-blur-sm`}
        >
          <div className="container">
            <div
              className={`flex items-center justify-center md:justify-between py-2 text-xs md:text-sm ${dark || isScrolled ? 'text-primary-600' : 'text-white/80 text-shadow-sm'}`}
            >
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success-500" />
                  <span>BI - OJK Hackathon 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-500" />
                  <span>Tim Indonesia Emas</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <span>Platform Active • Arbitrum Network</span>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </header>
  );
};

export default Header;
