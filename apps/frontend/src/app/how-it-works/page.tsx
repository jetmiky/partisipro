'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Users,
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  Building,
  FileText,
  Wallet,
  DollarSign,
  Lock,
  Globe,
  Zap,
  Eye,
  Award,
  MessageCircle,
} from 'lucide-react';

export default function HowItWorksPage() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'investor' | 'spv' | 'admin'>(
    'investor'
  );
  const [activeStep, setActiveStep] = useState(0);

  const investorSteps = [
    {
      icon: <Users className="w-8 h-8" />,
      title: t('howItWorks.investorSteps.step1.title'),
      description: t('howItWorks.investorSteps.step1.description'),
      details: t('howItWorks.investorSteps.step1.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.investorSteps.step1.duration'),
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: t('howItWorks.investorSteps.step2.title'),
      description: t('howItWorks.investorSteps.step2.description'),
      details: t('howItWorks.investorSteps.step2.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.investorSteps.step2.duration'),
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: t('howItWorks.investorSteps.step3.title'),
      description: t('howItWorks.investorSteps.step3.description'),
      details: t('howItWorks.investorSteps.step3.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.investorSteps.step3.duration'),
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: t('howItWorks.investorSteps.step4.title'),
      description: t('howItWorks.investorSteps.step4.description'),
      details: t('howItWorks.investorSteps.step4.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.investorSteps.step4.duration'),
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: t('howItWorks.investorSteps.step5.title'),
      description: t('howItWorks.investorSteps.step5.description'),
      details: t('howItWorks.investorSteps.step5.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.investorSteps.step5.duration'),
    },
  ];

  const spvSteps = [
    {
      icon: <Building className="w-8 h-8" />,
      title: t('howItWorks.spvSteps.step1.title'),
      description: t('howItWorks.spvSteps.step1.description'),
      details: t('howItWorks.spvSteps.step1.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.spvSteps.step1.duration'),
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: t('howItWorks.spvSteps.step2.title'),
      description: t('howItWorks.spvSteps.step2.description'),
      details: t('howItWorks.spvSteps.step2.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.spvSteps.step2.duration'),
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: t('howItWorks.spvSteps.step3.title'),
      description: t('howItWorks.spvSteps.step3.description'),
      details: t('howItWorks.spvSteps.step3.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.spvSteps.step3.duration'),
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: t('howItWorks.spvSteps.step4.title'),
      description: t('howItWorks.spvSteps.step4.description'),
      details: t('howItWorks.spvSteps.step4.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.spvSteps.step4.duration'),
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: t('howItWorks.spvSteps.step5.title'),
      description: t('howItWorks.spvSteps.step5.description'),
      details: t('howItWorks.spvSteps.step5.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.spvSteps.step5.duration'),
    },
  ];

  const adminSteps = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('howItWorks.adminSteps.step1.title'),
      description: t('howItWorks.adminSteps.step1.description'),
      details: t('howItWorks.adminSteps.step1.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.adminSteps.step1.duration'),
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: t('howItWorks.adminSteps.step2.title'),
      description: t('howItWorks.adminSteps.step2.description'),
      details: t('howItWorks.adminSteps.step2.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.adminSteps.step2.duration'),
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: t('howItWorks.adminSteps.step3.title'),
      description: t('howItWorks.adminSteps.step3.description'),
      details: t('howItWorks.adminSteps.step3.details', {
        returnObjects: true,
      }) as string[],
      duration: t('howItWorks.adminSteps.step3.duration'),
    },
  ];

  const getCurrentSteps = () => {
    switch (activeTab) {
      case 'investor':
        return investorSteps;
      case 'spv':
        return spvSteps;
      case 'admin':
        return adminSteps;
      default:
        return investorSteps;
    }
  };

  const blockchainFeatures = [
    {
      icon: <Lock className="w-8 h-8" />,
      title: t('howItWorks.blockchain.features.security.title'),
      description: t('howItWorks.blockchain.features.security.description'),
      details: t('howItWorks.blockchain.features.security.details', {
        returnObjects: true,
      }) as string[],
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: t('howItWorks.blockchain.features.transparency.title'),
      description: t('howItWorks.blockchain.features.transparency.description'),
      details: t('howItWorks.blockchain.features.transparency.details', {
        returnObjects: true,
      }) as string[],
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: t('howItWorks.blockchain.features.network.title'),
      description: t('howItWorks.blockchain.features.network.description'),
      details: t('howItWorks.blockchain.features.network.details', {
        returnObjects: true,
      }) as string[],
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: t('howItWorks.blockchain.features.compliance.title'),
      description: t('howItWorks.blockchain.features.compliance.description'),
      details: t('howItWorks.blockchain.features.compliance.details', {
        returnObjects: true,
      }) as string[],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <Header />

      <main className="pt-24 relative z-10">
        {/* Hero Section */}
        <section className="gradient-brand-light py-16 md:py-24 relative">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
                {t('howItWorks.title')}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                {t('howItWorks.subtitle')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 glass-modern rounded-full px-4 py-2">
                  <CheckCircle className="w-5 h-5 text-success-500" />
                  <span className="text-sm font-medium">
                    {t('howItWorks.hero.simpleProcess')}
                  </span>
                </div>
                <div className="flex items-center gap-2 glass-modern rounded-full px-4 py-2">
                  <Shield className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">
                    {t('howItWorks.hero.safeTransparent')}
                  </span>
                </div>
                <div className="flex items-center gap-2 glass-modern rounded-full px-4 py-2">
                  <Clock className="w-5 h-5 text-secondary-500" />
                  <span className="text-sm font-medium">
                    {t('howItWorks.hero.startIn5Minutes')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Journey Tabs */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t('howItWorks.roles.title')}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('howItWorks.roles.description')}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setActiveTab('investor');
                    setActiveStep(0);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === 'investor'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Users className="w-5 h-5 inline mr-2" />
                  Investor
                </button>
                <button
                  onClick={() => {
                    setActiveTab('spv');
                    setActiveStep(0);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === 'spv'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Building className="w-5 h-5 inline mr-2" />
                  SPV/Proyek
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin');
                    setActiveStep(0);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === 'admin'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Shield className="w-5 h-5 inline mr-2" />
                  Admin
                </button>
              </div>
            </div>

            {/* Process Steps */}
            <div className="max-w-6xl mx-auto">
              {/* Timeline */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                  {getCurrentSteps().map((step, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center relative"
                    >
                      <button
                        onClick={() => setActiveStep(index)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                          activeStep === index
                            ? 'bg-primary-500 text-white shadow-lg scale-110'
                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                        }`}
                      >
                        {step.icon}
                      </button>
                      <div className="text-center mt-3">
                        <div
                          className={`text-sm font-medium ${
                            activeStep === index
                              ? 'text-primary-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {t('howItWorks.process.step')} {index + 1}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {step.duration}
                        </div>
                      </div>
                      {index < getCurrentSteps().length - 1 && (
                        <div className="absolute top-8 left-16 w-full h-0.5 bg-gray-200 hidden lg:block">
                          <div
                            className={`h-full transition-all duration-500 ${
                              activeStep > index
                                ? 'bg-primary-500'
                                : 'bg-gray-200'
                            }`}
                            style={{
                              width: activeStep > index ? '100%' : '0%',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Step Details */}
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="feature-icon mb-6">
                      {getCurrentSteps()[activeStep].icon}
                    </div>
                    <h3 className="text-3xl font-bold mb-4">
                      {getCurrentSteps()[activeStep].title}
                    </h3>
                    <p className="text-xl text-muted-foreground mb-6">
                      {getCurrentSteps()[activeStep].description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-primary-600 mb-6">
                      <Clock className="w-4 h-4" />
                      <span>
                        {t('howItWorks.process.estimatedTime')}{' '}
                        {getCurrentSteps()[activeStep].duration}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">
                      {t('howItWorks.process.processDetails')}
                    </h4>
                    <ul className="space-y-3">
                      {getCurrentSteps()[activeStep].details.map(
                        (detail, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">
                              {detail}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blockchain Technology */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t('howItWorks.blockchain.title')}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('howItWorks.blockchain.description')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {blockchainFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="feature-icon mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Flow Diagram */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t('howItWorks.flow.title')}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('howItWorks.flow.description')}
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {/* On-Chain Process */}
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold mb-6 text-primary-800">
                    {t('howItWorks.flow.onChain.title')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.onChain.steps.0')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.onChain.steps.1')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.onChain.steps.2')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">4</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.onChain.steps.3')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Off-Chain Process */}
                <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold mb-6 text-secondary-800">
                    {t('howItWorks.flow.offChain.title')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.offChain.steps.0')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.offChain.steps.1')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.offChain.steps.2')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">4</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.offChain.steps.3')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Integration Layer */}
                <div className="bg-gradient-to-br from-success-50 to-support-100 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold mb-6 text-success-800">
                    {t('howItWorks.flow.integration.title')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.integration.steps.0')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.integration.steps.1')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.integration.steps.2')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">4</span>
                      </div>
                      <span className="text-sm">
                        {t('howItWorks.flow.integration.steps.3')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t('howItWorks.faq.title')}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('howItWorks.faq.description')}
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold mb-3">
                  {t('howItWorks.faq.questions.blockchain.question')}
                </h3>
                <p className="text-muted-foreground">
                  {t('howItWorks.faq.questions.blockchain.answer')}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold mb-3">
                  {t('howItWorks.faq.questions.security.question')}
                </h3>
                <p className="text-muted-foreground">
                  {t('howItWorks.faq.questions.security.answer')}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold mb-3">
                  {t('howItWorks.faq.questions.minimum.question')}
                </h3>
                <p className="text-muted-foreground">
                  {t('howItWorks.faq.questions.minimum.answer')}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold mb-3">
                  {t('howItWorks.faq.questions.withdraw.question')}
                </h3>
                <p className="text-muted-foreground">
                  {t('howItWorks.faq.questions.withdraw.answer')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('howItWorks.cta.title')}
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {t('howItWorks.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-light btn-lg">
                <Users className="w-5 h-5" />
                {t('howItWorks.cta.startInvesting')}
              </button>
              <button className="btn btn-outline-light btn-lg">
                <MessageCircle className="w-5 h-5" />
                {t('howItWorks.cta.freeConsultation')}
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
