'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  actions?: React.ReactNode;
  showCloseButton?: boolean;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  actions,
  showCloseButton = true,
}: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      default:
        return 'max-w-lg';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop - New glass-modal-overlay */}
      <div className="glass-modal-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`
          relative glass-modern rounded-2xl shadow-2xl w-full ${getSizeClasses()}
          transform transition-all duration-300 ease-out
        `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary-200/30">
            <h3 className="text-lg font-semibold text-primary-900">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50/50 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>

          {/* Actions */}
          {actions && (
            <div className="px-6 py-4 border-t border-primary-200/30 flex items-center justify-end gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
