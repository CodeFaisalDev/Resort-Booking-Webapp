'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Compass, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReservationDetails {
  id: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
  roomNum: string;
  roomTypeName: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [resDetails, setResDetails] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/checkout/${reservationId}`);
        const data = await res.json();
        if (res.ok) {
          setResDetails(data);
        } else {
          setError(data.error || 'Failed loading checkout invoice.');
        }
      } catch (err) {
        setError('Error loading checkout details.');
      }
    }
    fetchDetails();
  }, [reservationId]);

  const handleSimulatedPayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Fire simulated webhook callback
      const webhookRes = await fetch('/api/webhooks/dodo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          status: 'COMPLETED',
          method: 'Simulated Credit Card',
        }),
      });

      const data = await webhookRes.json();
      if (!webhookRes.ok) {
        setError(data.error || 'Webhook simulation failed.');
      } else {
        setCompleted(true);
        // Trigger celebratory confetti
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        // Wait 3 seconds and redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (err) {
      setError('An error occurred during payment processing simulation.');
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
        {completed ? (
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
              <h2 className="mt-2 font-heading text-2xl font-normal text-white">Dodo Payments Simulator</h2>
              <p className="text-[9px] text-[#8a8a8a] uppercase tracking-widest font-black mt-1">Sandbox Transaction Node</p>
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

            {/* Secure Card mock */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-4 relative border border-white/5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
                  <CreditCard className="h-4 w-4 text-brand-accent" />
                  <span>Simulated Credit Card</span>
                </div>
                <div className="text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded border border-brand-accent/20 font-bold tracking-wider">
                  SANDBOX
                </div>
              </div>

              <div className="space-y-3">
                <div className="opacity-40 pointer-events-none">
                  <label className="block text-[10px] text-[#8a8a8a] uppercase mb-1 font-bold tracking-wider">Card Number</label>
                  <input type="text" value="••••  ••••  ••••  4242" disabled className="w-full rounded-lg bg-white/5 border border-white/5 py-2.5 px-3 text-xs text-[#E5E5E5]" />
                </div>
                
                <div className="grid grid-cols-2 gap-3 opacity-40 pointer-events-none">
                  <div>
                    <label className="block text-[10px] text-[#8a8a8a] uppercase mb-1 font-bold tracking-wider">Expiry</label>
                    <input type="text" value="12 / 29" disabled className="w-full rounded-lg bg-white/5 border border-white/5 py-2.5 px-3 text-xs text-[#E5E5E5]" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8a8a8a] uppercase mb-1 font-bold tracking-wider">CVC</label>
                    <input type="text" value="***" disabled className="w-full rounded-lg bg-white/5 border border-white/5 py-2.5 px-3 text-xs text-[#E5E5E5]" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSimulatedPayment}
                disabled={loading}
                className="w-full rounded-xl bg-brand-accent py-3.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-brand-accent-hover transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{loading ? 'Verifying Sandbox Payment...' : 'Complete Simulated Payment'}</span>
              </button>

              <div className="text-[9px] text-[#8a8a8a] text-center flex items-center justify-center gap-1 font-semibold uppercase tracking-wider select-none">
                <span>Secured by simulated encryption algorithms.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
