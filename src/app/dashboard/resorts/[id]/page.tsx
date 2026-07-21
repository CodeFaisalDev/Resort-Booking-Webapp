'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  Star, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Compass, 
  CheckCircle, 
  ShieldAlert, 
  Sparkles,
  Globe,
  Layers,
  BedDouble
} from 'lucide-react';
import { ResortCardSkeleton } from '@/components/SkeletonLoaders';
import { dashboardCache } from '@/lib/dashboardCache';

const LOCATION_PRESETS = [
  { name: 'Maldives', location: 'North Malé Atoll, Maldives', lat: 3.2028, lng: 73.2207 },
  { name: 'Bali', location: 'Uluwatu, Bali, Indonesia', lat: -8.4095, lng: 115.1889 },
  { name: 'Swiss Alps', location: 'Zermatt, Swiss Alps, Switzerland', lat: 45.9766, lng: 7.7491 },
  { name: 'Santorini', location: 'Oia, Santorini, Greece', lat: 36.3932, lng: 25.4615 },
  { name: 'Aspen', location: 'Aspen Mountain, Colorado, USA', lat: 39.1911, lng: -106.8175 },
  { name: 'Tokyo', location: 'Ginza District, Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
];

export default function EditResortPage() {
  const router = useRouter();
  const params = useParams();
  const resortId = params?.id as string;

  const [loadingResort, setLoadingResort] = useState(true);
  const [resortData, setResortData] = useState<any>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('0.0');
  const [longitude, setLongitude] = useState('0.0');
  const [rating, setRating] = useState('5.0');
  
  // Image list manager
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (!resortId) return;
    const fetchResort = async () => {
      setLoadingResort(true);
      try {
        const res = await fetch(`/api/resorts/${resortId}`);
        const data = await res.json();
        if (res.ok && data) {
          setResortData(data);
          setName(data.name || '');
          setDescription(data.description || '');
          setLocation(data.location || '');
          setLatitude(String(data.latitude || 0));
          setLongitude(String(data.longitude || 0));
          setRating(String(data.rating || 5.0));
          setImages(data.images || []);
        } else {
          showToast(data.error || 'Failed to fetch resort data.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Error loading resort property details.', 'error');
      } finally {
        setLoadingResort(false);
      }
    };
    fetchResort();
  }, [resortId]);

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    if (!images.includes(imageUrlInput.trim())) {
      setImages([...images, imageUrlInput.trim()]);
    }
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const applyLocationPreset = (preset: typeof LOCATION_PRESETS[0]) => {
    setLocation(preset.location);
    setLatitude(String(preset.lat));
    setLongitude(String(preset.lng));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !location.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    if (images.length === 0) {
      showToast('Please add at least one image URL for the resort gallery.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        rating: parseFloat(rating) || 5.0,
        images,
      };

      const res = await fetch(`/api/resorts/${resortId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Resort updated successfully!', 'success');
        // Invalidate resorts & overview cache so fresh data is loaded
        dashboardCache.invalidate('resorts');
        dashboardCache.invalidate('overview');
        setTimeout(() => {
          router.push('/dashboard?tab=resorts');
        }, 1200);
      } else {
        showToast(data.error || 'Failed to update resort.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating resort property.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingResort) {
    return (
      <div className="min-h-screen bg-[#0C0A09] text-[#E5E5E5] p-8 space-y-6 max-w-5xl mx-auto">
        <ResortCardSkeleton />
        <ResortCardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0A09] text-[#E5E5E5] p-4 md:p-8 select-none">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <ShieldAlert className="h-4 w-4 shrink-0" />}
          <span className="text-xs font-bold">{toast.msg}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* TOP NAVBAR & BREADCRUMBS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <button
              onClick={() => router.push('/dashboard?tab=resorts')}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8a8a8a] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Properties
            </button>
            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-white flex items-center gap-3">
              <Building className="h-7 w-7 text-brand-accent" /> Edit Resort: {resortData?.name || 'Property'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard?tab=resorts')}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase text-[#A0A0A0] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Update Resort
                </>
              )}
            </button>
          </div>
        </div>

        {/* MAIN FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: BASIC PROPERTY DETAILS */}
          <div className="bg-[#1A1A1A]/90 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <Compass className="h-5 w-5 text-brand-accent" />
              <h2 className="font-heading text-lg font-normal text-white">Property Overview</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8a8a8a]">
                  Resort Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-brand-accent transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8a8a8a]">
                  Destination Location <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="h-4 w-4 absolute left-4 top-3.5 text-[#8a8a8a]" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-brand-accent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8a8a8a]">
                  Star Rating (1.0 - 5.0)
                </label>
                <div className="relative">
                  <Star className="h-4 w-4 absolute left-4 top-3.5 text-yellow-400" />
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-brand-accent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8a8a8a]">
                  Associated Rooms
                </label>
                <div className="px-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs font-bold text-brand-accent flex items-center gap-2">
                  <BedDouble className="h-4 w-4" /> {resortData?.rooms?.length || 0} Registered Rooms
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8a8a8a]">
                Description & Luxury Experience <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl p-4 text-xs focus:outline-none focus:border-brand-accent transition-all leading-relaxed"
              />
            </div>
          </div>

          {/* SECTION 2: GEO COORDINATES & LOCATION PRESETS */}
          <div className="bg-[#1A1A1A]/90 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <Globe className="h-5 w-5 text-brand-accent" />
              <h2 className="font-heading text-lg font-normal text-white">Geographic Coordinates</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8a8a8a]">
                  Latitude Decimal
                </label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8a8a8a]">
                  Longitude Decimal
                </label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>

            <div className="space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#8a8a8a]">
                Global Presets
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyLocationPreset(preset)}
                    className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-left transition-all cursor-pointer group"
                  >
                    <span className="block font-bold text-white text-xs group-hover:text-brand-accent">{preset.name}</span>
                    <span className="block text-[9px] text-[#8a8a8a] truncate mt-0.5">{preset.lat}, {preset.lng}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: IMAGE GALLERY MANAGER */}
          <div className="bg-[#1A1A1A]/90 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <ImageIcon className="h-5 w-5 text-brand-accent" />
              <h2 className="font-heading text-lg font-normal text-white">Media Gallery URLs</h2>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-brand-accent"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4" /> Add Image URL
                </button>
              </div>

              {/* Image Preview Grid */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#8a8a8a]">
                  Gallery Images ({images.length})
                </span>

                {images.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-[#8a8a8a] text-xs">
                    No images added.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((imgUrl, idx) => (
                      <div key={idx} className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#141414] group">
                        <img src={imgUrl} alt={`Gallery item ${idx + 1}`} className="h-36 w-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-3">
                          <span className="text-[10px] font-mono text-white/70 truncate max-w-[150px]">{imgUrl}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition-all cursor-pointer"
                            title="Remove Image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM FORM ACTIONS */}
          <div className="flex justify-end items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard?tab=resorts')}
              className="px-6 py-3 rounded-2xl border border-white/10 text-xs font-bold uppercase text-[#A0A0A0] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 rounded-2xl bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              {submitting ? 'Updating Property...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
