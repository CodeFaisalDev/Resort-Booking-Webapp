'use client';
import React, { useState, useEffect, useMemo } from 'react';
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
  SlidersHorizontal,
  Users,
  DollarSign,
  X,
  Loader2,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { ResortGridSkeleton } from '@/components/SkeletonLoaders';

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
  rooms: {
    id: string;
    roomNum: string;
    roomType: {
      id: string;
      name: string;
      basePrice: number;
      maxOccupency: number;
    };
  }[];
}

export default function BookPage() {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResorts, setTotalResorts] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedResortId, setSelectedResortId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'rating' | 'price-low' | 'price-high' | 'name'>('rating');
  const [imgIndices, setImgIndices] = useState<Record<string, number>>({});

  // Mobile layout state
  const [mobileShowMap, setMobileShowMap] = useState(false);

  const fetchResorts = async () => {
    setLoading(true);
    try {
      // Fetch a larger batch for client-side filtering
      const res = await fetch(`/api/resorts?page=${page}&limit=12&query=${encodeURIComponent(searchQuery)}&type=${selectedType}`);
      const data = await res.json();
      if (res.ok) {
        setResorts(data.resorts || []);
        setTotalResorts(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.resorts && data.resorts.length > 0 && !selectedResortId) {
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

  // Get price range for a resort
  const getResortPriceRange = (r: Resort) => {
    if (!r.rooms || r.rooms.length === 0) return { min: 0, max: 0 };
    const prices = r.rooms.map(room => Number(room.roomType.basePrice));
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  // Client-side filtering & sorting
  const filteredResorts = useMemo(() => {
    let list = [...resorts];

    // Price filter
    list = list.filter(r => {
      const p = getResortPriceRange(r);
      return p.min <= priceRange[1] && p.max >= priceRange[0];
    });

    // Rating filter
    if (minRating > 0) {
      list = list.filter(r => r.rating >= minRating);
    }

    // Sorting
    if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'price-low') list.sort((a, b) => getResortPriceRange(a).min - getResortPriceRange(b).min);
    else if (sortBy === 'price-high') list.sort((a, b) => getResortPriceRange(b).max - getResortPriceRange(a).max);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [resorts, priceRange, minRating, sortBy]);

  // Image carousel helpers
  const getImgIdx = (id: string) => imgIndices[id] || 0;
  const nextImg = (id: string, total: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndices(prev => ({ ...prev, [id]: ((prev[id] || 0) + 1) % total }));
  };
  const prevImg = (id: string, total: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndices(prev => ({ ...prev, [id]: ((prev[id] || 0) - 1 + total) % total }));
  };

  const categories = [
    { id: 'all', label: 'All Escapes', icon: '🏝️' },
    { id: 'tropical', label: 'Tropical Islands', icon: '🏖️' },
    { id: 'alpine', label: 'Alpine Chalets', icon: '🏔️' },
    { id: 'coastal', label: 'Coastal Cliffs', icon: '🌊' },
    { id: 'forest', label: 'Forest Retreats', icon: '🌲' }
  ];

  const ratingOptions = [
    { value: 0, label: 'Any' },
    { value: 3, label: '3+' },
    { value: 4, label: '4+' },
    { value: 4.5, label: '4.5+' },
  ];

  const activeFiltersCount = (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 2000 ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#141414] text-[#E5E5E5] w-full relative">

      {/* ─── STICKY HEADER / FILTER BAR ─── */}
      <div className="sticky top-0 z-30 bg-[#141414]/95 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 py-4">
          
          {/* Top row: brand + search + filter toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <Compass className="h-7 w-7 text-brand-accent animate-spin-slow" />
              <div className="hidden sm:block">
                <h1 className="font-heading text-base font-normal text-white uppercase tracking-wider leading-tight">
                  Explore & Book
                </h1>
                <span className="text-[9px] text-[#8a8a8a] font-bold uppercase tracking-wider">
                  {totalResorts} properties
                </span>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex-grow max-w-xl bg-[#1A1A1A]/80 border border-white/5 rounded-full p-1 flex items-center focus-within:border-brand-accent/40 transition-colors">
              <div className="flex items-center gap-2 pl-3 flex-grow">
                <Search className="h-4 w-4 text-[#555] shrink-0" />
                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-full placeholder-stone-600 font-bold"
                />
              </div>
              <button type="submit" className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-[10px] uppercase px-4 py-2 rounded-full transition-all shrink-0 cursor-pointer">
                Search
              </button>
            </form>

            {/* Filter & Sort toggles */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                showFilters || activeFiltersCount > 0
                  ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent'
                  : 'border-white/10 bg-white/5 text-[#A0A0A0] hover:text-white hover:border-white/20'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-accent text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-[#A0A0A0] px-4 py-2.5 pr-8 rounded-full outline-none cursor-pointer hover:border-white/20 hover:text-white transition-all"
              >
                <option value="rating">Top Rated</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="name">A → Z</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#555] pointer-events-none" />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedType(cat.id); setPage(1); }}
                className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedType === cat.id
                    ? 'border-brand-accent/35 bg-brand-accent/10 text-brand-accent'
                    : 'border-white/5 bg-transparent text-[#A0A0A0] hover:border-white/10 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── EXPANDED FILTER PANEL ─── */}
        {showFilters && (
          <div className="border-t border-white/5 bg-[#1A1A1A]/60 backdrop-blur-md animate-fade-in">
            <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-end gap-8">

              {/* Price Range */}
              <div className="space-y-2 min-w-[220px]">
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#8a8a8a]">
                  <DollarSign className="h-3 w-3 inline mr-1" />Price Range (per night)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0} max={2000} step={50}
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
                    className="flex-1 accent-brand-accent h-1 cursor-pointer"
                  />
                  <input
                    type="range"
                    min={0} max={2000} step={50}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
                    className="flex-1 accent-brand-accent h-1 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-white">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}{priceRange[1] >= 2000 ? '+' : ''}</span>
                </div>
              </div>

              {/* Rating filter */}
              <div className="space-y-2">
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#8a8a8a]">
                  <Star className="h-3 w-3 inline mr-1" />Minimum Rating
                </label>
                <div className="flex gap-1.5">
                  {ratingOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setMinRating(opt.value)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                        minRating === opt.value
                          ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent'
                          : 'border-white/5 text-[#A0A0A0] hover:text-white hover:border-white/10'
                      }`}
                    >
                      {opt.value > 0 && <Star className="h-2.5 w-2.5 inline mr-0.5 fill-current" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear all */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => { setPriceRange([0, 2000]); setMinRating(0); }}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors cursor-pointer pb-1"
                >
                  <X className="h-3 w-3" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── SPLIT LAYOUT: LIST + MAP ─── */}
      <div className="flex flex-col md:flex-row relative">

        {/* LEFT PANEL: Resort Cards — uses BODY scroll (no nested overflow) */}
        <div className={`w-full md:w-[55%] lg:w-[60%] px-4 sm:px-6 lg:px-8 py-8 space-y-6 ${
          mobileShowMap ? 'hidden md:block' : 'block'
        }`}>
          
          {/* Results meta */}
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#8a8a8a] select-none">
            <span>{filteredResorts.length} of {totalResorts} destinations shown</span>
            <span>Page {page} / {totalPages}</span>
          </div>

          {loading ? (
            <ResortGridSkeleton count={4} />
          ) : filteredResorts.length === 0 ? (
            <div className="text-center py-20 bg-[#1A1A1A]/80 border border-white/5 rounded-3xl space-y-4">
              <span className="text-4xl block">🏝️</span>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">No Properties Found</h3>
              <p className="text-[#8a8a8a] text-xs max-w-xs mx-auto">
                Try adjusting your filters, search terms, or browse a different category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredResorts.map((r) => {
                const isSelected = r.id === selectedResortId;
                const images = r.images && r.images.length > 0 ? r.images : ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=600"];
                const imgIdx = getImgIdx(r.id);
                const prices = getResortPriceRange(r);

                return (
                  <div
                    key={r.id}
                    onMouseEnter={() => setSelectedResortId(r.id)}
                    className={`group rounded-2xl border overflow-hidden transition-all duration-300 bg-[#1A1A1A]/80 backdrop-blur-md ${
                      isSelected ? 'border-brand-accent/25 shadow-2xl shadow-brand-accent/5 scale-[1.01]' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Image Carousel */}
                    <div className="relative h-48 sm:h-52 overflow-hidden">
                      <img
                        src={images[imgIdx]}
                        alt={r.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

                      {/* Carousel arrows */}
                      {images.length > 1 && (
                        <>
                          <button onClick={(e) => prevImg(r.id, images.length, e)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80">
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button onClick={(e) => nextImg(r.id, images.length, e)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          {/* Dots */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                            {images.map((_, i) => (
                              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-3' : 'bg-white/40'}`} />
                            ))}
                          </div>
                        </>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 bg-[#141414]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 text-[9px] font-bold text-brand-accent flex items-center gap-1">
                        <Star className="h-3 w-3 fill-brand-accent text-brand-accent" />
                        <span>{r.rating.toFixed(1)}</span>
                      </div>
                      {r.rating >= 4.8 && (
                        <div className="absolute top-3 right-3 bg-brand-accent/90 backdrop-blur-md px-2 py-1 rounded-full text-[8px] font-black text-white flex items-center gap-1 uppercase tracking-wider">
                          <Sparkles className="h-2.5 w-2.5" />
                          Guest Favourite
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-sans text-base font-bold text-white line-clamp-1">{r.name}</h3>
                          <div className="flex items-center gap-1 text-[10px] text-[#8a8a8a] font-bold mt-0.5">
                            <MapPin className="h-3 w-3 text-brand-accent shrink-0" />
                            <span className="truncate">{r.location}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-bold text-white">${prices.min}</span>
                          {prices.min !== prices.max && <span className="text-[10px] text-[#8a8a8a]"> – ${prices.max}</span>}
                          <span className="block text-[8px] text-[#8a8a8a] font-bold uppercase">/ night</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#A0A0A0] leading-relaxed line-clamp-2">{r.description}</p>

                      {/* Room types preview */}
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          const seen = new Set();
                          return r.rooms.filter(room => {
                            if (seen.has(room.roomType.id)) return false;
                            seen.add(room.roomType.id);
                            return true;
                          }).slice(0, 3).map(room => (
                            <span key={room.roomType.id} className="bg-white/5 border border-white/5 rounded-full px-2.5 py-1 text-[9px] font-bold text-[#A0A0A0]">
                              {room.roomType.name}
                            </span>
                          ));
                        })()}
                      </div>

                      <Link
                        href={`/book/${r.id}`}
                        className="w-full rounded-xl bg-brand-accent hover:bg-brand-accent-hover px-4 py-3 text-white text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all shadow-lg mt-2"
                      >
                        <span>View Rooms & Book</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-8 text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider select-none">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-full border border-white/5 bg-[#1A1A1A]/80 px-4 py-2.5 hover:bg-white/5 disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        page === pageNum ? 'bg-brand-accent text-white' : 'bg-white/5 text-[#A0A0A0] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-full border border-white/5 bg-[#1A1A1A]/80 px-4 py-2.5 hover:bg-white/5 disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: STICKY MAP */}
        <div className={`w-full md:w-[45%] lg:w-[40%] md:sticky md:top-[140px] md:h-[calc(100vh-140px)] p-4 sm:p-6 ${
          mobileShowMap ? 'block h-[70vh]' : 'hidden md:block'
        }`}>
          <div className="w-full h-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            <ResortMap
              resorts={filteredResorts}
              selectedResortId={selectedResortId}
              onMarkerClick={(id) => setSelectedResortId(id)}
            />
          </div>
        </div>
      </div>

      {/* MOBILE MAP/LIST TOGGLE FAB */}
      <button
        onClick={() => setMobileShowMap(!mobileShowMap)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 md:hidden rounded-full bg-brand-accent px-6 py-3 font-semibold uppercase text-xs text-white flex items-center gap-2 shadow-xl shadow-brand-accent/20 active:scale-95 transition-all animate-fade-in cursor-pointer"
      >
        {mobileShowMap ? (
          <>
            <Layers className="h-4 w-4" />
            <span>Show List</span>
          </>
        ) : (
          <>
            <Map className="h-4 w-4" />
            <span>Show Map</span>
          </>
        )}
      </button>
    </div>
  );
}
