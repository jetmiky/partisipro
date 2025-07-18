'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Target,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageTransition } from '@/components/ui/PageTransition';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ToastProvider, toast } from '@/components/ui/AnimatedNotification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { profilingService } from '@/services/profiling.service';

// Types for form data
interface ProfileFormData {
  age: string;
  income: string;
  experience: string;
  knownInvestments: string[];
  investmentGoal: string;
  riskTolerance: string;
  marketReaction: string;
  holdingPeriod: string;
  projectDetailImportance: string;
  tokenTypes: string[];
}

// Question data structure
const questionSections = [
  {
    id: 'demographics',
    title: 'Data Pribadi dan Demografi',
    description: 'Informasi dasar tentang profil investor Anda',
    icon: User,
    questions: [
      {
        id: 'age',
        question: 'Berapakah usia Anda saat ini?',
        type: 'single-choice',
        options: [
          { value: '<=25', label: '≤ 25 tahun' },
          { value: '26-35', label: '26 tahun - 35 tahun' },
          { value: '36-45', label: '36 tahun - 45 tahun' },
          { value: '46-55', label: '46 tahun - 55 tahun' },
          { value: '>55', label: '> 55 tahun' },
        ],
      },
      {
        id: 'income',
        question: 'Berapa perkiraan rata-rata penghasilan bulanan Anda?',
        type: 'single-choice',
        options: [
          { value: '<=5M', label: '≤ 5 Juta' },
          { value: '5.1-10M', label: '5.1 Juta - 10 Juta' },
          { value: '10.1-20M', label: '10.1 Juta - 20 Juta' },
          { value: '20.1-50M', label: '20.1 Juta - 50 Juta' },
          { value: '>50M', label: '> 50 juta' },
        ],
      },
      {
        id: 'experience',
        question: 'Sudah berapa lama Anda memiliki pengalaman berinvestasi?',
        type: 'single-choice',
        options: [
          { value: 'never', label: 'Belum pernah berinvestasi' },
          { value: '<1year', label: 'Kurang dari 1 tahun' },
          { value: '1-3years', label: '1 - 3 tahun' },
          { value: '3-5years', label: '3 - 5 tahun' },
          { value: '>5years', label: 'Lebih dari 5 tahun' },
        ],
      },
      {
        id: 'knownInvestments',
        question: 'Jenis investasi yang Anda kenal atau miliki?',
        type: 'multiple-choice',
        options: [
          { value: 'savings', label: 'Tabungan / Deposito' },
          { value: 'mutual_funds', label: 'Reksadana' },
          { value: 'stocks', label: 'Saham' },
          { value: 'bonds', label: 'Obligasi' },
          { value: 'property', label: 'Properti' },
          { value: 'gold', label: 'Emas' },
          { value: 'crypto', label: 'Crypto' },
          { value: 'others', label: 'Lainnya' },
        ],
      },
    ],
  },
  {
    id: 'preferences',
    title: 'Preferensi Investasi dan Gaya Portofolio',
    description: 'Memahami tujuan dan toleransi risiko investasi Anda',
    icon: Target,
    questions: [
      {
        id: 'investmentGoal',
        question: 'Tujuan utama Anda berinvestasi adalah?',
        type: 'single-choice',
        options: [
          {
            value: 'long_term_growth',
            label: 'Pertumbuhan jangka panjang (pensiun, pendidikan)',
          },
          { value: 'regular_income', label: 'Pendapatan rutin' },
          { value: 'inflation_hedge', label: 'Lindung nilai dari inflasi' },
          {
            value: 'medium_term_goals',
            label: 'Tujuan jangka menengah (rumah, liburan)',
          },
          { value: 'diversification', label: 'Diversifikasi portofolio' },
        ],
      },
      {
        id: 'riskTolerance',
        question: 'Seberapa besar Anda bersedia mengambil risiko?',
        type: 'single-choice',
        options: [
          { value: 'very_conservative', label: 'Sangat konservatif' },
          { value: 'conservative', label: 'Konservatif' },
          { value: 'moderate', label: 'Moderat' },
          { value: 'aggressive', label: 'Agresif' },
          { value: 'very_aggressive', label: 'Sangat agresif' },
        ],
      },
      {
        id: 'marketReaction',
        question:
          'Jika nilai investasi Anda turun 20 - 30% dalam waktu singkat, Anda akan...',
        type: 'single-choice',
        options: [
          { value: 'panic_sell', label: 'Panik dan jual' },
          { value: 'worry_wait', label: 'Khawatir tapi menunggu' },
          { value: 'buy_more', label: 'Membeli lebih banyak' },
          {
            value: 'no_worry_long_term',
            label: 'Tidak khawatir, fokus jangka panjang',
          },
        ],
      },
      {
        id: 'holdingPeriod',
        question: 'Berapa lama Anda berencana menahan investasi ini?',
        type: 'single-choice',
        options: [
          { value: '<1year', label: '< 1 tahun' },
          { value: '1-3years', label: '1 - 3 tahun' },
          { value: '3-5years', label: '3 - 5 tahun' },
          { value: '>5years', label: '> 5 tahun' },
        ],
      },
      {
        id: 'projectDetailImportance',
        question:
          'Seberapa penting mengetahui detail proyek KPBU yang Anda investasikan?',
        type: 'single-choice',
        options: [
          {
            value: 'very_important',
            label: 'Sangat penting - ingin semua detail',
          },
          { value: 'important', label: 'Penting - cukup garis besar' },
          {
            value: 'not_important',
            label: 'Tidak terlalu penting - lebih fokus pada return',
          },
        ],
      },
      {
        id: 'tokenTypes',
        question: 'Apa jenis token KPBU yang menarik bagi Anda?',
        type: 'multiple-choice',
        options: [
          {
            value: 'debt_token',
            label: 'Token Berbasis Utang - pendapatan tetap',
          },
          {
            value: 'equity_token',
            label: 'Token Ekuitas - potensi capital gain',
          },
          {
            value: 'revenue_token',
            label: 'Token Hak Pendapatan - hasil langsung dari proyek',
          },
          {
            value: 'hybrid_token',
            label: 'Token Hibrida - campuran aman dan untung',
          },
          { value: 'unsure', label: 'Belum yakin - ingin tahu lebih lanjut' },
        ],
      },
    ],
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProfileFormData>({
    age: '',
    income: '',
    experience: '',
    knownInvestments: [],
    investmentGoal: '',
    riskTolerance: '',
    marketReaction: '',
    holdingPeriod: '',
    projectDetailImportance: '',
    tokenTypes: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleInputChange = (
    questionId: string,
    value: string,
    isMultiple = false
  ) => {
    setFormData(prev => {
      if (isMultiple) {
        const currentValues = prev[
          questionId as keyof ProfileFormData
        ] as string[];
        const newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        return { ...prev, [questionId]: newValues };
      } else {
        return { ...prev, [questionId]: value };
      }
    });
  };

  const handleNext = () => {
    if (currentStep < questionSections.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Use the profiling service to submit data
      const response = await profilingService.mockSubmitProfile(formData);

      if (response.success) {
        toast.success('Profil investor berhasil disimpan!', {
          message: 'Anda akan dialihkan ke proses KYC',
          duration: 3000,
        });

        // Redirect to KYC after successful submission
        setTimeout(() => {
          router.push('/kyc');
        }, 1500);
      } else {
        throw new Error(response.message || 'Gagal menyimpan profil');
      }
    } catch (error) {
      toast.error('Gagal menyimpan profil', {
        message: error instanceof Error ? error.message : 'Silakan coba lagi',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current step is valid
  const isCurrentStepValid = () => {
    const currentSection = questionSections[currentStep];
    return currentSection.questions.every(question => {
      const value = formData[question.id as keyof ProfileFormData];
      if (question.type === 'multiple-choice') {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== '';
    });
  };

  const getProgressPercentage = () => {
    return ((currentStep + 1) / questionSections.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const currentSection = questionSections[currentStep];
  const isLastStep = currentStep === questionSections.length - 1;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ToastProvider />

      <PageTransition type="fade" duration={400} transitionKey="profiling">
        {/* Fluid Background Shapes */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 left-16"></div>
          <div className="fluid-shape-2 top-1/2 right-20"></div>
          <div className="fluid-shape-3 bottom-32 left-1/4"></div>
        </div>

        <div className="container max-w-4xl mx-auto px-4 py-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-modern mb-2">
              Profil Investor
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Lengkapi profil Anda untuk mendapatkan pengalaman investasi yang
              lebih personal
            </p>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Langkah {currentStep + 1} dari {questionSections.length}
                </span>
                <span className="text-sm text-primary-600 font-medium">
                  {Math.round(getProgressPercentage())}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill bg-gradient-to-r from-primary-500 to-primary-600"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-3xl mx-auto">
            {/* Section Header */}
            <Card className="mb-8 glass-modern animate-fade-in-up animate-delay-200">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <currentSection.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gradient-modern">
                      {currentSection.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentSection.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Questions */}
            <div className="space-y-6">
              {currentSection.questions.map((question, questionIndex) => (
                <Card
                  key={question.id}
                  className="glass-modern animate-fade-in-up"
                  style={{ animationDelay: `${(questionIndex + 1) * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      {question.question}
                    </h3>

                    <div className="space-y-3">
                      {question.options.map(option => (
                        <label
                          key={option.value}
                          className="flex items-center p-4 rounded-xl border-2 border-secondary-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-200 cursor-pointer group"
                        >
                          <input
                            type={
                              question.type === 'multiple-choice'
                                ? 'checkbox'
                                : 'radio'
                            }
                            name={question.id}
                            value={option.value}
                            checked={
                              question.type === 'multiple-choice'
                                ? (
                                    formData[
                                      question.id as keyof ProfileFormData
                                    ] as string[]
                                  ).includes(option.value)
                                : formData[
                                    question.id as keyof ProfileFormData
                                  ] === option.value
                            }
                            onChange={() =>
                              handleInputChange(
                                question.id,
                                option.value,
                                question.type === 'multiple-choice'
                              )
                            }
                            className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500 focus:ring-2"
                          />
                          <span className="ml-3 text-sm font-medium text-foreground group-hover:text-primary-700 transition-colors">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 animate-fade-in-up animate-delay-500">
              <AnimatedButton
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </AnimatedButton>

              <div className="flex items-center gap-2">
                {questionSections.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStep
                        ? 'bg-primary-600'
                        : 'bg-secondary-300'
                    }`}
                  />
                ))}
              </div>

              {isLastStep ? (
                <AnimatedButton
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!isCurrentStepValid() || isSubmitting}
                  loading={isSubmitting}
                  className="flex items-center gap-2"
                  ripple
                >
                  <Check className="w-4 h-4" />
                  Selesai
                </AnimatedButton>
              ) : (
                <AnimatedButton
                  variant="primary"
                  onClick={handleNext}
                  disabled={!isCurrentStepValid()}
                  className="flex items-center gap-2"
                  ripple
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </AnimatedButton>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <Card className="max-w-3xl mx-auto mt-8 glass-modern animate-fade-in-up animate-delay-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Disclaimer
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Semua jawaban Anda dijaga kerahasiaannya dan hanya digunakan
                    untuk memberikan pengalaman investasi yang lebih personal,
                    aman, dan terarah.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </div>
  );
}
