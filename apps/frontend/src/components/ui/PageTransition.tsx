'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  transitionKey?: string;
  type?: 'fade' | 'slide' | 'scale' | 'blur';
  duration?: number;
  stagger?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const PageTransition = ({
  children,
  className,
  transitionKey,
  type = 'fade',
  duration = 300,
  stagger = false,
  direction = 'up',
}: PageTransitionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousKey = useRef<string | undefined>(transitionKey);

  // Animation variants based on type and direction
  const getAnimationClasses = (entering: boolean, exiting: boolean) => {
    const baseClasses = 'transition-all ease-out';
    const durationClass = `duration-${duration}`;

    switch (type) {
      case 'fade':
        return cn(
          baseClasses,
          durationClass,
          entering && !exiting ? 'opacity-100' : 'opacity-0'
        );

      case 'slide':
        // eslint-disable-next-line no-case-declarations
        const slideTransforms = {
          up: entering && !exiting ? 'translate-y-0' : 'translate-y-8',
          down: entering && !exiting ? 'translate-y-0' : '-translate-y-8',
          left: entering && !exiting ? 'translate-x-0' : 'translate-x-8',
          right: entering && !exiting ? 'translate-x-0' : '-translate-x-8',
        };

        return cn(
          baseClasses,
          durationClass,
          entering && !exiting ? 'opacity-100' : 'opacity-0',
          slideTransforms[direction]
        );

      case 'scale':
        return cn(
          baseClasses,
          durationClass,
          entering && !exiting ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        );

      case 'blur':
        return cn(
          baseClasses,
          durationClass,
          entering && !exiting ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
        );

      default:
        return baseClasses;
    }
  };

  useEffect(() => {
    // Handle transition key changes
    if (transitionKey !== previousKey.current) {
      setIsExiting(true);

      const exitTimer = setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
        previousKey.current = transitionKey;

        // Small delay before entering
        const enterTimer = setTimeout(() => {
          setIsVisible(true);
        }, 50);

        return () => clearTimeout(enterTimer);
      }, duration);

      return () => clearTimeout(exitTimer);
    } else {
      // Initial mount
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [transitionKey, duration]);

  // Staggered animation for child elements
  useEffect(() => {
    if (stagger && isVisible && containerRef.current) {
      const elements = containerRef.current.querySelectorAll('[data-stagger]');
      elements.forEach((el, index) => {
        const element = el as HTMLElement;
        element.style.transitionDelay = `${index * 100}ms`;
      });
    }
  }, [isVisible, stagger]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'will-change-transform',
        getAnimationClasses(isVisible, isExiting),
        className
      )}
    >
      {children}
    </div>
  );
};

// Staggered Item Component
interface StaggeredItemProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const StaggeredItem = ({
  children,
  delay = 0,
  className,
}: StaggeredItemProps) => {
  return (
    <div
      data-stagger
      className={cn('transition-all duration-300 ease-out', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Page Slide Transition Hook
export const usePageTransition = (initialState = false) => {
  const [isTransitioning, setIsTransitioning] = useState(initialState);
  const [currentPage, setCurrentPage] = useState<string | null>(null);

  const transitionTo = (pageKey: string, duration = 300) => {
    setIsTransitioning(true);
    setCurrentPage(pageKey);

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, duration);

    return () => clearTimeout(timer);
  };

  return {
    isTransitioning,
    currentPage,
    transitionTo,
  };
};

export { PageTransition, StaggeredItem };
