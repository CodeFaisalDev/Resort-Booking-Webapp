'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  Map, 
  Layers, 
  Search, 
  MapPin, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Compass,
  ArrowRight,
  Sliders,
  DollarSign
} from 'lucide-react';

const ResortMap = dynamic(() => import('@/components/ResortMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] bg-stone-950 flex items-center justify-center rounded-3xl border border-stone-850">
      <div className="text-amber-400/80 text-xs font-semibold uppercase tracking-wider animate-pulse">Loading Luxury Map...</div>
    </div>
  )
});

interface Resort {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  rating: number;
  images: string[];
}

export default function BookPage() {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResorts, setTotalResorts] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedResortId, setSelectedResortId] = useState<string | null>(null);

  // Mobile layout state: toggle between list (false) and map (true)
  const [mobileShowMap, setMobileShowMap] = useState(false);

  const fetchResorts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resorts?page=${page}&limit=6&query=${searchQuery}&type=${selectedType}`);
      const data = await res.json();
      if (res.ok) {
        setResorts(data.resorts || []);
        setTotalResorts(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.resorts && data.resorts.length > 0) {
          setSelectedResortId(data.resorts[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching resorts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResorts();
  }, [page, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchResorts();
  };

  return (
    <div className="flex flex-col flex-grow bg-[#141414] text-[#E5E5E5] w-full relative pt-24 pb-20 overflow-hidden">
      
      {/* 1. Header Filter Controls */}
      <section className="bg-[#1A1A1A]/40 border-b border-white/5 py-6 px-4 sm:px-6 lg:px-8 z-10 relative">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand header */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Compass className="h-8 w-8 text-brand-accent shrink-0 animate-spin-slow" />
            <div>
              <h1 className="font-heading text-lg sm:text-xl font-normal text-white uppercase tracking-wider">
                Explore Destinations
              </h1>
              <span className="text-[10px] text-[#8a8a8a] font-bold uppercase tracking-wider">
                {totalResorts} Luxury properties found
              </span>
            </div>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md bg-[#1A1A1A]/80 border border-white/5 rounded-full p-1.5 flex items-center shadow-lg focus-within:border-brand-accent transition-colors">
            <div className="flex items-center gap-2 pl-4 flex-grow">
              <Search className="h-4 w-4 text-[#555] shrink-0" />
              <input
                type="text"
                placeholder="Search by name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white outline-none w-full placeholder-stone-600 font-bold"
              />
            </div>
            <button
              type="submit"
              className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs uppercase px-5 py-2.5 rounded-full transition-all shrink-0 cursor-pointer shadow-lg"
            >
              Search
            </button>
          </form>

        </div>

        {/* Category Filters */}
        <div className="mx-auto max-w-7xl mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'All Escapes', icon: '🏝️' },
            { id: 'tropical', label: 'Tropical Islands', icon: '🏖️' },
            { id: 'alpine', label: 'Alpine Chalets', icon: '🏔️' },
            { id: 'coastal', label: 'Coastal Cliffs', icon: '🌊' },
            { id: 'forest', label: 'Forest Cabins', icon: '🌲' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedType(cat.id);
                setPage(1);
              }}
              className={`px-5 py-2.5 rounded-full border text-[11px] font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                selectedType === cat.id
                  ? 'border-brand-accent/35 bg-brand-accent/10 text-brand-accent shadow-lg shadow-brand-accent/5'
                  : 'border-white/5 bg-[#1A1A1A]/40 text-[#A0A0A0] hover:border-white/10 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. SPLIT LAYOUT CONTAINER */}
      <section className="flex-grow flex flex-col md:flex-row relative z-10">
        
        {/* LEFT PANEL: RESORTS LIST (Hidden on mobile if map toggle is active) */}
        <div className={`w-full md:w-[55%] lg:w-[60%] px-4 sm:px-6 lg:px-8 py-10 overflow-y-auto space-y-8 max-h-[calc(100vh-170px)] scrollbar-none ${
          mobileShowMap ? 'hidden md:block' : 'block'
        }`}>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
              <span className="w-8 h-8 rounded-full border-2 border-white/5 border-t-brand-accent animate-spin" />
              <span className="text-xs text-[#8a8a8a] font-bold uppercase tracking-wider">Refreshing listings...</span>
            </div>
          ) : resorts.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <span className="text-4xl block">🏝️</span>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">No Properties Found</h3>
              <p className="text-[#8a8a8a] text-xs max-w-xs mx-auto">
                No resorts match your search criteria. Try filtering by another collection or clear search tags.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {resorts.map((r) => {
                const isSelected = r.id === selectedResortId;
                const cardImage = r.images && r.images.length > 0 ? r.images[0] : "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=600";
                
                return (
                  <div
                    key={r.id}
                    onMouseEnter={() => setSelectedResortId(r.id)}
                    className={`rounded-3xl border overflow-hidden transition-all duration-300 bg-[#1A1A1A]/80 backdrop-blur-md ${
                      isSelected ? 'border-brand-accent/25 bg-[#1A1A1A] shadow-2xl' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative h-48 sm:h-52 overflow-hidden">
                      <img
                        src={cardImage}
                        alt={r.name}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                      
                      <div className="absolute top-3 left-3 bg-[#141414]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 text-[9px] font-bold text-brand-accent flex items-center gap-1">
                        <Star className="h-3 w-3 fill-brand-accent text-brand-accent" />
                        <span>{r.rating.toFixed(1)}</span>
                      </div>

                      <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[9px] font-black uppercase text-brand-accent tracking-wider">
                        <MapPin className="h-3 w-3" />
                        <span>{r.location}</span>
                      </div>
                    </div>

                    {/* Details content */}
                    <div className="p-5 space-y-3.5">
                      <h3 className="font-sans text-lg font-bold text-white line-clamp-1">
                        {r.name}
                      </h3>
                      <p className="text-[11px] text-[#A0A0A0] leading-relaxed line-clamp-2 min-h-[2.5rem]">
                        {r.description}
                      </p>
                      
                      <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a]">
                        <div>
                          <span className="block text-[8px] text-[#8a8a8a] font-bold uppercase">Standard pricing</span>
                          <span className="text-brand-accent font-bold">$250 - $850</span>
                        </div>
                        <Link
                          href={`/book/${r.id}`}
                          className="rounded-full bg-brand-accent hover:bg-brand-accent-hover px-4.5 py-2 text-white hover:scale-102 transition-all flex items-center gap-1 shadow-lg"
                        >
                          <span>Explore Suites</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginated Controller */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-8 text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider select-none">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-full border border-white/5 bg-[#1A1A1A]/80 px-4 py-2 hover:bg-white/5 disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-full border border-white/5 bg-[#1A1A1A]/80 px-4 py-2 hover:bg-white/5 disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>

        {/* RIGHT PANEL: INTERACTIVE STICKY MAP (Hidden on mobile if map toggle is inactive) */}
        <div className={`w-full md:w-[45%] lg:w-[40%] h-[calc(100vh-170px)] md:sticky md:top-[110px] p-4 sm:p-6 bg-[#141414] md:block ${
          mobileShowMap ? 'block w-full h-[60vh] sm:h-[65vh]' : 'hidden'
        }`}>
          <ResortMap
            resorts={resorts}
            selectedResortId={selectedResortId}
            onMarkerClick={(id) => {
              setSelectedResortId(id);
            }}
          />
        </div>

      </section>

      {/* FLOAT MAP TOGGLE BUTTON (Mobile Viewports Only) */}
      <button
        onClick={() => setMobileShowMap(!mobileShowMap)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 md:hidden rounded-full bg-brand-accent px-6 py-3 font-semibold uppercase text-xs text-white flex items-center gap-2 shadow-xl shadow-brand-accent/20 active:scale-95 transition-all animate-fade-in cursor-pointer"
      >
        {mobileShowMap ? (
          <>
            <Layers className="h-4 w-4" />
            <span>Show List View</span>
          </>
        ) : (
          <>
            <Map className="h-4 w-4" />
            <span>Show Map View</span>
          </>
        )}
      </button>
    </div>
  );
}
