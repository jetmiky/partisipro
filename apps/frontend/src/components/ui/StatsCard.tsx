'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'cyan';
  subtitle?: string;
  description?: string;
}

const StatsCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = 'blue',
  subtitle,
}: StatsCardProps) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'glass-light border-support-200 text-support-600';
      case 'purple':
        return 'glass-light border-secondary-200 text-secondary-600';
      case 'red':
        return 'glass-light border-accent-200 text-accent-600';
      case 'yellow':
        return 'glass-light border-primary-200 text-primary-600';
      case 'cyan':
        return 'glass-light border-support-200 text-support-600';
      default:
        return 'glass-light border-primary-200 text-primary-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decrease':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="glass-performance rounded-xl border border-primary-200/30 p-6 hover:shadow-xl hover:glass-animate transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-primary-600">{title}</h3>
        {icon && (
          <div className={`p-3 rounded-xl ${getColorClasses()}`}>{icon}</div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-2xl font-bold text-primary-900">{value}</div>

        {subtitle && <p className="text-sm text-primary-600">{subtitle}</p>}

        {change !== undefined && (
          <div className="flex items-center gap-1">
            {getChangeIcon()}
            <span className={`text-sm font-medium ${getChangeColor()}`}>
              {change > 0 ? '+' : ''}
              {change}%
            </span>
            <span className="text-sm text-primary-500">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
