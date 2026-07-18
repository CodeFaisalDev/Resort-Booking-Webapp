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
  Info
} from 'lucide-react';

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
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState(
    availableRoomTypes.length > 0 ? availableRoomTypes[0].id : ''
  );
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Reservation states
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numGuests, setNumGuests] = useState('2');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Calculation outputs
  const [nights, setNights] = useState(0);
  const [basePriceTotal, setBasePriceTotal] = useState(0);
  const [servicesTotal, setServicesTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Submit states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12 animate-fade-in relative z-10 text-[#E5E5E5]">
      
      {/* Back button */}
      <button 
        onClick={() => router.push('/book')}
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A0A0A0] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 text-brand-accent" />
        <span>Return to Listings</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column (Resort Detail & Images Slider) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Images Slider */}
          <div className="relative rounded-3xl overflow-hidden aspect-[16/10] bg-[#141414] border border-white/5 shadow-2xl">
            <img 
              src={resort.images[activeImageIdx] || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=800'} 
              alt={resort.name} 
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=800';
              }}
              className="w-full h-full object-cover"
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
                <img 
                  src={img} 
                  alt={`${resort.name} detail view ${idx + 1}`} 
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=600';
                  }}
                  className="w-full h-full object-cover" 
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
              <div className="bg-[#1A1A1A] border border-brand-accent/20 rounded-2xl px-4 py-2 flex items-center gap-1.5 self-start shadow-md">
                <Star className="h-4 w-4 fill-brand-accent text-brand-accent" />
                <span className="font-extrabold text-brand-accent text-sm">{resort.rating.toFixed(1)}</span>
                <span className="text-[10px] text-[#8a8a8a] font-bold uppercase ml-1">Rating</span>
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
          <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl space-y-6 sticky top-[110px] shadow-2xl border border-white/5">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-white">Configure Reservation</h2>
              <span className="text-[10px] text-[#8a8a8a] font-bold uppercase tracking-wider block mt-1">Estimate invoice values instantly</span>
            </div>

            {error && (
              <div className="rounded-xl bg-red-950/40 border border-red-500/20 p-4 text-center text-xs text-red-400 flex items-center justify-center gap-2 shadow-sm font-semibold">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-6 text-xs">
              
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider">Check-In</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8a8a8a]" />
                    <input
                      type="date"
                      required
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/5 py-3.5 pl-10 pr-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider">Check-Out</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8a8a8a]" />
                    <input
                      type="date"
                      required
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/5 py-3.5 pl-10 pr-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Guests Count */}
              <div>
                <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider">Number of Guests</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8a8a8a]" />
                  <select
                    value={numGuests}
                    onChange={(e) => setNumGuests(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/5 py-3.5 pl-10 pr-4 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors appearance-none font-bold"
                  >
                    <option value="1" className="bg-[#141414]">1 Guest</option>
                    <option value="2" className="bg-[#141414]">2 Guests</option>
                    <option value="3" className="bg-[#141414]">3 Guests</option>
                    <option value="4" className="bg-[#141414]">4 Guests</option>
                  </select>
                </div>
              </div>

              {/* Services marketplace */}
              <div className="space-y-3 pt-2">
                <label className="block text-[#8a8a8a] uppercase font-bold tracking-wider">Add-On Marketplace</label>
                <div className="space-y-2">
                  {services.map(s => {
                    const isChecked = selectedServices.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleServiceToggle(s.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                          isChecked ? 'border-brand-accent bg-brand-accent/5' : 'border-white/5 bg-[#1A1A1A]/40 hover:border-white/10 hover:bg-[#1A1A1A]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                            isChecked ? 'bg-brand-accent border-brand-accent text-white' : 'border-stone-750'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="block font-bold text-white">{s.name}</span>
                            <span className="text-[9px] text-[#8a8a8a] font-bold uppercase tracking-wider">{s.category}</span>
                          </div>
                        </div>
                        <span className="text-brand-accent font-bold">+${Number(s.price).toFixed(0)} <span className="text-[9px] text-[#8a8a8a]">/ night</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimate Breakdown panel */}
              {nights > 0 && (
                <div className="rounded-2xl bg-[#141414]/80 border border-white/5 p-5 space-y-3 animate-fade-in">
                  <h4 className="font-bold text-[10px] text-brand-accent uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Info className="h-3.5 w-3.5" />
                    <span>Cost Estimate Breakdown</span>
                  </h4>
                  <div className="flex justify-between text-[#A0A0A0]">
                    <span>Stay Duration:</span>
                    <span className="font-bold text-white">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                  </div>
                  <div className="flex justify-between text-[#A0A0A0]">
                    <span>Base Accommodations:</span>
                    <span className="font-bold text-white">${basePriceTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#A0A0A0]">
                    <span>Add-On Services Total:</span>
                    <span className="font-bold text-white">${servicesTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-white/5 text-sm">
                    <span className="font-bold text-[#A0A0A0]">Total Invoice Amount:</span>
                    <span className="font-extrabold text-brand-accent">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-accent py-4 font-bold uppercase tracking-wider text-white hover:bg-brand-accent-hover transition-all duration-300 shadow-lg flex items-center justify-center gap-2 text-[10px] cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Securing Suite Reservation...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Draft Reservation</span>
                    <ArrowRight className="h-3.5 w-3.5" />
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
