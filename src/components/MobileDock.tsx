'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Calendar, User } from 'lucide-react';

export default function MobileDock() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/book', icon: Search },
    { label: 'Bookings', href: '/dashboard', icon: Calendar },
    { label: 'Profile', href: '/login', icon: User }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-around gap-6 bg-stone-900/85 backdrop-blur-xl border border-stone-800/60 px-6 py-3.5 rounded-full shadow-[0_15px_30px_-5px_rgba(0,0,0,0.8)] md:hidden w-[85%] max-w-[360px] animate-slide-up">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all duration-300 relative p-1.5 ${
              isActive ? 'text-amber-400 scale-110' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider font-sans">{item.label}</span>
            {isActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24]" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
