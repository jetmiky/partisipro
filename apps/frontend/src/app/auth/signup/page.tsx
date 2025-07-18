'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { ToastProvider, toast } from '@/components/ui/AnimatedNotification';

export default function SignUpPage() {
  const router = useRouter();
  const {
    loginWithSocialProvider,
    loginWithEmailPassword,
    isAuthenticated,
    isLoading: authLoading,
    error,
    clearError,
  } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'investor',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || authLoading) return;

    setIsLoading(true);
    clearError();

    try {
      // Use Web3Auth email/password registration
      await loginWithEmailPassword(formData.email, formData.password);
      toast.success('Registration successful!', {
        message: 'Welcome to Partisipro',
        duration: 3000,
      });
      // Navigation will be handled by the useEffect above when isAuthenticated becomes true
    } catch (err) {
      // Error handling is managed by useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: string) => {
    if (isLoading || authLoading) return;

    setIsLoading(true);
    clearError();

    try {
      // Use Web3Auth social registration
      await loginWithSocialProvider(
        provider.toLowerCase() as 'google' | 'facebook' | 'apple'
      );
      toast.success(`${provider} registration successful!`, {
        message: 'Welcome to Partisipro',
        duration: 3000,
      });
      // Navigation will be handled by the useEffect above
    } catch (err) {
      // Social auth error is handled by useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Toast Provider for notifications */}
      <ToastProvider />
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 left-16"></div>
        <div className="fluid-shape-2 top-1/2 right-20"></div>
        <div className="fluid-shape-3 bottom-32 left-1/4"></div>
      </div>

      {/* Left Side - Decorative Background */}
      <div className="hidden lg:flex lg:w-1/2 gradient-brand-hero relative overflow-hidden">
        {/* Fluid Organic Shapes */}
        <div className="absolute inset-0 opacity-20 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-white rounded-full animate-float blur-sm"></div>
          <div
            className="absolute top-3/4 right-1/4 w-32 h-32 bg-white/80 rounded-full animate-float blur-sm"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/60 rounded-full animate-float blur-sm"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>

        {/* Logo */}
        <div className="absolute top-8 left-8 flex items-center gap-3 animate-fade-in-up">
          <div className="w-10 h-10 feature-icon">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">Partisipro</span>
            <p className="text-sm text-white/80">PPP Blockchain Platform</p>
          </div>
        </div>

        {/* Welcome Content */}
        <div className="w-full flex flex-col justify-center items-center text-center text-white p-12 relative z-10">
          <div className="max-w-md animate-fade-in-up animate-delay-300">
            <h2 className="text-3xl font-bold mb-4">Join the Future!</h2>
            <p className="text-lg text-white/90 mb-6">
              Start your journey in democratizing infrastructure investment
            </p>
            <div className="glass-hero p-6 rounded-2xl">
              <p className="text-sm text-white/95">
                &ldquo;Be part of Indonesia&apos;s infrastructure
                transformation&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8 animate-fade-in-up">
            <div className="w-10 h-10 feature-icon">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-gradient">
                Partisipro
              </span>
              <p className="text-sm text-muted-foreground">PPP Platform</p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-2 animate-fade-in-up animate-delay-200">
            <h1 className="text-2xl font-bold text-gradient">
              Welcome to Partisipro
            </h1>
            <h2 className="text-lg font-medium text-foreground">
              Sign Up to get started
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your details to proceed further
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="glass-modern border border-error-200 rounded-2xl p-4 animate-fade-in-up">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error-800">
                    Registration Error
                  </h3>
                  <div className="mt-2 text-sm text-error-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sign Up Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 animate-fade-in-up animate-delay-300"
          >
            {/* Full Name Input */}
            <div className="space-y-2">
              <AnimatedInput
                id="fullName"
                name="fullName"
                type="text"
                label="Full Name"
                placeholder="Enter your name"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <AnimatedInput
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <AnimatedInput
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="Create password"
                value={formData.password}
                onChange={handleInputChange}
                showPasswordToggle={true}
                required
              />
            </div>

            {/* Sign Up Button */}
            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isLoading || authLoading}
              ripple
            >
              Sign Up
            </AnimatedButton>

            {/* Social Auth Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  Or sign up with
                </span>
              </div>
            </div>

            {/* Social Auth Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSocialAuth('Google')}
                disabled={isLoading || authLoading}
                className="flex items-center justify-center px-4 py-2 glass-modern rounded-xl hover:glass-feature transition-all hover-scale disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2 text-sm font-medium">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('Apple')}
                disabled={isLoading || authLoading}
                className="flex items-center justify-center px-4 py-2 glass-modern rounded-xl hover:glass-feature transition-all hover-scale disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span className="ml-2 text-sm font-medium">Apple</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('Facebook')}
                disabled={isLoading || authLoading}
                className="flex items-center justify-center px-4 py-2 glass-modern rounded-xl hover:glass-feature transition-all hover-scale disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="ml-2 text-sm font-medium">Facebook</span>
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="text-center animate-fade-in-up animate-delay-500">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="text-center animate-fade-in-up animate-delay-700">
            <p className="text-xs text-muted-foreground">
              By signing up, you agree to our{' '}
              <Link
                href="/legal"
                className="text-primary-600 hover:text-primary-700 transition-colors"
              >
                Terms of Use
              </Link>{' '}
              and{' '}
              <Link
                href="/legal"
                className="text-primary-600 hover:text-primary-700 transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
