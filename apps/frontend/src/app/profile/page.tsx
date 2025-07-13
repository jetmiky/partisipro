'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  User,
  Wallet,
  Settings,
  Bell,
  Shield,
  FileText,
  Camera,
  Copy,
  Check,
  Edit3,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Smartphone,
  Monitor,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button, Card, DashboardLayout, Modal, Input } from '@/components/ui';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  kycStatus: 'verified' | 'pending' | 'rejected';
  registrationDate: string;
  avatar?: string;
  preferences: {
    riskTolerance: 'low' | 'medium' | 'high';
    categories: string[];
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      governance: boolean;
      portfolio: boolean;
      marketing: boolean;
    };
    reporting: {
      frequency: 'daily' | 'weekly' | 'monthly';
      format: 'email' | 'pdf' | 'both';
      language: 'id' | 'en';
    };
  };
  connectedWallets: {
    address: string;
    type: 'web3auth' | 'metamask';
    isActive: boolean;
    connectedDate: string;
  }[];
  security: {
    twoFactorEnabled: boolean;
    lastLogin: string;
    loginAttempts: number;
    securityQuestions: boolean;
  };
}

interface LoginActivity {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  timestamp: string;
  status: 'success' | 'failed';
}

const mockProfile: UserProfile = {
  id: '1',
  email: 'investor@example.com',
  fullName: 'Budi Santoso',
  phone: '+62 812-3456-7890',
  address: {
    street: 'Jl. Sudirman No. 123',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12190',
    country: 'Indonesia',
  },
  kycStatus: 'verified',
  registrationDate: '2023-08-15',
  avatar: undefined,
  preferences: {
    riskTolerance: 'medium',
    categories: ['Transportation', 'Energy'],
    notifications: {
      email: true,
      sms: true,
      push: true,
      governance: true,
      portfolio: true,
      marketing: false,
    },
    reporting: {
      frequency: 'monthly',
      format: 'both',
      language: 'id',
    },
  },
  connectedWallets: [
    {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      type: 'web3auth',
      isActive: true,
      connectedDate: '2023-08-15',
    },
  ],
  security: {
    twoFactorEnabled: true,
    lastLogin: '2024-01-10T14:30:00Z',
    loginAttempts: 0,
    securityQuestions: true,
  },
};

const mockLoginActivity: LoginActivity[] = [
  {
    id: '1',
    device: 'Chrome on Windows',
    location: 'Jakarta, Indonesia',
    ipAddress: '192.168.1.1',
    timestamp: '2024-01-10T14:30:00Z',
    status: 'success',
  },
  {
    id: '2',
    device: 'Mobile Safari on iPhone',
    location: 'Jakarta, Indonesia',
    ipAddress: '192.168.1.2',
    timestamp: '2024-01-09T10:15:00Z',
    status: 'success',
  },
  {
    id: '3',
    device: 'Chrome on Windows',
    location: 'Unknown Location',
    ipAddress: '10.0.0.1',
    timestamp: '2024-01-08T22:45:00Z',
    status: 'failed',
  },
];

// const indonesianProvinces = [
//   'DKI Jakarta',
//   'Jawa Barat',
//   'Jawa Tengah',
//   'Jawa Timur',
//   'Banten',
//   'Yogyakarta',
//   'Bali',
//   'Sumatera Utara',
//   'Sumatera Selatan',
//   'Sumatera Barat',
//   'Kalimantan Timur',
//   'Kalimantan Selatan',
//   'Sulawesi Selatan',
//   'Papua',
// ];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [activeTab, setActiveTab] = useState('account');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);

  editingSection;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getKYCStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(id);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      // console.error('Failed to copy text: ', err);
    }
  };

  // const handleProfileUpdate = (section: string, data: any) => {
  //   setProfile(prev => ({ ...prev, ...data }));
  //   setEditingSection(null);
  // };

  const handleNotificationChange = (
    key: keyof UserProfile['preferences']['notifications'],
    value: boolean
  ) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences.notifications,
          [key]: value,
        },
      },
    }));
  };

  const tabs = [
    { id: 'account', label: 'Account Information', icon: User },
    { id: 'wallet', label: 'Wallet Management', icon: Wallet },
    { id: 'preferences', label: 'Investment Preferences', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security Settings', icon: Shield },
    { id: 'reports', label: 'Reports & Tax', icon: FileText },
  ];

  const renderAccountSection = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {profile.fullName}
              </h2>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getKYCStatusColor(profile.kycStatus)}`}
              >
                {getKYCStatusLabel(profile.kycStatus)}
              </span>
            </div>
            <p className="text-gray-600 mb-1">{profile.email}</p>
            <p className="text-sm text-gray-500">
              Member since {formatDate(profile.registrationDate)}
            </p>
          </div>
          <div>
            <Button
              variant="secondary"
              onClick={() => setEditingSection('profile')}
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Personal Information</h3>
          <Button
            variant="secondary"
            onClick={() => setEditingSection('personal')}
            className="text-sm"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="font-medium text-gray-900">{profile.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium text-gray-900">
                {profile.address.street}, {profile.address.city},{' '}
                {profile.address.province} {profile.address.postalCode}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* KYC Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">KYC Verification</h3>
          {profile.kycStatus === 'verified' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Identity Verification</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getKYCStatusColor(profile.kycStatus)}`}
            >
              {getKYCStatusLabel(profile.kycStatus)}
            </span>
          </div>
          {profile.kycStatus === 'verified' && (
            <div className="text-sm text-gray-500">
              Your identity has been successfully verified. You can now
              participate in all investment activities.
            </div>
          )}
          {profile.kycStatus === 'pending' && (
            <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
              Your KYC application is under review. This process typically takes
              1-3 business days.
            </div>
          )}
          {profile.kycStatus === 'rejected' && (
            <div className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
              Your KYC application was rejected. Please contact support for
              assistance.
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderWalletSection = () => (
    <div className="space-y-6">
      {/* Connected Wallets */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Connected Wallets</h3>
          <Button variant="primary" className="text-sm">
            Connect New Wallet
          </Button>
        </div>
        <div className="space-y-4">
          {profile.connectedWallets.map((wallet, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 capitalize">
                      {wallet.type}
                    </p>
                    {wallet.isActive && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-mono">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Connected on {formatDate(wallet.connectedDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    copyToClipboard(wallet.address, wallet.address)
                  }
                  className="text-sm p-2"
                >
                  {copiedAddress === wallet.address ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="secondary" className="text-sm">
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Wallet Security */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Wallet Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Backup & Recovery</p>
                <p className="text-sm text-gray-600">
                  Secure your wallet with backup phrase
                </p>
              </div>
            </div>
            <Button variant="secondary" className="text-sm">
              View Backup
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">
                  Multi-Factor Authentication
                </p>
                <p className="text-sm text-gray-600">
                  Additional security for transactions
                </p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">Enabled</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderPreferencesSection = () => (
    <div className="space-y-6">
      {/* Risk Tolerance */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Risk Tolerance</h3>
        <div className="space-y-3">
          {[
            {
              value: 'low',
              label: 'Conservative',
              description: 'Prefer stable returns with minimal risk',
            },
            {
              value: 'medium',
              label: 'Moderate',
              description: 'Balanced approach with moderate risk and returns',
            },
            {
              value: 'high',
              label: 'Aggressive',
              description:
                'Higher risk tolerance for potentially higher returns',
            },
          ].map(option => (
            <label
              key={option.value}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="riskTolerance"
                value={option.value}
                checked={profile.preferences.riskTolerance === option.value}
                onChange={e =>
                  setProfile(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      riskTolerance: e.target.value as
                        | 'low'
                        | 'medium'
                        | 'high',
                    },
                  }))
                }
                className="text-primary-600"
              />
              <div>
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Investment Categories */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Preferred Investment Categories
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Transportation',
            'Energy',
            'Infrastructure',
            'Healthcare',
            'Education',
            'Technology',
            'Agriculture',
            'Tourism',
          ].map(category => (
            <label
              key={category}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={profile.preferences.categories.includes(category)}
                onChange={e => {
                  const newCategories = e.target.checked
                    ? [...profile.preferences.categories, category]
                    : profile.preferences.categories.filter(
                        c => c !== category
                      );
                  setProfile(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      categories: newCategories,
                    },
                  }));
                }}
                className="text-primary-600"
              />
              <span className="font-medium text-gray-900">{category}</span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {[
            {
              key: 'email',
              label: 'Email Notifications',
              description: 'Receive updates via email',
              icon: Mail,
            },
            {
              key: 'sms',
              label: 'SMS Notifications',
              description: 'Receive important alerts via SMS',
              icon: Smartphone,
            },
            {
              key: 'push',
              label: 'Push Notifications',
              description: 'Browser and mobile push notifications',
              icon: Monitor,
            },
            {
              key: 'governance',
              label: 'Governance Alerts',
              description: 'Voting reminders and governance updates',
              icon: Bell,
            },
            {
              key: 'portfolio',
              label: 'Portfolio Updates',
              description: 'Investment performance and return notifications',
              icon: CreditCard,
            },
            {
              key: 'marketing',
              label: 'Marketing Communications',
              description: 'New projects and promotional offers',
              icon: Bell,
            },
          ].map(item => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    profile.preferences.notifications[
                      item.key as keyof typeof profile.preferences.notifications
                    ]
                  }
                  onChange={e =>
                    handleNotificationChange(
                      item.key as keyof typeof profile.preferences.notifications,
                      e.target.checked
                    )
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Reporting Preferences */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Report Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              value={profile.preferences.reporting.frequency}
              onChange={e =>
                setProfile(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    reporting: {
                      ...prev.preferences.reporting,
                      frequency: e.target.value as
                        | 'daily'
                        | 'weekly'
                        | 'monthly',
                    },
                  },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <select
              value={profile.preferences.reporting.format}
              onChange={e =>
                setProfile(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    reporting: {
                      ...prev.preferences.reporting,
                      format: e.target.value as 'email' | 'pdf' | 'both',
                    },
                  },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="email">Email Only</option>
              <option value="pdf">PDF Download</option>
              <option value="both">Email + PDF</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={profile.preferences.reporting.language}
              onChange={e =>
                setProfile(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    reporting: {
                      ...prev.preferences.reporting,
                      language: e.target.value as 'id' | 'en',
                    },
                  },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Security Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-gray-600">
                  Additional security layer enabled
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setTwoFactorModalOpen(true)}
              className="text-sm"
            >
              Manage
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Password</p>
                <p className="text-sm text-gray-600">
                  Last changed 3 months ago
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setPasswordModalOpen(true)}
              className="text-sm"
            >
              Change Password
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Security Questions</p>
                <p className="text-sm text-gray-600">
                  Recovery questions configured
                </p>
              </div>
            </div>
            <Button variant="secondary" className="text-sm">
              Update
            </Button>
          </div>
        </div>
      </Card>

      {/* Login Activity */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Recent Login Activity
        </h3>
        <div className="space-y-3">
          {mockLoginActivity.map(activity => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <div>
                  <p className="font-medium text-gray-900">{activity.device}</p>
                  <p className="text-sm text-gray-600">{activity.location}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(activity.timestamp)}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {activity.status === 'success' ? 'Success' : 'Failed'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Button variant="secondary" className="text-sm">
            View All Activity
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderReportsSection = () => (
    <div className="space-y-6">
      {/* Tax Information */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Tax Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Residency
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="ID">Indonesia</option>
              <option value="SG">Singapore</option>
              <option value="MY">Malaysia</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax ID (NPWP)
            </label>
            <Input type="text" placeholder="Enter your NPWP number" />
          </div>
        </div>
      </Card>

      {/* Available Reports */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Available Reports</h3>
        <div className="space-y-3">
          {[
            {
              title: 'Annual Investment Summary 2023',
              date: '2024-01-01',
              type: 'Tax Report',
            },
            {
              title: 'Q4 2023 Portfolio Performance',
              date: '2023-12-31',
              type: 'Performance',
            },
            {
              title: 'Transaction History - December 2023',
              date: '2023-12-31',
              type: 'Transactions',
            },
            {
              title: 'Profit Distribution Summary 2023',
              date: '2023-12-31',
              type: 'Distributions',
            },
          ].map((report, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{report.title}</p>
                  <p className="text-sm text-gray-600">
                    {report.type} • Generated on {formatDate(report.date)}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Generate Custom Report */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Generate Custom Report
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="portfolio">Portfolio Summary</option>
              <option value="transactions">Transaction History</option>
              <option value="tax">Tax Summary</option>
              <option value="performance">Performance Analysis</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="ytd">Year to Date</option>
              <option value="last-year">Last Year</option>
              <option value="last-quarter">Last Quarter</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="primary" className="w-full">
              Generate Report
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <DashboardLayout userType="investor">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your account information, preferences, and security settings
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <Card className="p-2">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                    <ChevronRight
                      className={`w-4 h-4 ml-auto transition-transform ${
                        activeTab === tab.id ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'account' && renderAccountSection()}
            {activeTab === 'wallet' && renderWalletSection()}
            {activeTab === 'preferences' && renderPreferencesSection()}
            {activeTab === 'notifications' && renderNotificationsSection()}
            {activeTab === 'security' && renderSecuritySection()}
            {activeTab === 'reports' && renderReportsSection()}
          </div>
        </div>

        {/* Password Change Modal */}
        {passwordModalOpen && (
          <Modal
            isOpen={passwordModalOpen}
            onClose={() => setPasswordModalOpen(false)}
            title="Change Password"
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <Input type="password" placeholder="Enter new password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <Input type="password" placeholder="Confirm new password" />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setPasswordModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1">
                  Update Password
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Two-Factor Authentication Modal */}
        {twoFactorModalOpen && (
          <Modal
            isOpen={twoFactorModalOpen}
            onClose={() => setTwoFactorModalOpen(false)}
            title="Two-Factor Authentication"
          >
            <div className="p-6">
              <div className="text-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2FA is Currently Enabled
                </h3>
                <p className="text-gray-600">
                  Your account is protected with two-factor authentication
                </p>
              </div>
              <div className="space-y-3">
                <Button variant="secondary" className="w-full">
                  View Recovery Codes
                </Button>
                <Button variant="secondary" className="w-full">
                  Reset Authenticator
                </Button>
                <Button variant="accent" className="w-full">
                  Disable 2FA
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
