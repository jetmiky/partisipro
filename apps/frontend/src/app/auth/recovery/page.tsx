'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Layers, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { authService } from '@/services/auth.service';
import { useTranslation } from 'react-i18next';

export default function PasswordRecoveryPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

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
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authService.requestPasswordReset(formData.email);
      if (response.success) {
        setSuccess(t('auth.recovery.messages.instructionsSent'));
        setStep('otp');
        setTimer(119); // 1:59 timer
      } else {
        setError(t('auth.recovery.messages.sendFailed'));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || t('auth.recovery.messages.sendFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // For now, we'll treat the OTP as the reset token
      // In a real implementation, this would validate the OTP and return a reset token
      if (formData.otp && formData.otp.length >= 6) {
        setResetToken(formData.otp);
        setStep('newPassword');
        setSuccess(t('auth.recovery.messages.otpVerified'));
      } else {
        setError(t('auth.recovery.messages.invalidOtp'));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || t('auth.recovery.messages.invalidOtp')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validate password confirmation
    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('auth.recovery.messages.passwordMismatch'));
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError(t('auth.recovery.messages.passwordTooShort'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.resetPassword(
        formData.newPassword,
        resetToken || formData.otp
      );

      if (response.success) {
        setSuccess(t('auth.recovery.messages.resetSuccess'));
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        setError(t('auth.recovery.messages.resetFailed'));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || t('auth.recovery.messages.resetFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setSuccess(null);

    try {
      const response = await authService.requestPasswordReset(formData.email);
      if (response.success) {
        setSuccess(t('auth.recovery.messages.newOtpSent'));
        setTimer(119); // Reset timer to 1:59
      } else {
        setError(t('auth.recovery.messages.resendFailed'));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || t('auth.recovery.messages.resendFailed')
      );
    }
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
            {t('auth.recovery.back')}
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

          {/* Error/Success Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {t('auth.recovery.error')}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    {t('auth.recovery.success')}
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>{success}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Email Entry */}
          {step === 'email' && (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('auth.recovery.steps.email.title')}
                </h1>
                <h2 className="text-lg font-medium text-gray-700">
                  {t('auth.recovery.steps.email.subtitle')}
                </h2>
                <p className="text-sm text-gray-500">
                  {t('auth.recovery.steps.email.description')}
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t('auth.recovery.steps.email.emailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t(
                        'auth.recovery.steps.email.emailPlaceholder'
                      )}
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
                  {isLoading
                    ? t('auth.recovery.steps.email.sending')
                    : t('auth.recovery.steps.email.continueButton')}
                </Button>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('auth.recovery.steps.otp.title')}
                </h1>
                <h2 className="text-lg font-medium text-gray-700">
                  {t('auth.recovery.steps.otp.subtitle')}
                </h2>
                <p className="text-sm text-gray-500">
                  {t('auth.recovery.steps.otp.description', {
                    email: formData.email,
                  })}
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {/* Timer */}
                {timer > 0 && (
                  <div className="text-center">
                    <span className="text-accent-500 font-medium">
                      {formatTime(timer)} {t('auth.recovery.steps.otp.seconds')}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="otp"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t('auth.recovery.steps.otp.otpLabel')}
                  </label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    placeholder={t('auth.recovery.steps.otp.otpPlaceholder')}
                    value={formData.otp}
                    onChange={handleInputChange}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 text-center">
                    {t('auth.recovery.steps.otp.demoHint')}
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading
                    ? t('auth.recovery.steps.otp.verifying')
                    : t('auth.recovery.steps.otp.submitButton')}
                </Button>

                {timer === 0 && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="text-sm text-secondary-600 hover:text-secondary-700 font-medium"
                    >
                      {t('auth.recovery.steps.otp.resendCode')}
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
                  {t('auth.recovery.steps.newPassword.title')}
                </h1>
                <h2 className="text-lg font-medium text-gray-700">
                  {t('auth.recovery.steps.newPassword.subtitle')}
                </h2>
                <p className="text-sm text-gray-500">
                  {t('auth.recovery.steps.newPassword.description')}
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="newPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t('auth.recovery.steps.newPassword.passwordLabel')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t(
                        'auth.recovery.steps.newPassword.passwordPlaceholder'
                      )}
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t('auth.recovery.steps.newPassword.confirmLabel')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t(
                        'auth.recovery.steps.newPassword.confirmPlaceholder'
                      )}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
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
                  {isLoading
                    ? t('auth.recovery.steps.newPassword.updating')
                    : t('auth.recovery.steps.newPassword.confirmButton')}
                </Button>
              </form>
            </>
          )}

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('auth.recovery.rememberPassword')}{' '}
              <Link
                href="/auth/signin"
                className="text-secondary-600 hover:text-secondary-700 font-medium"
              >
                {t('auth.recovery.signInLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
