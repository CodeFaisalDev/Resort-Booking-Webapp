'use client';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
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
  Calendar,
  Users,
  Loader2,
  SlidersHorizontal,
  DollarSign,
  X,
  Sparkles,
  ChevronDown,
  Grid3X3,
  LayoutList,
  Heart
} from 'lucide-react';
import { ResortGridSkeleton } from '@/components/SkeletonLoaders';

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

  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedResortId, setExpandedResortId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'rating' | 'price-low' | 'price-high' | 'name'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [imgIndices, setImgIndices] = useState<Record<string, number>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const urlQuery = searchParams.get('query') || '';
    setSearchQuery(urlQuery);
  }, [searchParams]);

  useEffect(() => {
    const loadAllResorts = async () => {
      setLoading(true);
      try {
        const urlQuery = searchParams.get('query') || '';
        const res = await fetch(`/api/resorts?page=${page}&limit=12&query=${encodeURIComponent(urlQuery)}&type=${selectedCategory}`);
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

  const getResortPriceRange = (r: Resort) => {
    if (!r.rooms || r.rooms.length === 0) return { min: 0, max: 0 };
    const prices = r.rooms.map(room => Number(room.roomType.basePrice));
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  const getUniqueRoomTypes = (rooms: Room[]) => {
    const seen = new Map<string, RoomType>();
    rooms.forEach(r => { if (!seen.has(r.roomType.id)) seen.set(r.roomType.id, r.roomType); });
    return Array.from(seen.values());
  };

  // Client-side filtering & sorting
  const filteredResorts = useMemo(() => {
    let list = [...resorts];
    list = list.filter(r => {
      const p = getResortPriceRange(r);
      return p.min <= priceRange[1] && p.max >= priceRange[0];
    });
    if (minRating > 0) {
      list = list.filter(r => r.rating >= minRating);
    }
    if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'price-low') list.sort((a, b) => getResortPriceRange(a).min - getResortPriceRange(b).min);
    else if (sortBy === 'price-high') list.sort((a, b) => getResortPriceRange(b).max - getResortPriceRange(a).max);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [resorts, priceRange, minRating, sortBy]);

  const getImgIdx = (id: string) => imgIndices[id] || 0;
  const nextImg = (id: string, total: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setImgIndices(prev => ({ ...prev, [id]: ((prev[id] || 0) + 1) % total }));
  };
  const prevImg = (id: string, total: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setImgIndices(prev => ({ ...prev, [id]: ((prev[id] || 0) - 1 + total) % total }));
  };
  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setLikedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const categories = [
    { id: 'all', label: 'All Collections', icon: '🏝️' },
    { id: 'tropical', label: 'Tropical Beach', icon: '🏖️' },
    { id: 'alpine', label: 'Alpine Peaks', icon: '🏔️' },
    { id: 'coastal', label: 'Coastal Cliffs', icon: '🌊' },
    { id: 'forest', label: 'Forest Eco', icon: '🌲' }
  ];

  const ratingOptions = [
    { value: 0, label: 'Any' },
    { value: 3, label: '3+' },
    { value: 4, label: '4+' },
    { value: 4.5, label: '4.5+' },
  ];

  const activeFiltersCount = (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 2000 ? 1 : 0);

  return (
    <div className="w-full min-h-screen bg-[#141414] text-[#E5E5E5] relative">
      
      {/* Decorative glows */}
      <div className="absolute top-[10%] left-[-15%] w-[500px] h-[500px] bg-brand-accent/3 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[30%] right-[-15%] w-[500px] h-[500px] bg-brand-accent/3 rounded-full blur-[140px] pointer-events-none" />

      {/* ─── HERO SECTION ─── */}
      <section className="pt-32 pb-12 px-4 sm:px-8 text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-accent border border-brand-accent/20">
          <Compass className="h-3.5 w-3.5" />
          <span>Global Resort Collection</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-6xl font-normal tracking-tight text-white leading-tight">
          Discover Your Dream Stay
        </h1>
        <p className="mx-auto max-w-xl text-[#A0A0A0] text-xs sm:text-sm font-medium leading-relaxed">
          Explore our curated collection of premium resorts worldwide. Compare rates, browse rooms, and reserve your perfect escape.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mx-auto max-w-2xl bg-[#1A1A1A]/80 border border-white/5 rounded-full p-1.5 shadow-2xl flex items-center gap-3 focus-within:border-brand-accent/40 transition-colors">
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
          <button type="submit" className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs uppercase px-6 py-3 rounded-full transition-all shrink-0 shadow-lg cursor-pointer">
            Search Collection
          </button>
        </form>
      </section>

      {/* ─── STICKY TOOLBAR ─── */}
      <div className="sticky top-0 z-30 bg-[#141414]/95 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">

          {/* Category tabs + controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                  className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'border-brand-accent/35 bg-brand-accent/10 text-brand-accent'
                      : 'border-white/5 bg-transparent text-[#A0A0A0] hover:border-white/10 hover:text-white'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  showFilters || activeFiltersCount > 0
                    ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent'
                    : 'border-white/10 bg-white/5 text-[#A0A0A0] hover:text-white'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{activeFiltersCount}</span>
                )}
              </button>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-[#A0A0A0] px-3.5 py-2 pr-7 rounded-full outline-none cursor-pointer hover:border-white/20 hover:text-white transition-all"
                >
                  <option value="rating">Top Rated</option>
                  <option value="price-low">Price ↑</option>
                  <option value="price-high">Price ↓</option>
                  <option value="name">A → Z</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#555] pointer-events-none" />
              </div>

              {/* View mode toggle */}
              <div className="hidden sm:flex border border-white/10 rounded-full overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={`p-2 transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-[#555] hover:text-white'}`}>
                  <Grid3X3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-[#555] hover:text-white'}`}>
                  <LayoutList className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="border-t border-white/5 bg-[#1A1A1A]/60 backdrop-blur-md animate-fade-in">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-end gap-8">
              {/* Price Range */}
              <div className="space-y-2 min-w-[220px]">
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#8a8a8a]">
                  <DollarSign className="h-3 w-3 inline mr-1" />Price Range (per night)
                </label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={2000} step={50} value={priceRange[0]}
                    onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
                    className="flex-1 accent-brand-accent h-1 cursor-pointer" />
                  <input type="range" min={0} max={2000} step={50} value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
                    className="flex-1 accent-brand-accent h-1 cursor-pointer" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-white">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}{priceRange[1] >= 2000 ? '+' : ''}</span>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#8a8a8a]">
                  <Star className="h-3 w-3 inline mr-1" />Minimum Rating
                </label>
                <div className="flex gap-1.5">
                  {ratingOptions.map(opt => (
                    <button key={opt.value} onClick={() => setMinRating(opt.value)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                        minRating === opt.value ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent' : 'border-white/5 text-[#A0A0A0] hover:text-white hover:border-white/10'
                      }`}>
                      {opt.value > 0 && <Star className="h-2.5 w-2.5 inline mr-0.5 fill-current" />}{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <button onClick={() => { setPriceRange([0, 2000]); setMinRating(0); }}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors cursor-pointer pb-1">
                  <X className="h-3 w-3" />Clear All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Results info */}
        <div className="flex justify-between items-center text-[10px] text-[#8a8a8a] uppercase tracking-widest font-black select-none">
          <span>{filteredResorts.length} of {total} properties</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        {/* Grid / List */}
        {loading ? (
          <ResortGridSkeleton count={6} />
        ) : filteredResorts.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A]/80 border border-white/5 rounded-3xl space-y-4 shadow-2xl">
            <span className="text-4xl block">🏖️</span>
            <h3 className="font-sans text-lg font-bold text-white uppercase">No resorts matched</h3>
            <p className="text-[#8a8a8a] text-xs max-w-xs mx-auto">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-5'}>
            {filteredResorts.map((r) => {
              const images = r.images && r.images.length > 0 ? r.images : ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=600'];
              const imgIdx = getImgIdx(r.id);
              const prices = getResortPriceRange(r);
              const uniqueTypes = getUniqueRoomTypes(r.rooms);
              const isExpanded = expandedResortId === r.id;
              const isLiked = likedIds.has(r.id);

              if (viewMode === 'list') {
                return (
                  <div key={r.id} className="group flex flex-col sm:flex-row rounded-2xl border border-white/5 bg-[#1A1A1A]/80 backdrop-blur-md overflow-hidden hover:border-brand-accent/20 transition-all duration-300 shadow-lg">
                    {/* Image */}
                    <div className="relative w-full sm:w-72 h-52 sm:h-auto shrink-0 overflow-hidden">
                      <img src={images[imgIdx]} alt={r.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1A1A1A]/30 hidden sm:block" />
                      {images.length > 1 && (
                        <>
                          <button onClick={(e) => prevImg(r.id, images.length, e)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
                          <button onClick={(e) => nextImg(r.id, images.length, e)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {images.map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIdx ? 'bg-white w-3' : 'bg-white/40'}`} />)}
                          </div>
                        </>
                      )}
                      <button onClick={(e) => toggleLike(r.id, e)} className="absolute top-3 right-3 cursor-pointer">
                        <Heart className={`h-5 w-5 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-white/60 hover:text-white'}`} />
                      </button>
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-sans text-lg font-bold text-white">{r.name}</h3>
                            <div className="flex items-center gap-1 text-[10px] text-[#8a8a8a] font-bold mt-0.5">
                              <MapPin className="h-3 w-3 text-brand-accent" />{r.location}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-[#141414] px-2.5 py-1 rounded-full text-[10px] font-bold text-brand-accent border border-white/5 shrink-0">
                            <Star className="h-3 w-3 fill-brand-accent" />{r.rating.toFixed(1)}
                          </div>
                        </div>
                        <p className="text-[11px] text-[#A0A0A0] leading-relaxed line-clamp-2 mt-2">{r.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {uniqueTypes.slice(0, 4).map(rt => (
                            <span key={rt.id} className="bg-white/5 border border-white/5 rounded-full px-2.5 py-1 text-[9px] font-bold text-[#A0A0A0]">{rt.name}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div>
                          <span className="text-lg font-bold text-white">${prices.min}</span>
                          {prices.min !== prices.max && <span className="text-xs text-[#8a8a8a]"> – ${prices.max}</span>}
                          <span className="text-[9px] text-[#8a8a8a] font-bold uppercase ml-1">/ night</span>
                        </div>
                        <button onClick={() => router.push(`/book/${r.id}`)}
                          className="rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 flex items-center gap-1.5 transition-all shadow-lg cursor-pointer">
                          Reserve <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Grid card
              return (
                <div key={r.id} className="group rounded-2xl overflow-hidden border border-white/5 bg-[#1A1A1A]/80 backdrop-blur-md shadow-lg hover:border-brand-accent/20 hover:shadow-2xl hover:shadow-brand-accent/5 transition-all duration-300 flex flex-col">
                  {/* Image carousel */}
                  <div className="relative h-56 overflow-hidden">
                    <img src={images[imgIdx]} alt={r.name}
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=600'; }}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

                    {images.length > 1 && (
                      <>
                        <button onClick={(e) => prevImg(r.id, images.length, e)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => nextImg(r.id, images.length, e)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                          {images.map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-3' : 'bg-white/40'}`} />)}
                        </div>
                      </>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 bg-[#141414]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 text-[9px] font-bold text-brand-accent flex items-center gap-1">
                      <Star className="h-3 w-3 fill-brand-accent text-brand-accent" />{r.rating.toFixed(1)}
                    </div>
                    {r.rating >= 4.8 && (
                      <div className="absolute top-3 left-16 bg-brand-accent/90 px-2 py-1 rounded-full text-[8px] font-black text-white flex items-center gap-1 uppercase tracking-wider">
                        <Sparkles className="h-2.5 w-2.5" />Favourite
                      </div>
                    )}
                    <button onClick={(e) => toggleLike(r.id, e)} className="absolute top-3 right-3 cursor-pointer">
                      <Heart className={`h-5 w-5 drop-shadow-lg transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-white/70 hover:text-white hover:scale-110'}`} />
                    </button>

                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[9px] font-black uppercase text-brand-accent tracking-widest">
                      <MapPin className="h-3 w-3" />{r.location}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-sans text-base font-bold text-white line-clamp-1">{r.name}</h3>
                      <div className="text-right shrink-0">
                        <span className="text-base font-bold text-white">${prices.min}</span>
                        <span className="block text-[8px] text-[#8a8a8a] font-bold uppercase">/ night</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#A0A0A0] leading-relaxed line-clamp-2 flex-1">{r.description}</p>

                    {/* Room types pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {uniqueTypes.slice(0, 3).map(rt => (
                        <span key={rt.id} className="bg-white/5 border border-white/5 rounded-full px-2.5 py-1 text-[9px] font-bold text-[#A0A0A0]">{rt.name}</span>
                      ))}
                      {uniqueTypes.length > 3 && (
                        <span className="bg-white/5 border border-white/5 rounded-full px-2.5 py-1 text-[9px] font-bold text-[#8a8a8a]">+{uniqueTypes.length - 3} more</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => router.push(`/book/${r.id}`)}
                        className="flex-grow rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-[10px] uppercase py-3 transition-all text-center flex items-center justify-center gap-1.5 shadow-lg cursor-pointer">
                        Reserve Suite <ArrowRight className="h-3 w-3" />
                      </button>
                      <button onClick={() => setExpandedResortId(isExpanded ? null : r.id)}
                        className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase px-3.5 py-3 transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer">
                        <Layers className="h-3 w-3 text-brand-accent" />
                        <span className="hidden sm:inline">{isExpanded ? 'Hide' : 'Rooms'}</span>
                      </button>
                    </div>

                    {/* Expanded rooms */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-white/5 space-y-2 animate-fade-in">
                        <span className="block font-black uppercase text-[9px] text-[#8a8a8a] tracking-wider">Available Room Categories</span>
                        {uniqueTypes.map((rt) => (
                          <div key={rt.id} className="p-3 bg-[#141414]/80 rounded-xl border border-white/5 flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-bold text-white block">{rt.name}</span>
                              <span className="text-[9px] text-[#8a8a8a]"><Users className="h-2.5 w-2.5 inline mr-0.5" />Max {rt.maxOccupency} guests</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-brand-accent">${Number(rt.basePrice).toFixed(0)}</span>
                              <span className="text-[9px] text-[#8a8a8a] block uppercase font-bold">/ night</span>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 pt-10 text-xs font-bold text-[#A0A0A0] uppercase tracking-wider select-none">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-full border border-white/5 bg-[#1A1A1A]/80 px-5 py-3 hover:bg-white/5 disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer">
              <ChevronLeft className="h-4.5 w-4.5" /><span>Previous</span>
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    page === p ? 'bg-brand-accent text-white' : 'bg-white/5 text-[#A0A0A0] hover:bg-white/10 hover:text-white'
                  }`}>{p}</button>
              ))}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded-full border border-white/5 bg-[#1A1A1A]/80 px-5 py-3 hover:bg-white/5 disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer">
              <span>Next</span><ChevronRight className="h-4.5 w-4.5" />
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
      <div className="mx-auto max-w-7xl px-4 py-32 space-y-8 bg-[#141414] min-h-screen">
        <div className="space-y-4 text-center">
          <div className="h-6 w-48 bg-white/5 animate-pulse rounded-md mx-auto" />
          <div className="h-4 w-96 bg-white/5 animate-pulse rounded-md mx-auto" />
        </div>
        <ResortGridSkeleton count={6} />
      </div>
    }>
      <ResortsBrowseContent />
    </Suspense>
  );
}
