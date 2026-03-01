'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const ANIMATION_CLASS = 'animate-in fade-in slide-in-from-bottom-4 duration-700';
const REDUCED_CLASS = 'animate-in fade-in duration-400';

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Задержка анимации в ms (например, для каскада) */
  delay?: number;
};

export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-200',
        visible && (reduceMotion ? REDUCED_CLASS : ANIMATION_CLASS),
        className
      )}
      style={
        visible && delay > 0
          ? { animationDelay: `${delay}ms`, animationFillMode: 'both' as const }
          : undefined
      }
    >
      {children}
    </div>
  );
}
