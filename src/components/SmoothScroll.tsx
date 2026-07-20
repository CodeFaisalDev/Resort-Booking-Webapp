'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ── 1. Hard-reset scroll state on EVERY route change ──
    // This is critical: Lenis sets overflow:hidden on <html>.
    // When destroyed, it may not fully reset — causing scroll-lock
    // on the next page if the new Lenis hasn't initialized yet.
    document.documentElement.style.overflow = '';
    document.documentElement.style.height = '';
    document.body.style.overflow = '';
    document.body.style.height = '';
    window.scrollTo(0, 0);

    // Dashboard pages use fixed-viewport layouts with their own
    // overflow-y-auto panels — Lenis must NOT run there.
    if (pathname?.startsWith('/dashboard')) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // ── 2. Delay Lenis init by one animation frame ──
    // This ensures React has flushed the new page's DOM before
    // Lenis measures content height. Without this, Lenis may
    // calculate maxScroll = 0 and lock scrolling.
    let rafId: number;
    let lenis: Lenis;

    rafId = requestAnimationFrame(() => {
      lenis = new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.3,
        lerp: 0.08,
        autoResize: true,
      });

      lenisRef.current = lenis;

      // Sync Lenis → GSAP ScrollTrigger
      lenis.on('scroll', () => {
        ScrollTrigger.update();
      });

      const updateTicker = (time: number) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(updateTicker);
      gsap.ticker.lagSmoothing(0);

      // Start at top
      lenis.scrollTo(0, { immediate: true });

      // Force a resize recalculation after content settles
      setTimeout(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      }, 150);

      // Store cleanup data
      (lenis as any).__updateTicker = updateTicker;
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (lenisRef.current) {
        const l = lenisRef.current;
        if ((l as any).__updateTicker) {
          gsap.ticker.remove((l as any).__updateTicker);
        }
        l.destroy();
        lenisRef.current = null;
      }
      // Hard-reset on cleanup too
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, [pathname]);

  return null;
}
