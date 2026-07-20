'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Compass, ShieldCheck, CreditCard, Lock, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReservationDetails {
  id: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
  roomNum: string;
  roomTypeName: string;
  status?: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [resDetails, setResDetails] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // 1. Fetch Reservation Details
  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/checkout/${reservationId}`);
        const data = await res.json();
        if (res.ok) {
          setResDetails(data);
          
          // If the reservation is already confirmed, mark as completed
          if (data.status === 'CONFIRMED') {
            setCompleted(true);
          }
        } else {
          setError(data.error || 'Failed loading checkout invoice.');
        }
      } catch (err) {
        setError('Error loading checkout details.');
      }
    }
    fetchDetails();
  }, [reservationId]);

  // 2. Poll Status check when redirected back with ?success=true
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('success') === 'true') {
      setCheckingPayment(true);
      
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/checkout/${reservationId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'CONFIRMED') {
              clearInterval(interval);
              setCompleted(true);
              setCheckingPayment(false);
              
              // Trigger celebratory confetti
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
              });
              
              // Redirect to dashboard after 3 seconds
              setTimeout(() => {
                router.push('/dashboard');
              }, 3000);
            }
          }
        } catch (err) {
          console.error('Error checking payment status:', err);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [reservationId, router]);

  // 3. Initiate Checkout Session redirect
  const handleDodoPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/checkout/${reservationId}/session`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create checkout session.');
      } else if (data.checkout_url) {
        // Redirect user to Dodo Payments sandbox hosted checkout page
        window.location.href = data.checkout_url;
      } else {
        setError('Checkout session URL not returned.');
      }
    } catch (err) {
      setError('An error occurred during payment gateway connection.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] text-[#E5E5E5] px-4 py-20 relative overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        
        <div className="bg-[#1A1A1A]/80 backdrop-blur-md max-w-md w-full p-8 rounded-3xl text-center border border-white/5 shadow-2xl">
          <p className="text-red-400 text-sm font-semibold mb-6">{error}</p>
          <button 
            onClick={() => router.push('/book')} 
            className="w-full rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white py-3.5 font-bold uppercase text-[10px] tracking-widest cursor-pointer shadow-lg transition-colors"
          >
            Return to Bookings
          </button>
        </div>
      </div>
    );
  }

  if (!resDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] text-[#E5E5E5]">
        <p className="text-brand-accent text-xs uppercase tracking-widest font-bold animate-pulse">Loading Invoice details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-[#E5E5E5] flex items-center justify-center pt-28 pb-20 px-4 relative overflow-hidden">
      
      {/* Glow Backdrops */}
      <div className="absolute top-[20%] left-[-15%] w-[400px] h-[400px] bg-brand-accent/3 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] right-[-15%] w-[400px] h-[400px] bg-brand-accent/3 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        {checkingPayment ? (
          <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-8 rounded-3xl text-center space-y-6 animate-fade-in border border-brand-accent/20 shadow-2xl">
            <Loader2 className="mx-auto h-16 w-16 text-brand-accent animate-spin" />
            <h2 className="font-heading text-2xl font-normal text-white">Verifying Transaction...</h2>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              We are confirming your payment with Dodo Payments. Once confirmed, you will be redirected automatically. Please do not close or reload this page.
            </p>
          </div>
        ) : completed ? (
          <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-8 rounded-3xl text-center space-y-6 animate-fade-in border border-brand-accent/20 shadow-2xl">
            <ShieldCheck className="mx-auto h-16 w-16 text-brand-accent animate-pulse" />
            <h2 className="font-heading text-2xl font-normal text-white">Payment Succeeded!</h2>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Your payment receipt and confirmation email are being processed. Redirecting to your personal guest dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Brand header */}
            <div className="text-center select-none">
              <Compass className="mx-auto h-10 w-10 text-brand-accent animate-spin-slow" />
              <h2 className="mt-2 font-heading text-2xl font-normal text-white">Dodo Payments Checkout</h2>
              <p className="text-[9px] text-[#8a8a8a] uppercase tracking-widest font-black mt-1">Secure Transaction Node</p>
            </div>

            {/* Invoice Summary */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-4 border border-white/5 shadow-2xl">
              <div className="border-b border-white/5 pb-3 flex justify-between items-center">
                <span className="text-white font-sans text-lg font-bold">{resDetails.roomTypeName}</span>
                <span className="text-[#8a8a8a] text-[10px] font-bold uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded border border-white/5">Room {resDetails.roomNum}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[#8a8a8a] uppercase mb-0.5 font-bold tracking-wider text-[9px]">Check-In</span>
                  <span className="text-[#E5E5E5] font-semibold">{new Date(resDetails.checkIn).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-[#8a8a8a] uppercase mb-0.5 font-bold tracking-wider text-[9px]">Check-Out</span>
                  <span className="text-[#E5E5E5] font-semibold">{new Date(resDetails.checkOut).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-between items-center text-sm font-semibold">
                <span className="text-[#A0A0A0]">Amount Due</span>
                <span className="text-brand-accent text-lg font-black">${Number(resDetails.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Portal Redirect trigger */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-5 relative border border-white/5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
                  <CreditCard className="h-4 w-4 text-brand-accent" />
                  <span>Hosted Payment Gateway</span>
                </div>
                <div className="text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded border border-brand-accent/20 font-bold tracking-wider">
                  SANDBOX
                </div>
              </div>

              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                Clicking the button below will securely redirect you to the Dodo Payments sandboxed payment page. You will return here automatically once the transaction is finished.
              </p>

              <button
                onClick={handleDodoPayment}
                disabled={loading}
                className={`w-full rounded-xl py-3.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${loading ? 'bg-brand-accent/70 cursor-wait' : 'bg-brand-accent hover:bg-brand-accent-hover cursor-pointer'}`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                <span>{loading ? 'Initializing Payment Node...' : 'Proceed to Secure Payment'}</span>
              </button>

              <div className="text-[9px] text-[#8a8a8a] text-center flex items-center justify-center gap-1 font-semibold uppercase tracking-wider select-none">
                <span>Encrypted hosted checkout node.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
