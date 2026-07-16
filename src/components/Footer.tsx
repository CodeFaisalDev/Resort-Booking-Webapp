'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, Mail, ArrowUpRight, ArrowUp, Star, Loader2 } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [footerEmail, setFooterEmail] = useState('');
  const [footerSubscribed, setFooterSubscribed] = useState(false);
  const [footerSubscribing, setFooterSubscribing] = useState(false);
  
  const handleFooterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!footerEmail.trim() || !footerEmail.includes('@')) return;
    setFooterSubscribing(true);
    setTimeout(() => {
      setFooterSubscribing(false);
      setFooterSubscribed(true);
      setFooterEmail('');
    }, 1200);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Only hide on dashboard routes
  if (pathname.startsWith('/dashboard')) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-[#0a0a0a] text-stone-400 border-t border-stone-800/50">
      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16 py-14 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Column 1: Logo & Tagline */}
          <div className="space-y-5">
            <Link href="/" className="inline-block group">
              <span className="font-sans text-2xl font-black tracking-tight text-white transition-colors group-hover:text-orange-500">
                ESKAP<span className="text-orange-500 italic">INN</span>
              </span>
            </Link>
            <p className="text-[13px] text-stone-500 leading-relaxed max-w-xs font-medium">
              Curating extraordinary stays across 30+ destinations worldwide. From overwater villas to alpine chalets — your dream escape starts here.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { label: 'Instagram', path: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z', rect: true },
                { label: 'Facebook', path: 'M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z' },
                { label: 'X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                { label: 'YouTube', path: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 11.75a29 29 0 0 0-.46-5.33zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z' },
              ].map((social, i) => (
                <a key={i} href="#" aria-label={social.label}
                  className="w-9 h-9 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:scale-105 active:scale-95 transition-all duration-350 cursor-pointer">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    {social.rect && <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />}
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-5">
            <h4 className="text-[12px] font-bold text-white uppercase tracking-[0.15em]">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'All Destinations', href: '/resorts' },
                { label: 'Hotels & Resorts', href: '/resorts' },
                { label: 'About Us', href: '/about' },
                { label: 'Sign In', href: '/login' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Contact Support', href: '/about' },
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href}
                    className="text-[13px] text-stone-500 hover:text-white transition-colors font-semibold flex items-center gap-1.5 group cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-800 group-hover:bg-orange-500 transition-colors" />
                    <span className="relative pb-0.5 overflow-hidden">
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Top Destinations */}
          <div className="space-y-5">
            <h4 className="text-[12px] font-bold text-white uppercase tracking-[0.15em]">Top Destinations</h4>
            <ul className="space-y-3">
              {[
                'Maldives', 'Bali, Indonesia', 'Santorini, Greece',
                'Dubai, UAE', 'Phuket, Thailand', 'Bora Bora',
                'Amalfi Coast, Italy', 'Maui, Hawaii',
              ].map((dest, i) => (
                <li key={i}>
                  <Link href={`/resorts?query=${encodeURIComponent(dest.split(',')[0])}`}
                    className="text-[13px] text-stone-500 hover:text-white transition-colors font-semibold flex items-center gap-1.5 group cursor-pointer">
                    <MapPin className="h-3 w-3 text-stone-700 group-hover:text-orange-500 transition-colors shrink-0" />
                    <span className="relative pb-0.5 overflow-hidden">
                      {dest}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Newsletter */}
          <div className="space-y-5">
            <h4 className="text-[12px] font-bold text-white uppercase tracking-[0.15em]">Stay Connected</h4>
            <ul className="space-y-3 text-[13px] font-semibold">
              <li className="flex items-center gap-2.5 hover:text-stone-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span>750 Luxury Promenade, Maldives</span>
              </li>
              <li className="flex items-center gap-2.5 hover:text-stone-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                  <Phone className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span>+1 800-ESKAP-INN</span>
              </li>
              <li className="flex items-center gap-2.5 hover:text-stone-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                  <Mail className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span>concierge@eskapinn.com</span>
              </li>
            </ul>

            {/* Mini newsletter */}
            <div className="pt-3">
              <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Footer Newsletter</span>
              {footerSubscribed ? (
                <div className="mt-2 text-[11.5px] font-bold text-orange-400 bg-orange-500/5 border border-orange-500/10 rounded-xl p-2.5 animate-fade-in">
                  ✓ Successfully subscribed!
                </div>
              ) : (
                <form onSubmit={handleFooterSubscribe} className="mt-2 flex bg-stone-900/80 rounded-full border border-stone-800 p-1">
                  <input type="email" placeholder="Your email" value={footerEmail} onChange={(e) => setFooterEmail(e.target.value)}
                    className="bg-transparent text-[12px] text-stone-250 placeholder:text-stone-600 outline-none px-3.5 flex-1 font-bold" required />
                  <button type="submit" disabled={footerSubscribing} className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-full transition-all shrink-0 active:scale-95 disabled:opacity-50 flex items-center justify-center cursor-pointer">
                    {footerSubscribing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-stone-800/50">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-stone-600 font-semibold uppercase tracking-wider">
            © {year} ESKAPINN Group. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* Payment method badges */}
            {['Visa', 'Mastercard', 'Amex', 'PayPal'].map((pm, i) => (
              <span key={i} className="text-[10px] font-black text-stone-650 bg-stone-900 px-2.5 py-1 rounded border border-stone-800/80 uppercase tracking-wider select-none">
                {pm}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-stone-500 font-bold">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>

      {/* Floating Scroll Top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/25 transition-all hover:scale-110 active:scale-95 border border-orange-400 cursor-pointer animate-fade-in flex items-center justify-center"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4.5 w-4.5 stroke-[2.5]" />
        </button>
      )}
    </footer>
  );
}
