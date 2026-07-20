'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reset document body styles to default on route transitions
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';

    if (pathname?.startsWith('/dashboard')) {
      return;
    }

    // Register ScrollTrigger if not already done
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential easing
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
    });

    // Synchronize Lenis scroll updates with ScrollTrigger
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // Feed Lenis raf to GSAP ticker
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    
    gsap.ticker.add(updateTicker);

    // Turn off lag smoothing to keep scroll synced
    gsap.ticker.lagSmoothing(0);

    // Scroll to top immediately on page change
    lenis.scrollTo(0, { immediate: true });

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
