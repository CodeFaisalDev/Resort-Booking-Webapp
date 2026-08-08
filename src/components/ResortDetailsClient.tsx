'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Star, 
  MapPin, 
  ArrowLeft, 
  Calendar, 
  Users, 
  Check, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  Info,
  Clock,
  Heart
} from 'lucide-react';
import SafeImage from '@/components/SafeImage';

interface RoomType {
  id: string;
  name: string;
  description: string;
  basePrice: any;
  maxOccupency: number;
}

interface Room {
  id: string;
  roomNum: string;
  floor: string;
  status: string;
  roomType: RoomType;
}

interface Resort {
  id: string;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  rating: number;
  images: string[];
  rooms: Room[];
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: any;
}

interface ResortDetailsClientProps {
  resort: Resort;
  services: Service[];
}

export default function ResortDetailsClient({ resort, services }: ResortDetailsClientProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Extract unique room types available at this resort
  const roomTypesMap: { [key: string]: RoomType } = {};
  resort.rooms.forEach(r => {
    roomTypesMap[r.roomType.id] = r.roomType;
  });
  const availableRoomTypes = Object.values(roomTypesMap);

  // Active States
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>(
    availableRoomTypes.length > 0 ? availableRoomTypes[0].id : ''
  );
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    async function checkFavorite() {
      try {
        const res = await fetch('/api/favorites');
        if (res.ok) {
          const data = await res.json();
          if (data.favoriteIds && data.favoriteIds.includes(resort.id)) {
            setIsFavorited(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (session) {
      checkFavorite();
    }
  }, [session, resort.id]);

  const toggleFavorite = async () => {
    if (!session) {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsFavorited(prev => !prev);

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resortId: resort.id })
      });
      const data = await res.json();
      if (!res.ok && data.loginRequired) {
        router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
      } else if (data.favoriteIds) {
        setIsFavorited(data.favoriteIds.includes(resort.id));
      }
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  // Date Helper utilities
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const addDaysToStr = (baseDateStr: string, daysToAdd: number) => {
    const d = baseDateStr ? new Date(baseDateStr) : new Date();
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  };

  // Reservation states (Defaulted to 3-day stay starting today)
  const [checkIn, setCheckIn] = useState(getTodayStr());
  const [checkOut, setCheckOut] = useState(addDaysToStr(getTodayStr(), 3));
  const [numGuests, setNumGuests] = useState('2');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Calculation outputs
  const [nights, setNights] = useState(3);
  const [basePriceTotal, setBasePriceTotal] = useState(0);
  const [servicesTotal, setServicesTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Submit states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Days Counter Handlers
  const handleNightsChange = (newNights: number) => {
    const baseStart = checkIn || getTodayStr();
    if (!checkIn) setCheckIn(baseStart);
    setCheckOut(addDaysToStr(baseStart, newNights));
  };

  const handleCheckInChange = (newIn: string) => {
    setCheckIn(newIn);
    const currentNights = nights > 0 ? nights : 3;
    setCheckOut(addDaysToStr(newIn, currentNights));
  };

  // Calculate live estimate when checkIn, checkOut, selectedServices, or selectedRoomTypeId changes
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setNights(0);
      return;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (start >= end) {
      setNights(0);
      return;
    }

    const diff = Math.abs(end.getTime() - start.getTime());
    const calcNights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    setNights(calcNights);

    const selectedType = availableRoomTypes.find(t => t.id === selectedRoomTypeId);
    const basePrice = selectedType ? Number(selectedType.basePrice) : 0;
    const baseSum = basePrice * calcNights;
    setBasePriceTotal(baseSum);

    let servSum = 0;
    services.forEach(s => {
      if (selectedServices.includes(s.id)) {
        servSum += Number(s.price) * calcNights;
      }
    });
    setServicesTotal(servSum);

    setGrandTotal(baseSum + servSum);
  }, [checkIn, checkOut, selectedRoomTypeId, selectedServices]);

  const handleServiceToggle = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!session) {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if ((session.user as any).type !== 'guest') {
      setError('Staff accounts cannot place guest room reservations.');
      return;
    }

    if (nights === 0) {
      setError('Please select valid check-in and check-out dates.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: selectedRoomTypeId,
          checkIn,
          checkOut,
          numGuests,
          serviceIds: selectedServices
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed creating draft reservation.');
      } else {
        router.push(`/checkout/${data.reservationId}`);
      }
    } catch (err) {
      setError('An unexpected connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 space-y-8 sm:space-y-12 animate-fade-in relative z-10 text-[#E5E5E5] overflow-x-hidden w-full">
      
      {/* Back button */}
      <button 
        onClick={() => router.push('/book')}
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A0A0A0] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 text-brand-accent" />
        <span>Return to Listings</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Left Column (Resort Detail & Images Slider) */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          
          {/* Images Slider */}
          <div className="relative rounded-3xl overflow-hidden aspect-[16/10] bg-[#141414] border border-white/5 shadow-2xl">
            <SafeImage
              src={resort.images[activeImageIdx]} 
              alt={resort.name} 
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

            {/* Thumbnail dots selector inside the image container */}
            <div className="absolute bottom-6 left-6 flex gap-2 z-20">
              {resort.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === activeImageIdx ? 'w-8 bg-brand-accent' : 'w-2.5 bg-stone-100/50 hover:bg-stone-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Gallery row of small thumbnail images below the slider */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {resort.images.map((img, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer border-2 transition-all ${
                  idx === activeImageIdx ? 'border-brand-accent scale-[0.98]' : 'border-white/5 opacity-60 hover:opacity-100'
                }`}
              >
                <SafeImage 
                  src={img} 
                  alt={`${resort.name} detail view ${idx + 1}`} 
                  fill
                  className="object-cover" 
                />
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl sm:text-4xl font-normal text-white">{resort.name}</h1>
                <div className="flex items-center gap-1.5 text-xs text-brand-accent mt-2 font-bold uppercase tracking-wider">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{resort.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 self-start">
                <button
                  onClick={toggleFavorite}
                  className={`p-3 rounded-2xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                    isFavorited 
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-500' 
                      : 'bg-[#1A1A1A] border-white/10 text-stone-400 hover:text-white hover:border-white/20'
                  }`}
                  title={isFavorited ? "Remove from Favorites" : "Save to Favorites"}
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
                <div className="bg-[#1A1A1A] border border-brand-accent/20 rounded-2xl px-4 py-2 flex items-center gap-1.5 shadow-md">
                  <Star className="h-4 w-4 fill-brand-accent text-brand-accent" />
                  <span className="font-extrabold text-brand-accent text-sm">{resort.rating.toFixed(1)}</span>
                  <span className="text-[10px] text-[#8a8a8a] font-bold uppercase ml-1">Rating</span>
                </div>
              </div>
            </div>

            <p className="text-[#A0A0A0] text-sm leading-relaxed font-light pt-4 border-t border-white/5">
              {resort.description}
            </p>
          </div>

          {/* Room types collection select */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-accent">Available Room Classes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableRoomTypes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedRoomTypeId(t.id)}
                  className={`text-left p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-44 cursor-pointer ${
                    selectedRoomTypeId === t.id 
                      ? 'border-brand-accent bg-brand-accent/10 shadow-lg shadow-brand-accent/5' 
                      : 'border-white/5 bg-[#1A1A1A]/40 hover:border-white/10 hover:bg-[#1A1A1A]/60'
                  }`}
                >
                  <div className="w-full">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white text-sm">{t.name}</span>
                      <span className="text-[9px] bg-[#141414]/90 text-[#8a8a8a] border border-white/5 px-2 py-0.5 rounded font-bold uppercase">
                        Max: {t.maxOccupency} Guests
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8a8a8a] mt-2.5 line-clamp-3 leading-relaxed">{t.description}</p>
                  </div>
                  <div className="text-right w-full pt-4 border-t border-white/5">
                    <span className="text-[10px] text-[#8a8a8a] uppercase block font-bold">Standard price</span>
                    <span className="text-brand-accent font-extrabold text-lg">${Number(t.basePrice).toFixed(0)} <span className="text-[10px] text-[#8a8a8a]">/ night</span></span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (Live Invoice & Date Selector Panel) */}
        <div className="lg:col-span-5">
          <div className="bg-[#1A1A1A]/90 backdrop-blur-xl p-5 sm:p-8 rounded-3xl space-y-6 sticky top-[110px] shadow-2xl border border-white/10 relative overflow-hidden">
            
            {/* Subtle luxury glow effect behind card header */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
                <span className="text-[10px] text-brand-accent font-mono font-bold uppercase tracking-widest">Luxury Booking Engine</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-normal text-white tracking-tight">Configure Reservation</h2>
              <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block mt-1">Instant invoice estimation & suite lock</span>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-950/40 border border-rose-500/30 p-4 text-center text-xs text-rose-300 flex items-center justify-center gap-2.5 shadow-sm font-semibold animate-fade-in">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-6 text-xs">
              
              {/* Dates Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Check-In Date
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-accent pointer-events-none transition-colors group-focus-within:text-amber-400" />
                    <input
                      type="date"
                      required
                      value={checkIn}
                      onChange={(e) => handleCheckInChange(e.target.value)}
                      className="w-full rounded-2xl bg-white/[0.03] border border-white/10 py-3.5 pl-10 pr-3 text-white text-xs outline-none focus:border-brand-accent focus:bg-white/[0.06] focus:ring-1 focus:ring-brand-accent/50 transition-all font-medium [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Check-Out Date
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-accent pointer-events-none transition-colors group-focus-within:text-amber-400" />
                    <input
                      type="date"
                      required
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full rounded-2xl bg-white/[0.03] border border-white/10 py-3.5 pl-10 pr-3 text-white text-xs outline-none focus:border-brand-accent focus:bg-white/[0.06] focus:ring-1 focus:ring-brand-accent/50 transition-all font-medium [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Stay Duration (Days / Nights) Counter */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Stay Duration (Days / Nights)
                </label>
                <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 focus-within:border-brand-accent transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-white font-bold text-xs">
                        {nights > 0 ? `${nights} ${nights === 1 ? 'Day / 1 Night' : 'Days / Nights'}` : '1 Day / Night'}
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">Automatic check-out adjustment</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => handleNightsChange(Math.max(1, (nights || 1) - 1))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-brand-accent hover:text-white text-white font-bold flex items-center justify-center text-xs transition-all cursor-pointer disabled:opacity-30"
                      disabled={(nights || 1) <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-brand-accent text-xs">{nights || 1}</span>
                    <button
                      type="button"
                      onClick={() => handleNightsChange((nights || 1) + 1)}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-brand-accent hover:text-white text-white font-bold flex items-center justify-center text-xs transition-all cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Guests Count (No overlapping text bug) */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Guests Count
                </label>
                <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 focus-within:border-brand-accent transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-white font-bold text-xs">{numGuests} {Number(numGuests) === 1 ? 'Guest' : 'Guests'}</span>
                      <span className="text-[10px] text-stone-400 font-medium">Standard suite occupancy</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setNumGuests(prev => String(Math.max(1, Number(prev) - 1)))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-brand-accent hover:text-white text-white font-bold flex items-center justify-center text-xs transition-all cursor-pointer disabled:opacity-30"
                      disabled={Number(numGuests) <= 1}
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-white text-xs">{numGuests}</span>
                    <button
                      type="button"
                      onClick={() => setNumGuests(prev => String(Math.min(10, Number(prev) + 1)))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-brand-accent hover:text-white text-white font-bold flex items-center justify-center text-xs transition-all cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Add-On Services Marketplace */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                    Add-On Marketplace
                  </label>
                  {selectedServices.length > 0 && (
                    <span className="text-[10px] text-brand-accent font-bold uppercase tracking-wider">
                      {selectedServices.length} Selected
                    </span>
                  )}
                </div>
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {services.map(s => {
                    const isChecked = selectedServices.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleServiceToggle(s.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? 'border-brand-accent bg-brand-accent/10 ring-1 ring-brand-accent/30 shadow-lg shadow-brand-accent/5'
                            : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`h-6 w-6 rounded-xl border flex items-center justify-center transition-all ${
                            isChecked ? 'bg-brand-accent border-brand-accent text-stone-950 shadow-md shadow-brand-accent/40 scale-105' : 'border-white/20 bg-white/5'
                          }`}>
                            {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="block font-bold text-white text-xs tracking-tight">{s.name}</span>
                            <span className="text-[9px] text-stone-400 font-mono font-semibold uppercase tracking-wider">{s.category}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-brand-accent font-extrabold text-xs block">+${Number(s.price).toFixed(0)}</span>
                          <span className="text-[9px] text-stone-500 font-medium uppercase">/ night</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Cost Estimate Breakdown Panel */}
              {nights > 0 && (
                <div className="rounded-2xl bg-black/60 border border-brand-accent/20 p-5 space-y-3 animate-fade-in shadow-xl">
                  <h4 className="font-bold text-[10px] text-brand-accent uppercase tracking-wider flex items-center gap-1.5 mb-2 font-mono">
                    <Info className="h-3.5 w-3.5" />
                    <span>Cost Estimate Breakdown</span>
                  </h4>
                  <div className="flex justify-between text-stone-300 text-xs">
                    <span>Stay Duration:</span>
                    <span className="font-bold text-white">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                  </div>
                  <div className="flex justify-between text-stone-300 text-xs">
                    <span>Base Accommodations:</span>
                    <span className="font-bold text-white">${basePriceTotal.toFixed(2)}</span>
                  </div>
                  {servicesTotal > 0 && (
                    <div className="flex justify-between text-stone-300 text-xs">
                      <span>Add-On Services Total:</span>
                      <span className="font-bold text-white">${servicesTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-white/10 text-sm">
                    <span className="font-bold text-stone-200">Total Invoice Amount:</span>
                    <span className="font-extrabold text-brand-accent text-base">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Dynamic Cancellation Policy Warning Banner */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2 text-[11px]">
                <div className="flex items-center gap-2 font-bold text-amber-400 uppercase tracking-wider text-[10px] font-mono">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Cancellation & Refund Policy Terms</span>
                </div>
                <div className="space-y-1.5 text-stone-300">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                    <span><strong>≥ 7 Days Prior:</strong> 100% Full Refund Guarantee ($0 Fee)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                    <span><strong>3 to 7 Days Prior:</strong> 95% Refund (5% Processing Fee)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                    <span><strong>Within 72 Hours:</strong> 90% Refund (10% Max Fee Cap)</span>
                  </div>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-4 font-extrabold uppercase tracking-widest text-stone-950 hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 text-xs cursor-pointer border border-amber-300/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-stone-950" />
                    <span>Securing Suite Reservation...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Draft Reservation</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
