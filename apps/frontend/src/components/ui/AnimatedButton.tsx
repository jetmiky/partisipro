'use client';

import { forwardRef, useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'btn-micro relative overflow-hidden transition-all duration-200 ease-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary:
          'btn-primary hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 focus:ring-primary-500',
        secondary:
          'btn-secondary hover:shadow-md hover:-translate-y-0.5 focus:ring-secondary-500',
        accent:
          'btn-accent hover:shadow-lg hover:shadow-accent-500/25 hover:-translate-y-0.5 focus:ring-accent-500',
        outline:
          'btn-outline hover:shadow-md hover:-translate-y-0.5 focus:ring-primary-500',
        ghost:
          'btn-ghost hover:bg-secondary-100 hover:scale-105 focus:ring-secondary-500',
      },
      size: {
        sm: 'btn-sm text-xs px-3 py-1.5',
        default: 'px-6 py-3 text-sm',
        lg: 'btn-lg text-base px-8 py-4',
        xl: 'btn-xl text-lg px-10 py-5',
      },
      loading: {
        true: 'pointer-events-none',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      loading: false,
    },
  }
);

interface RippleProps {
  x: number;
  y: number;
  size: number;
}

const Ripple = ({ x, y, size }: RippleProps) => {
  return (
    <span
      className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        animation: 'ripple 600ms ease-out',
      }}
    />
  );
};

export interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  ripple?: boolean;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      ripple = true,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<RippleProps[]>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (ripples.length > 0) {
        const timer = setTimeout(() => {
          setRipples([]);
        }, 600);
        return () => clearTimeout(timer);
      }
    }, [ripples]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setRipples([{ x, y, size }]);
      }

      if (onClick) {
        onClick(e);
      }
    };

    return (
      <button
        ref={ref || buttonRef}
        className={cn(buttonVariants({ variant, size, loading, className }))}
        onClick={handleClick}
        disabled={loading}
        {...props}
      >
        {/* Ripple Effect */}
        {ripples.map((ripple, index) => (
          <Ripple key={index} {...ripple} />
        ))}

        {/* Button Content */}
        <span
          className={cn(
            'flex items-center justify-center gap-2 transition-all duration-200',
            loading && 'opacity-0'
          )}
        >
          {children}
        </span>

        {/* Loading Indicator */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
          </span>
        )}
      </button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

export { AnimatedButton, buttonVariants };
