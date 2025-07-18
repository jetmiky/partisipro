'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Mail, FileText, ArrowRight } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ScrollReveal } from '@/components/ui/ScrollAnimations';
import { PageTransition } from '@/components/ui/PageTransition';

export default function SPVApplicationSuccessPage() {
  const router = useRouter();

  const nextSteps = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Application Review',
      description:
        'Our team will review your application within 3-5 business days',
      timeline: '3-5 business days',
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: 'Email Notification',
      description:
        "You'll receive an email with the review decision and next steps",
      timeline: 'After review',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Additional Documentation',
      description: 'If approved, you may need to provide additional documents',
      timeline: 'If required',
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Platform Access',
      description: "Once approved, you'll be granted access to create projects",
      timeline: 'Final step',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <PageTransition type="fade" duration={300}>
          <div className="text-center">
            {/* Success Icon */}
            <ScrollReveal animation="scale" delay={0}>
              <div className="w-24 h-24 bg-gradient-to-br from-support-500 to-support-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </ScrollReveal>

            {/* Success Message */}
            <ScrollReveal animation="slide-up" delay={200}>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gradient mb-4">
                  Application Submitted Successfully!
                </h1>
                <p className="text-xl text-muted-foreground">
                  Thank you for your interest in becoming an SPV partner with
                  Partisipro. We&apos;ve received your application and will
                  review it carefully.
                </p>
              </div>
            </ScrollReveal>

            {/* Application Details */}
            <ScrollReveal animation="slide-up" delay={300}>
              <div className="glass-modern p-6 rounded-xl mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <h3 className="font-semibold text-primary-700 mb-2">
                      Application ID
                    </h3>
                    <p className="text-gray-600 font-mono">
                      #SPV-{Date.now().toString().slice(-6)}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-700 mb-2">
                      Submitted
                    </h3>
                    <p className="text-gray-600">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-700 mb-2">
                      Status
                    </h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      Under Review
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-700 mb-2">
                      Expected Response
                    </h3>
                    <p className="text-gray-600">3-5 business days</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Next Steps */}
            <ScrollReveal animation="slide-up" delay={400}>
              <div className="glass-modern p-6 rounded-xl mb-8">
                <h2 className="text-xl font-bold text-gradient mb-6">
                  What Happens Next?
                </h2>

                <div className="space-y-4">
                  {nextSteps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white">
                          {step.icon}
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          {step.description}
                        </p>
                        <span className="text-xs text-primary-600 font-medium">
                          {step.timeline}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Important Notes */}
            <ScrollReveal animation="slide-up" delay={500}>
              <div className="glass-modern p-6 rounded-xl mb-8 bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
                <h3 className="font-semibold text-primary-800 mb-4">
                  Important Notes
                </h3>
                <div className="text-left space-y-2 text-sm text-primary-700">
                  <p>
                    • Check your email regularly for updates on your application
                    status
                  </p>
                  <p>
                    • Make sure your contact information is accurate and
                    up-to-date
                  </p>
                  <p>
                    • Prepare additional documents that may be requested during
                    the review
                  </p>
                  <p>
                    • Our team may contact you for clarification or additional
                    information
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Action Buttons */}
            <ScrollReveal animation="slide-up" delay={600}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <AnimatedButton
                  onClick={() => router.push('/')}
                  variant="outline"
                  ripple
                  className="flex items-center"
                >
                  Back to Home
                </AnimatedButton>

                <AnimatedButton
                  onClick={() => router.push('/contact')}
                  ripple
                  className="flex items-center"
                >
                  Contact Support
                  <ArrowRight className="w-4 h-4 ml-2" />
                </AnimatedButton>
              </div>
            </ScrollReveal>

            {/* Footer */}
            <ScrollReveal animation="fade" delay={700}>
              <div className="mt-8 text-center text-sm text-muted-foreground">
                <p>
                  Questions? Contact our team at{' '}
                  <a
                    href="mailto:spv@partisipro.com"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    spv@partisipro.com
                  </a>
                </p>
              </div>
            </ScrollReveal>
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
