'use client';

import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  illustration?: React.ReactNode;
  className?: string;
}

const EmptyState = ({
  title,
  description,
  icon,
  action,
  illustration,
  className = '',
}: EmptyStateProps) => {
  const defaultIllustration = (
    <svg
      className="w-48 h-48 text-gray-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {/* Icon/Illustration */}
      <div className="mb-6">{illustration || icon || defaultIllustration}</div>

      {/* Title */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-500 max-w-md mb-6">{description}</p>

      {/* Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'primary'}
          className="min-w-[120px]"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
