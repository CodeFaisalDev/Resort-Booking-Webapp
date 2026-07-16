'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Bell } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === '/') return null;

  return (
    <header className="w-full bg-white border-b border-stone-200 sticky top-0 z-50 px-4 sm:px-8 py-4 shadow-sm flex items-center justify-between">
      {/* Brand logo */}
      <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => router.push('/')}>
        <span className="font-sans text-2xl font-extrabold tracking-tight text-stone-900 flex items-center">
          ESKAP<span className="text-orange-500 italic">INN</span>
        </span>
      </div>

      {/* Center menu options */}
      <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-stone-600 uppercase tracking-wider">
        <Link href="/about" className="hover:text-orange-500 transition-colors">Contact Customer</Link>
        <Link href="/resorts" className="hover:text-orange-500 transition-colors">Hotels</Link>
        <Link href="/book" className="hover:text-orange-500 transition-colors">Explore Map</Link>
        <div className="flex items-center gap-1 cursor-pointer hover:text-orange-500 transition-colors">
          <span>USD</span>
          <span className="text-[10px]">🇺🇸</span>
        </div>
        <button className="relative p-1 text-stone-500 hover:text-orange-500 transition-all">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
        </button>
      </div>

      {/* Right action button */}
      <div>
        {session ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-full shadow-md transition-all active:scale-95"
            >
              Dashboard
            </button>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-stone-500 hover:text-stone-900 font-bold text-xs uppercase transition-all"
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={() => router.push('/login')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase px-6 py-2.5 rounded-full shadow-md transition-all active:scale-95"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
