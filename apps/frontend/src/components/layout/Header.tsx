'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Shield, Layers, TrendingUp } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Projects', href: '#projects' },
    { name: 'About', href: '#about' },
    { name: 'Security', href: '#security' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-secondary-200'
          : 'bg-transparent'
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="feature-icon w-10 h-10 md:w-12 md:h-12">
              <Layers className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-bold text-gradient">
                Partisipro
              </span>
              <span className="text-xs text-muted-foreground hidden md:block">
                PPP Blockchain Platform
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map(item => (
              <a key={item.name} href={item.href} className="nav-link">
                {item.name}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button className="btn btn-ghost btn-sm">Sign In</button>
            <button className="btn btn-primary btn-sm">
              <Shield className="w-4 h-4" />
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-secondary-600 hover:text-primary-600 transition-colors"
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
            <div className="bg-white border-t border-secondary-200 shadow-lg">
              <nav className="px-4 py-6 space-y-4">
                {navigation.map(item => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block text-secondary-600 hover:text-primary-600 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}

                <div className="pt-4 border-t border-secondary-200">
                  <button className="btn btn-ghost w-full mb-2">Sign In</button>
                  <button className="btn btn-primary w-full">
                    <Shield className="w-4 h-4" />
                    Get Started
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Trust Indicators Bar */}
      {!isMenuOpen && (
        <div className="border-t border-secondary-200/50 bg-secondary-50/50 backdrop-blur-sm">
          <div className="container">
            <div className="flex items-center justify-center md:justify-between py-2 text-xs md:text-sm text-muted-foreground">
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success-500" />
                  <span>Bank Indonesia Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-500" />
                  <span>IDR Stablecoin Integrated</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <span>Platform Active • Arbitrum Network</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
