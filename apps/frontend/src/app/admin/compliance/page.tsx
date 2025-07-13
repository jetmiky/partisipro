'use client';

import { useState } from 'react';
import {
  DashboardLayout,
  Card,
  Button,
  DataTable,
  StatsCard,
} from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Download,
  Eye,
  Activity,
  BarChart3,
} from 'lucide-react';

interface ComplianceAlert {
  id: string;
  type:
    | 'identity_expiring'
    | 'claim_revoked'
    | 'compliance_violation'
    | 'audit_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUsers: number;
  createdAt: string;
  resolvedAt?: string;
  status: 'active' | 'resolved' | 'in_progress';
}

interface ComplianceAlertTableRow extends Record<string, unknown> {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUsers: number;
  createdAt: string;
  status: 'active' | 'resolved' | 'in_progress';
  actions: ComplianceAlert;
}

interface ComplianceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  period: string;
  category: 'verification' | 'claims' | 'compliance' | 'risk';
}

export default function AdminCompliancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedAlert, setSelectedAlert] = useState<ComplianceAlert | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    'overview' | 'alerts' | 'metrics' | 'audit'
  >('overview');

  // TODO: Mock compliance data - replace with actual compliance analytics API
  const complianceAlerts: ComplianceAlert[] = [
    {
      id: '1',
      type: 'identity_expiring',
      severity: 'medium',
      title: 'Identity Verifications Expiring Soon',
      description: '45 user identities will expire within the next 30 days',
      affectedUsers: 45,
      createdAt: '2024-01-25T10:00:00Z',
      status: 'active',
    },
    {
      id: '2',
      type: 'claim_revoked',
      severity: 'high',
      title: 'Accredited Investor Claims Revoked',
      description:
        '3 users had their accredited investor claims revoked by OJK',
      affectedUsers: 3,
      createdAt: '2024-01-24T14:30:00Z',
      status: 'in_progress',
    },
    {
      id: '3',
      type: 'compliance_violation',
      severity: 'critical',
      title: 'AML Compliance Violation Detected',
      description: 'Suspicious transaction patterns detected for 2 users',
      affectedUsers: 2,
      createdAt: '2024-01-23T09:15:00Z',
      status: 'active',
    },
    {
      id: '4',
      type: 'audit_required',
      severity: 'low',
      title: 'Quarterly Compliance Audit Due',
      description: 'Q1 2024 compliance audit required by OJK',
      affectedUsers: 0,
      createdAt: '2024-01-22T16:45:00Z',
      status: 'active',
    },
  ];

  const complianceMetrics: ComplianceMetric[] = [
    {
      id: '1',
      name: 'Identity Verification Rate',
      value: 94.2,
      target: 95.0,
      trend: 'up',
      change: 2.1,
      period: 'Last 30 days',
      category: 'verification',
    },
    {
      id: '2',
      name: 'Claims Compliance Rate',
      value: 98.7,
      target: 98.0,
      trend: 'up',
      change: 0.5,
      period: 'Last 30 days',
      category: 'claims',
    },
    {
      id: '3',
      name: 'AML Screening Pass Rate',
      value: 99.1,
      target: 99.0,
      trend: 'stable',
      change: 0.0,
      period: 'Last 30 days',
      category: 'compliance',
    },
    {
      id: '4',
      name: 'Risk Score Average',
      value: 2.3,
      target: 3.0,
      trend: 'down',
      change: -0.2,
      period: 'Last 30 days',
      category: 'risk',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'active':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'verification':
        return 'text-blue-600 bg-blue-50';
      case 'claims':
        return 'text-purple-600 bg-purple-50';
      case 'compliance':
        return 'text-green-600 bg-green-50';
      case 'risk':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleResolveAlert = async (alertId: string) => {
    alertId;

    // TODO: Implement alert resolution via compliance API
    alert('Alert resolution functionality coming soon');
  };

  const handleExportReport = () => {
    // TODO: Implement compliance report export
    alert('Compliance report export functionality coming soon');
  };

  const activeAlerts = complianceAlerts.filter(
    alert => alert.status === 'active'
  );
  const criticalAlerts = complianceAlerts.filter(
    alert => alert.severity === 'critical'
  );
  const totalAffectedUsers = complianceAlerts.reduce(
    (sum, alert) => sum + alert.affectedUsers,
    0
  );
  const avgComplianceScore =
    complianceMetrics.reduce((sum, metric) => sum + metric.value, 0) /
    complianceMetrics.length;

  const alertsTableData: ComplianceAlertTableRow[] = complianceAlerts.map(
    alert => ({
      id: alert.id,
      type: alert.type.replace('_', ' ').toUpperCase(),
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      affectedUsers: alert.affectedUsers,
      createdAt: formatDate(alert.createdAt),
      status: alert.status,
      actions: alert,
    })
  );

  const alertColumns: Column<ComplianceAlertTableRow>[] = [
    {
      label: 'Alert Type',
      key: 'type',
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.type}</div>
          <div className="text-sm text-gray-500">{row.title}</div>
        </div>
      ),
    },
    {
      label: 'Severity',
      key: 'severity',
      render: (_, row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(row.severity)}`}
        >
          {row.severity.toUpperCase()}
        </span>
      ),
    },
    {
      label: 'Affected Users',
      key: 'affectedUsers',
      render: (_, row) => (
        <div className="text-center font-medium">{row.affectedUsers}</div>
      ),
    },
    {
      label: 'Created',
      key: 'createdAt',
      render: (_, row) => <div className="text-sm">{row.createdAt}</div>,
    },
    {
      label: 'Status',
      key: 'status',
      render: (_, row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}
        >
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedAlert(row.actions)}
            className="flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View
          </Button>
          {row.status === 'active' && (
            <Button
              size="sm"
              onClick={() => handleResolveAlert(row.actions.id)}
              className="flex items-center gap-1"
            >
              <CheckCircle className="w-3 h-3" />
              Resolve
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Compliance Dashboard
            </h1>
            <p className="text-gray-600">
              Platform-wide compliance monitoring and reporting
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button
              variant="outline"
              onClick={handleExportReport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Alerts"
            value={activeAlerts.length.toString()}
            icon={<AlertTriangle className="w-4 h-4" />}
            change={criticalAlerts.length}
            changeType={criticalAlerts.length === 0 ? 'increase' : 'decrease'}
          />
          <StatsCard
            title="Compliance Score"
            value={`${avgComplianceScore.toFixed(1)}%`}
            icon={<Shield className="w-4 h-4" />}
            change={0.5}
            changeType="increase"
          />
          <StatsCard
            title="Verification Rate"
            value="94.2%"
            icon={<CheckCircle className="w-4 h-4" />}
            change={2.1}
            changeType="increase"
          />
          <StatsCard
            title="Affected Users"
            value={totalAffectedUsers.toString()}
            icon={<Users className="w-4 h-4" />}
            description="Across all active alerts"
            changeType="neutral"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alerts ({activeAlerts.length})
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'metrics'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Audit Trail
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
              <Card className="p-6 border-red-200 bg-red-50">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-red-900">
                      Critical Alerts
                    </h2>
                    <p className="text-red-700">Immediate attention required</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {criticalAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {alert.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {alert.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedAlert(alert)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Compliance Activity
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Identity verification completed
                    </p>
                    <p className="text-sm text-gray-600">
                      125 users verified in the last 24 hours
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Claims updated</p>
                    <p className="text-sm text-gray-600">
                      45 claims renewed automatically
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      AML screening completed
                    </p>
                    <p className="text-sm text-gray-600">
                      Daily screening passed for all users
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Compliance Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complianceMetrics.map(metric => (
                <Card key={metric.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {metric.name}
                      </h3>
                      <p className="text-sm text-gray-600">{metric.period}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(metric.category)}`}
                    >
                      {metric.category.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {metric.value}%
                        </span>
                        <span
                          className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}
                        >
                          {metric.trend === 'up'
                            ? '+'
                            : metric.trend === 'down'
                              ? '-'
                              : ''}
                          {Math.abs(metric.change)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{ width: `${(metric.value / 100) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Target: {metric.target}%
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Compliance Alerts
              </h2>
              <p className="text-gray-600">
                Monitor and manage compliance alerts
              </p>
            </div>
            <DataTable data={alertsTableData} columns={alertColumns} />
          </Card>
        )}

        {activeTab === 'metrics' && (
          <Card className="p-6">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Detailed Metrics
              </h3>
              <p className="text-gray-600 mb-4">
                Comprehensive compliance metrics and analytics
              </p>
              <Button
                onClick={() => alert('Detailed metrics dashboard coming soon')}
              >
                View Metrics Dashboard
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'audit' && (
          <Card className="p-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Audit Trail
              </h3>
              <p className="text-gray-600 mb-4">
                Complete audit trail for all compliance activities
              </p>
              <Button
                onClick={() => alert('Audit trail functionality coming soon')}
              >
                View Audit Trail
              </Button>
            </div>
          </Card>
        )}

        {/* Alert Detail Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Alert Details
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alert Type
                    </label>
                    <p className="text-gray-900">
                      {selectedAlert.type.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity
                    </label>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedAlert.severity)}`}
                    >
                      {selectedAlert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedAlert.title}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900">{selectedAlert.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Affected Users
                    </label>
                    <p className="text-gray-900">
                      {selectedAlert.affectedUsers}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAlert.status)}`}
                    >
                      {selectedAlert.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created At
                    </label>
                    <p className="text-gray-900">
                      {formatDate(selectedAlert.createdAt)}
                    </p>
                  </div>
                  {selectedAlert.resolvedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resolved At
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedAlert.resolvedAt)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    {selectedAlert.status === 'active' && (
                      <Button
                        onClick={() => handleResolveAlert(selectedAlert.id)}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Resolve Alert
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() =>
                        alert('View affected users functionality coming soon')
                      }
                      className="flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      View Affected Users
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        alert('Export alert details functionality coming soon')
                      }
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
