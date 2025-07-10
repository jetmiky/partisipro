'use client';

import { useState, useEffect } from 'react';
import {
  DashboardLayout,
  StatsCard,
  DataTable,
  Button,
  Modal,
  Input,
  Card,
} from '@/components/ui';

interface ClaimableAmount {
  projectId: string;
  projectName: string;
  amount: number;
  currency: string;
  period: string;
  status: 'available' | 'pending' | 'processing';
}

interface ClaimHistory {
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
    console.log('Processing claim for:', selectedClaim);

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
  };

  const handleBankAccountSave = async () => {
    // TODO: Replace with real bank account update API
    console.log('Saving bank account:', bankForm);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setBankAccount(bankForm);
    setIsBankModalOpen(false);
  };

  const claimableColumns = [
    { key: 'projectName', label: 'Project' },
    { key: 'period', label: 'Period' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number, row: ClaimableAmount) =>
        `${row.currency} ${value.toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'available'
              ? 'bg-green-100 text-green-800'
              : value === 'processing'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: ClaimableAmount) => (
        <Button
          size="sm"
          onClick={() => handleClaim(row)}
          disabled={row.status !== 'available'}
          className="bg-primary-500 hover:bg-primary-600"
        >
          {row.status === 'available' ? 'Claim' : 'Processing'}
        </Button>
      ),
    },
  ];

  const historyColumns = [
    { key: 'projectName', label: 'Project' },
    { key: 'date', label: 'Date' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number, row: ClaimHistory) =>
        `${row.currency} ${value.toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'completed'
              ? 'bg-green-100 text-green-800'
              : value === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-96 rounded-lg"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="investor">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profit Claims</h1>
            <p className="text-gray-600 mt-1">
              Claim your profit distributions from infrastructure investments
            </p>
          </div>

          <Button
            onClick={() => setIsBankModalOpen(true)}
            variant="outline"
            className="border-primary-500 text-primary-600 hover:bg-primary-50"
          >
            {bankAccount ? 'Update Bank Account' : 'Add Bank Account'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Claimable"
            value={`IDR ${totalClaimable.toLocaleString()}`}
            subtitle="Available for withdrawal"
            changeType="increase"
          />
          <StatsCard
            title="Total Claimed"
            value={`IDR ${totalClaimed.toLocaleString()}`}
            subtitle="Successfully withdrawn"
            changeType="neutral"
          />
          <StatsCard
            title="Active Claims"
            value={claimableAmounts
              .filter(c => c.status === 'processing')
              .length.toString()}
            subtitle="Currently processing"
            changeType="neutral"
          />
        </div>

        {/* Bank Account Info */}
        {bankAccount && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Withdrawal Bank Account
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Bank:</span>
                <p className="font-medium">{bankAccount.bankName}</p>
              </div>
              <div>
                <span className="text-gray-500">Account Number:</span>
                <p className="font-medium">
                  ****{bankAccount.accountNumber.slice(-4)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Account Holder:</span>
                <p className="font-medium">{bankAccount.accountHolder}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Claimable Amounts */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available Claims
          </h3>
          {claimableAmounts.length > 0 ? (
            <DataTable data={claimableAmounts} columns={claimableColumns} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              No claimable amounts available
            </div>
          )}
        </Card>

        {/* Claim History */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Claim History
          </h3>
          {claimHistory.length > 0 ? (
            <DataTable data={claimHistory} columns={historyColumns} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              No claim history available
            </div>
          )}
        </Card>

        {/* Bank Account Modal */}
        <Modal
          isOpen={isBankModalOpen}
          onClose={() => setIsBankModalOpen(false)}
          title="Bank Account Information"
        >
          <div className="space-y-4">
            <Input
              label="Bank Name"
              value={bankForm.bankName}
              onChange={e =>
                setBankForm(prev => ({ ...prev, bankName: e.target.value }))
              }
              placeholder="e.g., Bank Central Asia"
            />
            <Input
              label="Account Number"
              value={bankForm.accountNumber}
              onChange={e =>
                setBankForm(prev => ({
                  ...prev,
                  accountNumber: e.target.value,
                }))
              }
              placeholder="Enter your account number"
            />
            <Input
              label="Account Holder Name"
              value={bankForm.accountHolder}
              onChange={e =>
                setBankForm(prev => ({
                  ...prev,
                  accountHolder: e.target.value,
                }))
              }
              placeholder="Enter account holder name"
            />
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleBankAccountSave}
                disabled={
                  !bankForm.bankName ||
                  !bankForm.accountNumber ||
                  !bankForm.accountHolder
                }
                className="flex-1 bg-primary-500 hover:bg-primary-600"
              >
                Save Bank Account
              </Button>
              <Button
                onClick={() => setIsBankModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Claim Confirmation Modal */}
        <Modal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          title="Confirm Claim"
        >
          {selectedClaim && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Project:</span>
                  <span className="font-medium">
                    {selectedClaim.projectName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Period:</span>
                  <span className="font-medium">{selectedClaim.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-lg">
                    {selectedClaim.currency}{' '}
                    {selectedClaim.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {bankAccount && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Withdrawal to:</strong> {bankAccount.bankName} -
                    ****{bankAccount.accountNumber.slice(-4)} (
                    {bankAccount.accountHolder})
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={processClaim}
                  disabled={!bankAccount}
                  className="flex-1 bg-primary-500 hover:bg-primary-600"
                >
                  {bankAccount ? 'Confirm Claim' : 'Add Bank Account First'}
                </Button>
                <Button
                  onClick={() => setIsClaimModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
