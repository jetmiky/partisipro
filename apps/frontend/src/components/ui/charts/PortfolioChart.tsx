'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

interface PortfolioChartProps {
  data: Array<{
    month: string;
    totalValue: number;
    returns: number;
    roi: number;
  }>;
  type: 'performance' | 'returns' | 'comparison';
  height?: number;
  showTrend?: boolean;
}

interface DataPoint {
  x: number;
  y: number;
  label: string;
  value: number;
}

export function PortfolioChart({
  data,
  type,
  height = 200,
  showTrend = true,
}: PortfolioChartProps) {
  const chartData = useMemo(() => {
    const processedData: DataPoint[] = data.map((item, index) => ({
      x: index,
      y:
        type === 'performance'
          ? item.totalValue
          : type === 'returns'
            ? item.returns
            : item.roi,
      label: new Date(item.month).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      value:
        type === 'performance'
          ? item.totalValue
          : type === 'returns'
            ? item.returns
            : item.roi,
    }));

    return processedData;
  }, [data, type]);

  const { maxValue, minValue, trend } = useMemo(() => {
    const values = chartData.map(d => d.y);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const firstValue = values[0] || 0;
    const lastValue = values[values.length - 1] || 0;
    const trendDirection = lastValue > firstValue ? 'up' : 'down';
    const trendPercent = firstValue
      ? ((lastValue - firstValue) / firstValue) * 100
      : 0;

    return {
      maxValue: max,
      minValue: min,
      trend: {
        direction: trendDirection,
        percentage: Math.abs(trendPercent),
      },
    };
  }, [chartData]);

  const formatValue = (value: number) => {
    if (type === 'comparison') {
      return `${value.toFixed(1)}%`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const createSVGPath = (points: DataPoint[]) => {
    if (points.length < 2) return '';

    const chartWidth = 100; // Use percentage for responsive
    const chartHeight = 100;
    const padding = 5;

    const xStep = (chartWidth - padding * 2) / (points.length - 1);
    const yRange = maxValue - minValue;
    const yScale = yRange > 0 ? (chartHeight - padding * 2) / yRange : 0;

    let path = '';
    points.forEach((point, index) => {
      const x = padding + index * xStep;
      const y = chartHeight - padding - (point.y - minValue) * yScale;

      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  };

  const svgPath = createSVGPath(chartData);

  const getChartColor = () => {
    switch (type) {
      case 'performance':
        return trend.direction === 'up' ? '#10b981' : '#ef4444';
      case 'returns':
        return '#3b82f6';
      case 'comparison':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getChartTitle = () => {
    switch (type) {
      case 'performance':
        return 'Portfolio Performance';
      case 'returns':
        return 'Monthly Returns';
      case 'comparison':
        return 'ROI Comparison';
      default:
        return 'Chart';
    }
  };

  const getChartIcon = () => {
    switch (type) {
      case 'performance':
        return trend.direction === 'up' ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        );
      case 'returns':
        return <Activity className="w-4 h-4" />;
      case 'comparison':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div
            className={`p-2 rounded-lg mr-3`}
            style={{
              backgroundColor: `${getChartColor()}15`,
              color: getChartColor(),
            }}
          >
            {getChartIcon()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{getChartTitle()}</h3>
            <p className="text-sm text-gray-600">
              {chartData.length} data points
            </p>
          </div>
        </div>
        {showTrend && (
          <div className="text-right">
            <div
              className={`flex items-center text-sm font-medium ${
                trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {trend.percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">vs previous</div>
          </div>
        )}
      </div>

      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0"
        >
          {/* Grid lines */}
          <defs>
            <pattern
              id={`grid-${type}`}
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect
            width="100"
            height="100"
            fill={`url(#grid-${type})`}
            opacity="0.5"
          />

          {/* Chart line */}
          <path
            d={svgPath}
            fill="none"
            stroke={getChartColor()}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Fill area under curve */}
          <path
            d={`${svgPath} L 95 95 L 5 95 Z`}
            fill={getChartColor()}
            opacity="0.1"
          />

          {/* Data points */}
          {chartData.map((point, index) => {
            const x = 5 + (index * 90) / (chartData.length - 1);
            const y = 95 - ((point.y - minValue) / (maxValue - minValue)) * 90;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill={getChartColor()}
                className="cursor-pointer hover:r-3 transition-all"
              >
                <title>
                  {point.label}: {formatValue(point.value)}
                </title>
              </circle>
            );
          })}
        </svg>

        {/* Data labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 pt-2">
          {chartData.map((point, index) => (
            <div
              key={index}
              className="text-center"
              style={{
                marginLeft: index === 0 ? '0' : '-20px',
                marginRight: index === chartData.length - 1 ? '0' : '-20px',
              }}
            >
              {point.label}
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {formatValue(maxValue)}
            </div>
            <div className="text-xs text-gray-500">Peak</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {formatValue(chartData[chartData.length - 1]?.value || 0)}
            </div>
            <div className="text-xs text-gray-500">Current</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {formatValue(
                chartData.reduce((sum, point) => sum + point.value, 0) /
                  chartData.length
              )}
            </div>
            <div className="text-xs text-gray-500">Average</div>
          </div>
        </div>
      </div>
    </div>
  );
}
