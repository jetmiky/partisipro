import Header from '@/components/layout/Header';
import Hero from '@/components/layout/Hero';
import Features from '@/components/layout/Features';
import HowItWorks from '@/components/layout/HowItWorks';
import Statistics from '@/components/layout/Statistics';
import Security from '@/components/layout/Security';
import Testimonials from '@/components/layout/Testimonials';
import FAQ from '@/components/layout/FAQ';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Statistics />
        <Security />
        <Testimonials />
        <FAQ />
        {/* TODO: Add authentication integration */}
        {/* TODO: Add token store/wallet connections */}
        {/* TODO: Add complex investment flows */}
      </main>
      <Footer />
    </div>
  );
}
