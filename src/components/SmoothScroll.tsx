'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Helper to clean up all Lenis classes & inline styles on <html> and <body>
    const forceCleanupStyles = () => {
      const html = document.documentElement;
      const body = document.body;
      html.style.overflow = '';
      html.style.height = '';
      html.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-[#141414]', 'lenis-stopped');
      body.style.overflow = '';
      body.style.height = '';
      body.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
    };

    // 1. Immediate reset on route change
    forceCleanupStyles();
    window.scrollTo(0, 0);

    // Skip Lenis on mobile devices for max touch performance & speed
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;

    // Dashboard pages & mobile viewports use native browser scrolling
    if (pathname?.startsWith('/dashboard') || isMobile) {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    let lenis: Lenis | null = null;
    let resizeObserver: ResizeObserver | null = null;

    // 2. Schedule Lenis initialization
    rafIdRef.current = requestAnimationFrame(() => {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.2,
        lerp: 0.09,
        autoResize: true,
      });

      lenisRef.current = lenis;

      // Sync Lenis → GSAP ScrollTrigger
      lenis.on('scroll', () => {
        try {
          ScrollTrigger.update();
        } catch (e) {
          // ignore stale scope triggers
        }
      });

      const updateTicker = (time: number) => {
        lenis?.raf(time * 1000);
      };

      gsap.ticker.add(updateTicker);
      gsap.ticker.lagSmoothing(0);

      // Start at top
      lenis.scrollTo(0, { immediate: true });

      // Observe body height changes & recalculate Lenis + GSAP dimensions
      resizeObserver = new ResizeObserver(() => {
        if (lenisRef.current) {
          lenisRef.current.resize();
          try {
            ScrollTrigger.refresh();
          } catch (e) {}
        }
      });
      resizeObserver.observe(document.body);

      // Extra safety refresh after DOM settles
      setTimeout(() => {
        if (lenisRef.current) {
          lenisRef.current.resize();
          try {
            ScrollTrigger.refresh();
          } catch (e) {}
        }
      }, 200);

      (lenis as any).__updateTicker = updateTicker;
    });

    // 3. Cleanup on unmount or pathname change
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (lenisRef.current) {
        const l = lenisRef.current;
        if ((l as any).__updateTicker) {
          gsap.ticker.remove((l as any).__updateTicker);
        }
        l.destroy();
        lenisRef.current = null;
      }
      forceCleanupStyles();
      try {
        ScrollTrigger.refresh();
      } catch (e) {}
    };
  }, [pathname]);

  return null;
}

