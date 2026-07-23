'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  Loader2, 
  Calendar, 
  MapPin, 
  Building, 
  Sparkles, 
  CheckCircle2, 
  ChevronLeft, 
  Phone, 
  Mail, 
  User, 
  Receipt, 
  Clock, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
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
  const [guestPhone, setGuestPhone] = useState('');

  // 1. Fetch Reservation Invoice Details
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

  // 3. Initiate Dodo Payments Session
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
      setError('An error occurred connecting to the Dodo Payments gateway.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0c0a09] text-white flex flex-col justify-center items-center p-4 py-28">
        <div className="bg-stone-900 border border-stone-800 max-w-md w-full p-6 sm:p-8 rounded-3xl text-center shadow-2xl space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-serif font-bold text-white">Checkout Notice</h2>
          <p className="text-rose-400 text-xs font-medium leading-relaxed">{error}</p>
          <button 
            onClick={() => { setError(''); router.push('/dashboard'); }} 
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 py-3.5 font-bold uppercase text-xs tracking-wider cursor-pointer shadow-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!resDetails) {
    return (
      <div className="min-h-screen bg-[#0c0a09] text-white flex flex-col justify-center items-center gap-3 py-32">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-stone-400 text-xs font-mono uppercase tracking-widest">Preparing Luxury Checkout Session...</p>
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
    <div className="min-h-screen bg-[#0c0a09] text-white font-sans selection:bg-amber-500 selection:text-stone-950 flex flex-col justify-between overflow-x-hidden w-full">

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        
        {/* Back Link */}
        <button 
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {checkingPayment ? (
          <div className="bg-stone-900 border border-amber-500/30 max-w-lg mx-auto p-8 sm:p-10 rounded-3xl text-center space-y-6 shadow-2xl my-12 animate-in fade-in">
            <Loader2 className="mx-auto h-16 w-16 text-amber-400 animate-spin" />
            <h2 className="font-serif text-2xl font-bold text-white">Verifying Transaction...</h2>
            <p className="text-stone-300 text-xs leading-relaxed font-light">
              We are confirming your payment with Dodo Payments. Once confirmed, you will be redirected automatically to your stay dashboard. Please do not refresh.
            </p>
          </div>
        ) : completed ? (
          <div className="bg-stone-900 border border-emerald-500/40 max-w-lg mx-auto p-8 sm:p-10 rounded-3xl text-center space-y-6 shadow-2xl my-12 animate-in fade-in">
            <ShieldCheck className="mx-auto h-16 w-16 text-emerald-400 animate-bounce" />
            <h2 className="font-serif text-2xl font-bold text-white">Payment Completed!</h2>
            <p className="text-stone-300 text-xs leading-relaxed font-light">
              Your stay at <strong className="text-white">{resDetails.resortName}</strong> has been officially confirmed! Redirecting to your guest dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Checkout Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                    256-Bit SSL Encrypted Checkout
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                  Guaranteed Luxury Checkout
                </h1>
              </div>

              <div className="flex items-center gap-3 text-xs text-stone-400 bg-stone-900 px-4 py-2.5 rounded-xl border border-stone-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Instant Confirmation & 7-Day Refund Policy</span>
              </div>
            </div>

            {/* Layout Grid */}
            <form onSubmit={handleDodoPayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Guest Info & Payment Authorization (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Guest Profile Information */}
                <div className="bg-stone-900/60 border border-stone-800 p-6 sm:p-8 rounded-3xl space-y-5 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-stone-800 pb-4">
                    <User className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">1. Guest Contact Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                        Full Name
                      </label>
                      <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 px-3.5 py-3 rounded-xl text-stone-300 text-xs font-medium">
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        <span>{resDetails.guest.fullName}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                        Email Address
                      </label>
                      <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 px-3.5 py-3 rounded-xl text-stone-300 text-xs font-medium overflow-hidden text-ellipsis">
                        <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span className="truncate">{resDetails.guest.email}</span>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                        Contact Phone (Required for Arrival Logistics)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+1 (555) 019-2834"
                          className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-none pl-10 pr-4 py-3 text-xs text-white placeholder-stone-600 rounded-xl transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Dodo Payments Gateway Info Card */}
                <div className="bg-stone-900/60 border border-stone-800 p-6 sm:p-8 rounded-3xl space-y-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">2. Dodo Payments Gateway</h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      Sandbox Active
                    </span>
                  </div>

                  <p className="text-stone-300 text-xs leading-relaxed font-light">
                    Clicking <strong className="text-amber-400 font-semibold">Proceed to Payment Gateway</strong> will open a secure Dodo Payments session where you can safely test credit cards, digital wallets, or mock payment credentials.
                  </p>

                  <div className="grid grid-cols-3 gap-3 text-[11px] text-stone-400 pt-2">
                    <div className="bg-stone-950 border border-stone-800/80 p-3 rounded-xl text-center">
                      <span className="block text-white font-bold mb-0.5">Instant</span>
                      <span>Email Invoice</span>
                    </div>
                    <div className="bg-stone-950 border border-stone-800/80 p-3 rounded-xl text-center">
                      <span className="block text-white font-bold mb-0.5">7 Days</span>
                      <span>Free Cancel</span>
                    </div>
                    <div className="bg-stone-950 border border-stone-800/80 p-3 rounded-xl text-center">
                      <span className="block text-white font-bold mb-0.5">256-Bit</span>
                      <span>SSL Shield</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Itemized Stay Invoice & Action (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Stay Receipt Card */}
                <div className="bg-stone-900/80 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl">
                  {resDetails.resortImage && (
                    <div className="relative h-48 w-full bg-stone-950">
                      <img 
                        src={resDetails.resortImage} 
                        alt={resDetails.resortName} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="bg-amber-500 text-stone-950 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                          {resDetails.roomTypeName}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 sm:p-8 space-y-6">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-white mb-1">{resDetails.resortName}</h2>
                      <div className="flex items-center gap-1.5 text-xs text-stone-400">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{resDetails.resortLocation}</span>
                      </div>
                    </div>

                    {/* Schedule & Room Summary */}
                    <div className="bg-stone-950 border border-stone-800/80 rounded-2xl p-4 space-y-3 text-xs">
                      <div className="flex justify-between items-center text-stone-300">
                        <span className="flex items-center gap-1.5 text-stone-400">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" /> Stay Schedule
                        </span>
                        <span className="font-bold text-white font-mono">
                          {checkInDate.toLocaleDateString()} – {checkOutDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-stone-300 pt-2 border-t border-stone-900">
                        <span className="flex items-center gap-1.5 text-stone-400">
                          <Building className="w-3.5 h-3.5 text-amber-400" /> Unit Number
                        </span>
                        <span className="font-bold text-amber-300 font-mono">Room {resDetails.roomNum}</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-300 pt-2 border-t border-stone-900">
                        <span className="flex items-center gap-1.5 text-stone-400">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> Total Duration
                        </span>
                        <span className="font-bold text-white">{nights} Night{nights > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Add-On Services Breakdown */}
                    {resDetails.services.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-stone-400">Add-On Experiences Included</span>
                        <div className="space-y-2 text-xs text-stone-300 bg-stone-950/60 p-3 rounded-xl border border-stone-800/60">
                          {resDetails.services.map((svc) => (
                            <div key={svc.id} className="flex justify-between items-center">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {svc.name}
                              </span>
                              <span className="font-bold text-white font-mono">${svc.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="border-t border-stone-800 pt-4 space-y-2.5 text-xs text-stone-300">
                      <div className="flex justify-between">
                        <span className="text-stone-400">Suite Rate ({nights} night{nights > 1 ? 's' : ''})</span>
                        <span className="font-semibold text-white font-mono">${staySubtotal.toFixed(2)}</span>
                      </div>
                      {servicesSubtotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-stone-400">Add-On Amenities</span>
                          <span className="font-semibold text-white font-mono">${servicesSubtotal.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-stone-400">Taxes & Eco Resort Fees (15%)</span>
                        <span className="font-semibold text-white font-mono">${taxes.toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t border-stone-800 pt-4 flex justify-between items-center">
                        <div>
                          <span className="block text-xs uppercase font-bold tracking-wider text-stone-400">Grand Total Due</span>
                          <span className="text-[10px] text-stone-500">All taxes included</span>
                        </div>
                        <span className="text-2xl font-serif font-bold text-amber-400 font-mono">
                          ${grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase tracking-wider py-4 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Gateway...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" /> Pay ${grandTotal.toFixed(2)} via Dodo
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

            </form>
          </div>
        )}
      </main>
    </div>
  );
}
