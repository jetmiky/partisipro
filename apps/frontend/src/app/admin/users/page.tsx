'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Shield,
  User as UserIcon,
  Building,
  Clock,
  RefreshCw,
  Download,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { StatsCard, DashboardLayout, DataTable, Modal } from '@/components/ui';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { toast } from '@/components/ui/AnimatedNotification';
import type { Column } from '@/components/ui/DataTable';

// User types
interface User extends Record<string, unknown> {
  id: string;
  email: string;
  role: 'investor' | 'spv' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  name: string;
  phone?: string;
  walletAddress?: string;
  companyName?: string;
  location?: string;
  createdAt: string;
  lastLogin?: string;
  kycStatus?: 'approved' | 'pending' | 'rejected';
  projectsCreated?: number;
  totalInvestments?: number;
  verificationLevel?: 'basic' | 'advanced' | 'institutional';
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  totalInvestors: number;
  totalSPVs: number;
  totalAdmins: number;
  newUsersToday: number;
}

interface CreateUserRequest {
  email: string;
  role: 'investor' | 'spv' | 'admin';
  name: string;
  phone?: string;
  walletAddress?: string;
  companyName?: string;
  location?: string;
}

// Mock data - replace with real API calls
const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@gmail.com',
    role: 'investor',
    status: 'active',
    name: 'John Doe',
    phone: '+62 812 3456 7890',
    walletAddress: '0x1234567890123456789012345678901234567890',
    location: 'Jakarta, Indonesia',
    createdAt: '2024-01-15T10:30:00Z',
    lastLogin: '2024-01-18T14:20:00Z',
    kycStatus: 'approved',
    totalInvestments: 25000000,
    verificationLevel: 'advanced',
  },
  {
    id: '2',
    email: 'infrastructure@ptabc.com',
    role: 'spv',
    status: 'active',
    name: 'Ahmad Wijaya',
    phone: '+62 811 2345 6789',
    walletAddress: '0x2345678901234567890123456789012345678901',
    companyName: 'PT ABC Infrastructure',
    location: 'Surabaya, Indonesia',
    createdAt: '2024-01-10T09:15:00Z',
    lastLogin: '2024-01-18T11:45:00Z',
    kycStatus: 'approved',
    projectsCreated: 3,
    verificationLevel: 'institutional',
  },
  {
    id: '3',
    email: 'admin@partisipro.com',
    role: 'admin',
    status: 'active',
    name: 'Sarah Administrator',
    phone: '+62 810 1234 5678',
    location: 'Jakarta, Indonesia',
    createdAt: '2024-01-01T08:00:00Z',
    lastLogin: '2024-01-18T16:30:00Z',
    verificationLevel: 'institutional',
  },
];

const mockStats: UserStats = {
  totalUsers: 1247,
  activeUsers: 1180,
  suspendedUsers: 42,
  pendingUsers: 25,
  totalInvestors: 1156,
  totalSPVs: 47,
  totalAdmins: 3,
  newUsersToday: 8,
};

const formatCurrency = (amount: number) => {
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}M`;
  }
  return `Rp ${amount.toLocaleString()}`;
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInHours = Math.floor(
    (now.getTime() - time.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

const getRoleIcon = (role: User['role']) => {
  switch (role) {
    case 'investor':
      return <UserIcon className="h-4 w-4" />;
    case 'spv':
      return <Building className="h-4 w-4" />;
    case 'admin':
      return <Shield className="h-4 w-4" />;
    default:
      return <UserIcon className="h-4 w-4" />;
  }
};

const getRoleColor = (role: User['role']) => {
  switch (role) {
    case 'investor':
      return 'text-primary-600 bg-primary-50 border-primary-200';
    case 'spv':
      return 'text-secondary-600 bg-secondary-50 border-secondary-200';
    case 'admin':
      return 'text-accent-600 bg-accent-50 border-accent-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusColor = (status: User['status']) => {
  switch (status) {
    case 'active':
      return 'text-support-600 bg-support-50 border-support-200';
    case 'suspended':
      return 'text-accent-600 bg-accent-50 border-accent-200';
    case 'pending':
      return 'text-warning-600 bg-warning-50 border-warning-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusIcon = (status: User['status']) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4" />;
    case 'suspended':
      return <XCircle className="h-4 w-4" />;
    case 'pending':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export default function AdminUsersPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [stats, setStats] = useState<UserStats>(mockStats);
  const [isLoading, setIsLoading] = useState(false);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    'all' | 'investor' | 'spv' | 'admin'
  >('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'suspended' | 'pending'
  >('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  // const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWhitelistModalOpen, setIsWhitelistModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create user form
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    email: '',
    role: 'investor',
    name: '',
    phone: '',
    walletAddress: '',
    companyName: '',
    location: '',
  });

  // Authentication guard
  useEffect(() => {
    // if (!isAuthenticated || !isAdmin) {
    //   window.location.href = '/auth/signin';
    //   return;
    // }
  }, [isAuthenticated, isAdmin]);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.companyName &&
        user.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async () => {
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newUser: User = {
        id: Date.now().toString(),
        ...createForm,
        status: 'active',
        createdAt: new Date().toISOString(),
        kycStatus: 'pending',
        verificationLevel: 'basic',
      };

      setUsers(prev => [newUser, ...prev]);
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + 1,
        activeUsers: prev.activeUsers + 1,
        [`total${createForm.role.charAt(0).toUpperCase() + createForm.role.slice(1)}s` as keyof UserStats]:
          (prev[
            `total${createForm.role.charAt(0).toUpperCase() + createForm.role.slice(1)}s` as keyof UserStats
          ] as number) + 1,
      }));

      setCreateForm({
        email: '',
        role: 'investor',
        name: '',
        phone: '',
        walletAddress: '',
        companyName: '',
        location: '',
      });

      setIsCreateModalOpen(false);
      toast.success('User created successfully!');
    } catch (err) {
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, status: 'suspended' } : user
        )
      );

      toast.success('User suspended successfully');
    } catch (err) {
      toast.error('Failed to suspend user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, status: 'active' } : user
        )
      );

      toast.success('User activated successfully');
    } catch (err) {
      toast.error('Failed to activate user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(prev => prev.filter(user => user.id !== userId));
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers - 1,
      }));

      toast.success('User deleted successfully');
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhitelistWallet = async (
    userId: string,
    walletAddress: string
  ) => {
    try {
      setIsLoading(true);
      // Simulate API call to whitelist wallet on blockchain
      await new Promise(resolve => setTimeout(resolve, 2000));

      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, walletAddress, status: 'active' as const }
            : user
        )
      );

      toast.success('Wallet whitelisted successfully on blockchain');
    } catch (err) {
      toast.error('Failed to whitelist wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const userColumns: Column<User>[] = [
    {
      key: 'name',
      label: 'User',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-medium">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
            {row.companyName && (
              <div className="text-xs text-gray-400">{row.companyName}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (_, row) => (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(row.role)}`}
        >
          {getRoleIcon(row.role)}
          <span className="capitalize">{row.role}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(row.status)}`}
        >
          {getStatusIcon(row.status)}
          <span className="capitalize">{row.status}</span>
        </div>
      ),
    },
    {
      key: 'walletAddress',
      label: 'Wallet',
      render: (_, row) => (
        <div className="font-mono text-sm text-gray-600">
          {row.walletAddress
            ? `${row.walletAddress.slice(0, 6)}...${row.walletAddress.slice(-4)}`
            : 'Not Set'}
        </div>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (_, row) => (
        <div className="text-sm text-gray-600">
          {row.lastLogin ? formatTimeAgo(row.lastLogin) : 'Never'}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedUser(row);
              setIsViewModalOpen(true);
            }}
            ripple
          >
            <Eye className="h-4 w-4" />
          </AnimatedButton>
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedUser(row);
              // setIsEditModalOpen(true);
            }}
            ripple
          >
            <Edit className="h-4 w-4" />
          </AnimatedButton>
          {row.role === 'spv' && (
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedUser(row);
                setIsWhitelistModalOpen(true);
              }}
              ripple
              className="text-primary-600 hover:text-primary-700"
            >
              <Shield className="h-4 w-4" />
            </AnimatedButton>
          )}
          {row.status === 'active' ? (
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={() => handleSuspendUser(row.id)}
              ripple
            >
              Suspend
            </AnimatedButton>
          ) : (
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={() => handleActivateUser(row.id)}
              ripple
            >
              Activate
            </AnimatedButton>
          )}
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => handleDeleteUser(row.id)}
            className="text-accent-600 hover:text-accent-700"
            ripple
          >
            <Trash2 className="h-4 w-4" />
          </AnimatedButton>
        </div>
      ),
    },
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    toast.info('Refreshing user data...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    toast.success('User data refreshed!');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <DashboardLayout userType="admin">
        <PageTransition type="fade" duration={300}>
          <div className="space-y-8 relative z-10">
            {/* Header */}
            <ScrollReveal animation="fade" delay={0} duration={800}>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    User Management
                  </h1>
                  <p className="text-muted-foreground">
                    Manage platform users, SPVs, and administrators
                  </p>
                </div>
                <div className="flex gap-3">
                  <AnimatedButton
                    onClick={handleRefresh}
                    disabled={isLoading}
                    loading={isLoading}
                    ripple
                    className="btn-modern btn-modern-secondary hover-lift"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                    />
                    Refresh
                  </AnimatedButton>
                  <AnimatedButton
                    ripple
                    className="btn-modern btn-modern-secondary hover-lift"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => setIsCreateModalOpen(true)}
                    ripple
                    className="btn-modern btn-modern-primary hover-lift"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </AnimatedButton>
                </div>
              </div>
            </ScrollReveal>

            {/* Stats Cards */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              itemDelay={150}
              animation="slide-up"
            >
              <StatsCard
                title="Total Users"
                value={stats.totalUsers.toString()}
                icon={<UserIcon className="w-4 h-4" />}
                change={12.5}
                changeType="increase"
                description="All platform users"
              />
              <StatsCard
                title="Active Users"
                value={stats.activeUsers.toString()}
                icon={<CheckCircle className="w-4 h-4" />}
                change={8.3}
                changeType="increase"
                description="Currently active"
              />
              <StatsCard
                title="SPVs"
                value={stats.totalSPVs.toString()}
                icon={<Building className="w-4 h-4" />}
                change={15.2}
                changeType="increase"
                description="Project companies"
              />
              <StatsCard
                title="New Today"
                value={stats.newUsersToday.toString()}
                icon={<UserPlus className="w-4 h-4" />}
                change={5.1}
                changeType="increase"
                description="New registrations"
              />
            </StaggeredList>

            {/* Filters */}
            <ScrollReveal animation="slide-up" delay={200} duration={600}>
              <div className="glass-modern p-6 rounded-xl">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users, emails, or companies..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    <option value="investor">Investors</option>
                    <option value="spv">SPVs</option>
                    <option value="admin">Admins</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </ScrollReveal>

            {/* Users Table */}
            <ScrollReveal animation="slide-up" delay={300} duration={600}>
              <div className="glass-modern p-6 rounded-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                      Users ({filteredUsers.length})
                    </h2>
                    <p className="text-gray-600">
                      Manage all platform users and their permissions
                    </p>
                  </div>
                </div>

                <DataTable<User> columns={userColumns} data={filteredUsers} />
              </div>
            </ScrollReveal>

            {/* Create User Modal */}
            <Modal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              title="Create New User"
              size="lg"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <AnimatedInput
                      value={createForm.name}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <AnimatedInput
                      type="email"
                      value={createForm.email}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={createForm.role}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          role: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="investor">Investor</option>
                      <option value="spv">SPV (Project Company)</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <AnimatedInput
                      type="tel"
                      value={createForm.phone}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+62 812 3456 7890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wallet Address
                    </label>
                    <AnimatedInput
                      value={createForm.walletAddress}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          walletAddress: e.target.value,
                        }))
                      }
                      placeholder="0x1234...5678"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <AnimatedInput
                      value={createForm.location}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      placeholder="Jakarta, Indonesia"
                    />
                  </div>
                </div>

                {createForm.role === 'spv' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <AnimatedInput
                      value={createForm.companyName}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                      placeholder="PT ABC Infrastructure"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <AnimatedButton
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1"
                    ripple
                  >
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={handleCreateUser}
                    disabled={
                      !createForm.name || !createForm.email || isSubmitting
                    }
                    loading={isSubmitting}
                    className="flex-1"
                    ripple
                  >
                    Create User
                  </AnimatedButton>
                </div>
              </div>
            </Modal>

            {/* View User Modal */}
            <Modal
              isOpen={isViewModalOpen}
              onClose={() => setIsViewModalOpen(false)}
              title="User Details"
              size="lg"
            >
              {selectedUser && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedUser.name}
                      </h3>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <div className="flex gap-2 mt-2">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(selectedUser.role)}`}
                        >
                          {getRoleIcon(selectedUser.role)}
                          <span className="capitalize">
                            {selectedUser.role}
                          </span>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedUser.status)}`}
                        >
                          {getStatusIcon(selectedUser.status)}
                          <span className="capitalize">
                            {selectedUser.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Phone
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Wallet Address
                        </label>
                        <p className="text-sm text-gray-900 font-mono">
                          {selectedUser.walletAddress || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Location
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.location || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Created
                        </label>
                        <p className="text-sm text-gray-900">
                          {new Date(
                            selectedUser.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Last Login
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.lastLogin
                            ? formatTimeAgo(selectedUser.lastLogin)
                            : 'Never'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          KYC Status
                        </label>
                        <p className="text-sm text-gray-900 capitalize">
                          {selectedUser.kycStatus || 'Not started'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedUser.companyName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.companyName}
                      </p>
                    </div>
                  )}

                  {selectedUser.role === 'investor' &&
                    selectedUser.totalInvestments && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Total Investments
                        </label>
                        <p className="text-sm text-gray-900">
                          {formatCurrency(selectedUser.totalInvestments)}
                        </p>
                      </div>
                    )}

                  {selectedUser.role === 'spv' &&
                    selectedUser.projectsCreated && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Projects Created
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.projectsCreated}
                        </p>
                      </div>
                    )}
                </div>
              )}
            </Modal>

            {/* Whitelist Wallet Modal */}
            <Modal
              isOpen={isWhitelistModalOpen}
              onClose={() => setIsWhitelistModalOpen(false)}
              title="Whitelist SPV Wallet"
              size="lg"
            >
              {selectedUser && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedUser.name}
                      </h3>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <p className="text-gray-500">
                        {selectedUser.companyName}
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-primary-800">
                          Wallet Whitelisting
                        </h4>
                        <p className="text-sm text-primary-700 mt-1">
                          This action will whitelist the SPV&apos;s
                          multi-signature wallet on the blockchain platform
                          registry. The wallet will be authorized to create
                          projects and manage funds.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Wallet Address
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <code className="text-sm text-gray-800">
                          {selectedUser.walletAddress || 'Not set'}
                        </code>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Multi-Signature Wallet Address *
                      </label>
                      <AnimatedInput
                        placeholder="0x1234567890123456789012345678901234567890"
                        className="font-mono"
                        icon={<Shield className="w-4 h-4" />}
                        value={selectedUser.walletAddress || ''}
                        onChange={e =>
                          setSelectedUser({
                            ...selectedUser,
                            walletAddress: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This should be a Safe (Gnosis Safe) or other
                        multi-signature wallet address
                      </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-800">
                            Important Notes
                          </h4>
                          <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                            <li>
                              • Verify the wallet address is correct before
                              whitelisting
                            </li>
                            <li>
                              • This action requires blockchain transaction
                              confirmation
                            </li>
                            <li>
                              • The SPV will be able to create projects after
                              whitelisting
                            </li>
                            <li>• Whitelisting cannot be easily reversed</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <AnimatedButton
                      variant="outline"
                      onClick={() => setIsWhitelistModalOpen(false)}
                      className="flex-1"
                      ripple
                    >
                      Cancel
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => {
                        if (selectedUser.walletAddress) {
                          handleWhitelistWallet(
                            selectedUser.id,
                            selectedUser.walletAddress
                          );
                          setIsWhitelistModalOpen(false);
                        }
                      }}
                      disabled={!selectedUser.walletAddress || isSubmitting}
                      loading={isSubmitting}
                      className="flex-1"
                      ripple
                    >
                      Whitelist Wallet
                    </AnimatedButton>
                  </div>
                </div>
              )}
            </Modal>
          </div>
        </PageTransition>
      </DashboardLayout>
    </div>
  );
}
