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
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="glass-effect max-w-md p-8 rounded-3xl text-center border-red-500/20">
          <p className="text-red-400 text-sm font-semibold mb-4">{error}</p>
          <button onClick={() => router.push('/book')} className="rounded-full bg-amber-500 px-6 py-2 text-stone-950 font-bold uppercase text-xs">
            Return to Bookings
          </button>
        </div>
      </div>
    );
  }

  if (!resDetails) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-amber-400/80 text-sm uppercase tracking-widest font-semibold animate-pulse">Loading Invoice details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      {completed ? (
        <div className="glass-effect p-8 rounded-3xl text-center space-y-6 animate-fade-in border-green-500/30">
          <ShieldCheck className="mx-auto h-16 w-16 text-green-400" />
          <h2 className="font-serif text-2xl font-bold text-amber-400">Payment Succeeded!</h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            Your payment receipt and confirmation email are being processed. Redirecting to your personal guest dashboard...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Brand header */}
          <div className="text-center">
            <Compass className="mx-auto h-10 w-10 text-amber-400" />
            <h2 className="mt-2 font-serif text-2xl font-bold text-stone-100">Dodo Payments Simulator</h2>
            <p className="text-xs text-stone-500 uppercase tracking-widest">Sandbox Transaction Node</p>
          </div>

          {/* Invoice Summary */}
          <div className="glass-effect p-6 rounded-3xl space-y-4">
            <div className="border-b border-stone-850 pb-3 flex justify-between items-center">
              <span className="text-stone-300 font-serif text-lg font-semibold">{resDetails.roomTypeName}</span>
              <span className="text-stone-400 text-xs font-medium">Room {resDetails.roomNum}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-stone-500 uppercase mb-0.5">Check-In</span>
                <span className="text-stone-300 font-semibold">{new Date(resDetails.checkIn).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block text-stone-500 uppercase mb-0.5">Check-Out</span>
                <span className="text-stone-300 font-semibold">{new Date(resDetails.checkOut).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="border-t border-stone-850 pt-4 flex justify-between items-center text-sm font-semibold">
              <span className="text-stone-400">Amount Due</span>
              <span className="text-amber-400 text-lg font-bold">${Number(resDetails.totalAmount).toFixed(2)}</span>
            </div>
          </div>

          {/* Secure Card mock */}
          <div className="glass-effect p-6 rounded-3xl space-y-4 relative">
            <div className="flex justify-between items-center border-b border-stone-850 pb-3">
              <div className="flex items-center gap-2 text-stone-300 text-xs font-semibold uppercase tracking-wider">
                <CreditCard className="h-4 w-4 text-amber-500" />
                <span>Simulated Credit Card</span>
              </div>
              <div className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                SANDBOX
              </div>
            </div>

            <div className="space-y-3">
              <div className="opacity-50 pointer-events-none">
                <label className="block text-[10px] text-stone-500 uppercase mb-1">Card Number</label>
                <input type="text" value="••••  ••••  ••••  4242" disabled className="w-full rounded-lg bg-stone-900/60 border border-stone-800 py-2.5 px-3 text-xs text-stone-300" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 opacity-50 pointer-events-none">
                <div>
                  <label className="block text-[10px] text-stone-500 uppercase mb-1">Expiry</label>
                  <input type="text" value="12 / 29" disabled className="w-full rounded-lg bg-stone-900/60 border border-stone-800 py-2.5 px-3 text-xs text-stone-300" />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-500 uppercase mb-1">CVC</label>
                  <input type="text" value="***" disabled className="w-full rounded-lg bg-stone-900/60 border border-stone-800 py-2.5 px-3 text-xs text-stone-300" />
                </div>
              </div>
            </div>

            <button
              onClick={handleSimulatedPayment}
              disabled={loading}
              className="w-full rounded-full bg-amber-500 py-3.5 text-xs font-semibold uppercase tracking-widest text-stone-950 hover:bg-amber-400 transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-amber-500/10"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{loading ? 'Verifying Sandbox Payment...' : 'Complete Simulated Payment'}</span>
            </button>

            <div className="text-[10px] text-stone-500 text-center flex items-center justify-center gap-1">
              <span>Secured by simulated encryption algorithms.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
