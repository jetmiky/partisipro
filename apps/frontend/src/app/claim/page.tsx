'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout, DataTable } from '@/components/ui';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { PageTransition } from '@/components/ui/PageTransition';
import { toast } from '@/components/ui/AnimatedNotification';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';

interface ClaimableAmount extends Record<string, unknown> {
  projectId: string;
  projectName: string;
  amount: number;
  currency: string;
  period: string;
  status: 'available' | 'pending' | 'processing';
}

interface ClaimHistory extends Record<string, unknown> {
  id: string;
  projectName: string;
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'failed' | 'pending';
  transactionHash?: string;
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export default function ClaimPage() {
  const { t } = useTranslation('common');
  const [claimableAmounts, setClaimableAmounts] = useState<ClaimableAmount[]>(
    []
  );
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ClaimableAmount | null>(
    null
  );
  const [bankForm, setBankForm] = useState<BankAccount>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  // TODO: Replace with real Treasury contract integration
  useEffect(() => {
    const mockFetchClaimData = async () => {
      setIsLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockClaimableAmounts: ClaimableAmount[] = [
        {
          projectId: 'toll-road-1',
          projectName: 'Jakarta-Bandung Toll Road',
          amount: 2450000,
          currency: 'IDR',
          period: 'Q4 2024',
          status: 'available',
        },
        {
          projectId: 'port-2',
          projectName: 'Tanjung Priok Port Expansion',
          amount: 1250000,
          currency: 'IDR',
          period: 'Q4 2024',
          status: 'available',
        },
        {
          projectId: 'airport-3',
          projectName: 'Soekarno-Hatta Terminal 4',
          amount: 850000,
          currency: 'IDR',
          period: 'Q3 2024',
          status: 'processing',
        },
      ];

      const mockClaimHistory: ClaimHistory[] = [
        {
          id: 'claim-1',
          projectName: 'Jakarta-Bandung Toll Road',
          amount: 2100000,
          currency: 'IDR',
          date: '2024-10-15',
          status: 'completed',
          transactionHash: '0x1234567890abcdef',
        },
        {
          id: 'claim-2',
          projectName: 'Tanjung Priok Port Expansion',
          amount: 980000,
          currency: 'IDR',
          date: '2024-10-10',
          status: 'completed',
          transactionHash: '0xabcdef1234567890',
        },
        {
          id: 'claim-3',
          projectName: 'Soekarno-Hatta Terminal 4',
          amount: 750000,
          currency: 'IDR',
          date: '2024-09-25',
          status: 'failed',
        },
      ];

      const mockBankAccount: BankAccount = {
        bankName: 'Bank Central Asia',
        accountNumber: '1234567890',
        accountHolder: 'John Doe',
      };

      setClaimableAmounts(mockClaimableAmounts);
      setClaimHistory(mockClaimHistory);
      setBankAccount(mockBankAccount);
      setIsLoading(false);
    };

    mockFetchClaimData();
  }, []);

  const totalClaimable = claimableAmounts
    .filter(claim => claim.status === 'available')
    .reduce((sum, claim) => sum + claim.amount, 0);

  const totalClaimed = claimHistory
    .filter(claim => claim.status === 'completed')
    .reduce((sum, claim) => sum + claim.amount, 0);

  const handleClaim = async (claimableAmount: ClaimableAmount) => {
    setSelectedClaim(claimableAmount);
    setIsClaimModalOpen(true);
  };

  const processClaim = async () => {
    if (!selectedClaim) return;

    // TODO: Replace with real Treasury contract claim function
    // console.log('Processing claim for:', selectedClaim);

    // Simulate claim processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update claimable amounts
    setClaimableAmounts(prev =>
      prev.map(claim =>
        claim.projectId === selectedClaim.projectId
          ? { ...claim, status: 'processing' as const }
          : claim
      )
    );

    // Add to claim history
    const newHistoryItem: ClaimHistory = {
      id: `claim-${Date.now()}`,
      projectName: selectedClaim.projectName,
      amount: selectedClaim.amount,
      currency: selectedClaim.currency,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    };

    setClaimHistory(prev => [newHistoryItem, ...prev]);
    setIsClaimModalOpen(false);
    setSelectedClaim(null);

    toast.success(t('claimPage.messages.claimProcessed'), {
      message: t('claimPage.messages.claimProcessedDescription', {
        currency: selectedClaim.currency,
        amount: selectedClaim.amount.toLocaleString(),
      }),
      duration: 5000,
    });
  };

  const handleBankAccountSave = async () => {
    // TODO: Replace with real bank account update API
    // console.log('Saving bank account:', bankForm);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setBankAccount(bankForm);
    setIsBankModalOpen(false);

    toast.success(t('claimPage.messages.bankAccountSaved'), {
      message: t('claimPage.messages.bankAccountSavedDescription'),
      duration: 4000,
    });
  };

  const claimableColumns = [
    { key: 'projectName', label: t('claimPage.availableClaims.table.project') },
    { key: 'period', label: t('claimPage.availableClaims.table.period') },
    {
      key: 'amount',
      label: t('claimPage.availableClaims.table.amount'),
      render: (value: unknown, row: ClaimableAmount) =>
        `${row.currency} ${(value as number).toLocaleString()}`,
    },
    {
      key: 'status',
      label: t('claimPage.availableClaims.table.status'),
      render: (value: unknown) => (
        <span
          className={`px-3 py-1 rounded-xl text-xs font-bold ${
            (value as string) === 'available'
              ? 'bg-gradient-to-r from-success-100 to-success-200 text-success-700'
              : (value as string) === 'processing'
                ? 'bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-700'
                : 'bg-gradient-to-r from-muted-100 to-muted-200 text-muted-700'
          }`}
        >
          {(value as string).charAt(0).toUpperCase() +
            (value as string).slice(1)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: t('claimPage.availableClaims.table.actions'),
      render: (_: unknown, row: ClaimableAmount) => (
        <AnimatedButton
          size="sm"
          onClick={() => handleClaim(row)}
          disabled={row.status !== 'available'}
          ripple={row.status === 'available'}
        >
          {row.status === 'available'
            ? t('claimPage.availableClaims.claimButton')
            : t('claimPage.availableClaims.processingButton')}
        </AnimatedButton>
      ),
    },
  ];

  const historyColumns = [
    { key: 'projectName', label: t('claimPage.claimHistory.table.project') },
    { key: 'date', label: t('claimPage.claimHistory.table.date') },
    {
      key: 'amount',
      label: t('claimPage.claimHistory.table.amount'),
      render: (value: unknown, row: ClaimHistory) =>
        `${row.currency} ${(value as number).toLocaleString()}`,
    },
    {
      key: 'status',
      label: t('claimPage.claimHistory.table.status'),
      render: (value: unknown) => (
        <span
          className={`px-3 py-1 rounded-xl text-xs font-bold ${
            (value as string) === 'completed'
              ? 'bg-gradient-to-r from-success-100 to-success-200 text-success-700'
              : (value as string) === 'failed'
                ? 'bg-gradient-to-r from-accent-100 to-accent-200 text-accent-700'
                : 'bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-700'
          }`}
        >
          {(value as string).charAt(0).toUpperCase() +
            (value as string).slice(1)}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Fluid Background Shapes */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 right-16"></div>
          <div className="fluid-shape-2 top-1/2 left-10"></div>
          <div className="fluid-shape-3 bottom-32 right-1/4"></div>
          <div className="fluid-shape-1 bottom-10 left-16"></div>
        </div>

        <DashboardLayout userType="investor">
          <div className="animate-pulse space-y-8 p-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-feature h-32 rounded-2xl"></div>
              ))}
            </div>
            <div className="glass-feature h-96 rounded-2xl"></div>
          </div>
        </DashboardLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <DashboardLayout userType="investor">
        <PageTransition type="fade" duration={300}>
          <div className="space-y-8 p-6 relative z-10">
            {/* Header */}
            <ScrollReveal animation="slide-up" delay={0}>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    {t('claimPage.overview.title')}
                  </h1>
                  <p className="text-muted-foreground">
                    {t('claimPage.overview.subtitle')}
                  </p>
                </div>

                <AnimatedButton
                  onClick={() => setIsBankModalOpen(true)}
                  variant="outline"
                >
                  {bankAccount
                    ? t('claimPage.bankAccount.updateButton')
                    : t('claimPage.bankAccount.addButton')}
                </AnimatedButton>
              </div>
            </ScrollReveal>

            {/* Stats Cards */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              itemDelay={150}
              animation="slide-up"
            >
              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    {t('claimPage.availableClaims.statusAvailable')}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    IDR {totalClaimable.toLocaleString()}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    {t('claimPage.availableClaims.totalClaimable')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('claimPage.availableClaims.availableForWithdrawal')}
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t('claimPage.claimHistory.allTime')}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    IDR {totalClaimed.toLocaleString()}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    {t('claimPage.claimHistory.totalClaimed')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('claimPage.claimHistory.successfullyWithdrawn')}
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t('claimPage.availableClaims.statusProcessing')}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {
                      claimableAmounts.filter(c => c.status === 'processing')
                        .length
                    }
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    {t('claimPage.availableClaims.activeClaims')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('claimPage.availableClaims.currentlyProcessing')}
                  </p>
                </div>
              </div>
            </StaggeredList>

            {/* Bank Account Info */}
            {bankAccount && (
              <ScrollReveal animation="slide-up" delay={200}>
                <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                  <h3 className="text-lg font-semibold text-gradient mb-4">
                    {t('claimPage.bankAccount.title')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="glass-modern rounded-xl p-4">
                      <span className="text-primary-600 font-medium">
                        {t('claimPage.bankAccount.bankName')}:
                      </span>
                      <p className="font-bold text-primary-800 mt-1">
                        {bankAccount.bankName}
                      </p>
                    </div>
                    <div className="glass-modern rounded-xl p-4">
                      <span className="text-primary-600 font-medium">
                        {t('claimPage.bankAccount.accountNumber')}:
                      </span>
                      <p className="font-bold text-primary-800 mt-1">
                        ****{bankAccount.accountNumber.slice(-4)}
                      </p>
                    </div>
                    <div className="glass-modern rounded-xl p-4">
                      <span className="text-primary-600 font-medium">
                        {t('claimPage.bankAccount.accountHolder')}:
                      </span>
                      <p className="font-bold text-primary-800 mt-1">
                        {bankAccount.accountHolder}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* Claimable Amounts */}
            <ScrollReveal animation="slide-up" delay={300}>
              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gradient mb-2">
                    {t('claimPage.availableClaims.title')}
                  </h2>
                  <p className="text-primary-600">
                    {t('claimPage.availableClaims.description')}
                  </p>
                </div>
                {claimableAmounts.length > 0 ? (
                  <div className="glass-modern rounded-xl overflow-hidden">
                    <DataTable
                      data={claimableAmounts}
                      columns={claimableColumns}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 feature-icon mx-auto mb-6 hover-scale">
                      <DollarSign className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-gradient mb-3">
                      {t('claimPage.availableClaims.empty.title')}
                    </h3>
                    <p className="text-primary-600">
                      {t('claimPage.availableClaims.empty.description')}
                    </p>
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* Claim History */}
            <ScrollReveal animation="slide-up" delay={400}>
              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gradient mb-2">
                    {t('claimPage.claimHistory.title')}
                  </h2>
                  <p className="text-primary-600">
                    {t('claimPage.claimHistory.description')}
                  </p>
                </div>
                {claimHistory.length > 0 ? (
                  <div className="glass-modern rounded-xl overflow-hidden">
                    <DataTable data={claimHistory} columns={historyColumns} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 feature-icon mx-auto mb-6 hover-scale">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-gradient mb-3">
                      {t('claimPage.claimHistory.empty.title')}
                    </h3>
                    <p className="text-primary-600">
                      {t('claimPage.claimHistory.empty.description')}
                    </p>
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* Bank Account Modal */}
            {isBankModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="glass-feature rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gradient mb-2">
                        {t('claimPage.claimModal.bankAccountModal.title')}
                      </h2>
                      <p className="text-primary-600">
                        {t('claimPage.claimModal.bankAccountModal.description')}
                      </p>
                    </div>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => setIsBankModalOpen(false)}
                      className="w-10 h-10 p-0 text-lg"
                    >
                      ×
                    </AnimatedButton>
                  </div>

                  <div className="space-y-6">
                    <div className="glass-modern rounded-xl p-4">
                      <AnimatedInput
                        id="bankName"
                        label={t('claimPage.bankAccount.bankName')}
                        value={bankForm.bankName}
                        onChange={e =>
                          setBankForm(prev => ({
                            ...prev,
                            bankName: e.target.value,
                          }))
                        }
                        placeholder={t(
                          'claimPage.claimModal.bankAccountModal.bankNamePlaceholder'
                        )}
                      />
                    </div>

                    <div className="glass-modern rounded-xl p-4">
                      <AnimatedInput
                        id="accountNumber"
                        label={t('claimPage.bankAccount.accountNumber')}
                        value={bankForm.accountNumber}
                        onChange={e =>
                          setBankForm(prev => ({
                            ...prev,
                            accountNumber: e.target.value,
                          }))
                        }
                        placeholder={t(
                          'claimPage.claimModal.bankAccountModal.accountNumberPlaceholder'
                        )}
                      />
                    </div>

                    <div className="glass-modern rounded-xl p-4">
                      <AnimatedInput
                        id="accountHolder"
                        label={t('claimPage.bankAccount.accountHolder')}
                        value={bankForm.accountHolder}
                        onChange={e =>
                          setBankForm(prev => ({
                            ...prev,
                            accountHolder: e.target.value,
                          }))
                        }
                        placeholder={t(
                          'claimPage.claimModal.bankAccountModal.accountHolderPlaceholder'
                        )}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <AnimatedButton
                        onClick={handleBankAccountSave}
                        disabled={
                          !bankForm.bankName ||
                          !bankForm.accountNumber ||
                          !bankForm.accountHolder
                        }
                        className="flex-1"
                        loading={false}
                      >
                        {t('claimPage.claimModal.bankAccountModal.saveButton')}
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={() => setIsBankModalOpen(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        {t(
                          'claimPage.claimModal.bankAccountModal.cancelButton'
                        )}
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Claim Confirmation Modal */}
            {isClaimModalOpen && selectedClaim && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="glass-feature rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-fade-in-up">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gradient mb-2">
                        {t('claimPage.claimModal.title')}
                      </h2>
                      <p className="text-primary-600">
                        {t('claimPage.claimModal.description')}
                      </p>
                    </div>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => setIsClaimModalOpen(false)}
                      className="w-10 h-10 p-0 text-lg"
                    >
                      ×
                    </AnimatedButton>
                  </div>

                  <div className="space-y-6">
                    <div className="glass-modern rounded-xl p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-primary-600 font-medium">
                          {t('claimPage.claimModal.project')}:
                        </span>
                        <span className="font-bold text-primary-800">
                          {selectedClaim.projectName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-primary-600 font-medium">
                          {t('claimPage.claimModal.period')}:
                        </span>
                        <span className="font-bold text-primary-800">
                          {selectedClaim.period}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-primary-200">
                        <span className="text-primary-600 font-medium">
                          {t('claimPage.claimModal.amount')}:
                        </span>
                        <span className="font-bold text-2xl text-gradient">
                          {selectedClaim.currency}{' '}
                          {selectedClaim.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {bankAccount && (
                      <div className="glass-hero rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-semibold text-primary-700">
                            {t('claimPage.claimModal.withdrawalDestination')}
                          </span>
                        </div>
                        <p className="text-primary-800 font-medium">
                          {bankAccount.bankName} - ****
                          {bankAccount.accountNumber.slice(-4)} (
                          {bankAccount.accountHolder})
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <AnimatedButton
                        onClick={processClaim}
                        disabled={!bankAccount}
                        className="flex-1"
                        ripple
                      >
                        {bankAccount
                          ? t('claimPage.claimModal.confirmButton')
                          : t('claimPage.claimModal.addBankAccountFirst')}
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={() => setIsClaimModalOpen(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        {t('claimPage.claimModal.cancelButton')}
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PageTransition>
      </DashboardLayout>
    </div>
  );
}
