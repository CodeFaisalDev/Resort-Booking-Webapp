'use client';
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface AnimateOnScrollProps {
  children: React.ReactNode;
  variant?: 'fade-up' | 'scale-in' | 'rotate-in' | 'fade-in' | 'stagger-grid' | 'parallax';
  delay?: number;
  duration?: number;
  className?: string;
  stagger?: number;
}

export default function AnimateOnScroll({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 0.8,
  className = '',
  stagger = 0.1
}: AnimateOnScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const el = containerRef.current;
    if (!el) return;

    let ctx = gsap.context(() => {
      const delayInSec = delay / 1000;

      if (variant === 'fade-up') {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: duration,
            delay: delayInSec,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      } else if (variant === 'scale-in') {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.92, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: duration,
            delay: delayInSec,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          }
        );
      } else if (variant === 'rotate-in') {
        gsap.fromTo(
          el,
          { opacity: 0, rotation: -3, y: 35 },
          {
            opacity: 1,
            rotation: 0,
            y: 0,
            duration: duration,
            delay: delayInSec,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      } else if (variant === 'fade-in') {
        gsap.fromTo(
          el,
          { opacity: 0 },
          {
            opacity: 1,
            duration: duration,
            delay: delayInSec,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          }
        );
      } else if (variant === 'stagger-grid') {
        const children = el.children;
        if (children && children.length > 0) {
          gsap.fromTo(
            Array.from(children),
            { opacity: 0, y: 30, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: duration,
              delay: delayInSec,
              stagger: stagger,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      } else if (variant === 'parallax') {
        gsap.to(el, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [variant, delay, duration, stagger]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

