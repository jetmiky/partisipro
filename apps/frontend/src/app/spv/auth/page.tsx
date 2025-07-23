'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { ScrollReveal } from '@/components/ui/ScrollAnimations';
import { PageTransition } from '@/components/ui/PageTransition';
import { toast } from '@/components/ui/AnimatedNotification';

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
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [wallet, setWallet] = useState<MultiSigWallet | null>(null);
  const [signatures, setSignatures] = useState<SignatureStatus[]>([]);
  const [walletAddress, setWalletAddress] = useState(
    '0x215033cdE0619D60B7352348F4598316Cc39bC6E'
  );
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
      name: 'PT. Special Purpose Vehicle',
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
        await new Promise(resolve => setTimeout(resolve, 3000));
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
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <PageTransition type="fade" duration={300}>
        <div className="max-w-lg w-full relative z-10">
          {/* Header */}
          <ScrollReveal animation="slide-up" delay={0}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gradient mb-3">
                SPV Authentication
              </h1>
              <p className="text-muted-foreground">
                Connect your multi-signature wallet to access SPV project
                management features
              </p>
            </div>
          </ScrollReveal>

          {/* Connection Step: Input */}
          {connectionStep === 'input' && (
            <ScrollReveal animation="slide-up" delay={200}>
              <div className="glass-feature rounded-2xl p-8 hover-lift">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gradient mb-4">
                      Connect Multi-Sig Wallet
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter your Safe (Gnosis Safe) wallet address to begin
                      authentication. This wallet must be whitelisted by
                      platform administrators.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <AnimatedInput
                      id="walletAddress"
                      label="Multi-Sig Wallet Address"
                      value={walletAddress}
                      onChange={e => setWalletAddress(e.target.value)}
                      placeholder="0x1234...5678"
                      className="font-mono"
                    />
                  </div>

                  <AnimatedButton
                    onClick={connectMultiSigWallet}
                    disabled={!walletAddress || isConnecting}
                    className="w-full"
                    loading={isConnecting}
                    ripple
                  >
                    Connect Wallet
                  </AnimatedButton>

                  <div className="text-xs text-muted-foreground text-center">
                    <p className="text-xs">
                      Need help?{' '}
                      <a
                        href="/contact"
                        className="text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        Contact Support
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Connection Step: Connecting */}
          {connectionStep === 'connecting' && (
            <ScrollReveal animation="fade" delay={100}>
              <div className="glass-feature rounded-2xl p-8">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 gradient-brand-hero rounded-xl flex items-center justify-center mx-auto animate-float">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                  <h2 className="text-xl font-semibold text-gradient">
                    Connecting Wallet
                  </h2>
                  <p className="text-muted-foreground">
                    Verifying wallet address and checking whitelist status...
                  </p>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Connection Step: Verification */}
          {connectionStep === 'verification' && wallet && (
            <ScrollReveal animation="slide-up" delay={200}>
              <div className="glass-feature rounded-2xl p-8 hover-lift">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gradient mb-3">
                      Signature Verification
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {verificationMessage}
                    </p>
                  </div>

                  {/* Wallet Info */}
                  <div className="glass-modern rounded-xl p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600 font-medium">
                        Wallet:
                      </span>
                      <span className="font-mono text-sm text-primary-700">
                        {formatAddress(wallet.address)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600 font-medium">
                        Organization:
                      </span>
                      <span className="font-semibold text-primary-800">
                        {wallet.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600 font-medium">
                        Required Signatures:
                      </span>
                      <span className="font-semibold text-gradient">
                        {wallet.threshold} of {wallet.signers.length}
                      </span>
                    </div>
                  </div>

                  {/* Signature Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-primary-700">
                        Signatures ({getSignedCount()}/{getRequiredSignatures()}
                        )
                      </span>
                      <span
                        className={`text-sm px-3 py-1 rounded-full glass-modern font-medium ${
                          isThresholdMet()
                            ? 'text-success-700 bg-success-50 border border-success-200'
                            : 'text-warning-700 bg-warning-50 border border-warning-200'
                        }`}
                      >
                        {isThresholdMet() ? 'Threshold Met' : 'Pending'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {signatures.map((sig, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 glass-modern rounded-xl hover-scale transition-all duration-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                sig.signed
                                  ? 'bg-success-500 border-success-500'
                                  : 'bg-white border-primary-300'
                              }`}
                            >
                              {sig.signed && (
                                <svg
                                  className="w-2 h-2 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="font-mono text-sm text-primary-700">
                              {formatAddress(sig.signer)}
                            </span>
                          </div>
                          <div className="text-right">
                            {sig.signed ? (
                              <div className="text-xs text-success-600 font-medium">
                                ✓ Signed
                                {sig.timestamp && (
                                  <div className="text-muted-foreground">
                                    {new Date(
                                      sig.timestamp
                                    ).toLocaleTimeString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulate Signature Button (for demo purposes) */}
                  {!isThresholdMet() && (
                    <div className="border-t border-primary-200 pt-6">
                      <p className="text-xs text-muted-foreground mb-4 text-center">
                        Demo: Click to simulate signature approval
                      </p>
                      <AnimatedButton
                        onClick={simulateSignatureApproval}
                        variant="primary"
                        className="w-full"
                        ripple
                      >
                        Simulate Next Signature
                      </AnimatedButton>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <AnimatedButton
                      onClick={disconnectWallet}
                      variant="outline"
                      className="flex-1"
                      ripple
                    >
                      Disconnect
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Connection Step: Connected */}
          {connectionStep === 'connected' && wallet && isConnected && (
            <ScrollReveal animation="scale" delay={300}>
              <div className="glass-feature rounded-2xl p-8 hover-lift">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto animate-float shadow-lg">
                    <svg
                      className="w-10 h-10 text-white"
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
                    <h2 className="text-xl font-semibold text-gradient mb-3">
                      Authentication Successful!
                    </h2>
                    <p className="text-base text-muted-foreground mb-4">
                      {verificationMessage}
                    </p>
                  </div>

                  <div className="glass-modern rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600 font-medium">
                        Connected Wallet:
                      </span>
                      <span className="font-mono text-sm text-primary-700">
                        {formatAddress(wallet.address)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600 font-medium">
                        Organization:
                      </span>
                      <span className="font-semibold text-primary-800">
                        {wallet.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600 font-medium">
                        Signatures:
                      </span>
                      <span className="font-semibold text-success-600">
                        ✓ {getSignedCount()}/{getRequiredSignatures()} confirmed
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <AnimatedButton
                      onClick={() => {
                        toast.success('Redirecting to SPV Dashboard...');
                        router.push('/spv/dashboard');
                      }}
                      className="flex-1"
                      ripple
                    >
                      Go to SPV Dashboard
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={disconnectWallet}
                      variant="outline"
                      className="flex-1"
                      ripple
                    >
                      Disconnect
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Footer */}
          <ScrollReveal animation="fade" delay={500}>
            <div className="text-center mt-8 text-muted-foreground">
              <p className="text-sm">
                Partisipro uses Safe (Gnosis Safe) multi-signature wallets for
                enhanced and extra security.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </PageTransition>
    </div>
  );
}
