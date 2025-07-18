'use client';

import { useState } from 'react';
import { DashboardLayout, DataTable } from '@/components/ui';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { toast } from '@/components/ui/AnimatedNotification';
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
    toast.info('Alert resolution functionality coming soon');
  };

  const handleExportReport = () => {
    // TODO: Implement compliance report export
    toast.info('Compliance report export functionality coming soon');
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
          <AnimatedButton
            size="sm"
            variant="outline"
            onClick={() => setSelectedAlert(row.actions)}
            ripple
            className="flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View
          </AnimatedButton>
          {row.status === 'active' && (
            <AnimatedButton
              size="sm"
              onClick={() => handleResolveAlert(row.actions.id)}
              ripple
              className="flex items-center gap-1"
            >
              <CheckCircle className="w-3 h-3" />
              Resolve
            </AnimatedButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <DashboardLayout>
        <PageTransition type="fade" duration={300}>
          <div className="space-y-8 relative z-10">
            {/* Header */}
            <ScrollReveal animation="fade" delay={0} duration={800}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    Compliance Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    Platform-wide compliance monitoring and reporting
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedPeriod}
                    onChange={e => setSelectedPeriod(e.target.value)}
                    className="px-3 py-2 glass-modern border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 hover-glow transition-all duration-300"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                  </select>
                  <AnimatedButton
                    variant="outline"
                    onClick={handleExportReport}
                    ripple
                    className="btn-modern btn-modern-secondary hover-lift flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Report
                  </AnimatedButton>
                </div>
              </div>
            </ScrollReveal>

            {/* Key Metrics */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              itemDelay={150}
              animation="slide-up"
            >
              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-accent-600 font-medium">
                    {criticalAlerts.length} critical
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {activeAlerts.length}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Active Alerts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Require attention
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +0.5%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {avgComplianceScore.toFixed(1)}%
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Compliance Score
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Platform average
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +2.1%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">94.2%</h3>
                  <p className="text-sm font-medium text-primary-700">
                    Verification Rate
                  </p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Active alerts
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {totalAffectedUsers}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Affected Users
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Across all alerts
                  </p>
                </div>
              </div>
            </StaggeredList>

            {/* Tabs */}
            <ScrollReveal animation="slide-up" delay={200} duration={600}>
              <div className="glass-modern rounded-xl p-2">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover-lift ${
                      activeTab === 'overview'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('alerts')}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover-lift ${
                      activeTab === 'alerts'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                    }`}
                  >
                    Alerts ({activeAlerts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('metrics')}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover-lift ${
                      activeTab === 'metrics'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                    }`}
                  >
                    Metrics
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover-lift ${
                      activeTab === 'audit'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                    }`}
                  >
                    Audit Trail
                  </button>
                </nav>
              </div>
            </ScrollReveal>

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
              <ScrollReveal animation="slide-up" delay={300} duration={600}>
                <div className="space-y-8">
                  {/* Critical Alerts */}
                  {criticalAlerts.length > 0 && (
                    <div className="glass-feature rounded-2xl p-8 border border-accent-200 bg-gradient-to-br from-accent-50 to-accent-100 hover-lift transition-all duration-300">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gradient mb-1">
                            Critical Alerts
                          </h2>
                          <p className="text-accent-700">
                            Immediate attention required
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {criticalAlerts.map((alert, index) => (
                          <div
                            key={alert.id}
                            className="flex items-center justify-between p-4 glass-modern rounded-xl hover-glow transition-all duration-300"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div>
                              <h3 className="font-semibold text-primary-800 mb-1">
                                {alert.title}
                              </h3>
                              <p className="text-sm text-primary-600">
                                {alert.description}
                              </p>
                            </div>
                            <AnimatedButton
                              size="sm"
                              onClick={() => setSelectedAlert(alert)}
                              ripple
                              className="btn-modern btn-modern-primary hover-lift flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </AnimatedButton>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                    <h2 className="text-xl font-bold text-gradient mb-6">
                      Recent Compliance Activity
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 glass-modern rounded-xl hover-glow transition-all duration-300">
                        <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary-800 mb-1">
                            Identity verification completed
                          </p>
                          <p className="text-sm text-primary-600">
                            125 users verified in the last 24 hours
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 glass-modern rounded-xl hover-glow transition-all duration-300">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary-800 mb-1">
                            Claims updated
                          </p>
                          <p className="text-sm text-primary-600">
                            45 claims renewed automatically
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 glass-modern rounded-xl hover-glow transition-all duration-300">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary-800 mb-1">
                            AML screening completed
                          </p>
                          <p className="text-sm text-primary-600">
                            Daily screening passed for all users
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {complianceMetrics.map((metric, index) => (
                      <div
                        key={metric.id}
                        className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="font-semibold text-gradient text-lg mb-1">
                              {metric.name}
                            </h3>
                            <p className="text-sm text-primary-600">
                              {metric.period}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-2 rounded-xl text-xs font-bold ${getCategoryColor(metric.category)}`}
                          >
                            {metric.category.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold text-gradient">
                              {metric.value}%
                            </span>
                            <span
                              className={`text-sm font-medium ${metric.trend === 'up' ? 'text-success-600' : metric.trend === 'down' ? 'text-accent-600' : 'text-muted-600'}`}
                            >
                              {metric.trend === 'up'
                                ? '+'
                                : metric.trend === 'down'
                                  ? '-'
                                  : ''}
                              {Math.abs(metric.change)}%
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="w-full bg-gradient-to-r from-muted-200 to-muted-300 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min((metric.value / 100) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Target: {metric.target}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            )}

            {activeTab === 'alerts' && (
              <ScrollReveal animation="slide-up" delay={300} duration={600}>
                <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gradient mb-2">
                      Compliance Alerts
                    </h2>
                    <p className="text-primary-600">
                      Monitor and manage compliance alerts
                    </p>
                  </div>
                  <div className="glass-modern rounded-xl overflow-hidden">
                    <DataTable data={alertsTableData} columns={alertColumns} />
                  </div>
                </div>
              </ScrollReveal>
            )}

            {activeTab === 'metrics' && (
              <ScrollReveal animation="slide-up" delay={300} duration={600}>
                <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                  <div className="text-center py-16">
                    <div className="w-20 h-20 feature-icon mx-auto mb-8 hover-scale">
                      <BarChart3 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gradient mb-4">
                      Detailed Metrics
                    </h3>
                    <p className="text-primary-600 mb-8 max-w-md mx-auto">
                      Comprehensive compliance metrics and analytics dashboard
                    </p>
                    <AnimatedButton
                      onClick={() =>
                        toast.info('Detailed metrics dashboard coming soon')
                      }
                      ripple
                      className="btn-modern btn-modern-primary hover-lift"
                    >
                      View Metrics Dashboard
                    </AnimatedButton>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {activeTab === 'audit' && (
              <ScrollReveal animation="slide-up" delay={300} duration={600}>
                <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                  <div className="text-center py-16">
                    <div className="w-20 h-20 feature-icon mx-auto mb-8 hover-scale">
                      <FileText className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gradient mb-4">
                      Audit Trail
                    </h3>
                    <p className="text-primary-600 mb-8 max-w-md mx-auto">
                      Complete audit trail for all compliance activities
                    </p>
                    <AnimatedButton
                      onClick={() =>
                        toast.info('Audit trail functionality coming soon')
                      }
                      ripple
                      className="btn-modern btn-modern-primary hover-lift"
                    >
                      View Audit Trail
                    </AnimatedButton>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* Alert Detail Modal */}
            {selectedAlert && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="glass-feature rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gradient mb-2">
                        Alert Details
                      </h2>
                      <p className="text-primary-600">
                        Compliance alert information and resolution actions
                      </p>
                    </div>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => setSelectedAlert(null)}
                      ripple
                      className="btn-modern btn-modern-secondary hover-lift w-10 h-10 p-0 text-lg"
                    >
                      ×
                    </AnimatedButton>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Alert Type
                        </label>
                        <p className="text-xl font-bold text-gradient">
                          {selectedAlert.type.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Severity
                        </label>
                        <span
                          className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold ${getSeverityColor(selectedAlert.severity)}`}
                        >
                          {selectedAlert.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="glass-modern rounded-xl p-6">
                      <label className="block text-sm font-semibold text-primary-700 mb-3">
                        Title
                      </label>
                      <p className="text-xl font-bold text-gradient">
                        {selectedAlert.title}
                      </p>
                    </div>

                    <div className="glass-modern rounded-xl p-6">
                      <label className="block text-sm font-semibold text-primary-700 mb-3">
                        Description
                      </label>
                      <p className="text-primary-800 leading-relaxed">
                        {selectedAlert.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Affected Users
                        </label>
                        <p className="text-xl font-bold text-gradient">
                          {selectedAlert.affectedUsers}
                        </p>
                      </div>
                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Status
                        </label>
                        <span
                          className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold ${getStatusColor(selectedAlert.status)}`}
                        >
                          {selectedAlert.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Created At
                        </label>
                        <p className="text-primary-800 font-medium">
                          {formatDate(selectedAlert.createdAt)}
                        </p>
                      </div>
                      {selectedAlert.resolvedAt && (
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Resolved At
                          </label>
                          <p className="text-primary-800 font-medium">
                            {formatDate(selectedAlert.resolvedAt)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="glass-modern rounded-xl p-6">
                      <div className="flex flex-wrap gap-3">
                        {selectedAlert.status === 'active' && (
                          <AnimatedButton
                            onClick={() => handleResolveAlert(selectedAlert.id)}
                            ripple
                            className="btn-modern btn-modern-primary hover-lift flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Resolve Alert
                          </AnimatedButton>
                        )}
                        <AnimatedButton
                          variant="outline"
                          onClick={() =>
                            toast.info(
                              'View affected users functionality coming soon'
                            )
                          }
                          ripple
                          className="btn-modern btn-modern-secondary hover-lift flex items-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          View Affected Users
                        </AnimatedButton>
                        <AnimatedButton
                          variant="outline"
                          onClick={() =>
                            toast.info(
                              'Export alert details functionality coming soon'
                            )
                          }
                          ripple
                          className="btn-modern btn-modern-secondary hover-lift flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export Details
                        </AnimatedButton>
                      </div>
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
