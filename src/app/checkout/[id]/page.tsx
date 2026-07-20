'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Compass, ShieldCheck, CreditCard, Lock, Loader2, Calendar, MapPin, Building, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ServiceDetails {
  id: string;
  name: string;
  category: string;
  subtotal: number;
}

interface ReservationDetails {
  id: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
  roomNum: string;
  roomTypeName: string;
  resortName: string;
  resortLocation: string;
  resortImage: string;
  roomBasePrice: number;
  numGuests: number;
  status?: string;
  guest: {
    fullName: string;
    email: string;
    phone: string;
  };
  services: ServiceDetails[];
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
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

  // Form Phone State
  const [guestPhone, setGuestPhone] = useState('');

  // 1. Fetch Reservation Details
  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/checkout/${reservationId}`);
        const data = await res.json();
        if (res.ok) {
          setResDetails(data);
          
          setGuestPhone(data.guest?.phone || '');

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
              
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
              });
              
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
  const handleDodoPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/checkout/${reservationId}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guestPhone
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create checkout session.');
      } else if (data.checkout_url) {
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
            onClick={() => { setError(''); router.push('/dashboard'); }} 
            className="w-full rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white py-3.5 font-bold uppercase text-[10px] tracking-widest cursor-pointer shadow-lg transition-colors"
          >
            Return to Dashboard
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

  // Invoice calculations
  const checkInDate = new Date(resDetails.checkIn);
  const checkOutDate = new Date(resDetails.checkOut);
  const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
  const staySubtotal = nights * resDetails.roomBasePrice;
  const servicesSubtotal = resDetails.services.reduce((acc, s) => acc + s.subtotal, 0);
  const calculatedSubtotal = staySubtotal + servicesSubtotal;
  const grandTotal = Number(resDetails.totalAmount);
  const taxes = Math.max(0, grandTotal - calculatedSubtotal);

  return (
    <div className="min-h-screen bg-[#141414] text-[#E5E5E5] flex items-center justify-center pt-28 pb-20 px-4 relative overflow-hidden">
      
      {/* Glow Backdrops */}
      <div className="absolute top-[10%] left-[-15%] w-[400px] h-[400px] bg-brand-accent/3 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] right-[-15%] w-[400px] h-[400px] bg-brand-accent/3 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-5xl transition-all duration-300">
        {checkingPayment ? (
          <div className="bg-[#1A1A1A]/80 backdrop-blur-md max-w-md mx-auto p-8 rounded-3xl text-center space-y-6 border border-brand-accent/20 shadow-2xl">
            <Loader2 className="mx-auto h-16 w-16 text-brand-accent animate-spin" />
            <h2 className="font-heading text-2xl font-normal text-white">Verifying Transaction...</h2>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              We are confirming your payment with Dodo Payments. Once confirmed, you will be redirected automatically. Please do not close or reload this page.
            </p>
          </div>
        ) : completed ? (
          <div className="bg-[#1A1A1A]/80 backdrop-blur-md max-w-md mx-auto p-8 rounded-3xl text-center space-y-6 border border-brand-accent/20 shadow-2xl">
            <ShieldCheck className="mx-auto h-16 w-16 text-brand-accent animate-pulse" />
            <h2 className="font-heading text-2xl font-normal text-white">Payment Succeeded!</h2>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Your payment receipt and confirmation email are being processed. Redirecting to your personal guest dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center md:text-left border-b border-white/5 pb-4">
              <span className="text-[10px] text-brand-accent uppercase tracking-widest font-black flex items-center justify-center md:justify-start gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Luxury Reservation Engine
              </span>
              <h1 className="mt-1 font-heading text-3xl font-normal text-white">Guest Checkout</h1>
            </div>

            {/* Layout Grid */}
            <form onSubmit={handleDodoPayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Billing Details (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Customer Details Prefilled */}
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">1. Guest Identification</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">Full Name</label>
                      <input
                        type="text"
                        disabled
                        value={resDetails.guest.fullName}
                        className="w-full rounded-xl bg-white/[0.02] border border-white/5 py-2.5 px-3.5 text-xs text-[#8a8a8a] outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">Email Address</label>
                      <input
                        type="email"
                        disabled
                        value={resDetails.guest.email}
                        className="w-full rounded-xl bg-white/[0.02] border border-white/5 py-2.5 px-3.5 text-xs text-[#8a8a8a] outline-none cursor-not-allowed"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+960 777-1234"
                        className="w-full rounded-xl bg-white/5 border border-white/5 focus:border-brand-accent focus:bg-white/10 focus:outline-none py-2.5 px-3.5 text-xs text-white placeholder-stone-600 transition-colors"
                      />
                    </div>
                  </div>
                </div>



              </div>

              {/* Right Column: Invoice summary details (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Stay Summary */}
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                  {resDetails.resortImage && (
                    <div className="relative h-44 w-full bg-stone-800">
                      <img 
                        src={resDetails.resortImage} 
                        alt={resDetails.resortName} 
                        className="w-full h-full object-cover brightness-[0.85]" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    <div>
                      <span className="text-[9px] bg-brand-accent/15 border border-brand-accent/20 text-brand-accent font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        {resDetails.roomTypeName}
                      </span>
                      <h2 className="mt-2 text-xl font-heading font-normal text-white">{resDetails.resortName}</h2>
                      <div className="flex items-center gap-1 text-[10px] text-[#A0A0A0] mt-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-brand-accent" />
                        <span>{resDetails.resortLocation}</span>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[#A0A0A0]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                          <span>Stay Schedule</span>
                        </div>
                        <span className="font-bold text-white">
                          {checkInDate.toLocaleDateString()} - {checkOutDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[#A0A0A0]">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-brand-accent" />
                          <span>Suite Details</span>
                        </div>
                        <span className="font-bold text-white">Room {resDetails.roomNum}</span>
                      </div>
                    </div>

                    {/* Services Included */}
                    {resDetails.services.length > 0 && (
                      <div className="border-t border-white/5 pt-4 space-y-2">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-[#8a8a8a]">Add-On Amenities</span>
                        <div className="space-y-1.5 text-xs text-[#A0A0A0]">
                          {resDetails.services.map((svc) => (
                            <div key={svc.id} className="flex justify-between items-center">
                              <span>{svc.name}</span>
                              <span className="font-semibold text-white">${svc.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pricing Invoices */}
                    <div className="border-t border-white/5 pt-4 space-y-2.5 text-xs">
                      <div className="flex justify-between text-[#8a8a8a] font-semibold">
                        <span>Nightly stay subtotal ({nights} night{nights > 1 ? 's' : ''})</span>
                        <span className="text-white">${staySubtotal.toFixed(2)}</span>
                      </div>
                      {servicesSubtotal > 0 && (
                        <div className="flex justify-between text-[#8a8a8a] font-semibold">
                          <span>Amenities subtotal</span>
                          <span className="text-white">${servicesSubtotal.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#8a8a8a] font-semibold">
                        <span>Taxes & Luxury Resort Fees (15%)</span>
                        <span className="text-white">${taxes.toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t border-white/5 pt-3.5 flex justify-between items-center text-sm font-bold">
                        <span className="text-[#A0A0A0]">Total Stay Price</span>
                        <span className="text-brand-accent text-lg font-black">${grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gateway Checkout Redirection Button */}
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
                      <CreditCard className="h-4 w-4 text-brand-accent animate-pulse" />
                      <span>Sandbox Hosted Gateway</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full rounded-xl py-3.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                      loading ? 'bg-brand-accent/70 cursor-wait' : 'bg-brand-accent hover:bg-brand-accent-hover cursor-pointer'
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                    <span>{loading ? 'Opening Payment Gateway...' : 'Proceed to Secure Payment'}</span>
                  </button>

                  <p className="text-[9px] text-[#8a8a8a] text-center uppercase tracking-wider font-semibold">
                    Encrypted secure transaction protocol.
                  </p>
                </div>

              </div>

            </form>
          </div>
        )}
      </div>
    </div>
  );
}
