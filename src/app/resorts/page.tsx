'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Compass, 
  MapPin, 
  Star, 
  Search, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Info,
  Calendar,
  Users,
  CheckCircle,
  HelpCircle,
  Loader2
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
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  rating: number;
  images: string[];
  rooms: Room[];
}

function ResortsBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pagination states
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAllRooms, setShowAllRooms] = useState(false);

  // Sync state from query parameters on mount or query change
  useEffect(() => {
    const urlQuery = searchParams.get('query') || '';
    setSearchQuery(urlQuery);
  }, [searchParams]);

  // Load resorts whenever the search params, page, or category changes
  useEffect(() => {
    const loadAllResorts = async () => {
      setLoading(true);
      try {
        const urlQuery = searchParams.get('query') || '';
        const res = await fetch(`/api/resorts?page=${page}&limit=9&query=${encodeURIComponent(urlQuery)}&type=${selectedCategory}`);
        const data = await res.json();
        if (res.ok) {
          setResorts(data.resorts || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (e) {
        console.error('Error browsing resorts:', e);
      } finally {
        setLoading(false);
      }
    };

    loadAllResorts();
  }, [searchParams, page, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('query', searchQuery.trim());
    } else {
      params.delete('query');
    }
    router.replace(`/resorts?${params.toString()}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#141414] text-[#E5E5E5] pb-24 pt-24 relative overflow-hidden">
      
      {/* Glow Backdrops */}
      <div className="absolute top-[10%] left-[-15%] w-[500px] h-[500px] bg-brand-accent/3 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[30%] right-[-15%] w-[500px] h-[500px] bg-brand-accent/3 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* 1. Header Hero section */}
      <section className="py-16 px-4 sm:px-8 text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-accent border border-brand-accent/20">
          <span>Global Resort Collection</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-6xl font-normal tracking-tight text-white leading-tight">
          Browse All Resorts & Rooms
        </h1>
        <p className="mx-auto max-w-xl text-[#A0A0A0] text-xs sm:text-sm font-medium leading-relaxed">
          Explore our collection of premium properties, map accommodations, compare pricing rates, and reserve your dream stay instantly.
        </p>

        {/* Dynamic Search Parameters Bar */}
        <form onSubmit={handleSearchSubmit} className="mx-auto max-w-2xl bg-[#1A1A1A]/80 border border-white/5 rounded-full p-2 shadow-2xl flex items-center gap-3 focus-within:border-brand-accent transition-colors">
          <div className="flex items-center gap-2 pl-4 flex-grow">
            <Search className="h-4.5 w-4.5 text-[#555] shrink-0" />
            <input
              type="text"
              placeholder="Search resorts, locations, regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white outline-none w-full placeholder-stone-600 font-bold"
            />
          </div>
          <button
            type="submit"
            className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs uppercase px-6 py-3 rounded-full transition-all shrink-0 shadow-lg cursor-pointer"
          >
            Search Collection
          </button>
        </form>
      </section>

      {/* 2. MAIN LAYOUT AND FILTERS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-10 relative z-10">
        
        {/* Category Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-white/5 pb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-start w-full md:w-auto">
            {[
              { id: 'all', label: 'All Collections', icon: '🏝️' },
              { id: 'tropical', label: 'Tropical Beach', icon: '🏖️' },
              { id: 'alpine', label: 'Alpine Peaks', icon: '🏔️' },
              { id: 'coastal', label: 'Coastal Cliffs', icon: '🌊' },
              { id: 'forest', label: 'Forest Eco', icon: '🌲' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setPage(1);
                }}
                className={`px-5 py-2.5 rounded-full border text-[11px] font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'border-brand-accent/35 bg-brand-accent/10 text-brand-accent shadow-lg shadow-brand-accent/5'
                    : 'border-white/5 bg-[#1A1A1A]/40 text-[#A0A0A0] hover:border-white/10 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAllRooms(!showAllRooms)}
            className={`px-6 py-2.5 rounded-full border text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer shrink-0 border-brand-accent w-full md:w-auto justify-center shadow-lg ${
              showAllRooms
                ? 'bg-brand-accent text-white shadow-brand-accent/10'
                : 'bg-transparent text-brand-accent hover:bg-brand-accent/5'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>{showAllRooms ? 'Hide Rooms Globally' : 'Show Rooms Globally'}</span>
          </button>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center text-xs text-[#8a8a8a] uppercase tracking-wider font-black select-none">
          <span>Found {total} properties</span>
          <span>Showing page {page} of {totalPages}</span>
        </div>

        {/* Resorts Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="h-8 w-8 text-brand-accent animate-spin" />
            <span className="text-xs text-[#8a8a8a] font-bold uppercase">Loading property grid...</span>
          </div>
        ) : resorts.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A]/80 border border-white/5 rounded-[32px] space-y-4 shadow-2xl">
            <span className="text-4xl block">🏖️</span>
            <h3 className="font-sans text-lg font-bold text-white uppercase">No resorts matched your request</h3>
            <p className="text-[#8a8a8a] text-xs max-w-xs mx-auto">
              Please adjust your destination filter tags or type keywords into the search box.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resorts.map((r) => {
              const isExpanded = showAllRooms;
              const cardImage = r.images && r.images.length > 0 ? r.images[0] : 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=600';
              
              return (
                <div 
                  key={r.id} 
                  className="rounded-[32px] overflow-hidden border border-white/5 bg-[#1A1A1A]/80 backdrop-blur-md shadow-2xl hover:border-brand-accent/20 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={cardImage} 
                        alt={r.name} 
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=600';
                        }}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                      
                      <div className="absolute top-4 left-4 bg-[#141414]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-brand-accent flex items-center gap-1 shadow-lg border border-white/5">
                        <Star className="h-3 w-3 fill-brand-accent text-brand-accent" />
                        <span>{r.rating.toFixed(1)}</span>
                      </div>

                      <div className="absolute bottom-4 left-4 flex items-center gap-1 text-[9px] font-black uppercase text-brand-accent tracking-widest">
                        <MapPin className="h-3 w-3" />
                        <span>{r.location}</span>
                      </div>
                    </div>

                    {/* Content details */}
                    <div className="px-6 space-y-3">
                      <h3 className="font-sans text-xl font-bold text-white line-clamp-1">{r.name}</h3>
                      <p className="text-[#A0A0A0] text-xs leading-relaxed line-clamp-3 min-h-[3.3rem]">
                        {r.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/book/${r.id}`)}
                        className="flex-grow rounded-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs uppercase py-3 px-4 transition-all text-center flex items-center justify-center gap-1 shadow-lg cursor-pointer"
                      >
                        <span>Reserve Suite</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setShowAllRooms(!showAllRooms)}
                        className="rounded-full border border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase px-4 py-3 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Layers className="h-3.5 w-3.5 text-brand-accent" />
                        <span>{isExpanded ? 'Hide Rooms' : 'Show Rooms'}</span>
                      </button>
                    </div>

                    {/* Room expansion section */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-white/5 space-y-3 animate-fade-in text-[11px]">
                        <span className="block font-black uppercase text-[9px] text-[#8a8a8a] tracking-wider">Room category details</span>
                        
                        {r.rooms.map((room) => (
                          <div key={room.id} className="p-3 bg-[#141414]/80 rounded-xl border border-white/5 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white block">{room.roomType.name}</span>
                              <span className="text-[9px] text-[#8a8a8a]">Max occupancy: {room.roomType.maxOccupency} Guests</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-brand-accent block">${Number(room.roomType.basePrice).toFixed(0)}</span>
                              <span className="text-[9px] text-[#8a8a8a] block uppercase font-bold">Per night</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination controller */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 pt-10 text-xs font-bold text-[#A0A0A0] uppercase tracking-wider select-none">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-white/5 bg-[#1A1A1A]/80 px-5 py-3 hover:bg-white/5 disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              <span>Previous Page</span>
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full border border-white/5 bg-[#1A1A1A]/80 px-5 py-3 hover:bg-white/5 disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Next Page</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

      </section>
      
    </div>
  );
}

export default function ResortsBrowsePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen space-y-3 bg-[#141414]">
        <Loader2 className="h-8 w-8 text-brand-accent animate-spin" />
        <span className="text-xs text-[#8a8a8a] font-bold uppercase tracking-wider animate-pulse">
          Loading Search Collection...
        </span>
      </div>
    }>
      <ResortsBrowseContent />
    </Suspense>
  );
}
