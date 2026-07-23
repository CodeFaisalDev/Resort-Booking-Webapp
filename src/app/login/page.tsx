'use client';
import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, User, Shield, Compass, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [roleType, setRoleType] = useState('GUEST'); // GUEST or STAFF

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email Verification States
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Error/Loading States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Resend code countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Real-time password validation indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      // 1. Client-side password restrictions check
      if (!isPasswordValid) {
        setError('Password does not satisfy complexity requirements.');
        setLoading(false);
        return;
      }

      // Sign Up Guest Flow
      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Registration failed');
          setLoading(false);
          return;
        }

        // Direct user to verify code
        if (data.needsVerification) {
          setVerificationEmail(email);
          setShowVerification(true);
          setResendCooldown(60);
          setLoading(false);
        }
      } catch (err: any) {
        setError('An unexpected error occurred during sign up.');
        setLoading(false);
      }
    } else {
      // Sign In Flow
      try {
        // Pre-check validation for Guest accounts
        const preCheck = await fetch('/api/auth/pre-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, roleType })
        });
        const checkData = await preCheck.json();

        if (!preCheck.ok) {
          if (checkData.error === 'EmailNotVerified') {
            setVerificationEmail(email);
            setShowVerification(true);
            setResendCooldown(60);
            setLoading(false);
            return;
          }
          setError(checkData.error || 'Invalid email, password, or login type.');
          setLoading(false);
          return;
        }

        // Call standard NextAuth credentials signin
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

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/signup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, code: verificationCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification code check failed.');
        setLoading(false);
      } else {
        // Authenticate the user directly
        const loginRes = await signIn('credentials', {
          redirect: false,
          email: verificationEmail,
          password,
          roleType: 'GUEST'
        });

        if (loginRes?.error) {
          setError('Verification succeeded. Please sign in manually.');
          setShowVerification(false);
          setIsSignUp(false);
          setLoading(false);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError('An error occurred during verification code confirmation.');
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setResendLoading(true);

    try {
      const res = await fetch('/api/signup/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to dispatch verification code.');
      } else {
        setResendCooldown(60);
      }
    } catch (err) {
      setError('An error occurred while resending the code.');
    } finally {
      setResendLoading(false);
    }
  };

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: Code & New Password, 3: Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  // Password validation for forgot password reset
  const hasForgotMinLength = newPassword.length >= 8;
  const hasForgotUppercase = /[A-Z]/.test(newPassword);
  const hasForgotLowercase = /[a-z]/.test(newPassword);
  const hasForgotNumber = /\d/.test(newPassword);
  const hasForgotSpecial = /[@$!%*?&]/.test(newPassword);
  const isForgotNewPasswordValid = hasForgotMinLength && hasForgotUppercase && hasForgotLowercase && hasForgotNumber && hasForgotSpecial;

  // Handle request password reset code (Step 1)
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to dispatch reset code.');
      } else {
        setForgotStep(2);
      }
    } catch (err) {
      setError('An error occurred while requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reset password submit (Step 2)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isForgotNewPasswordValid) {
      setError('New password does not satisfy complexity requirements.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code: forgotCode, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed resetting password.');
      } else {
        setForgotSuccessMsg(data.message || 'Password updated successfully!');
        setForgotStep(3);
      }
    } catch (err) {
      setError('An error occurred while setting your new password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-[#141414] text-[#E5E5E5] px-4 py-16 sm:py-20 pt-24 sm:pt-28 relative overflow-x-hidden w-full">
      
      {/* Glow Backdrops */}
      <div className="absolute top-[10%] left-[-15%] w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] right-[-15%] w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-8 bg-[#1A1A1A]/80 backdrop-blur-md rounded-3xl p-5 sm:p-10 shadow-2xl relative border border-white/5 transition-all">
        
        {showForgotPassword ? (
          // FORGOT PASSWORD OVERLAY
          <div className="space-y-6">
            <div className="text-center select-none">
              <Compass className="mx-auto h-12 w-12 text-brand-accent animate-spin-slow" />
              <h2 className="mt-4 font-heading text-2xl font-normal text-white">
                {forgotStep === 1 && 'Reset Password'}
                {forgotStep === 2 && 'Set New Password'}
                {forgotStep === 3 && 'Password Changed'}
              </h2>
              <p className="mt-2 text-xs text-[#A0A0A0] leading-relaxed">
                {forgotStep === 1 && 'Enter your registered email address to receive a 6-digit security reset code.'}
                {forgotStep === 2 && `Enter the 6-digit code sent to ${forgotEmail} and choose a new password.`}
                {forgotStep === 3 && 'Your account security credentials have been updated.'}
              </p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-950/40 border border-red-500/20 p-3.5 text-center text-xs text-red-400 font-semibold shadow-sm">
                {error}
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestResetCode} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-500" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                  <span>{loading ? 'Sending Code...' : 'Send Reset Code'}</span>
                </button>
              </form>
            )}

            {/* STEP 2: Code + New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5 text-center">6-Digit Reset Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3 px-3 text-center text-lg sm:text-xl font-bold tracking-[4px] sm:tracking-[8px] text-white placeholder-stone-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3 pl-10 pr-12 text-sm text-[#E5E5E5] placeholder-stone-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3.5 text-stone-500 hover:text-stone-300 focus:outline-none cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3 pl-10 pr-12 text-sm text-[#E5E5E5] placeholder-stone-600 transition-colors"
                    />
                  </div>
                </div>

                {/* Password complexity checklist */}
                {newPassword.length > 0 && (
                  <div className="bg-[#141414]/60 border border-white/5 p-3 rounded-xl space-y-2 text-[10px]">
                    <span className="block font-bold text-[#8a8a8a] uppercase tracking-wider mb-1">Complexity Requirements:</span>
                    <div className="grid grid-cols-2 gap-1.5 font-medium">
                      <div className="flex items-center gap-1.5">
                        {hasForgotMinLength ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-stone-600" />}
                        <span className={hasForgotMinLength ? 'text-green-400' : 'text-[#8a8a8a]'}>8+ Characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasForgotUppercase ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-stone-600" />}
                        <span className={hasForgotUppercase ? 'text-green-400' : 'text-[#8a8a8a]'}>Uppercase (A-Z)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasForgotLowercase ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-stone-600" />}
                        <span className={hasForgotLowercase ? 'text-green-400' : 'text-[#8a8a8a]'}>Lowercase (a-z)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasForgotNumber ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-stone-600" />}
                        <span className={hasForgotNumber ? 'text-green-400' : 'text-[#8a8a8a]'}>Number (0-9)</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        {hasForgotSpecial ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-stone-600" />}
                        <span className={hasForgotSpecial ? 'text-green-400' : 'text-[#8a8a8a]'}>Special (@$!%*?&)</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isForgotNewPasswordValid || newPassword !== confirmPassword}
                  className={`w-full rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                    loading || !isForgotNewPasswordValid || newPassword !== confirmPassword ? 'bg-brand-accent/50 cursor-not-allowed' : 'bg-brand-accent hover:bg-brand-accent-hover cursor-pointer'
                  }`}
                >
                  {loading && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                  <span>{loading ? 'Updating Password...' : 'Reset Password'}</span>
                </button>
              </form>
            )}

            {/* STEP 3: Success Screen */}
            {forgotStep === 3 && (
              <div className="text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-sm text-stone-300 leading-relaxed">
                  {forgotSuccessMsg}
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotStep(1);
                    setError('');
                  }}
                  className="w-full rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white py-3.5 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-lg"
                >
                  Sign In Now
                </button>
              </div>
            )}

            {forgotStep !== 3 && (
              <div className="text-center pt-3 border-t border-white/5">
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotStep(1);
                    setError('');
                  }}
                  className="text-xs text-[#8a8a8a] hover:text-white transition-colors uppercase tracking-wider font-bold cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        ) : showVerification ? (
          // 6-digit confirmation overlay
          <div className="space-y-6">
            <div className="text-center select-none">
              <Compass className="mx-auto h-12 w-12 text-brand-accent animate-spin-slow" />
              <h2 className="mt-4 font-heading text-2xl font-normal text-white">Confirm Your Email</h2>
              <p className="mt-2 text-xs text-[#A0A0A0] leading-relaxed">
                We sent a 6-digit confirmation code to <strong className="text-white">{verificationEmail}</strong>. Please enter it below.
              </p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-950/40 border border-red-500/20 p-3.5 text-center text-xs text-red-400 font-semibold shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyCodeSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5 text-center">Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3.5 px-3 text-center text-lg sm:text-xl font-bold tracking-[4px] sm:tracking-[8px] text-white placeholder-stone-700 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                <span>{loading ? 'Verifying...' : 'Verify Code'}</span>
              </button>
            </form>

            <div className="flex flex-col items-center gap-2 pt-4 border-t border-white/5">
              <button
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || resendLoading}
                className={`text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 ${
                  resendCooldown > 0 ? 'text-[#8a8a8a] cursor-not-allowed' : 'text-brand-accent hover:text-brand-accent-hover cursor-pointer'
                }`}
              >
                {resendLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Verification Code'}
                </span>
              </button>

              <button
                onClick={() => setShowVerification(false)}
                className="text-[10px] text-[#8a8a8a] hover:text-white uppercase tracking-wider font-bold transition-colors cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          </div>
        ) : (
          // Main Sign-in / Sign-up Panels
          <>
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

            <form className="space-y-6" onSubmit={handleSubmit}>
              
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
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-3 pl-10 pr-12 text-sm text-[#E5E5E5] placeholder-stone-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-stone-500 hover:text-stone-300 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {!isSignUp && (
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotEmail(email);
                          setError('');
                        }}
                        className="text-[11px] text-brand-accent hover:text-brand-accent-hover font-semibold transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                {/* Password validation checkbox items (only for signup) */}
                {isSignUp && password.length > 0 && (
                  <div className="bg-[#141414]/60 border border-white/5 p-3 rounded-xl space-y-2 text-[10px]">
                    <span className="block font-bold text-[#8a8a8a] uppercase tracking-wider mb-1">Complexity Requirements:</span>
                    <div className="grid grid-cols-2 gap-1.5 font-medium">
                      <div className="flex items-center gap-1.5">
                        {hasMinLength ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-stone-600" />
                        )}
                        <span className={hasMinLength ? 'text-green-400' : 'text-[#8a8a8a]'}>8+ Characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasUppercase ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-stone-600" />
                        )}
                        <span className={hasUppercase ? 'text-green-400' : 'text-[#8a8a8a]'}>Uppercase (A-Z)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasLowercase ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-stone-600" />
                        )}
                        <span className={hasLowercase ? 'text-green-400' : 'text-[#8a8a8a]'}>Lowercase (a-z)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasNumber ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-stone-600" />
                        )}
                        <span className={hasNumber ? 'text-green-400' : 'text-[#8a8a8a]'}>Number (0-9)</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        {hasSpecial ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-stone-600" />
                        )}
                        <span className={hasSpecial ? 'text-green-400' : 'text-[#8a8a8a]'}>Special character (@$!%*?&)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (isSignUp && !isPasswordValid)}
                className={`w-full rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                  loading || (isSignUp && !isPasswordValid) ? 'bg-brand-accent/50 cursor-not-allowed' : 'bg-brand-accent hover:bg-brand-accent-hover cursor-pointer'
                }`}
              >
                {loading && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                <span>{loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}</span>
              </button>
            </form>

            {/* Google OAuth Button */}
            {(!isSignUp || roleType === 'GUEST') && (
              <div className="space-y-3 pt-1">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-white/10 w-full" />
                  <span className="bg-[#1A1A1A] px-3 text-[10px] uppercase font-bold text-stone-500 tracking-widest absolute">OR</span>
                </div>

                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/' })}
                  className="w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-3 text-xs font-semibold text-white transition-all flex items-center justify-center gap-3 cursor-pointer shadow-md active:scale-98"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            )}

            <div className="text-center pt-4 border-t border-white/5">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-xs text-brand-accent hover:text-brand-accent-hover transition-colors uppercase tracking-wider font-semibold cursor-pointer"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have a profile? Sign Up"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
