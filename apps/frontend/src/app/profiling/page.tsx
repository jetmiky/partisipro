'use client';

// Force dynamic rendering for presentation mode compatibility
export const dynamic = 'force-dynamic';

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
import { PageTransition } from '@/components/ui/PageTransition';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ToastProvider, toast } from '@/components/ui/AnimatedNotification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PresentationModeIndicator } from '@/components/layout/PresentationModeIndicator';

// Check if we're in presentation mode - remove if unused
// const isPresentationMode =
//   process.env.NEXT_PUBLIC_PRESENTATION_MODE === 'true' ||
//   (typeof window !== 'undefined' &&
//     window.location.search.includes('presentation=true'));

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

  // Always authenticated in presentation mode

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProfileFormData>({
    age: '26-35',
    income: '10.1-20M',
    experience: '1-3years',
    knownInvestments: ['stocks', 'mutual_funds', 'property'],
    investmentGoal: 'long_term_growth',
    riskTolerance: 'moderate',
    marketReaction: 'no_worry_long_term',
    holdingPeriod: '>5years',
    projectDetailImportance: 'important',
    tokenTypes: ['revenue_token', 'hybrid_token'],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [profileResults, setProfileResults] = useState<{
    riskLevel: string;
    investorType: string;
    score: number;
    recommendations: string[];
  } | null>(null);

  // No redirect needed in presentation mode
  useEffect(() => {
    // Presentation mode - always authenticated
  }, []);

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
    setCompletionProgress(0);

    try {
      // Simulate profile analysis and saving
      const steps = [
        { progress: 20, message: 'Menganalisis profil risiko...' },
        { progress: 40, message: 'Menghitung skor investor...' },
        { progress: 60, message: 'Menyimpan preferensi investasi...' },
        { progress: 80, message: 'Mengatur rekomendasi portofolio...' },
        { progress: 100, message: 'Profil berhasil disimpan!' },
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setCompletionProgress(step.progress);
        toast.success(step.message);
      }

      // Calculate profile results
      const results = calculateProfileResults(formData);
      setProfileResults(results);
      setShowResults(true);

      // Show final success message
      toast.success('Profil investor berhasil disimpan!', {
        message: 'Lihat hasil analisis profil Anda',
        duration: 3000,
      });
    } catch (error) {
      toast.error('Gagal menyimpan profil', {
        message: error instanceof Error ? error.message : 'Silakan coba lagi',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate investor profile results
  const calculateProfileResults = (data: ProfileFormData) => {
    let riskScore = 0;
    let recommendations: string[] = [];

    // Risk tolerance scoring
    const riskMap: { [key: string]: number } = {
      very_conservative: 1,
      conservative: 2,
      moderate: 3,
      aggressive: 4,
      very_aggressive: 5,
    };

    riskScore += riskMap[data.riskTolerance] || 3;

    // Market reaction scoring
    const reactionMap: { [key: string]: number } = {
      panic_sell: 1,
      worry_wait: 2,
      no_worry_long_term: 4,
      buy_more: 5,
    };

    riskScore += reactionMap[data.marketReaction] || 3;

    // Experience scoring
    const experienceMap: { [key: string]: number } = {
      never: 1,
      '<1year': 2,
      '1-3years': 3,
      '3-5years': 4,
      '>5years': 5,
    };

    riskScore += experienceMap[data.experience] || 2;

    // Calculate average risk score
    const avgRiskScore = riskScore / 3;

    // Determine risk level and investor type
    let riskLevel: string;
    let investorType: string;

    if (avgRiskScore <= 2) {
      riskLevel = 'Konservatif';
      investorType = 'Investor Konservatif';
      recommendations = [
        'Fokus pada proyek infrastruktur dengan risiko rendah',
        'Pilih token berbasis utang dengan pendapatan tetap',
        'Diversifikasi investasi di berbagai sektor',
      ];
    } else if (avgRiskScore <= 3.5) {
      riskLevel = 'Moderat';
      investorType = 'Investor Seimbang';
      recommendations = [
        'Kombinasi token utang dan ekuitas untuk keseimbangan',
        'Investasi di proyek dengan track record yang baik',
        'Pertimbangkan token pendapatan untuk cash flow',
      ];
    } else {
      riskLevel = 'Agresif';
      investorType = 'Investor Growth';
      recommendations = [
        'Fokus pada token ekuitas dengan potensi capital gain tinggi',
        'Investasi di proyek inovatif dan berkembang',
        'Manfaatkan volatilitas untuk keuntungan jangka panjang',
      ];
    }

    return {
      riskLevel,
      investorType,
      score: Math.round(avgRiskScore * 20), // Convert to 0-100 scale
      recommendations,
    };
  };

  // Auto-fill demo function
  const handleDemoAutoFill = () => {
    const demoData: ProfileFormData = {
      age: '26-35',
      income: '10.1-20M',
      experience: '1-3years',
      knownInvestments: ['stocks', 'mutual_funds', 'property'],
      investmentGoal: 'long_term_growth',
      riskTolerance: 'moderate',
      marketReaction: 'no_worry_long_term',
      holdingPeriod: '>5years',
      projectDetailImportance: 'important',
      tokenTypes: ['revenue_token', 'hybrid_token'],
    };

    setFormData(demoData);
    toast.success('Form berhasil diisi dengan data demo!', {
      message: 'Anda dapat langsung melanjutkan atau memodifikasi jawaban',
      duration: 3000,
    });
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

  // Always show content in presentation mode

  const currentSection = questionSections[currentStep];
  const isLastStep = currentStep === questionSections.length - 1;

  // Results display component
  const renderResults = () => {
    if (!showResults || !profileResults) return null;

    return (
      <div className="max-w-3xl mx-auto mb-8">
        <Card className="glass-feature animate-fade-in-up">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gradient-modern">
                  Hasil Analisis Profil Investor
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Profil investasi Anda telah berhasil dianalisis
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">
                    {profileResults.score}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Skor Risiko: {profileResults.score}/100
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profileResults.riskLevel}
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-secondary-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Tipe Investor
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profileResults.investorType}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-foreground mb-4 text-center">
                Rekomendasi Investasi
              </h4>
              <div className="space-y-3">
                {profileResults.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-primary-600" />
                    </div>
                    <p className="text-sm text-muted-foreground flex-1">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-8">
              <AnimatedButton
                variant="primary"
                onClick={() => router.push('/kyc')}
                className="flex items-center gap-2"
                ripple
              >
                Lanjut ke Verifikasi KYC
                <ChevronRight className="w-4 h-4" />
              </AnimatedButton>

              <AnimatedButton
                variant="outline"
                onClick={() => router.push('/marketplace')}
                className="flex items-center gap-2"
                ripple
              >
                Jelajahi Proyek
                <Target className="w-4 h-4" />
              </AnimatedButton>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ToastProvider />

      {/* Presentation Mode Indicator */}
      <PresentationModeIndicator />

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

          {/* Results Display */}
          {renderResults()}

          {/* Main Content */}
          <div
            className="max-w-3xl mx-auto"
            style={{ display: showResults ? 'none' : 'block' }}
          >
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

            {/* Demo Auto-Fill Button */}
            <div className="text-center mb-6 animate-fade-in-up animate-delay-400">
              <div className="flex gap-3 justify-center">
                <AnimatedButton
                  variant="outline"
                  onClick={handleDemoAutoFill}
                  className="border-2 border-dashed border-primary-300 hover:border-primary-500"
                  ripple
                >
                  <Target className="w-4 h-4 mr-2" />
                  Demo: Isi Otomatis
                </AnimatedButton>

                <AnimatedButton
                  variant="outline"
                  onClick={() => {
                    const demoData: ProfileFormData = {
                      age: '26-35',
                      income: '10.1-20M',
                      experience: '1-3years',
                      knownInvestments: ['stocks', 'mutual_funds', 'property'],
                      investmentGoal: 'long_term_growth',
                      riskTolerance: 'moderate',
                      marketReaction: 'no_worry_long_term',
                      holdingPeriod: '>5years',
                      projectDetailImportance: 'important',
                      tokenTypes: ['revenue_token', 'hybrid_token'],
                    };
                    setFormData(demoData);
                    const results = calculateProfileResults(demoData);
                    setProfileResults(results);
                    setShowResults(true);
                  }}
                  className="border-2 border-dashed border-success-300 hover:border-success-500"
                  ripple
                >
                  <Check className="w-4 h-4 mr-2" />
                  Demo: Lihat Hasil
                </AnimatedButton>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Untuk keperluan presentasi - simulasi profiling investor moderat
              </p>
            </div>

            {/* Submission Progress */}
            {isSubmitting && (
              <Card className="glass-modern mb-6 animate-fade-in-up">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground mb-4">
                      Memproses Profil Investor
                    </h3>
                    <div className="w-full bg-secondary-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${completionProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {completionProgress}% selesai
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

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
