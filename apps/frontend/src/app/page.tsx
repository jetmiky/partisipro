'use client';

import Header from '@/components/layout/Header';
import Hero from '@/components/layout/Hero';
import Features from '@/components/layout/Features';
import HowItWorks from '@/components/layout/HowItWorks';
import Statistics from '@/components/layout/Statistics';
import Security from '@/components/layout/Security';
import Testimonials from '@/components/layout/Testimonials';
import FAQ from '@/components/layout/FAQ';
import Footer from '@/components/layout/Footer';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal } from '@/components/ui/ScrollAnimations';
import { ToastProvider } from '@/components/ui/AnimatedNotification';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Toast Provider for notifications */}
      <ToastProvider />

      {/* Page Transition Wrapper */}
      <PageTransition type="fade" duration={300} transitionKey="home">
        {/* Fluid Background Shapes */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 left-10"></div>
          <div className="fluid-shape-2 top-96 right-20"></div>
          <div className="fluid-shape-3 bottom-32 left-1/4"></div>
          <div className="fluid-shape-1 bottom-10 right-10"></div>
        </div>

        <Header />
        <main className="relative z-10">
          <ScrollReveal animation="fade" delay={0}>
            <Hero />
          </ScrollReveal>
          <ScrollReveal animation="slide-up" delay={100}>
            <Features />
          </ScrollReveal>
          <ScrollReveal animation="slide-up" delay={200}>
            <HowItWorks />
          </ScrollReveal>
          <ScrollReveal animation="slide-up" delay={100}>
            <Statistics />
          </ScrollReveal>
          <ScrollReveal animation="slide-up" delay={200}>
            <Security />
          </ScrollReveal>
          <ScrollReveal animation="slide-up" delay={100}>
            <Testimonials />
          </ScrollReveal>
          <ScrollReveal animation="slide-up" delay={200}>
            <FAQ />
          </ScrollReveal>
        </main>
        <Footer />
      </PageTransition>
    </div>
  );
}
