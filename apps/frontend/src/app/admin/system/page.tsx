'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Settings,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Server,
  Globe,
  Download,
  RefreshCw,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Pause,
  RotateCcw,
  FileText,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
} from 'lucide-react';
import { Button, StatsCard, DashboardLayout, DataTable } from '@/components/ui';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { toast } from '@/components/ui/AnimatedNotification';
import type { Column } from '@/components/ui/DataTable';
import type { SystemHealth, SystemConfig, SystemLog, UserRole } from '@/types';

// Mock data
const mockSystemConfigs: SystemConfig[] = [
  {
    id: 'maintenance_mode',
    category: 'platform',
    name: 'Maintenance Mode',
    description: 'Enable maintenance mode to block user access during updates',
    type: 'boolean',
    currentValue: false,
    defaultValue: false,
    isModified: false,
    lastUpdated: '2025-01-08',
    updatedBy: 'System Admin',
    requiresRestart: false,
  },
  {
    id: 'max_investment_amount',
    category: 'platform',
    name: 'Maximum Investment Amount',
    description: 'Maximum investment amount per transaction in IDR',
    type: 'number',
    currentValue: 1000000000, // 1B IDR
    defaultValue: 1000000000,
    isModified: false,
    lastUpdated: '2024-12-20',
    updatedBy: 'Platform Admin',
    requiresRestart: false,
  },
  {
    id: 'session_timeout',
    category: 'security',
    name: 'Session Timeout',
    description: 'User session timeout in minutes',
    type: 'number',
    currentValue: 30,
    defaultValue: 30,
    isModified: false,
    lastUpdated: '2024-11-15',
    updatedBy: 'Security Admin',
    requiresRestart: false,
  },
  {
    id: 'admin_email_alerts',
    category: 'platform',
    name: 'Admin Email Alerts',
    description: 'Send email alerts for critical system events',
    type: 'boolean',
    currentValue: true,
    defaultValue: true,
    isModified: false,
    lastUpdated: '2024-08-10',
    updatedBy: 'System Admin',
    requiresRestart: false,
  },
];

const mockSystemHealth: SystemHealth[] = [
  {
    component: 'Web Application',
    status: 'healthy',
    uptime: 99.8,
    lastCheck: '2025-01-10 09:45',
    details: 'All services operational',
  },
  {
    component: 'Database',
    status: 'healthy',
    uptime: 99.9,
    lastCheck: '2025-01-10 09:45',
    details: 'MySQL cluster healthy',
  },
  {
    component: 'Blockchain Node',
    status: 'warning',
    uptime: 98.5,
    lastCheck: '2025-01-10 09:44',
    details: 'High latency detected',
  },
  {
    component: 'KYC Service',
    status: 'healthy',
    uptime: 99.2,
    lastCheck: '2025-01-10 09:45',
    details: 'Verihubs API responsive',
  },
  {
    component: 'Payment Gateway',
    status: 'critical',
    uptime: 97.1,
    lastCheck: '2025-01-10 09:43',
    details: 'Connection timeout issues',
  },
];

const mockSystemLogs: SystemLog[] = [
  {
    id: 'log_001',
    timestamp: '2025-01-10 09:45:23',
    level: 'warn',
    component: 'Blockchain Node',
    message: 'High RPC response time detected',
    details: 'Average response time: 2.5s (threshold: 1s)',
  },
  {
    id: 'log_002',
    timestamp: '2025-01-10 09:40:15',
    level: 'error',
    component: 'Payment Gateway',
    message: 'Connection timeout to payment provider',
    details: 'Unable to connect to payment gateway after 3 retry attempts',
  },
  {
    id: 'log_003',
    timestamp: '2025-01-10 09:35:07',
    level: 'info',
    component: 'User Authentication',
    message: 'Successful admin login',
    details: 'Admin user logged in from IP: 192.168.1.100',
    userId: 'admin_001',
  },
  {
    id: 'log_004',
    timestamp: '2025-01-10 09:30:42',
    level: 'error',
    component: 'Database',
    message: 'Database connection pool exhausted',
    details: 'All 100 database connections in use, new connections queued',
  },
];

const mockUserRoles: UserRole[] = [
  {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      'system:admin',
      'users:manage',
      'projects:manage',
      'fees:manage',
      'reports:view',
    ],
    userCount: 2,
    lastModified: '2024-01-15',
    isSystemRole: true,
  },
  {
    id: 'platform_admin',
    name: 'Platform Administrator',
    description: 'Platform management without system-level access',
    permissions: ['projects:manage', 'users:view', 'fees:view', 'reports:view'],
    userCount: 5,
    lastModified: '2024-03-20',
    isSystemRole: false,
  },
  {
    id: 'compliance_officer',
    name: 'Compliance Officer',
    description: 'Compliance and risk management access',
    permissions: ['projects:review', 'users:kyc', 'reports:compliance'],
    userCount: 3,
    lastModified: '2024-06-10',
    isSystemRole: false,
  },
  {
    id: 'support_agent',
    name: 'Support Agent',
    description: 'Customer support and basic user management',
    permissions: ['users:support', 'tickets:manage', 'reports:basic'],
    userCount: 8,
    lastModified: '2024-08-05',
    isSystemRole: false,
  },
];

const getHealthStatusColor = (status: SystemHealth['status']) => {
  switch (status) {
    case 'healthy':
      return 'text-support-600 bg-support-50';
    case 'warning':
      return 'text-primary-600 bg-primary-50';
    case 'critical':
      return 'text-accent-600 bg-accent-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getHealthStatusIcon = (status: SystemHealth['status']) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'critical':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getLogLevelColor = (level: SystemLog['level']) => {
  switch (level) {
    case 'info':
      return 'text-support-600 bg-support-50';
    case 'warn':
      return 'text-primary-600 bg-primary-50';
    case 'error':
      return 'text-accent-600 bg-accent-50';
    case 'debug':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getCategoryIcon = (category: SystemConfig['category']) => {
  switch (category) {
    case 'platform':
      return <Settings className="h-4 w-4" />;
    case 'security':
      return <Shield className="h-4 w-4" />;
    case 'integration':
      return <Globe className="h-4 w-4" />;
    case 'maintenance':
      return <Activity className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

const formatConfigValue = (
  value: string | number | boolean,
  type: string,
  sensitive: boolean
) => {
  if (sensitive && type !== 'boolean') {
    return '••••••••';
  }

  if (type === 'boolean') {
    return value ? 'Enabled' : 'Disabled';
  }

  if (type === 'number') {
    if (typeof value === 'number' && value >= 1000000) {
      return (value / 1000000).toLocaleString() + 'M';
    }

    if (typeof value === 'string' && Number.parseInt(value) >= 1000000) {
      return (Number.parseInt(value) / 1000000).toLocaleString() + 'M';
    }
  }

  return value.toString();
};

export default function AdminSystemPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>(
    {}
  );
  const [activeTab, setActiveTab] = useState<
    'health' | 'config' | 'logs' | 'roles'
  >('health');

  // Authentication guard
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      window.location.href = '/auth/signin';
      return;
    }
  }, [isAuthenticated, isAdmin]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // TODO: Fetch latest system data
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast.success('System data refreshed', {
      message: 'All system metrics updated successfully.',
    });
  };

  const handleEditConfig = (
    configId: string,
    currentValue: string | number | boolean
  ) => {
    setEditingConfig(configId);
    setConfigValues({ ...configValues, [configId]: currentValue });
  };

  const handleSaveConfig = async (_configId: string) => {
    // TODO: Update system configuration
    // console.log('Updating config:', configId, 'to value:', configValues[configId]);
    _configId;
    setEditingConfig(null);
    toast.success('Configuration updated', {
      message: 'System configuration saved successfully.',
    });
  };

  const handleCancelEdit = (configId: string) => {
    setEditingConfig(null);
    const { [configId]: _removed, ...rest } = configValues;

    _removed;
    setConfigValues(rest);
  };

  const handleToggleMaintenanceMode = () => {
    // TODO: Toggle maintenance mode
    // console.log('Toggle maintenance mode');
    toast.warning('Maintenance mode toggled', {
      message: 'System maintenance mode has been activated.',
      persistent: true,
    });
  };

  const handleRestartSystem = () => {
    // TODO: Restart system components
    // console.log('Restart system');
    toast.info('System restart initiated', {
      message: 'All services will be restarted shortly...',
      persistent: true,
    });
  };

  const healthColumns: Column<SystemHealth>[] = [
    {
      key: 'component',
      label: 'Component',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Server className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-900">{row.component}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <div
          className={`flex items-center gap-2 px-2 py-1 rounded-full w-fit ${getHealthStatusColor(row.status)}`}
        >
          {getHealthStatusIcon(row.status)}
          <span className="font-medium capitalize">{row.status}</span>
        </div>
      ),
    },
    {
      key: 'uptime',
      label: 'Uptime',
      render: (_, row) => (
        <span className="font-medium text-gray-900">{row.uptime}%</span>
      ),
    },
    {
      key: 'metrics',
      label: 'Metrics',
      render: (_, row) => (
        <div className="flex flex-col text-sm">
          {row.metrics?.cpu && (
            <span className="text-gray-600">CPU: {row.metrics.cpu}%</span>
          )}
          {row.metrics?.memory && (
            <span className="text-gray-600">Memory: {row.metrics.memory}%</span>
          )}
          {row.metrics?.connections && (
            <span className="text-gray-600">
              Connections: {row.metrics.connections}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'lastCheck',
      label: 'Last Check',
      render: (_, row) => (
        <span className="text-sm text-gray-600">{row.lastCheck}</span>
      ),
    },
  ];

  const configColumns: Column<SystemConfig>[] = [
    {
      key: 'name',
      label: 'Configuration',
      render: (_, row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            {getCategoryIcon(row.category)}
            <span className="font-medium text-gray-900">{row.name}</span>
          </div>
          <span className="text-sm text-gray-500">{row.description}</span>
          {row.requiresRestart && (
            <span className="text-xs text-accent-600 mt-1">
              ⚠ Requires restart
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {editingConfig === row.id ? (
            <div className="flex items-center gap-2">
              {row.type === 'boolean' ? (
                <select
                  value={
                    configValues[row.id]?.toString() ||
                    row.currentValue.toString()
                  }
                  onChange={e =>
                    setConfigValues({
                      ...configValues,
                      [row.id]: e.target.value === 'true',
                    })
                  }
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : row.type === 'select' ? (
                <select
                  value={String(configValues[row.id] || row.currentValue)}
                  onChange={e =>
                    setConfigValues({
                      ...configValues,
                      [row.id]: e.target.value,
                    })
                  }
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {row.options?.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={row.type === 'password' ? 'password' : row.type}
                  value={String(configValues[row.id] || row.currentValue)}
                  onChange={e =>
                    setConfigValues({
                      ...configValues,
                      [row.id]:
                        row.type === 'number'
                          ? parseFloat(e.target.value)
                          : e.target.value,
                    })
                  }
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {formatConfigValue(row.currentValue, row.type, false)}
              </span>
              {false && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setShowSensitive({
                      ...showSensitive,
                      [row.id]: !showSensitive[row.id],
                    })
                  }
                >
                  {showSensitive[row.id] ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (_, row) => (
        <div className="flex flex-col text-sm">
          <span>{new Date(row.lastUpdated).toLocaleDateString()}</span>
          <span className="text-gray-500">by {row.updatedBy}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {editingConfig === row.id ? (
            <>
              <AnimatedButton
                size="sm"
                onClick={() => handleSaveConfig(row.id)}
                ripple
              >
                <Save className="h-4 w-4" />
              </AnimatedButton>
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={() => handleCancelEdit(row.id)}
                ripple
              >
                <X className="h-4 w-4" />
              </AnimatedButton>
            </>
          ) : (
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={() => handleEditConfig(row.id, row.currentValue)}
              ripple
            >
              <Edit className="h-4 w-4" />
            </AnimatedButton>
          )}
        </div>
      ),
    },
  ];

  const logColumns: Column<SystemLog>[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (_, row) => (
        <span className="text-sm font-mono text-gray-600">{row.timestamp}</span>
      ),
    },
    {
      key: 'level',
      label: 'Level',
      render: (_, row) => (
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${getLogLevelColor(row.level)}`}
        >
          {row.level.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'component',
      label: 'Component',
      render: (_, row) => (
        <span className="font-medium text-gray-900">{row.component}</span>
      ),
    },
    {
      key: 'message',
      label: 'Message',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-gray-900">{row.message}</span>
          {row.details && (
            <span className="text-sm text-gray-500">{row.details}</span>
          )}
        </div>
      ),
    },
  ];

  const roleColumns: Column<UserRole>[] = [
    {
      key: 'name',
      label: 'Role',
      render: (_, row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{row.name}</span>
            {row.isSystemRole && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                SYSTEM
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">{row.description}</span>
        </div>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (_, row) => (
        <div className="flex flex-wrap gap-1">
          {row.permissions.slice(0, 3).map((permission: string) => (
            <span
              key={permission}
              className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-700"
            >
              {permission}
            </span>
          ))}
          {row.permissions.length > 3 && (
            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
              +{row.permissions.length - 3} more
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'userCount',
      label: 'Users',
      render: (_, row) => (
        <span className="font-medium text-gray-900">{row.userCount}</span>
      ),
    },
    {
      key: 'lastModified',
      label: 'Last Modified',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.lastModified).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <AnimatedButton
          variant="outline"
          size="sm"
          disabled={row.isSystemRole}
          ripple
        >
          <Edit className="h-4 w-4" />
        </AnimatedButton>
      ),
    },
  ];

  const healthyComponents = mockSystemHealth.filter(
    h => h.status === 'healthy'
  ).length;
  const warningComponents = mockSystemHealth.filter(
    h => h.status === 'warning'
  ).length;
  const criticalComponents = mockSystemHealth.filter(
    h => h.status === 'critical'
  ).length;
  const totalRoles = mockUserRoles.length;

  return (
    <DashboardLayout userType="admin">
      <PageTransition type="fade" duration={300}>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 relative overflow-hidden">
          {/* Fluid background shapes */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-20 animate-[float_3s_ease-in-out_infinite] blur-sm"></div>
            <div className="absolute top-1/4 right-20 w-48 h-48 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full opacity-15 animate-[float_4s_ease-in-out_infinite_reverse] blur-sm"></div>
            <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-25 animate-[float_5s_ease-in-out_infinite] blur-sm"></div>
            <div className="absolute bottom-10 right-10 w-36 h-36 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full opacity-20 animate-[float_6s_ease-in-out_infinite_reverse] blur-sm"></div>
          </div>

          <div className="space-y-6 p-6 relative z-10">
            {/* Header */}
            <ScrollReveal animation="slide-up" delay={0}>
              <div className="glass-modern p-6 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                      System Configuration
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Platform-wide settings and system management
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <AnimatedButton
                      variant="secondary"
                      onClick={handleRefresh}
                      loading={isLoading}
                      ripple
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </AnimatedButton>
                    <AnimatedButton
                      variant="accent"
                      onClick={handleToggleMaintenanceMode}
                      ripple
                    >
                      <Pause className="h-4 w-4" />
                      Maintenance Mode
                    </AnimatedButton>
                    <AnimatedButton
                      variant="outline"
                      onClick={handleRestartSystem}
                      ripple
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restart Services
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* System Stats */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              itemDelay={100}
            >
              <StatsCard
                title="Healthy Components"
                value={healthyComponents.toString()}
                icon={<CheckCircle className="w-4 h-4" />}
                change={0}
                changeType="neutral"
                description="Operating normally"
              />
              <StatsCard
                title="Warning Components"
                value={warningComponents.toString()}
                icon={<AlertTriangle className="w-4 h-4" />}
                change={0}
                changeType="neutral"
                description="Need attention"
              />
              <StatsCard
                title="Critical Issues"
                value={criticalComponents.toString()}
                icon={<AlertTriangle className="w-4 h-4" />}
                change={0}
                changeType="neutral"
                description="Require immediate action"
              />
              <StatsCard
                title="User Roles"
                value={totalRoles.toString()}
                icon={<Users className="w-4 h-4" />}
                change={0}
                changeType="neutral"
                description="Active role configurations"
              />
            </StaggeredList>

            {/* Navigation Tabs */}
            <ScrollReveal animation="slide-up" delay={200}>
              <div className="glass-modern p-4 rounded-xl">
                <nav className="flex space-x-8">
                  {[
                    {
                      id: 'health',
                      label: 'System Health',
                      icon: <Activity className="h-4 w-4" />,
                    },
                    {
                      id: 'config',
                      label: 'Configuration',
                      icon: <Settings className="h-4 w-4" />,
                    },
                    {
                      id: 'logs',
                      label: 'System Logs',
                      icon: <FileText className="h-4 w-4" />,
                    },
                    {
                      id: 'roles',
                      label: 'User Roles',
                      icon: <Users className="h-4 w-4" />,
                    },
                  ].map(tab => (
                    <AnimatedButton
                      key={tab.id}
                      variant={activeTab === tab.id ? 'primary' : 'ghost'}
                      onClick={() =>
                        setActiveTab(
                          tab.id as 'health' | 'config' | 'logs' | 'roles'
                        )
                      }
                      className="flex items-center gap-2"
                      ripple
                    >
                      {tab.icon}
                      {tab.label}
                    </AnimatedButton>
                  ))}
                </nav>
              </div>
            </ScrollReveal>

            {/* Tab Content */}
            {activeTab === 'health' && (
              <ScrollReveal animation="slide-up" delay={300}>
                <div className="glass-modern p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                        System Health
                      </h2>
                      <p className="text-gray-600">
                        Monitor system components and performance
                      </p>
                    </div>
                    <AnimatedButton
                      variant="secondary"
                      onClick={() =>
                        toast.info('Exporting health report', {
                          message: 'Generating system health report...',
                        })
                      }
                      ripple
                    >
                      <Download className="h-4 w-4" />
                      Export Report
                    </AnimatedButton>
                  </div>
                  <DataTable columns={healthColumns} data={mockSystemHealth} />
                </div>
              </ScrollReveal>
            )}

            {activeTab === 'config' && (
              <ScrollReveal animation="slide-up" delay={300}>
                <div className="glass-modern p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                        System Configuration
                      </h2>
                      <p className="text-gray-600">
                        Manage platform settings and parameters
                      </p>
                    </div>
                    <AnimatedButton
                      variant="secondary"
                      onClick={() =>
                        toast.info('Exporting configuration', {
                          message: 'Downloading system configuration...',
                        })
                      }
                      ripple
                    >
                      <Download className="h-4 w-4" />
                      Export Config
                    </AnimatedButton>
                  </div>
                  <DataTable columns={configColumns} data={mockSystemConfigs} />
                </div>
              </ScrollReveal>
            )}

            {activeTab === 'logs' && (
              <ScrollReveal animation="slide-up" delay={300}>
                <div className="glass-modern p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                        System Logs
                      </h2>
                      <p className="text-gray-600">
                        View system events and error logs
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <AnimatedButton
                        variant="secondary"
                        onClick={() =>
                          toast.info('Refreshing logs', {
                            message: 'Loading latest system logs...',
                          })
                        }
                        ripple
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </AnimatedButton>
                      <AnimatedButton
                        variant="secondary"
                        onClick={() =>
                          toast.info('Exporting logs', {
                            message: 'Preparing log export...',
                          })
                        }
                        ripple
                      >
                        <Download className="h-4 w-4" />
                        Export Logs
                      </AnimatedButton>
                    </div>
                  </div>
                  <DataTable columns={logColumns} data={mockSystemLogs} />
                </div>
              </ScrollReveal>
            )}

            {activeTab === 'roles' && (
              <ScrollReveal animation="slide-up" delay={300}>
                <div className="glass-modern p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                        User Roles
                      </h2>
                      <p className="text-gray-600">
                        Manage user roles and permissions
                      </p>
                    </div>
                    <AnimatedButton
                      variant="primary"
                      onClick={() =>
                        toast.info('Creating new role', {
                          message: 'Opening role creation form...',
                        })
                      }
                      ripple
                    >
                      <Users className="h-4 w-4" />
                      Create Role
                    </AnimatedButton>
                  </div>
                  <DataTable<UserRole>
                    columns={roleColumns}
                    data={mockUserRoles}
                  />
                </div>
              </ScrollReveal>
            )}

            {/* System Resources */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              itemDelay={150}
            >
              <StatsCard
                title="CPU Usage"
                value="45%"
                icon={<Cpu className="w-4 h-4" />}
                change={-5.2}
                changeType="decrease"
                description="Average across servers"
              />
              <StatsCard
                title="Memory Usage"
                value="62%"
                icon={<MemoryStick className="w-4 h-4" />}
                change={8.1}
                changeType="increase"
                description="System memory utilization"
              />
              <StatsCard
                title="Disk Usage"
                value="34%"
                icon={<HardDrive className="w-4 h-4" />}
                change={2.3}
                changeType="increase"
                description="Storage utilization"
              />
              <StatsCard
                title="Network Status"
                value="Optimal"
                icon={<Wifi className="w-4 h-4" />}
                change={0}
                changeType="neutral"
                description="Network connectivity"
              />
            </StaggeredList>

            {/* TODO: Mock Implementation Notes */}
            <ScrollReveal animation="fade" delay={400}>
              <div className="glass-modern p-6 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-900 mb-2">
                      TODO: Mock Implementation Notes
                    </h3>
                    <ul className="text-sm text-primary-800 space-y-1">
                      <li>
                        • Mock system health monitoring with real-time metrics
                        collection
                      </li>
                      <li>
                        • Mock configuration management with blockchain
                        parameter updates
                      </li>
                      <li>
                        • Mock centralized logging system with log aggregation
                        and analysis
                      </li>
                      <li>
                        • Mock user role management with permission-based access
                        control
                      </li>
                      <li>
                        • Mock maintenance mode with graceful service shutdown
                      </li>
                      <li>
                        • Mock system restart capabilities with service
                        orchestration
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
