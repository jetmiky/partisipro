'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Layers } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';

export default function PasswordRecoveryPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement email verification and OTP sending
    setTimeout(() => {
      console.log('Sending OTP to:', formData.email);
      setIsLoading(false);
      setStep('otp');
      setTimer(119); // 1:59 timer
      alert('OTP sent to your email! (This is a mockup)');
    }, 1500);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement OTP verification
    setTimeout(() => {
      console.log('Verifying OTP:', formData.otp);
      setIsLoading(false);
      if (formData.otp === '123456') {
        setStep('newPassword');
      } else {
        alert('Invalid OTP. Try 123456 for demo purposes.');
      }
    }, 1500);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement password reset
    setTimeout(() => {
      console.log('Resetting password');
      setIsLoading(false);
      alert('Password reset successful! (This is a mockup)');
      // Redirect to sign in
    }, 1500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Decorative Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-100 via-primary-50 to-secondary-100 relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 left-12 w-24 h-24 bg-secondary-200/40 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-primary-300/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-secondary-300/30 rounded-full blur-xl"></div>

        {/* Logo */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900">Partisipro</span>
            <p className="text-sm text-gray-600">PPP Blockchain Platform</p>
          </div>
        </div>
      </div>

      {/* Right Side - Recovery Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Back Button */}
          <Link
            href="/auth/signin"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">
                Partisipro
              </span>
              <p className="text-sm text-gray-600">PPP Platform</p>
            </div>
          </div>

          {/* Step 1: Email Entry */}
          {step === 'email' && (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Lost your password?
                </h1>
                <h2 className="text-lg font-medium text-gray-700">
                  Enter your detail to recover
                </h2>
                <p className="text-sm text-gray-500">
                  Please enter your email address account to send the OTP
                  verification to reset your password
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="michael@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Continue'}
                </Button>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Verify your email
                </h1>
                <h2 className="text-lg font-medium text-gray-700">
                  Enter the verification code
                </h2>
                <p className="text-sm text-gray-500">
                  We sent a 6-digit code to {formData.email}
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {/* Timer */}
                {timer > 0 && (
                  <div className="text-center">
                    <span className="text-accent-500 font-medium">
                      {formatTime(timer)} Sec
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="otp"
                    className="text-sm font-medium text-gray-700"
                  >
                    OTP
                  </label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    placeholder="Enter the code"
                    value={formData.otp}
                    onChange={handleInputChange}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 text-center">
                    For demo purposes, use: 123456
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Submit'}
                </Button>

                {timer === 0 && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setTimer(119);
                        // TODO: Resend OTP logic
                        alert('OTP resent! (This is a mockup)');
                      }}
                      className="text-sm text-secondary-600 hover:text-secondary-700 font-medium"
                    >
                      Resend code
                    </button>
                  </div>
                )}
              </form>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 'newPassword' && (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Create New Password
                </h1>
                <h2 className="text-lg font-medium text-gray-700">
                  Set your new password
                </h2>
                <p className="text-sm text-gray-500">
                  Please make sure this password is not the same as the previous
                  password
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="newPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={
                    isLoading ||
                    formData.newPassword !== formData.confirmPassword
                  }
                >
                  {isLoading ? 'Updating...' : 'Confirm New Password'}
                </Button>
              </form>
            </>
          )}

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                href="/auth/signin"
                className="text-secondary-600 hover:text-secondary-700 font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
