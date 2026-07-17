'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, User, Shield, Compass } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [roleType, setRoleType] = useState('GUEST'); // GUEST or STAFF

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [idProofNum, setIdProofNum] = useState('');

  // States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      // Sign Up Guest Flow
      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password, phone, nationality, idProofNum }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Registration failed');
          setLoading(false);
          return;
        }

        // Auto log in after sign up
        const loginRes = await signIn('credentials', {
          redirect: false,
          email,
          password,
          roleType: 'GUEST',
        });

        if (loginRes?.error) {
          setError('Sign up success, but login failed. Please sign in manually.');
        } else {
          router.push('/dashboard');
        }
      } catch (err: any) {
        setError('An unexpected error occurred during sign up.');
      } finally {
        setLoading(false);
      }
    } else {
      // Sign In Flow
      try {
        const loginRes = await signIn('credentials', {
          redirect: false,
          email,
          password,
          roleType,
        });

        if (loginRes?.error) {
          setError('Invalid email, password, or login type.');
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        setError('An error occurred during sign in.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-[#141414] text-[#E5E5E5] px-4 py-20 pt-28 relative overflow-hidden">
      
      {/* Glow Backdrops */}
      <div className="absolute top-[10%] left-[-15%] w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] right-[-15%] w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-8 bg-[#1A1A1A]/80 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-2xl relative border border-white/5">
        
        <div className="text-center select-none">
          <Compass className="mx-auto h-12 w-12 text-brand-accent animate-spin-slow" />
          <h2 className="mt-4 font-heading text-3xl font-normal tracking-tight text-white">
            {isSignUp ? 'Join Luxury Horizon' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-xs text-[#A0A0A0] font-medium">
            {isSignUp ? 'Create your profile to start booking' : 'Access your resort reservation engine'}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-950/40 border border-red-500/20 p-3.5 text-center text-xs text-red-400 font-semibold shadow-sm">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Sign In Role Type Switch */}
          {!isSignUp && (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#141414]/50 p-1 border border-white/5">
              <button
                type="button"
                onClick={() => setRoleType('GUEST')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${roleType === 'GUEST' ? 'bg-brand-accent text-white shadow-md' : 'text-[#8a8a8a] hover:text-white'}`}
              >
                Guest Portal
              </button>
              <button
                type="button"
                onClick={() => setRoleType('STAFF')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${roleType === 'STAFF' ? 'bg-brand-accent text-white shadow-md' : 'text-[#8a8a8a] hover:text-white'}`}
              >
                Staff Portal
              </button>
            </div>
          )}

          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600 transition-colors"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3 px-4 text-sm text-stone-100 placeholder-stone-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">Nationality</label>
                  <input
                    type="text"
                    required
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="American"
                    className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3 px-4 text-sm text-stone-100 placeholder-stone-600 transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">Passport / ID Number</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-500" />
                    <input
                      type="text"
                      required
                      value={idProofNum}
                      onChange={(e) => setIdProofNum(e.target.value)}
                      placeholder="Passport ID (e.g. US1234567)"
                      className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-accent py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-brand-accent-hover transition-all duration-300 shadow-lg cursor-pointer"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-white/5">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-brand-accent hover:text-brand-accent-hover transition-colors uppercase tracking-wider font-semibold cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have a profile? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
