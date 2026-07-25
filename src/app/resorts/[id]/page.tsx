'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Star, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  MessageSquarePlus, 
  Send, 
  ShieldCheck, 
  Coffee, 
  Wifi, 
  Tv, 
  Wind, 
  Palmtree, 
  Waves, 
  Clock, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';

interface RoomType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  maxOccupency: number;
}

interface Room {
  id: string;
  roomNum: string;
  floor: string;
  status: string;
  roomType: RoomType;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  guestName: string;
  guestNationality: string;
}

interface ResortDetails {
  id: string;
  name: string;
  location: string;
  description: string;
  rating: number;
  images: string[];
  rooms: Room[];
  reviews: Review[];
}

export default function PublicResortDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const resortId = params.id as string;

  const [resort, setResort] = useState<ResortDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Review Form States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  const fetchResortDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/resorts/${resortId}`);
      const data = await res.json();
      if (res.ok) {
        setResort(data.resort);
      } else {
        setError(data.error || 'Failed to load resort details.');
      }
    } catch (e) {
      setError('Network error loading resort.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resortId) {
      fetchResortDetails();
    }
  }, [resortId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push('/login');
      return;
    }

    setReviewSubmitting(true);
    setReviewMsg('');

    try {
      const res = await fetch(`/api/resorts/${resortId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newRating,
          title: newTitle,
          comment: newComment
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewMsg('Thank you! Your review has been published.');
        setNewTitle('');
        setNewComment('');
        setTimeout(() => {
          setShowReviewModal(false);
          setReviewMsg('');
          fetchResortDetails();
        }, 1500);
      } else {
        setReviewMsg(data.error || 'Failed to post review.');
      }
    } catch (e) {
      setReviewMsg('Error submitting review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0a09] text-white flex flex-col justify-center items-center gap-4 py-32 px-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-stone-400 font-mono text-xs uppercase tracking-widest">Loading Luxury Resort Experience...</p>
      </div>
    );
  }

  if (error || !resort) {
    return (
      <div className="min-h-screen bg-[#0c0a09] text-white flex flex-col justify-center items-center gap-4 py-32 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-2xl font-serif font-bold text-white">Resort Not Found</h2>
        <p className="text-stone-400 max-w-md text-sm">{error || 'The requested resort destination is unavailable.'}</p>
        <button 
          onClick={() => router.push('/resorts')}
          className="mt-4 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer"
        >
          Explore All Resorts
        </button>
      </div>
    );
  }

  // Group rooms by roomType
  const roomTypesMap: Record<string, { type: RoomType; rooms: Room[] }> = {};
  resort.rooms.forEach(r => {
    if (!roomTypesMap[r.roomType.id]) {
      roomTypesMap[r.roomType.id] = { type: r.roomType, rooms: [] };
    }
    roomTypesMap[r.roomType.id].rooms.push(r);
  });

  const uniqueRoomTypes = Object.values(roomTypesMap);

  return (
    <div className="min-h-screen bg-[#0c0a09] text-white font-sans selection:bg-amber-500 selection:text-stone-950 overflow-x-hidden w-full">

      {/* Main Container */}
      <main className="pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
        
        {/* Back Link */}
        <button 
          onClick={() => router.push('/resorts')}
          className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to All Resorts
        </button>

        {/* Hero Title & Rating Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-stone-800/80 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                bookme.com Signature Destination
              </span>
              <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-full text-amber-400 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{resort.rating.toFixed(1)}</span>
                <span className="text-stone-500 text-[10px]">({resort.reviews?.length || 0} reviews)</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-white mb-2">
              {resort.name}
            </h1>
            <p className="flex items-center gap-2 text-stone-400 text-sm">
              <MapPin className="w-4 h-4 text-amber-500" /> {resort.location}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/book/${resort.id}`)}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <span>Book Your Stay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Photo Gallery Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-16">
          <div className="lg:col-span-2 relative h-[380px] sm:h-[480px] rounded-2xl overflow-hidden border border-stone-800 group">
            <img 
              src={resort.images?.[activeImgIndex] || resort.images?.[0] || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1200'} 
              alt={resort.name}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60" />
            
            {resort.images && resort.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImgIndex((prev) => (prev === 0 ? resort.images.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-950/70 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-amber-500 hover:text-stone-950 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveImgIndex((prev) => (prev === resort.images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-950/70 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-amber-500 hover:text-stone-950 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {resort.images?.slice(0, 3).map((img, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveImgIndex(idx)}
                className={`relative h-[115px] sm:h-[150px] rounded-xl overflow-hidden cursor-pointer border transition-all ${
                  activeImgIndex === idx ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-stone-800 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Resort Overview & Amenities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-serif font-bold text-amber-400 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Sanctuary Description
              </h2>
              <p className="text-stone-300 leading-relaxed text-base sm:text-lg whitespace-pre-line font-light">
                {resort.description}
              </p>
            </div>

            {/* Included Luxury Amenities */}
            <div className="border-t border-stone-800/80 pt-8">
              <h3 className="text-lg font-serif font-bold text-white mb-6">Signature Amenities & Inclusions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-stone-900/60 border border-stone-800 p-4 rounded-xl">
                  <Waves className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-semibold text-stone-200">Infinity Ocean Pool</span>
                </div>
                <div className="flex items-center gap-3 bg-stone-900/60 border border-stone-800 p-4 rounded-xl">
                  <Palmtree className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-semibold text-stone-200">Private Beach Lounge</span>
                </div>
                <div className="flex items-center gap-3 bg-stone-900/60 border border-stone-800 p-4 rounded-xl">
                  <Coffee className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-semibold text-stone-200">Artisan Breakfast</span>
                </div>
                <div className="flex items-center gap-3 bg-stone-900/60 border border-stone-800 p-4 rounded-xl">
                  <Wifi className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-semibold text-stone-200">High-Speed Wi-Fi</span>
                </div>
                <div className="flex items-center gap-3 bg-stone-900/60 border border-stone-800 p-4 rounded-xl">
                  <Wind className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-semibold text-stone-200">Holistic Wellness Spa</span>
                </div>
                <div className="flex items-center gap-3 bg-stone-900/60 border border-stone-800 p-4 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-semibold text-stone-200">24/7 Butler Service</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Booking Callout Card */}
          <div className="bg-gradient-to-b from-stone-900 via-stone-900/90 to-stone-950 border border-stone-800 rounded-2xl p-6 sm:p-8 h-fit space-y-6 sticky top-28">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Starting From</span>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-amber-400">
                  ${uniqueRoomTypes[0]?.type.basePrice || 450} <span className="text-xs font-sans text-stone-400 font-normal">/ night</span>
                </p>
              </div>
              <div className="flex items-center gap-1 text-amber-400 text-sm font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{resort.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-stone-300">
              <div className="flex items-center justify-between py-2 border-b border-stone-800/50">
                <span className="text-stone-400">Available Suite Types:</span>
                <span className="font-semibold text-white">{uniqueRoomTypes.length} Categories</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-stone-800/50">
                <span className="text-stone-400">Total Rooms:</span>
                <span className="font-semibold text-white">{resort.rooms.length} Units</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-stone-400">Cancellation Policy:</span>
                <span className="font-semibold text-emerald-400">Free Refund (7 days prior)</span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/book/${resort.id}`)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase tracking-wider py-4 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Reserve This Destination</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-stone-500 text-center">
              No immediate charge required. Reserve dates & select services first.
            </p>
          </div>
        </div>

        {/* Accommodations Showcase */}
        <section className="mb-20 border-t border-stone-800/80 pt-12">
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Available Suites & Villas</h2>
          <p className="text-stone-400 text-sm mb-8">Select your preferred suite category for instant reservation</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {uniqueRoomTypes.map(({ type, rooms }) => {
              const availableRoomsCount = rooms.filter(r => r.status === 'AVAILABLE').length;
              return (
                <div key={type.id} className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-serif font-bold text-white">{type.name}</h3>
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-sm rounded-lg">
                        ${type.basePrice} / night
                      </span>
                    </div>
                    <p className="text-stone-400 text-xs leading-relaxed mb-6 font-light">{type.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-stone-300 mb-6">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-400" /> Max Occupancy: {type.maxOccupency} Guests
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> {availableRoomsCount} Available
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/book/${resort.id}`)}
                    className="w-full py-3 bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center"
                  >
                    Select {type.name}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Guest Reviews & Ratings Section */}
        <section className="border-t border-stone-800/80 pt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-1">Guest Experiences & Reviews</h2>
              <p className="text-stone-400 text-sm">Authentic stays verified by bookme.com Guests</p>
            </div>

            <button
              onClick={() => {
                if (!session) {
                  router.push('/login');
                } else {
                  setShowReviewModal(true);
                }
              }}
              className="bg-stone-900 border border-amber-500/40 hover:border-amber-400 text-amber-400 px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" /> Write a Review
            </button>
          </div>

          {/* Rating Summary Card */}
          <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-6 sm:p-8 mb-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center justify-center p-6 bg-stone-900 border border-stone-800 rounded-xl text-center min-w-[200px]">
              <span className="text-5xl font-serif font-bold text-amber-400 mb-2">{resort.rating.toFixed(1)}</span>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= Math.round(resort.rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-700'}`} 
                  />
                ))}
              </div>
              <span className="text-xs text-stone-400 font-mono">Based on {resort.reviews?.length || 0} reviews</span>
            </div>

            <div className="flex-1 w-full space-y-2">
              <h4 className="text-sm font-bold text-white mb-3">Rating Highlights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-300">
                <div className="flex items-center justify-between p-3 bg-stone-900/60 rounded-lg border border-stone-800">
                  <span className="text-stone-400">Cleanliness & Housekeeping</span>
                  <span className="font-bold text-amber-400">5.0 / 5.0</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-900/60 rounded-lg border border-stone-800">
                  <span className="text-stone-400">Staff Hospitality</span>
                  <span className="font-bold text-amber-400">4.9 / 5.0</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-900/60 rounded-lg border border-stone-800">
                  <span className="text-stone-400">Location & Tranquility</span>
                  <span className="font-bold text-amber-400">5.0 / 5.0</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-900/60 rounded-lg border border-stone-800">
                  <span className="text-stone-400">Dining & Wellness</span>
                  <span className="font-bold text-amber-400">4.8 / 5.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Review Cards Grid */}
          {resort.reviews && resort.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resort.reviews.map((rev) => (
                <div key={rev.id} className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-stone-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center text-sm">
                          {rev.guestName?.[0] || 'G'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{rev.guestName}</h4>
                          <span className="text-[11px] text-stone-500">{rev.guestNationality || 'Verified Guest'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-stone-900 px-2.5 py-1 rounded-full border border-stone-800">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star 
                            key={st} 
                            className={`w-3 h-3 ${st <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-700'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <h5 className="text-base font-serif font-semibold text-amber-300 mb-2">{rev.title}</h5>
                    <p className="text-stone-300 text-xs sm:text-sm leading-relaxed font-light font-sans">{rev.comment}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-stone-800/40 text-[10px] text-stone-500 font-mono">
                    Posted on {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-stone-900/20 border border-dashed border-stone-800 rounded-2xl p-12 text-center">
              <MessageSquarePlus className="w-10 h-10 text-stone-600 mx-auto mb-3" />
              <h4 className="text-lg font-serif font-bold text-stone-300 mb-1">No Guest Reviews Yet</h4>
              <p className="text-stone-500 text-xs mb-4">Be the first guest to share your experience at {resort.name}</p>
              <button
                onClick={() => {
                  if (!session) router.push('/login');
                  else setShowReviewModal(true);
                }}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase text-xs rounded-xl"
              >
                Write First Review
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <h3 className="text-xl font-serif font-bold text-white mb-2">Write Your Guest Review</h3>
            <p className="text-stone-400 text-xs mb-6">Share your stay experience at {resort.name}</p>

            {reviewMsg && (
              <div className={`p-3 rounded-lg text-xs font-semibold mb-4 ${
                reviewMsg.includes('Thank') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {reviewMsg}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Star Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1.5 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star className={`w-7 h-7 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-stone-700'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-amber-400 font-mono">{newRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unforgettable Stay & World-Class Hospitality"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1">
                  Your Detailed Review
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell future guests about your room, service, dining, and overall experience..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-5 py-3 border border-stone-800 hover:border-stone-700 text-stone-300 text-xs font-bold uppercase tracking-wider rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {reviewSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Publish Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
