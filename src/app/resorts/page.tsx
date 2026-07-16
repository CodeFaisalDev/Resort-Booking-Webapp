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

  // Filter parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Accordion details
  const [expandedResortId, setExpandedResortId] = useState<string | null>(null);

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
    <div className="w-full min-h-screen bg-stone-50 text-stone-900 pb-24">
      
      {/* 1. Header Hero section */}
      <section className="bg-white border-b border-stone-200 py-16 px-4 sm:px-8 text-center space-y-6 shadow-sm">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-600 border border-orange-500/20">
          <span>Global Resort Collection</span>
        </div>
        <h1 className="font-sans text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-900 leading-tight">
          Browse All Resorts & Rooms
        </h1>
        <p className="mx-auto max-w-xl text-stone-500 text-xs sm:text-sm font-light leading-relaxed">
          Explore our collection of 100 properties, map accommodations, compare pricing rates, and reserve your dream stay instantly.
        </p>

        {/* Dynamic Search Parameters Bar */}
        <form onSubmit={handleSearchSubmit} className="mx-auto max-w-2xl bg-white border border-stone-200 rounded-full p-2 shadow-md flex items-center gap-3">
          <div className="flex items-center gap-2 pl-4 flex-grow">
            <Search className="h-4.5 w-4.5 text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Search resorts, locations, regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-stone-850 outline-none w-full placeholder-stone-400 font-bold"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase px-6 py-3 rounded-full transition-all shrink-0 shadow-md shadow-orange-500/10"
          >
            Search Collection
          </button>
        </form>
      </section>

      {/* 2. MAIN LAYOUT AND FILTERS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        
        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-center">
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
              className={`px-5 py-2.5 rounded-full border text-[11px] font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'border-orange-500 bg-orange-500/10 text-orange-600 shadow-sm'
                  : 'border-stone-200 bg-white hover:border-stone-300 text-stone-500 hover:text-stone-850'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center text-xs text-stone-500 uppercase tracking-wider font-bold">
          <span>Found {total} properties</span>
          <span>Showing page {page} of {totalPages}</span>
        </div>

        {/* Resorts Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <span className="text-xs text-stone-500 font-bold uppercase">Loading property grid...</span>
          </div>
        ) : resorts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-stone-200 rounded-[32px] space-y-4 shadow-sm">
            <span className="text-4xl">🏖️</span>
            <h3 className="font-sans text-lg font-bold text-stone-750 uppercase">No resorts matched your request</h3>
            <p className="text-stone-400 text-xs max-w-xs mx-auto">
              Please adjust your destination filter tags or type keywords into the search box.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resorts.map((r) => {
              const isExpanded = expandedResortId === r.id;
              const cardImage = r.images && r.images.length > 0 ? r.images[0] : 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=600';
              
              // Get standard pricing info based on room types
              const prices = r.rooms.map(room => Number(room.roomType.basePrice));
              const minPrice = prices.length > 0 ? Math.min(...prices) : 250;
              const maxPrice = prices.length > 0 ? Math.max(...prices) : 850;

              return (
                <div 
                  key={r.id} 
                  className="rounded-[32px] overflow-hidden border border-stone-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={cardImage} 
                        alt={r.name} 
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-103"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                      
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-stone-900 flex items-center gap-1 shadow">
                        <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                        <span>{r.rating.toFixed(1)}</span>
                      </div>

                      <div className="absolute bottom-4 left-4 flex items-center gap-1 text-[9px] font-bold uppercase text-orange-400 tracking-wider">
                        <MapPin className="h-3 w-3" />
                        <span>{r.location}</span>
                      </div>
                    </div>

                    {/* Content details */}
                    <div className="px-6 space-y-3">
                      <h3 className="font-sans text-xl font-bold text-stone-900 line-clamp-1">{r.name}</h3>
                      <p className="text-stone-500 text-xs leading-relaxed line-clamp-3 min-h-[3.3rem]">
                        {r.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/book/${r.id}`)}
                        className="flex-grow rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase py-3 px-4 transition-all text-center flex items-center justify-center gap-1 shadow-md shadow-orange-500/10"
                      >
                        <span>Reserve Suite</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setExpandedResortId(isExpanded ? null : r.id)}
                        className="rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 font-bold text-xs uppercase px-4 py-3 transition-all flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>{isExpanded ? 'Hide Rooms' : 'Show Rooms'}</span>
                      </button>
                    </div>

                    {/* Room expansion section */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-stone-100 space-y-3 animate-fade-in text-[11px]">
                        <span className="block font-bold uppercase text-[9px] text-stone-400 tracking-wider">Room category details</span>
                        
                        {r.rooms.map((room) => (
                          <div key={room.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-stone-850 block">{room.roomType.name}</span>
                              <span className="text-[9px] text-stone-500">Max occupency: {room.roomType.maxOccupency} Guests</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-orange-500 block">${Number(room.roomType.basePrice).toFixed(0)}</span>
                              <span className="text-[9px] text-stone-400 block uppercase">Per night</span>
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
          <div className="flex items-center justify-between border-t border-stone-200 pt-10 text-xs font-bold text-stone-500 uppercase tracking-wider">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-stone-200 bg-white px-5 py-3 hover:bg-stone-50 disabled:opacity-40 flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              <span>Previous Page</span>
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full border border-stone-200 bg-white px-5 py-3 hover:bg-stone-50 disabled:opacity-40 flex items-center gap-1 transition-all"
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
      <div className="flex flex-col items-center justify-center min-h-screen space-y-3 bg-stone-50">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <span className="text-xs text-stone-500 font-bold uppercase tracking-wider animate-pulse">
          Loading Search Collection...
        </span>
      </div>
    }>
      <ResortsBrowseContent />
    </Suspense>
  );
}
