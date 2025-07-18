'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/utils/cn';

interface IntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

// Hook for intersection observer
const useIntersectionObserver = <T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverOptions = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<T>(null);

  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);

        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, hasIntersected]);

  const shouldAnimate = triggerOnce ? hasIntersected : isIntersecting;

  return [elementRef, shouldAnimate] as const;
};

// Scroll Reveal Component
interface ScrollRevealProps {
  children: React.ReactNode;
  animation?:
    | 'fade'
    | 'slide-up'
    | 'slide-down'
    | 'slide-left'
    | 'slide-right'
    | 'scale'
    | 'blur';
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
  stagger?: boolean;
  staggerDelay?: number;
}

const ScrollReveal = ({
  children,
  animation = 'fade',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
  className,
  stagger = false,
  staggerDelay = 100,
}: ScrollRevealProps) => {
  const [ref, isVisible] = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce,
  });

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all ease-out';
    const durationClass = `duration-${duration}`;

    switch (animation) {
      case 'fade':
        return cn(
          baseClasses,
          durationClass,
          isVisible ? 'opacity-100' : 'opacity-0'
        );

      case 'slide-up':
        return cn(
          baseClasses,
          durationClass,
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        );

      case 'slide-down':
        return cn(
          baseClasses,
          durationClass,
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
        );

      case 'slide-left':
        return cn(
          baseClasses,
          durationClass,
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
        );

      case 'slide-right':
        return cn(
          baseClasses,
          durationClass,
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
        );

      case 'scale':
        return cn(
          baseClasses,
          durationClass,
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        );

      case 'blur':
        return cn(
          baseClasses,
          durationClass,
          isVisible ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
        );

      default:
        return baseClasses;
    }
  };

  // Handle staggered animations
  useEffect(() => {
    if (stagger && isVisible && ref.current) {
      const elements = ref.current.querySelectorAll('[data-stagger-item]');
      elements.forEach((el, index) => {
        const element = el as HTMLElement;
        element.style.transitionDelay = `${delay + index * staggerDelay}ms`;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, stagger, delay, staggerDelay]);

  return (
    <div
      ref={ref}
      className={cn(getAnimationClasses(), className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Parallax Scroll Component
interface ParallaxScrollProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  reverse?: boolean;
}

const ParallaxScroll = ({
  children,
  speed = 0.5,
  className,
  reverse = false,
}: ParallaxScrollProps) => {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    const scrolled = window.pageYOffset;
    const rate = scrolled * speed * (reverse ? -1 : 1);

    setOffset(rate);
  }, [speed, reverse]);

  useEffect(() => {
    // Use passive listener for better performance
    const options = { passive: true };

    window.addEventListener('scroll', handleScroll, options);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div
      ref={elementRef}
      className={cn('will-change-transform', className)}
      style={{
        transform: `translateY(${offset}px)`,
      }}
    >
      {children}
    </div>
  );
};

// Staggered List Component
interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  itemDelay?: number;
  animation?: 'fade' | 'slide-up' | 'scale';
}

const StaggeredList = ({
  children,
  className,
  itemDelay = 100,
  animation = 'slide-up',
}: StaggeredListProps) => {
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (isVisible && ref.current) {
      const items = ref.current.children;

      Array.from(items).forEach((item, index) => {
        const element = item as HTMLElement;
        element.style.transitionDelay = `${index * itemDelay}ms`;

        // Add animation classes
        element.classList.add('transition-all', 'duration-600', 'ease-out');

        switch (animation) {
          case 'fade':
            element.classList.add('opacity-100');
            break;
          case 'slide-up':
            element.classList.add('opacity-100', 'translate-y-0');
            break;
          case 'scale':
            element.classList.add('opacity-100', 'scale-100');
            break;
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, itemDelay, animation]);

  // Initial hidden state
  const getInitialItemClasses = () => {
    switch (animation) {
      case 'fade':
        return 'opacity-0';
      case 'slide-up':
        return 'opacity-0 translate-y-8';
      case 'scale':
        return 'opacity-0 scale-95';
      default:
        return 'opacity-0';
    }
  };

  return (
    <div ref={ref} className={cn('space-y-4', className)}>
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <div key={index} className={getInitialItemClasses()}>
            {child}
          </div>
        ))
      ) : (
        <div className={getInitialItemClasses()}>{children}</div>
      )}
    </div>
  );
};

// Scroll Progress Component
interface ScrollProgressProps {
  className?: string;
  color?: string;
  height?: string;
}

const ScrollProgress = ({
  className,
  color = '#4A90E2',
  height = '2px',
}: ScrollProgressProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = (scrollTop / documentHeight) * 100;

      setProgress(scrollProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        'fixed top-0 left-0 w-full bg-secondary-200 z-50 transition-all duration-150',
        className
      )}
      style={{ height }}
    >
      <div
        className="h-full bg-primary-600 transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};

export {
  ScrollReveal,
  ParallaxScroll,
  StaggeredList,
  ScrollProgress,
  useIntersectionObserver,
};
