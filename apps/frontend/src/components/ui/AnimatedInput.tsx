'use client';

import { forwardRef, useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const inputVariants = cva(
  'input-micro w-full py-3 text-base border rounded-lg bg-white transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 placeholder:text-muted-foreground disabled:bg-secondary-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          'border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20',
        error:
          'border-error-500 focus:border-error-500 focus:ring-error-500/20 bg-error-50/50',
        success:
          'border-success-500 focus:border-success-500 focus:ring-success-500/20 bg-success-50/50',
        warning:
          'border-warning-500 focus:border-warning-500 focus:ring-warning-500/20 bg-warning-50/50',
      },
      size: {
        sm: 'py-2 text-sm',
        default: 'py-3 text-base',
        lg: 'py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const FloatingLabel = ({
  children,
  htmlFor,
  focused,
  hasValue,
  variant,
  hasIcon,
}: {
  children: React.ReactNode;
  htmlFor: string;
  focused: boolean;
  hasValue: boolean;
  variant: 'default' | 'error' | 'success' | 'warning';
  hasIcon?: boolean;
}) => {
  const colorMap = {
    default: focused ? 'text-primary-600' : 'text-muted-foreground',
    error: 'text-error-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
  };

  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'absolute transition-all duration-200 ease-out pointer-events-none',
        hasIcon ? 'left-12' : 'left-4',
        focused || hasValue
          ? '-top-2 text-xs bg-white px-1 rounded'
          : 'top-3 text-base',
        colorMap[variant]
      )}
    >
      {children}
    </label>
  );
};

const ValidationIcon = ({
  variant,
}: {
  variant: 'error' | 'success' | 'warning';
}) => {
  const icons = {
    error: <XCircle className="w-5 h-5 text-error-500" />,
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    warning: <AlertCircle className="w-5 h-5 text-warning-500" />,
  };

  return (
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-fade-in">
      {icons[variant]}
    </div>
  );
};

export interface AnimatedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  success?: string;
  warning?: string;
  showPasswordToggle?: boolean;
  icon?: React.ReactNode;
}

const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  (
    {
      className,
      variant,
      size,
      label,
      error,
      success,
      warning,
      showPasswordToggle = false,
      type = 'text',
      id,
      icon,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const uniqueId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Determine actual variant based on validation states
    const actualVariant = error
      ? 'error'
      : success
        ? 'success'
        : warning
          ? 'warning'
          : variant || 'default';

    const handleFocus = () => {
      setFocused(true);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setHasValue(!!e.target.value);
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    useEffect(() => {
      if (inputRef.current) {
        setHasValue(!!inputRef.current.value);
      }
    }, []);

    const inputType =
      showPasswordToggle && type === 'password'
        ? showPassword
          ? 'text'
          : 'password'
        : type;

    return (
      <div className="relative">
        {/* Input Container */}
        <div className="relative">
          <input
            ref={ref || inputRef}
            type={inputType}
            id={uniqueId}
            className={cn(
              inputVariants({ variant: actualVariant, size, className }),
              label && 'placeholder-transparent',
              icon ? 'pl-12' : 'pl-4',
              (showPasswordToggle || error || success || warning) && 'pr-12'
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
            placeholder={label ? '' : props.placeholder}
          />

          {/* Icon */}
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}

          {/* Floating Label */}
          {label && (
            <FloatingLabel
              htmlFor={uniqueId}
              focused={focused}
              hasValue={hasValue}
              variant={actualVariant}
              hasIcon={!!icon}
            >
              {label}
            </FloatingLabel>
          )}

          {/* Validation Icons */}
          {(error || success || warning) && !showPasswordToggle && (
            <ValidationIcon
              variant={actualVariant as 'error' | 'success' | 'warning'}
            />
          )}

          {/* Password Toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Validation Messages */}
        {(error || success || warning) && (
          <div className="mt-1 animate-slide-down">
            {error && (
              <p className="text-sm text-error-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-success-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {success}
              </p>
            )}
            {warning && (
              <p className="text-sm text-warning-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {warning}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

export { AnimatedInput, inputVariants };
