'use client';
import React, { useEffect, useRef, useState } from 'react';

interface AnimateOnScrollProps {
  children: React.ReactNode;
  variant?: 'fade-up' | 'scale-in' | 'rotate-in' | 'fade-in';
  delay?: number;
  duration?: number;
  className?: string;
}

export default function AnimateOnScroll({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 800,
  className = ''
}: AnimateOnScrollProps) {
  const domRef = useRef<HTMLDivElement>(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });

    if (domRef.current) {
      observer.observe(domRef.current);
    }

    return () => {
      if (domRef.current) {
        observer.unobserve(domRef.current);
      }
    };
  }, []);

  const getVariantStyles = () => {
    switch (variant) {
      case 'fade-up':
        return isVisible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-10 opacity-0';
      case 'scale-in':
        return isVisible 
          ? 'scale-100 opacity-100' 
          : 'scale-95 opacity-0';
      case 'rotate-in':
        return isVisible 
          ? 'rotate-0 translate-y-0 opacity-100' 
          : '-rotate-2 translate-y-8 opacity-0';
      case 'fade-in':
        return isVisible 
          ? 'opacity-100' 
          : 'opacity-0';
      default:
        return '';
    }
  };

  return (
    <div
      ref={domRef}
      className={`transition-all ease-[cubic-bezier(0.16,1,0.3,1)] ${getVariantStyles()} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
}
