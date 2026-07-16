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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12 animate-fade-in relative z-10 text-stone-100">
      
      {/* Back button */}
      <button 
        onClick={() => router.push('/book')}
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Listings</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column (Resort Detail & Images Slider) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Images Slider */}
          <div className="relative rounded-3xl overflow-hidden aspect-[16/10] bg-stone-900 border border-stone-850 shadow-2xl">
            <img 
              src={resort.images[activeImageIdx] || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=800'} 
              alt={resort.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />

            {/* Thumbnail dots selector inside the image container */}
            <div className="absolute bottom-6 left-6 flex gap-2 z-20">
              {resort.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === activeImageIdx ? 'w-8 bg-amber-400' : 'w-2.5 bg-stone-100/50 hover:bg-stone-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-100">{resort.name}</h1>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-2 font-bold uppercase tracking-wider">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{resort.location}</span>
                </div>
              </div>
              <div className="bg-stone-900 border border-amber-500/20 rounded-2xl px-4 py-2 flex items-center gap-1.5 self-start">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-extrabold text-amber-400 text-sm">{resort.rating.toFixed(1)}</span>
                <span className="text-[10px] text-stone-500 font-semibold uppercase">Rating</span>
              </div>
            </div>

            <p className="text-stone-400 text-sm leading-relaxed font-light pt-4 border-t border-stone-900">
              {resort.description}
            </p>
          </div>

          {/* Room types collection select */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">Available Room Classes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableRoomTypes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedRoomTypeId(t.id)}
                  className={`text-left p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-44 ${
                    selectedRoomTypeId === t.id 
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5' 
                      : 'border-stone-850 bg-stone-900/15 hover:border-stone-800'
                  }`}
                >
                  <div className="w-full">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-stone-100 text-sm">{t.name}</span>
                      <span className="text-[10px] bg-stone-900/90 text-stone-400 border border-stone-800 px-2 py-0.5 rounded font-bold uppercase">
                        Max: {t.maxOccupency} Guests
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-2.5 line-clamp-3 leading-relaxed">{t.description}</p>
                  </div>
                  <div className="text-right w-full pt-4 border-t border-stone-900/40">
                    <span className="text-[10px] text-stone-500 uppercase block font-semibold">Standard price</span>
                    <span className="text-amber-400 font-extrabold text-lg">${Number(t.basePrice).toFixed(0)} <span className="text-[10px] text-stone-500">/ night</span></span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (Live Invoice & Date Selector Panel) */}
        <div className="lg:col-span-5">
          <div className="glass-effect p-6 sm:p-8 rounded-3xl space-y-6 sticky top-[110px] shadow-2xl border-amber-950/20">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-200">Configure Reservation</h2>
              <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Estimate invoice values instantly</span>
            </div>

            {error && (
              <div className="rounded-xl bg-red-950/40 border border-red-500/20 p-4 text-center text-xs text-red-400 flex items-center justify-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-6 text-xs">
              
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-500 uppercase mb-1.5 font-bold tracking-wider">Check-In</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 h-4.5 w-4.5 text-stone-600" />
                    <input
                      type="date"
                      required
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-850 py-3.5 pl-10 pr-3 text-stone-100 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-stone-500 uppercase mb-1.5 font-bold tracking-wider">Check-Out</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 h-4.5 w-4.5 text-stone-600" />
                    <input
                      type="date"
                      required
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-850 py-3.5 pl-10 pr-3 text-stone-100 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Guests Count */}
              <div>
                <label className="block text-stone-500 uppercase mb-1.5 font-bold tracking-wider">Number of Guests</label>
                <div className="relative">
                  <Users className="absolute left-3 top-3.5 h-4.5 w-4.5 text-stone-600" />
                  <select
                    value={numGuests}
                    onChange={(e) => setNumGuests(e.target.value)}
                    className="w-full rounded-xl bg-stone-900/40 border border-stone-850 py-3.5 pl-10 pr-4 text-stone-100 outline-none focus:border-amber-500 appearance-none"
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                  </select>
                </div>
              </div>

              {/* Services marketplace */}
              <div className="space-y-3 pt-2">
                <label className="block text-stone-500 uppercase font-bold tracking-wider">Add-On Marketplace</label>
                <div className="space-y-2">
                  {services.map(s => {
                    const isChecked = selectedServices.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleServiceToggle(s.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                          isChecked ? 'border-amber-500 bg-amber-500/5' : 'border-stone-850 bg-stone-900/10 hover:border-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                            isChecked ? 'bg-amber-500 border-amber-500 text-stone-950' : 'border-stone-750'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="block font-bold text-stone-200">{s.name}</span>
                            <span className="text-[9px] text-stone-500 uppercase tracking-wider">{s.category}</span>
                          </div>
                        </div>
                        <span className="text-amber-400 font-bold">+${Number(s.price).toFixed(0)} <span className="text-[9px] text-stone-500">/ night</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimate Breakdown panel */}
              {nights > 0 && (
                <div className="rounded-2xl bg-stone-900/40 border border-stone-850 p-5 space-y-3 animate-fade-in">
                  <h4 className="font-bold text-[10px] text-amber-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Info className="h-3.5 w-3.5" />
                    <span>Cost Estimate Breakdown</span>
                  </h4>
                  <div className="flex justify-between text-stone-400">
                    <span>Stay Duration:</span>
                    <span className="font-bold text-stone-200">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Base Accommodations:</span>
                    <span className="font-bold text-stone-200">${basePriceTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Add-On Services Total:</span>
                    <span className="font-bold text-stone-200">${servicesTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-stone-800 text-sm">
                    <span className="font-bold text-stone-300">Total Invoice Amount:</span>
                    <span className="font-extrabold text-amber-400">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-amber-500 py-4 font-bold uppercase tracking-wider text-stone-950 hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 text-[10px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-stone-950" />
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
