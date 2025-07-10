'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface MultiSigWallet {
  address: string;
  name: string;
  threshold: number;
  signers: string[];
  isConnected: boolean;
}

interface SignatureStatus {
  signer: string;
  signed: boolean;
  timestamp?: string;
}

export default function SPVAuthPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [wallet, setWallet] = useState<MultiSigWallet | null>(null);
  const [signatures, setSignatures] = useState<SignatureStatus[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [connectionStep, setConnectionStep] = useState<
    'input' | 'connecting' | 'verification' | 'connected'
  >('input');
  const [verificationMessage, setVerificationMessage] = useState('');

  // TODO: Replace with real multi-sig wallet integration (Safe wallet)
  const connectMultiSigWallet = async () => {
    if (!walletAddress) return;

    setIsConnecting(true);
    setConnectionStep('connecting');

    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock multi-sig wallet data
    const mockWallet: MultiSigWallet = {
      address: walletAddress,
      name: 'SPV Infrastructure Ltd.',
      threshold: 2,
      signers: [
        '0x1234567890123456789012345678901234567890',
        '0x2345678901234567890123456789012345678901',
        '0x3456789012345678901234567890123456789012',
      ],
      isConnected: true,
    };

    const mockSignatures: SignatureStatus[] = [
      {
        signer: '0x1234567890123456789012345678901234567890',
        signed: true,
        timestamp: new Date().toISOString(),
      },
      {
        signer: '0x2345678901234567890123456789012345678901',
        signed: false,
      },
      {
        signer: '0x3456789012345678901234567890123456789012',
        signed: false,
      },
    ];

    setWallet(mockWallet);
    setSignatures(mockSignatures);
    setConnectionStep('verification');
    setVerificationMessage(
      'Please have the required signers approve this authentication session.'
    );
    setIsConnecting(false);
  };

  const simulateSignatureApproval = async () => {
    // Simulate additional signature
    const currentSigned = signatures.filter(s => s.signed).length;

    if (currentSigned < (wallet?.threshold || 2)) {
      setSignatures(prev => {
        const updated = [...prev];
        const nextUnsigned = updated.findIndex(s => !s.signed);
        if (nextUnsigned !== -1) {
          updated[nextUnsigned] = {
            ...updated[nextUnsigned],
            signed: true,
            timestamp: new Date().toISOString(),
          };
        }
        return updated;
      });

      // Check if threshold is met
      const newSignedCount = signatures.filter(s => s.signed).length + 1;
      if (newSignedCount >= (wallet?.threshold || 2)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setConnectionStep('connected');
        setIsConnected(true);
        setVerificationMessage(
          'Authentication successful! You can now access SPV features.'
        );
      }
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    setSignatures([]);
    setIsConnected(false);
    setConnectionStep('input');
    setWalletAddress('');
    setVerificationMessage('');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getSignedCount = () => signatures.filter(s => s.signed).length;
  const getRequiredSignatures = () => wallet?.threshold || 2;
  const isThresholdMet = () => getSignedCount() >= getRequiredSignatures();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            SPV Authentication
          </h1>
          <p className="text-gray-600 mt-2">
            Connect your multi-signature wallet to access SPV project management
            features
          </p>
        </div>

        {/* Connection Step: Input */}
        {connectionStep === 'input' && (
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Connect Multi-Sig Wallet
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your Safe (Gnosis Safe) wallet address to begin
                  authentication. This wallet must be whitelisted by platform
                  administrators.
                </p>
              </div>

              <Input
                label="Multi-Sig Wallet Address"
                value={walletAddress}
                onChange={e => setWalletAddress(e.target.value)}
                placeholder="0x1234...5678"
                className="font-mono"
              />

              <Button
                onClick={connectMultiSigWallet}
                disabled={!walletAddress || isConnecting}
                className="w-full bg-primary-500 hover:bg-primary-600"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>

              <div className="text-xs text-gray-500 text-center">
                <p>
                  Need help?{' '}
                  <a
                    href="/contact"
                    className="text-primary-600 hover:underline"
                  >
                    Contact Support
                  </a>
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Connection Step: Connecting */}
        {connectionStep === 'connecting' && (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <h2 className="text-xl font-semibold text-gray-900">
                Connecting Wallet
              </h2>
              <p className="text-gray-600">
                Verifying wallet address and checking whitelist status...
              </p>
            </div>
          </Card>
        )}

        {/* Connection Step: Verification */}
        {connectionStep === 'verification' && wallet && (
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Signature Verification
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {verificationMessage}
                </p>
              </div>

              {/* Wallet Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Wallet:</span>
                  <span className="font-mono text-sm">
                    {formatAddress(wallet.address)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Organization:</span>
                  <span className="font-medium">{wallet.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Required Signatures:</span>
                  <span className="font-medium">
                    {wallet.threshold} of {wallet.signers.length}
                  </span>
                </div>
              </div>

              {/* Signature Progress */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Signatures ({getSignedCount()}/{getRequiredSignatures()})
                  </span>
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${
                      isThresholdMet()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {isThresholdMet() ? 'Threshold Met' : 'Pending'}
                  </span>
                </div>

                <div className="space-y-2">
                  {signatures.map((sig, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            sig.signed ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        ></div>
                        <span className="font-mono text-sm">
                          {formatAddress(sig.signer)}
                        </span>
                      </div>
                      <div className="text-right">
                        {sig.signed ? (
                          <div className="text-xs text-green-600">
                            ✓ Signed
                            {sig.timestamp && (
                              <div className="text-gray-500">
                                {new Date(sig.timestamp).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Pending</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulate Signature Button (for demo purposes) */}
              {!isThresholdMet() && (
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 mb-3 text-center">
                    Demo: Click to simulate signature approval
                  </p>
                  <Button
                    onClick={simulateSignatureApproval}
                    variant="outline"
                    className="w-full border-secondary-500 text-secondary-600 hover:bg-secondary-50"
                  >
                    Simulate Next Signature
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  className="flex-1"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Connection Step: Connected */}
        {connectionStep === 'connected' && wallet && isConnected && (
          <Card className="p-6">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Authentication Successful!
                </h2>
                <p className="text-gray-600 mb-4">{verificationMessage}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Connected Wallet:</span>
                  <span className="font-mono text-sm">
                    {formatAddress(wallet.address)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Organization:</span>
                  <span className="font-medium">{wallet.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Signatures:</span>
                  <span className="font-medium text-green-600">
                    ✓ {getSignedCount()}/{getRequiredSignatures()} confirmed
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => (window.location.href = '/spv/dashboard')}
                  className="flex-1 bg-primary-500 hover:bg-primary-600"
                >
                  Go to SPV Dashboard
                </Button>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  className="flex-1"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Partisipro uses Safe (Gnosis Safe) multi-signature wallets for
            enhanced security.
          </p>
        </div>
      </div>
    </div>
  );
}
