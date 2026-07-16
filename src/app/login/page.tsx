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
    <div className="flex min-h-[80vh] items-center justify-center bg-stone-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-effect rounded-3xl p-8 sm:p-10 shadow-2xl relative">
        
        {/* Glow Element */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-600/15 rounded-full blur-3xl -z-10" />

        <div className="text-center">
          <Compass className="mx-auto h-12 w-12 text-amber-400" />
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-amber-400 animate-fade-in">
            {isSignUp ? 'Join Luxury Horizon' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-stone-400">
            {isSignUp ? 'Create your profile to start booking' : 'Access your resort reservation engine'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Sign In Role Type Switch */}
          {!isSignUp && (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-900/50 p-1 border border-stone-850">
              <button
                type="button"
                onClick={() => setRoleType('GUEST')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${roleType === 'GUEST' ? 'bg-amber-500 text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-200'}`}
              >
                Guest Portal
              </button>
              <button
                type="button"
                onClick={() => setRoleType('STAFF')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${roleType === 'STAFF' ? 'bg-amber-500 text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-200'}`}
              >
                Staff Portal
              </button>
            </div>
          )}

          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-amber-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-stone-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl bg-stone-900/40 border border-stone-850 focus:border-amber-500 focus:outline-none py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-amber-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-stone-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl bg-stone-900/40 border border-stone-850 focus:border-amber-500 focus:outline-none py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-amber-400 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 h-4.5 w-4.5 text-stone-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-stone-900/40 border border-stone-850 focus:border-amber-500 focus:outline-none py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-amber-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl bg-stone-900/40 border border-stone-850 focus:border-amber-500 focus:outline-none py-3 px-4 text-sm text-stone-100 placeholder-stone-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-amber-400 mb-1">Nationality</label>
                  <input
                    type="text"
                    required
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="American"
                    className="w-full rounded-xl bg-stone-900/40 border border-stone-850 focus:border-amber-500 focus:outline-none py-3 px-4 text-sm text-stone-100 placeholder-stone-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wider text-amber-400 mb-1">Passport / ID Number</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3.5 h-4.5 w-4.5 text-stone-500" />
                    <input
                      type="text"
                      required
                      value={idProofNum}
                      onChange={(e) => setIdProofNum(e.target.value)}
                      placeholder="Passport ID (e.g. US1234567)"
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-850 focus:border-amber-500 focus:outline-none py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-amber-500 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 hover:bg-amber-400 transition-all duration-300 shadow-md shadow-amber-500/10 hover:shadow-amber-400/30"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-stone-900">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-amber-400/80 hover:text-amber-400 transition-colors uppercase tracking-wider font-semibold"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have a profile? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
