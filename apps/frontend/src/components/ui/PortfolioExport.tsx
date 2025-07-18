'use client';

import { useState } from 'react';
import {
  Download,
  FileText,
  Table,
  Image,
  Calendar,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import type {
  PortfolioExportData,
  EnhancedPortfolioAnalytics,
  AnalyticsFilters,
} from '@/types';

interface PortfolioExportProps {
  portfolioData: EnhancedPortfolioAnalytics;
  onExport?: (format: ExportFormat, filters: AnalyticsFilters) => Promise<void>;
}

type ExportFormat = 'pdf' | 'csv' | 'json' | 'png';

interface ExportOption {
  format: ExportFormat;
  title: string;
  description: string;
  icon: React.ReactNode;
  fileSize: string;
  features: string[];
}

export function PortfolioExport({
  portfolioData,
  onExport,
}: PortfolioExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [exportProgress, setExportProgress] = useState(0);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeGovernance, setIncludeGovernance] = useState(true);
  const [includePredictions, setIncludePredictions] = useState(true);
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>(
    'ALL'
  );

  const exportOptions: ExportOption[] = [
    {
      format: 'pdf',
      title: 'PDF Report',
      description: 'Comprehensive portfolio report with charts and analysis',
      icon: <FileText className="w-5 h-5" />,
      fileSize: '~2.5 MB',
      features: [
        'Executive summary',
        'Performance charts',
        'Risk analysis',
        'Governance tracking',
        'Predictive insights',
      ],
    },
    {
      format: 'csv',
      title: 'CSV Data',
      description: 'Raw data export for external analysis',
      icon: <Table className="w-5 h-5" />,
      fileSize: '~150 KB',
      features: [
        'Investment details',
        'Transaction history',
        'Performance metrics',
        'Governance data',
        'Platform benchmarks',
      ],
    },
    {
      format: 'json',
      title: 'JSON Data',
      description: 'Structured data for developers and integrations',
      icon: <CheckCircle className="w-5 h-5" />,
      fileSize: '~75 KB',
      features: [
        'Complete data structure',
        'API-ready format',
        'Nested analytics',
        'Identity insights',
        'Predictive models',
      ],
    },
    {
      format: 'png',
      title: 'Chart Images',
      description: 'High-resolution charts for presentations',
      // This is a lucide react element, not NextJS Image element.
      // eslint-disable-next-line jsx-a11y/alt-text
      icon: <Image className="w-5 h-5" />,
      fileSize: '~5 MB',
      features: [
        'Portfolio performance',
        'Asset allocation',
        'Risk distribution',
        'Trend analysis',
        'Comparison charts',
      ],
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const filters: AnalyticsFilters = {
        timeRange,
        categories: [],
        riskLevels: ['low', 'medium', 'high'],
        projectStatus: ['active', 'completed', 'claiming'],
        performanceMetric: 'roi',
        sortBy: 'performance',
        sortOrder: 'desc',
      };

      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (onExport) {
        await onExport(selectedFormat, filters);
      } else {
        // Default mock export
        await mockExport(selectedFormat);
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      // Reset after success
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      // Handle export error silently or show user notification
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const mockExport = async (format: ExportFormat) => {
    const exportData: PortfolioExportData = {
      generatedAt: new Date().toISOString(),
      portfolioSummary: portfolioData.crossProjectMetrics,
      detailedInvestments: portfolioData.portfolioComparison,
      performanceAnalysis: {
        monthlyData: portfolioData.crossProjectMetrics.monthlyPerformance,
        benchmarkComparison: portfolioData.platformBenchmarks,
        trendAnalysis: portfolioData.trends,
      },
      identityProfile: portfolioData.identityInsights,
      governanceActivity:
        portfolioData.crossProjectMetrics.governanceParticipation,
      predictiveOutlook: portfolioData.predictiveInsights,
    };

    // Create downloadable content based on format
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'pdf':
        content = generatePDFContent(exportData);
        filename = `portfolio-report-${new Date().toISOString().split('T')[0]}.pdf`;
        mimeType = 'application/pdf';
        break;
      case 'csv':
        content = generateCSVContent(exportData);
        filename = `portfolio-data-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        filename = `portfolio-data-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      case 'png':
        // For PNG, we would typically capture chart screenshots
        content = 'Chart export functionality would be implemented here';
        filename = `portfolio-charts-${new Date().toISOString().split('T')[0]}.zip`;
        mimeType = 'application/zip';
        break;
      default:
        throw new Error('Unsupported export format');
    }

    // Create and trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePDFContent = (data: PortfolioExportData): string => {
    // In a real implementation, this would generate PDF content
    return `Portfolio Report - Generated ${data.generatedAt}
    
Total Invested: ${data.portfolioSummary.totalInvested}
Current Value: ${data.portfolioSummary.totalCurrentValue}
Total Returns: ${data.portfolioSummary.totalReturns}
Average ROI: ${data.portfolioSummary.averageROI}%

Projects: ${data.portfolioSummary.totalProjects}
Active: ${data.portfolioSummary.activeProjects}
Completed: ${data.portfolioSummary.completedProjects}

Identity Score: ${data.identityProfile.identityScore}/100
Governance Participation: ${data.governanceActivity.participationRate}%

This is a mock PDF export. In production, this would be a proper PDF document.`;
  };

  const generateCSVContent = (data: PortfolioExportData): string => {
    const headers = [
      'Project Name',
      'Category',
      'Invested Amount',
      'Current Value',
      'ROI',
      'Risk Level',
      'Status',
      'Duration',
    ];

    const rows = data.detailedInvestments.map(investment => [
      investment.projectName,
      investment.category,
      investment.investedAmount,
      investment.currentValue,
      investment.roi,
      investment.riskLevel,
      investment.status,
      investment.duration,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const selectedOption = exportOptions.find(
    opt => opt.format === selectedFormat
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Export Portfolio
          </h3>
          <p className="text-gray-600">
            Download your portfolio data and analytics in various formats
          </p>
        </div>
        <Calendar className="w-6 h-6 text-gray-400" />
      </div>

      {/* Export Format Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {exportOptions.map(option => (
          <div
            key={option.format}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedFormat === option.format
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedFormat(option.format)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div
                  className={`p-2 rounded-lg mr-3 ${
                    selectedFormat === option.format
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {option.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{option.title}</h4>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{option.fileSize}</span>
            </div>
            <div className="text-xs text-gray-600">
              Includes: {option.features.slice(0, 3).join(', ')}
              {option.features.length > 3 && '...'}
            </div>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as typeof timeRange)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="1M">Last Month</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="1Y">Last Year</option>
            <option value="ALL">All Time</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={e => setIncludeCharts(e.target.checked)}
              className="mr-2 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Include Charts</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeGovernance}
              onChange={e => setIncludeGovernance(e.target.checked)}
              className="mr-2 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Governance Data</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includePredictions}
              onChange={e => setIncludePredictions(e.target.checked)}
              className="mr-2 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Predictions</span>
          </label>
        </div>
      </div>

      {/* Selected Format Details */}
      {selectedOption && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">
            {selectedOption.title} Features
          </h4>
          <ul className="space-y-1">
            {selectedOption.features.map((feature, index) => (
              <li
                key={index}
                className="flex items-center text-sm text-gray-600"
              >
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export Progress */}
      {isExporting && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Exporting {selectedOption?.title}...
            </span>
            <span className="text-sm text-gray-600">{exportProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center"
        variant="primary"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Export {selectedOption?.title}
          </>
        )}
      </Button>

      {/* Export History */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Recent Exports</h4>
        <div className="space-y-2">
          {[
            {
              name: 'Portfolio Report Q4 2024',
              format: 'PDF',
              date: '2024-01-10',
              size: '2.3 MB',
            },
            {
              name: 'Investment Data Export',
              format: 'CSV',
              date: '2024-01-05',
              size: '145 KB',
            },
            {
              name: 'Analytics Data Backup',
              format: 'JSON',
              date: '2024-01-01',
              size: '78 KB',
            },
          ].map((export_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
            >
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {export_.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {export_.format} • {export_.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">
                  {export_.size}
                </span>
                <Button variant="secondary" className="text-xs px-2 py-1">
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
