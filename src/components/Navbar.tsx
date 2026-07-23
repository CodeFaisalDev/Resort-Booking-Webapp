'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFloatingHeader, setShowFloatingHeader] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingHeader(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/resorts' && pathname?.startsWith('/resorts')) return true;
    return pathname === path;
  };

  const linkStyle = (path: string) => {
    return `transition-colors uppercase tracking-[0.2em] text-[11px] font-semibold ${isActive(path) ? 'text-brand-accent' : 'text-[#A0A0A0] hover:text-white'
      }`;
  };

  if (pathname?.startsWith('/dashboard')) return null;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${showFloatingHeader || pathname !== '/'
        ? 'bg-[#141414]/90 backdrop-blur-md py-4 px-4 md:px-16 border-white/10 shadow-lg'
        : 'bg-transparent py-6 px-4 md:px-16 border-transparent'
        }`}>
        <div className="flex items-center justify-between">
          {/* Brand logo */}
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => router.push('/')}>
            <span className="font-heading text-lg md:text-2xl font-semibold tracking-wide text-white">
              BOOKME<span className="text-brand-accent">.COM</span>
            </span>
          </div>

          {/* Center menu links */}
          <div className="hidden md:flex items-center gap-10">
            <Link href="/book" className={linkStyle('/book')}>
              Stays Map
            </Link>
            <Link href="/resorts" className={linkStyle('/resorts')}>
              Destinations
            </Link>
            <Link href="/about" className={linkStyle('/about')}>
              About & Experiences
            </Link>
          </div>

          {/* Right action button */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              {session ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-brand-accent hover:bg-brand-accent-hover text-white text-[11px] font-bold uppercase tracking-wider py-2.5 px-6 rounded-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-[#A0A0A0] hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="bg-brand-accent hover:bg-brand-accent-hover text-white text-[11px] font-bold uppercase tracking-wider py-2.5 px-6 rounded-lg transition-all active:scale-95 cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col items-center justify-center w-9 h-9 gap-1.5 bg-transparent border-none cursor-pointer"
              aria-label="Toggle menu"
            >
              <span className={`w-5 h-[1.5px] bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-[4.5px]' : ''}`} />
              <span className={`w-5 h-[1.5px] bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-[1.5px] bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-[4.5px]' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Full-Screen Mobile Navigation Overlay (Independent of header nav) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[999] bg-[#0D0D0D] w-full h-full min-h-screen md:hidden flex flex-col justify-between p-6 sm:p-10 overflow-y-auto animate-in fade-in zoom-in-95">
          {/* Top Bar inside overlay */}
          <div className="flex items-center justify-between border-b border-white/10 pb-6 shrink-0">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setMobileMenuOpen(false); router.push('/'); }}>
              <span className="font-heading text-xl font-bold tracking-wider text-white">
                BOOKME<span className="text-brand-accent">.COM</span>
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Center Navigation Links */}
          <div className="flex flex-col gap-6 my-auto py-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">Navigation Menu</p>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-2xl sm:text-3xl font-heading font-medium tracking-wide transition-colors ${pathname === '/' ? 'text-brand-accent font-semibold' : 'text-stone-300 hover:text-white'
                }`}
            >
              01. Home Overview
            </Link>
            <Link
              href="/resorts"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-2xl sm:text-3xl font-heading font-medium tracking-wide transition-colors ${pathname?.startsWith('/resorts') ? 'text-brand-accent font-semibold' : 'text-stone-300 hover:text-white'
                }`}
            >
              02. Explore Resorts
            </Link>
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-2xl sm:text-3xl font-heading font-medium tracking-wide transition-colors ${pathname === '/book' ? 'text-brand-accent font-semibold' : 'text-stone-300 hover:text-white'
                }`}
            >
              03. Interactive Stays Map
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-2xl sm:text-3xl font-heading font-medium tracking-wide transition-colors ${pathname === '/about' ? 'text-brand-accent font-semibold' : 'text-stone-300 hover:text-white'
                }`}
            >
              04. About & Experiences
            </Link>
          </div>

          {/* Bottom Session & Action Drawer */}
          <div className="border-t border-white/10 pt-6 flex flex-col gap-4 shrink-0">
            {session ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-stone-900 p-3.5 rounded-xl border border-stone-800">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{session.user?.name}</span>
                    <span className="text-[10px] text-stone-400">{session.user?.email}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setMobileMenuOpen(false); router.push('/dashboard'); }}
                    className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                    className="border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
                  className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); router.push('/login?tab=register'); }}
                  className="border border-amber-500/30 hover:border-amber-500 text-amber-400 text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer text-center"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
