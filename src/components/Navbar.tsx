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
    return `transition-colors uppercase tracking-[0.2em] text-[11px] font-semibold ${
      isActive(path) ? 'text-brand-accent' : 'text-[#A0A0A0] hover:text-white'
    }`;
  };

  if (pathname?.startsWith('/dashboard')) return null;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
      showFloatingHeader || pathname !== '/'
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

      {/* Mobile dropdown menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-400 ease-in-out ${mobileMenuOpen ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col gap-4 py-4 border-t border-white/10">
          <Link href="/book" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0] hover:text-white transition-colors">Stays Map</Link>
          <Link href="/resorts" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0] hover:text-white transition-colors">Destinations</Link>
          <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0] hover:text-white transition-colors">About & Experiences</Link>
          <div className="pt-2 border-t border-white/5 flex flex-col gap-3">
            {session ? (
              <>
                <button 
                  onClick={() => { setMobileMenuOpen(false); router.push('/dashboard'); }} 
                  className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white text-[11px] font-bold uppercase tracking-wider py-3 rounded-lg cursor-pointer"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }); }} 
                  className="w-full border border-white/10 hover:border-white/20 text-white text-[11px] font-bold uppercase tracking-wider py-3 rounded-lg cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => { setMobileMenuOpen(false); router.push('/login'); }} 
                className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white text-[11px] font-bold uppercase tracking-wider py-3 rounded-lg cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
