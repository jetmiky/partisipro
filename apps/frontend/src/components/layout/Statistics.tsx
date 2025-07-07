'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Users, Building, Shield } from 'lucide-react';

interface StatisticProps {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  description: string;
  color: string;
  duration?: number;
}

const AnimatedCounter = ({
  value,
  suffix,
  duration = 2000,
}: {
  value: number;
  suffix: string;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOutCubic * value);

      setCount(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, value, duration]);

  return (
    <div ref={countRef} className="stat-number">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
};

const Statistic = ({
  icon: Icon,
  value,
  suffix,
  label,
  description,
  color,
  duration,
}: StatisticProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const statRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (statRef.current) {
      observer.observe(statRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={statRef}
      className={`transition-all duration-700 ${
        isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="card card-interactive text-center p-8 group">
        <div
          className={`feature-icon mx-auto mb-6 bg-gradient-to-br ${color} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-8 h-8" />
        </div>

        <AnimatedCounter value={value} suffix={suffix} duration={duration} />

        <div className="stat-label mb-4">{label}</div>

        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

const Statistics = () => {
  const statistics = [
    {
      icon: TrendingUp,
      value: 2500000000,
      suffix: '',
      label: 'Total Infrastructure Value (IDR)',
      description:
        'Combined value of all infrastructure projects available on our platform',
      color: 'from-financial-gold-500 to-financial-gold-600',
      duration: 2500,
    },
    {
      icon: Users,
      value: 15420,
      suffix: '+',
      label: 'Active Investors',
      description:
        'Verified investors participating in PPP infrastructure funding',
      color: 'from-primary-500 to-primary-600',
      duration: 2000,
    },
    {
      icon: Building,
      value: 12,
      suffix: '',
      label: 'Active Projects',
      description: 'Infrastructure projects currently available for investment',
      color: 'from-accent-500 to-accent-600',
      duration: 1500,
    },
    {
      icon: Shield,
      value: 99.9,
      suffix: '%',
      label: 'Platform Uptime',
      description:
        'Reliable blockchain infrastructure with enterprise-grade security',
      color: 'from-success-500 to-success-600',
      duration: 1800,
    },
  ];

  return (
    <section className="section bg-gradient-section">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-gradient mb-6">Platform Statistics</h2>
          <p className="text-xl max-w-3xl mx-auto">
            Real-time metrics showcasing the growth and reliability of
            Indonesia&apos;s leading blockchain PPP funding platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {statistics.map((stat, index) => (
            <div key={index} style={{ animationDelay: `${index * 150}ms` }}>
              <Statistic {...stat} />
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="card card-gradient p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Why These Numbers Matter
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-primary-600 mb-2">
                  Market Impact
                </h4>
                <p className="text-muted-foreground">
                  Our platform has democratized access to infrastructure
                  investment, allowing retail investors to participate in
                  projects previously reserved for institutional investors.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-primary-600 mb-2">
                  Technology Excellence
                </h4>
                <p className="text-muted-foreground">
                  Built on Arbitrum blockchain with enterprise-grade security,
                  ensuring fast, reliable, and cost-effective transactions for
                  all users.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Statistics;
