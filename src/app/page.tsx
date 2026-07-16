'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  MapPin, Calendar as CalendarIcon, Users, Loader2, Heart,
  ChevronRight, ChevronLeft, ArrowUpRight, Star, Shield,
  Clock, Headphones, Globe, Send, Quote, Plus, Minus,
  Coffee, Compass, Anchor, Wind, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
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
}

const getCoords = (place: string): [number, number] | null => {
  const p = place.toLowerCase();
  if (p.includes('maldives')) return [3.2028, 73.2207];
  if (p.includes('bali')) return [-8.4095, 115.1889];
  if (p.includes('santorini')) return [36.3932, 25.4615];
  if (p.includes('aspen')) return [39.1911, -106.8175];
  if (p.includes('venice')) return [45.4408, 12.3155];
  if (p.includes('rome')) return [41.9028, 12.4964];
  if (p.includes('tokyo')) return [35.6762, 139.6503];
  if (p.includes('paris')) return [48.8566, 2.3522];
  if (p.includes('stavanger')) return [58.9700, 5.7331];
  if (p.includes('dubai')) return [25.2048, 55.2708];
  return null;
};

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Search parameters states
  const [searchPlace, setSearchPlace] = useState('');
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);
  
  // Date Picker States
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(new Date(2026, 5, 8)); // Jun 8, 2026
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(new Date(2026, 5, 13)); // Jun 13, 2026

  // Guest Selector States
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);

  // Other States
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [showFloatingHeader, setShowFloatingHeader] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{ src: string; title: string; subtitle: string } | null>(null);

  // Interactive Calculator States
  const [calcRate, setCalcRate] = useState(380);
  const [calcNights, setCalcNights] = useState(5);
  const [calcGuests, setCalcGuests] = useState(2);

  // New dining/spa interactive states
  const [activeDiningMenu, setActiveDiningMenu] = useState<'breakfast' | 'tea' | 'dinner'>('dinner');
  const [activeSpaService, setActiveSpaService] = useState<'massage' | 'spring' | 'yoga'>('massage');

  // Dynamic Background State
  const [activeBgImage, setActiveBgImage] = useState('https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1200');

  // Refs for closing dropdowns
  const destRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const destScrollRef = useRef<HTMLDivElement>(null);

  // GSAP animation container refs
  const rootRef = useRef<HTMLDivElement>(null);
  const heroPinRef = useRef<HTMLDivElement>(null);
  const bookingBarRef = useRef<HTMLDivElement>(null);
  const staysSectionRef = useRef<HTMLDivElement>(null);
  const diningSectionRef = useRef<HTMLDivElement>(null);
  const spaSectionRef = useRef<HTMLDivElement>(null);
  const excursionsSectionRef = useRef<HTMLDivElement>(null);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const featuresSectionRef = useRef<HTMLDivElement>(null);
  const destinationSectionRef = useRef<HTMLDivElement>(null);
  const testimonialSectionRef = useRef<HTMLDivElement>(null);
  const calcSectionRef = useRef<HTMLDivElement>(null);
  const newsletterSectionRef = useRef<HTMLDivElement>(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Fetch resorts
  useEffect(() => {
    async function getResorts() {
      try {
        const res = await fetch('/api/resorts?page=1&limit=12');
        const data = await res.json();
        if (res.ok) setResorts(data.resorts || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    getResorts();
  }, []);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setIsDestDropdownOpen(false);
      }
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
        setIsGuestDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sticky navigation threshold
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingHeader(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize Leaflet Map (Client-side only)
  useEffect(() => {
    if (loading) return;

    let active = true;
    let localMap: any = null;

    async function initMap() {
      if (!mapContainerRef.current) return;

      const L = await import('leaflet');
      if (!active) return;
      if (mapInstanceRef.current) return;

      // Initialize map container with global zoom-out
      localMap = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false, // Prevents scroll hijacking on snap scroll
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(localMap);

      mapInstanceRef.current = localMap;

      // Add pins for current resorts
      resorts.forEach((resort) => {
        const coords = getCoords(resort.name || resort.location);
        if (coords) {
          const marker = L.marker(coords, {
            icon: L.divIcon({
              className: 'custom-map-marker',
              html: `<div class="w-4 h-4 rounded-full bg-brand-accent border-2 border-[#141414] animate-pulse flex items-center justify-center shadow-lg"><div class="w-1.5 h-1.5 rounded-full bg-white"></div></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          }).addTo(localMap);

          marker.bindPopup(`
            <div class="text-left font-sans p-1">
              <span class="block text-xs font-bold text-[#141414]">${resort.name}</span>
              <span class="block text-[9px] text-[#666] mt-0.5">${resort.location}</span>
            </div>
          `);
        }
      });
    }

    initMap();

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, resorts]);

  // Sync Map View with searchPlace selection
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const coords = getCoords(searchPlace);
    if (coords) {
      mapInstanceRef.current.flyTo(coords, 10, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    } else if (searchPlace.trim() === '') {
      // Zoom out to global view if search is empty
      mapInstanceRef.current.flyTo([20, 0], 2, {
        duration: 1.5
      });
    }
  }, [searchPlace]);

  // GSAP Custom Scroll Animations (No Snap)
  useEffect(() => {
    if (loading) return;

    let ctx: gsap.Context | null = null;

    const rafId = requestAnimationFrame(() => {
      ctx = gsap.context(() => {

        // ─── 1. HERO ON-MOUNT REVEALS ───
        gsap.fromTo('.hero-animate-tag', 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
        );
        gsap.fromTo('.hero-animate-title', 
          { opacity: 0, y: 40 }, 
          { opacity: 1, y: 0, duration: 1, delay: 0.3, ease: 'power3.out' }
        );
        gsap.fromTo('.hero-animate-desc', 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, duration: 0.8, delay: 0.5, ease: 'power3.out' }
        );
        gsap.fromTo('.hero-animate-cta', 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, duration: 0.8, delay: 0.6, ease: 'power3.out' }
        );
        gsap.fromTo('.hero-animate-card',
          { opacity: 0, scale: 0.8, rotateY: 30 },
          { opacity: 1, scale: 1, rotateY: 0, duration: 1.2, delay: 0.4, stagger: 0.15, ease: 'power4.out' }
        );

        // ─── 2. FIXED BACKDROP PARALLAX ZOOM ───
        gsap.to('.fixed-backdrop-bg', {
          scale: 1.2,
          y: 80,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true
          }
        });

        // ─── 3. HERO MOUSE-MOVE PARALLAX & TILT ───
        const hero = heroPinRef.current;
        if (hero) {
          const onMouseMove = (e: MouseEvent) => {
            const rect = hero.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

            gsap.to('.floating-card-1', {
              x: x * 30,
              y: y * 30,
              rotateY: x * 15,
              rotateX: -y * 15,
              duration: 0.8,
              ease: 'power2.out',
              overwrite: 'auto'
            });

            gsap.to('.floating-card-2', {
              x: x * -20,
              y: y * -20,
              rotateY: x * 25,
              rotateX: -y * 25,
              duration: 1,
              ease: 'power2.out',
              overwrite: 'auto'
            });

            gsap.to('.floating-card-3', {
              x: x * 40,
              y: y * -30,
              rotateY: x * -12,
              rotateX: -y * 12,
              duration: 0.9,
              ease: 'power2.out',
              overwrite: 'auto'
            });

            gsap.to('.hero-parallax-text', {
              x: x * 12,
              y: y * 12,
              duration: 0.7,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          };

          hero.addEventListener('mousemove', onMouseMove);
          (window as any)._heroMouseMoveCleanup = () => {
            hero.removeEventListener('mousemove', onMouseMove);
          };
        }

        // ─── 4. BACKDROP IMAGE SWAPS PER SECTION ───
        ScrollTrigger.create({
          trigger: staysSectionRef.current,
          start: 'top center',
          onEnter: () => setActiveBgImage('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1200'),
          onEnterBack: () => setActiveBgImage('https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1200')
        });

        ScrollTrigger.create({
          trigger: diningSectionRef.current,
          start: 'top center',
          onEnter: () => setActiveBgImage('https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1200'),
          onEnterBack: () => setActiveBgImage('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1200')
        });

        ScrollTrigger.create({
          trigger: spaSectionRef.current,
          start: 'top center',
          onEnter: () => setActiveBgImage('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200'),
          onEnterBack: () => setActiveBgImage('https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1200')
        });

        ScrollTrigger.create({
          trigger: excursionsSectionRef.current,
          start: 'top center',
          onEnter: () => setActiveBgImage('https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&q=80&w=1200'),
          onEnterBack: () => setActiveBgImage('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200')
        });

        // ─── 5. DYNAMIC VELOCITY SKEW EFFECT ───
        let skewProxy = { skew: 0 };
        const skewSetter = gsap.quickSetter('.scroll-skew-el', 'skewY', 'deg');
        const clamp = gsap.utils.clamp(-6, 6);

        ScrollTrigger.create({
          onUpdate: (self) => {
            const skew = clamp(self.getVelocity() / -400);
            if (Math.abs(skew) > Math.abs(skewProxy.skew)) {
              skewProxy.skew = skew;
              gsap.to(skewProxy, {
                skew: 0,
                duration: 0.8,
                ease: 'power3.out',
                overwrite: 'auto',
                onUpdate: () => skewSetter(skewProxy.skew)
              });
            }
          }
        });

        // ─── 6. CLIP-PATH AND PARALLAX ON IMAGES ───
        gsap.utils.toArray('.parallax-image').forEach((img: any) => {
          gsap.fromTo(img,
            { scale: 1.25, yPercent: -12 },
            {
              scale: 1,
              yPercent: 12,
              ease: 'none',
              scrollTrigger: {
                trigger: img,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
              }
            }
          );
        });

        // ─── 7. SPLIT-TEXT REVEALS FOR HEADERS ───
        gsap.utils.toArray('.reveal-text').forEach((el: any) => {
          gsap.fromTo(el,
            { y: '100%' },
            {
              y: '0%',
              duration: 1.2,
              ease: 'power4.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 92%',
                toggleActions: 'play none none none'
              }
            }
          );
        });

        // ─── 8. DIRECTIONAL SECTION REVEALS (staggered + smooth scale) ───
        const panels: (HTMLElement | null)[] = [
          bookingBarRef.current,
          staysSectionRef.current,
          diningSectionRef.current,
          spaSectionRef.current,
          excursionsSectionRef.current,
          calcSectionRef.current,
          statsSectionRef.current,
          featuresSectionRef.current,
          destinationSectionRef.current,
          testimonialSectionRef.current,
          newsletterSectionRef.current,
        ];

        const revealDirs: Array<'bottom' | 'left' | 'right'> = [
          'bottom', 'right', 'left', 'bottom', 'right',
          'left', 'bottom', 'right', 'bottom', 'left', 'bottom'
        ];

        panels.forEach((panel, i) => {
          if (!panel) return;
          const dir = revealDirs[i % revealDirs.length];
          const fromVars: gsap.TweenVars = {
            opacity: 0,
            scale: 0.95,
            ...(dir === 'left' ? { x: -80 } : dir === 'right' ? { x: 80 } : { y: 60 })
          };
          gsap.fromTo(panel, fromVars, {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: panel,
              start: 'top 88%',
              end: 'top 50%',
              scrub: 1,
            }
          });
        });

        // ─── 9. EXCURSION TIMELINE PATH DRAW ───
        gsap.fromTo('.timeline-path-line',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: excursionsSectionRef.current,
              start: 'top 60%',
              end: 'bottom 70%',
              scrub: true
            }
          }
        );

        // ─── 10. STAGGER CARD REVEAL ───
        gsap.from('.stagger-card', {
          opacity: 0,
          y: 40,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.stagger-card-trigger',
            start: 'top 80%',
          }
        });

        ScrollTrigger.refresh();

      }, rootRef);
    });

    return () => {
      cancelAnimationFrame(rafId);
      ctx?.revert();
      if (typeof window !== 'undefined') {
        const cleanup = (window as any)._heroMouseMoveCleanup;
        if (cleanup) {
          cleanup();
          delete (window as any)._heroMouseMoveCleanup;
        }
      }
    };
  }, [loading]);



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchPlace.trim();
    const checkInParam = checkInDate ? `&checkIn=${checkInDate.toISOString()}` : '';
    const checkOutParam = checkOutDate ? `&checkOut=${checkOutDate.toISOString()}` : '';
    const guestsParam = `&guests=${adults + children}&rooms=${rooms}`;
    
    let url = '/resorts';
    if (query) {
      url += `?query=${encodeURIComponent(query)}${checkInParam}${checkOutParam}${guestsParam}`;
    } else {
      url += `?${checkInParam.slice(1)}${checkOutParam}${guestsParam}`;
    }
    router.push(url);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setSubscribing(true);
    setTimeout(() => {
      setSubscribing(false);
      setIsSubscribed(true);
      setEmail('');
    }, 1200);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  const getFormattedGuests = () => {
    const total = adults + children;
    return `${total} guest${total > 1 ? 's' : ''}, ${rooms} room${rooms > 1 ? 's' : ''}`;
  };

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const offset = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
      ref.current.scrollTo({ left: scrollLeft + offset, behavior: 'smooth' });
    }
  };

  const popularDestinations = [
    { name: 'Stavanger, Norway', type: 'Fjord Escape' },
    { name: 'Bali, Indonesia', type: 'Exotic Escape' },
    { name: 'Santorini, Greece', type: 'Coastal Cliffs' },
    { name: 'Paris, France', type: 'Romantic City' },
    { name: 'Dubai, UAE', type: 'Modern Metropolis' },
    { name: 'Tokyo, Japan', type: 'Eastern Wonder' },
  ];

  const getSuggestions = () => {
    const matchedResorts = resorts
      .filter(r => r.name.toLowerCase().includes(searchPlace.toLowerCase()) || r.location.toLowerCase().includes(searchPlace.toLowerCase()))
      .map(r => ({ name: r.name, type: 'Resort' }));

    const matchedLocations = resorts
      .filter(r => r.location.toLowerCase().includes(searchPlace.toLowerCase()))
      .map(r => ({ name: r.location, type: 'Location' }));

    const all = [...popularDestinations, ...matchedResorts, ...matchedLocations];
    const unique = Array.from(new Map(all.map(item => [item.name, item])).values());
    
    if (!searchPlace.trim()) {
      return popularDestinations;
    }
    return unique.filter(item => item.name.toLowerCase().includes(searchPlace.toLowerCase())).slice(0, 6);
  };

  // Calculator calculations
  const totalStayCost = calcRate * calcNights;
  const matchClassification = () => {
    if (calcRate < 250) return 'Standard Pavilion';
    if (calcRate < 500) return 'Executive Lagoon Suite';
    if (calcRate < 1000) return 'Premium Overwater Villa';
    return 'Royal Ocean Sanctuary';
  };

  const diningMenus = {
    breakfast: {
      title: 'Floating Lagoon Breakfast',
      desc: 'Wake up to a bespoke sunrise breakfast tray floating gently in your private plunge pool.',
      price: '$85 / guest',
      tag: 'ORGANIC & FRESH'
    },
    tea: {
      title: 'Sunset Cliffside High Tea',
      desc: 'Indulge in artisanal loose-leaf infusions and savory delicacies perched high above the coastline.',
      price: '$120 / guest',
      tag: 'CURATED HERITAGE'
    },
    dinner: {
      title: 'Cinematic Oceanfront Fine Dining',
      desc: 'A custom multi-course chef degustation set directly on the beachfront sand illuminated by fire embers.',
      price: '$240 / guest',
      tag: 'MICHELIN STARRED'
    }
  };

  const spaServices = {
    massage: {
      title: 'Deep Tissue Balinese Ritual',
      desc: 'Traditional deep-muscle pressure points combined with volcanic hot stone layouts to restore vital flow.',
      duration: '90 Minutes',
      price: '$190'
    },
    spring: {
      title: 'Private Sulfur Hot Springs',
      desc: 'Recharge in natural therapeutic mineral thermal waters carved directly into the resort stone cliffs.',
      duration: '60 Minutes',
      price: '$140'
    },
    yoga: {
      title: 'Sunset Infinity Yoga Meditation',
      desc: 'Vinyasa flow sessions led by native master gurus on our overwater sunset teak platform.',
      duration: '75 Minutes',
      price: '$95'
    }
  };

  return (
    <div ref={rootRef} className="w-full min-h-screen bg-transparent text-[#E5E5E5] antialiased relative overflow-x-hidden">
      
      {/* 0. FIXED DYNAMIC BACKDROP (Section overlay background) */}
      <div 
        className="fixed-backdrop-bg transition-all duration-1000"
        style={{ backgroundImage: `url('${activeBgImage}')` }} 
      />
      <div className="fixed-backdrop-overlay" />

      {/* Sticky Header Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        showFloatingHeader 
          ? 'bg-[#141414]/90 backdrop-blur-md py-3 md:py-4 px-4 md:px-16 border-white/10 shadow-lg' 
          : 'bg-transparent py-4 md:py-6 px-4 md:px-16 border-transparent'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="font-heading text-lg md:text-2xl font-semibold tracking-wide text-white">
              BOOKME<span className="text-brand-accent">.COM</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A0A0A0]">
            <Link href="/resorts" className="hover:text-white transition-colors">Stays</Link>
            <Link href="/resorts" className="hover:text-white transition-colors">Destinations</Link>
            <Link href="/about" className="hover:text-white transition-colors">Experiences</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/about" className="hover:text-white transition-colors">Contact</Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              {session ? (
                <Button 
                  onClick={() => router.push('/dashboard')} 
                  variant="outline"
                  className="border-brand-accent text-white hover:bg-brand-accent/10 hover:text-white text-[11px] font-semibold uppercase tracking-wider py-5 px-6 rounded-lg transition-all"
                >
                  Dashboard
                </Button>
              ) : (
                <Button 
                  onClick={() => router.push('/login')} 
                  variant="outline"
                  className="border-brand-accent text-white hover:bg-brand-accent/10 hover:text-white text-[11px] font-semibold uppercase tracking-wider py-5 px-6 rounded-lg transition-all"
                >
                  Book Now
                </Button>
              )}
            </div>

            {/* Mobile hamburger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden flex flex-col items-center justify-center w-9 h-9 gap-1.5 bg-transparent border-none cursor-pointer"
              aria-label="Toggle menu"
            >
              <span className={`w-5 h-[1.5px] bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-[4.5px]' : ''}`} />
              <span className={`w-5 h-[1.5px] bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-[1.5px] bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-[4.5px]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-400 ease-in-out ${mobileMenuOpen ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col gap-4 py-4 border-t border-white/10">
            <Link href="/resorts" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0] hover:text-white transition-colors">Stays</Link>
            <Link href="/resorts" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0] hover:text-white transition-colors">Destinations</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0] hover:text-white transition-colors">Experiences</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0] hover:text-white transition-colors">About</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0] hover:text-white transition-colors">Contact</Link>
            <div className="pt-2 border-t border-white/5">
              <Button 
                onClick={() => { setMobileMenuOpen(false); router.push(session ? '/dashboard' : '/login'); }} 
                className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white text-[11px] font-bold uppercase tracking-wider py-5 rounded-lg"
              >
                {session ? 'Dashboard' : 'Book Now'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 1. STUNNING HERO SECTION (Single Slide with high-end animations and mouse tilt) */}
      <section ref={heroPinRef} className="relative w-full h-screen overflow-hidden select-none bg-transparent z-10 flex items-center">
        
        {/* Main Text Content */}
        <div className="hero-parallax-text max-w-4xl mx-auto px-6 md:px-16 w-full text-center relative z-30 pointer-events-none">
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center pointer-events-auto">
            <span className="hero-animate-tag text-[11px] md:text-[12px] font-bold text-brand-accent uppercase tracking-[0.25em] mb-4 opacity-0 inline-block">
              MALDIVES FJORD RESORT
            </span>
            <h1 className="hero-animate-title font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-normal leading-[1.05] tracking-tight text-white max-w-3xl opacity-0">
              Where Luxury Meets the Horizon
            </h1>
            <p className="hero-animate-desc mt-6 max-w-2xl text-xs md:text-sm text-[#A0A0A0] leading-relaxed font-medium opacity-0">
              Discover unmatched tranquility over crystalline ocean lagoons. Live in floating sanctuaries designed for complete privacy, quiet escape, and cinematic luxury.
            </p>
            <div className="hero-animate-cta mt-8 flex gap-4 opacity-0">
              <Button onClick={() => router.push('/resorts?query=Maldives')} className="bg-brand-accent hover:bg-brand-accent-hover text-white text-[11px] font-bold uppercase tracking-wider py-6 px-8 rounded-lg shadow-2xl transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]">
                Explore Lagoon Villas
              </Button>
            </div>
          </div>
        </div>

        {/* Scattered 3D Floating Cards (Rendered behind text using z-10) */}
        {/* Card 1: Maldives */}
        <div 
          onClick={() => setSelectedCard({
            src: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1200',
            title: 'Lagoon Overwater Villa',
            subtitle: 'Maldives Fjord Resort'
          })}
          className="hero-animate-card floating-card-1 absolute top-[14%] right-[5%] w-[220px] h-[300px] rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#1A1A1A]/85 backdrop-blur-sm z-10 cursor-pointer hidden lg:block hover:border-brand-accent transition-all duration-300 pointer-events-auto -rotate-6 hover:scale-[1.03]"
        >
          <img src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=400" alt="Maldives" className="w-full h-44 object-cover border-b border-white/5" />
          <div className="p-4 text-left">
            <span className="text-[8px] font-black text-brand-accent tracking-widest block uppercase">Premium Sanctuary</span>
            <span className="text-xs font-bold text-white mt-1 block">Lagoon Overwater Villa</span>
            <span className="text-[10px] text-[#8a8a8a] mt-1 block">Maldives Fjord Resort</span>
          </div>
        </div>

        {/* Card 2: Bali */}
        <div 
          onClick={() => setSelectedCard({
            src: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1200',
            title: 'Volcanic Teak Retreat',
            subtitle: 'Bali Forest Sanctuary'
          })}
          className="hero-animate-card floating-card-2 absolute bottom-[14%] right-[6%] w-[220px] h-[300px] rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#1A1A1A]/90 backdrop-blur-sm z-10 cursor-pointer hidden lg:block hover:border-brand-accent transition-all duration-300 pointer-events-auto rotate-6 hover:scale-[1.03]"
        >
          <img src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=400" alt="Bali" className="w-full h-44 object-cover border-b border-white/5" />
          <div className="p-4 text-left">
            <span className="text-[8px] font-black text-brand-accent tracking-widest block uppercase">Jungle Seclusion</span>
            <span className="text-xs font-bold text-white mt-1 block">Volcanic Teak Retreat</span>
            <span className="text-[10px] text-[#8a8a8a] mt-1 block">Bali Forest Sanctuary</span>
          </div>
        </div>

        {/* Card 3: Aspen */}
        <div 
          onClick={() => setSelectedCard({
            src: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200',
            title: 'Thermal Alpine Chalet',
            subtitle: 'Aspen Alpin Ridge'
          })}
          className="hero-animate-card floating-card-3 absolute bottom-[10%] left-[5%] w-[220px] h-[300px] rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#1A1A1A]/95 backdrop-blur-sm z-10 cursor-pointer hidden lg:block hover:border-brand-accent transition-all duration-300 pointer-events-auto -rotate-10 hover:scale-[1.03]"
        >
          <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=400" alt="Aspen" className="w-full h-44 object-cover border-b border-white/5" />
          <div className="p-4 text-left">
            <span className="text-[8px] font-black text-brand-accent tracking-widest block uppercase">Winter Oasis</span>
            <span className="text-xs font-bold text-white mt-1 block">Thermal Alpine Chalet</span>
            <span className="text-[10px] text-[#8a8a8a] mt-1 block">Aspen Alpin Ridge</span>
          </div>
        </div>

        {/* Card 4: Santorini */}
        <div 
          onClick={() => setSelectedCard({
            src: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=1200',
            title: 'Santorini Cliffside Cave',
            subtitle: 'Santorini Fjord Escape'
          })}
          className="hero-animate-card floating-card-4 absolute top-[12%] left-[6%] w-[220px] h-[300px] rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#1A1A1A]/85 backdrop-blur-sm z-10 cursor-pointer hidden lg:block hover:border-brand-accent transition-all duration-300 pointer-events-auto rotate-[12deg] hover:scale-[1.03]"
        >
          <img src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=400" alt="Santorini" className="w-full h-44 object-cover border-b border-white/5" />
          <div className="p-4 text-left">
            <span className="text-[8px] font-black text-brand-accent tracking-widest block uppercase">Cliffside Escape</span>
            <span className="text-xs font-bold text-white mt-1 block">Santorini Cliffside Cave</span>
            <span className="text-[10px] text-[#8a8a8a] mt-1 block">Santorini Fjord Escape</span>
          </div>
        </div>

        {/* Card 5: Dubai */}
        <div 
          onClick={() => setSelectedCard({
            src: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=1200',
            title: 'Royal Ocean Sanctuary',
            subtitle: 'Dubai Modern Oasis'
          })}
          className="hero-animate-card floating-card-5 absolute top-[44%] right-[24%] w-[220px] h-[300px] rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#1A1A1A]/90 backdrop-blur-sm z-10 cursor-pointer hidden lg:block hover:border-brand-accent transition-all duration-300 pointer-events-auto -rotate-4 hover:scale-[1.03]"
        >
          <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=400" alt="Dubai" className="w-full h-44 object-cover border-b border-white/5" />
          <div className="p-4 text-left">
            <span className="text-[8px] font-black text-brand-accent tracking-widest block uppercase">Modern Sanctuary</span>
            <span className="text-xs font-bold text-white mt-1 block">Royal Ocean Sanctuary</span>
            <span className="text-[10px] text-[#8a8a8a] mt-1 block">Dubai Modern Oasis</span>
          </div>
        </div>

        {/* Hero bottom indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[9px] font-black text-[#555] uppercase tracking-widest">Scroll to Begin</span>
          <div className="w-5 h-8 rounded-full border border-[#333] flex justify-center p-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-bounce" />
          </div>
        </div>
      </section>

      <section ref={bookingBarRef} id="booking-card" className="scroll-skew-el w-full bg-[#141414]/95 backdrop-blur-md px-6 md:px-16 py-20 border-b border-white/5 relative z-30 text-left">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-left mb-8 select-none">
            <span className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.25em] block mb-2">FIND YOUR ESCAPE</span>
            <h2 className="font-heading text-3xl md:text-5xl font-normal text-white tracking-tight leading-tight overflow-hidden">
              <span className="reveal-text block">Interactive Stay Finder</span>
            </h2>
            <p className="text-xs text-[#8a8a8a] mt-2 font-semibold">
              Select your check-in dates, guest count, and search places. Watch the live interactive map fly to your chosen destination.
            </p>
          </div>

          <form onSubmit={handleSearch} className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col lg:flex-row items-stretch lg:items-center gap-2 shadow-2xl text-left relative z-20">
            
            {/* Destination Field */}
            <div ref={destRef} className="relative flex-[1.3] flex flex-col px-5 py-3 border-b lg:border-b-0 lg:border-r border-white/5 cursor-pointer hover:bg-white/5 rounded-lg transition-all"
              onClick={() => { setIsDestDropdownOpen(true); setIsGuestDropdownOpen(false); }}>
              <span className="text-[9px] font-black text-[#8a8a8a] uppercase tracking-wider">Destination</span>
              <input 
                type="text" 
                value={searchPlace} 
                onChange={(e) => setSearchPlace(e.target.value)}
                placeholder="Where are you going?"
                className="bg-transparent text-xs font-bold text-white outline-none border-none p-0 mt-1 placeholder:text-[#555] w-full focus:outline-none"
              />
              
              {isDestDropdownOpen && (
                <div className="absolute top-[110%] left-0 w-full lg:w-[320px] bg-[#1A1A1A]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-4 z-50 text-left"
                  onClick={(e) => e.stopPropagation()}>
                  <span className="block text-[10px] font-bold text-[#8a8a8a] uppercase tracking-wider mb-2.5 px-1">Suggestions</span>
                  <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto scrollbar-none">
                    {getSuggestions().map((item, idx) => (
                      <button key={idx} type="button"
                        onClick={(e) => { e.stopPropagation(); setSearchPlace(item.name); setIsDestDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group text-left border-none bg-transparent cursor-pointer">
                        <MapPin className="h-4 w-4 text-[#8a8a8a] group-hover:text-brand-accent transition-colors shrink-0" />
                        <div>
                          <span className="block text-xs font-bold text-[#E5E5E5]">{item.name}</span>
                          <span className="block text-[9px] text-[#8a8a8a] font-medium mt-0.5">{item.type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Check-in Date Picker */}
            <div className="flex-[1.1] flex flex-col px-5 py-3 border-b lg:border-b-0 lg:border-r border-white/5 cursor-pointer hover:bg-white/5 rounded-lg transition-all">
              <span className="text-[9px] font-black text-[#8a8a8a] uppercase tracking-wider">Check In</span>
              <Popover>
                <PopoverTrigger type="button" className="text-left bg-transparent text-xs font-bold text-white mt-1 border-none p-0 flex items-center justify-between w-full">
                  {checkInDate ? checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
                  <CalendarIcon className="h-3.5 w-3.5 text-[#8a8a8a]" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1A1A1A] border-white/10" align="start">
                  <Calendar
                    mode="single"
                    selected={checkInDate}
                    onSelect={setCheckInDate}
                    className="bg-[#1A1A1A] text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Check-out Date Picker */}
            <div className="flex-[1.1] flex flex-col px-5 py-3 border-b lg:border-b-0 lg:border-r border-white/5 cursor-pointer hover:bg-white/5 rounded-lg transition-all">
              <span className="text-[9px] font-black text-[#8a8a8a] uppercase tracking-wider">Check Out</span>
              <Popover>
                <PopoverTrigger type="button" className="text-left bg-transparent text-xs font-bold text-white mt-1 border-none p-0 flex items-center justify-between w-full">
                  {checkOutDate ? checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
                  <CalendarIcon className="h-3.5 w-3.5 text-[#8a8a8a]" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1A1A1A] border-white/10" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOutDate}
                    onSelect={setCheckOutDate}
                    className="bg-[#1A1A1A] text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Guests Selector */}
            <div ref={guestRef} className="relative flex-[1.2] flex flex-col px-5 py-3 cursor-pointer hover:bg-white/5 rounded-lg transition-all"
              onClick={() => { setIsGuestDropdownOpen(true); setIsDestDropdownOpen(false); }}>
              <span className="text-[9px] font-black text-[#8a8a8a] uppercase tracking-wider">Guests</span>
              <div className="text-xs font-bold text-white mt-1 flex items-center justify-between w-full">
                <span>{getFormattedGuests()}</span>
                <Users className="h-3.5 w-3.5 text-[#8a8a8a]" />
              </div>

              {isGuestDropdownOpen && (
                <div className="absolute top-[110%] right-0 w-[260px] bg-[#1A1A1A]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-4 z-50"
                  onClick={(e) => e.stopPropagation()}>
                  {/* Adults */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="block text-xs font-bold text-[#E5E5E5]">Adults</span>
                      <span className="block text-[9px] text-[#8a8a8a] mt-0.5">Age 13 or above</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" disabled={adults <= 1} onClick={() => setAdults(prev => prev - 1)} className="w-7 h-7 rounded-full border border-white/10 hover:border-brand-accent flex items-center justify-center text-[#8a8a8a] disabled:opacity-30 transition-colors bg-transparent cursor-pointer">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-[#E5E5E5]">{adults}</span>
                      <button type="button" onClick={() => setAdults(prev => prev + 1)} className="w-7 h-7 rounded-full border border-white/10 hover:border-brand-accent flex items-center justify-center text-[#8a8a8a] transition-colors bg-transparent cursor-pointer">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="block text-xs font-bold text-[#E5E5E5]">Children</span>
                      <span className="block text-[9px] text-[#8a8a8a] mt-0.5">Ages 2 – 12</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" disabled={children <= 0} onClick={() => setChildren(prev => prev - 1)} className="w-7 h-7 rounded-full border border-white/10 hover:border-brand-accent flex items-center justify-center text-[#8a8a8a] disabled:opacity-30 transition-colors bg-transparent cursor-pointer">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-[#E5E5E5]">{children}</span>
                      <button type="button" onClick={() => setChildren(prev => prev + 1)} className="w-7 h-7 rounded-full border border-white/10 hover:border-brand-accent flex items-center justify-center text-[#8a8a8a] transition-colors bg-transparent cursor-pointer">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <button type="button" onClick={() => { setAdults(2); setChildren(0); }} className="text-[10px] font-bold text-[#8a8a8a] hover:text-white transition-colors border-none bg-transparent cursor-pointer">Reset</button>
                    <button type="button" onClick={() => setIsGuestDropdownOpen(false)} className="bg-brand-accent hover:bg-brand-accent-hover text-white text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition-all border-none cursor-pointer">Apply</button>
                  </div>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="bg-brand-accent hover:bg-brand-accent-hover text-white py-6 px-7 rounded-lg shrink-0 font-bold text-[11px] uppercase tracking-wider shadow-none border-none cursor-pointer"
            >
              Search
            </Button>
          </form>

          {/* Leaflet Map Integration */}
          <div className="w-full mt-10 relative">
            <div 
              ref={mapContainerRef} 
              className="w-full h-[350px] md:h-[480px] rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative z-10"
            />
            <div className="absolute -bottom-6 left-10 right-10 h-10 bg-brand-accent/5 blur-2xl rounded-full pointer-events-none" />
          </div>

        </div>
      </section>

      <section ref={staysSectionRef} className="scroll-skew-el w-full bg-[#141414]/90 backdrop-blur-md px-6 md:px-16 py-20 border-b border-white/5 relative z-10 stagger-card-trigger">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div className="text-left">
              <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-[0.25em] block mb-2">FEATURED STAYS</span>
              <h2 className="font-heading text-3xl md:text-5xl font-normal text-white tracking-tight leading-tight overflow-hidden">
                <span className="reveal-text block">Our Curated Accommodations</span>
              </h2>
            </div>
            <Link href="/resorts" className="text-[11px] font-bold text-brand-accent uppercase tracking-wider hover:text-white transition-colors flex items-center gap-1.5">
              View All Resorts <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-8 w-8 text-brand-accent animate-spin" />
              <span className="text-xs text-[#8a8a8a] font-semibold animate-pulse">Loading stays...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
              
              {/* Asymmetric Large Card */}
              {resorts[0] && (
                <div onClick={() => router.push(`/book/${resorts[0].id}`)} className="md:col-span-8 group cursor-pointer flex flex-col stagger-card">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10">
                    <img src={resorts[0].images?.[0]} alt={resorts[0].name} className="parallax-image w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    <div className="absolute top-4 left-4 bg-[#141414]/85 border border-white/10 py-1 px-3 rounded-full flex items-center gap-1 shadow-md">
                      <Star className="h-3 w-3 fill-amber-450 text-amber-500 shrink-0" />
                      <span className="text-[10px] font-black text-white">{(resorts[0].rating || 4.95).toFixed(2)}</span>
                    </div>
                    <button onClick={(e) => toggleFavorite(resorts[0].id, e)} className="absolute top-4 right-4 bg-[#141414]/80 border border-white/10 p-2.5 rounded-full shadow-md text-white hover:text-brand-accent bg-transparent cursor-pointer">
                      <Heart className={`h-4.5 w-4.5 ${favorites.includes(resorts[0].id) ? 'fill-brand-accent text-brand-accent' : 'text-[#8a8a8a]'}`} />
                    </button>
                    <div className="absolute bottom-4 left-4 bg-[#141414]/80 border border-white/10 py-1 px-3 rounded-lg text-[9px] uppercase font-bold tracking-widest text-[#B9784F]">
                      Oceanfront Villa
                    </div>
                  </div>
                  <div className="mt-5 flex items-baseline justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white leading-snug group-hover:text-brand-accent transition-colors">{resorts[0].name}</h3>
                      <div className="flex items-center gap-1 text-[11px] text-[#8a8a8a] font-semibold mt-1">
                        <MapPin className="h-3.5 w-3.5 text-brand-accent shrink-0" />
                        <span>{resorts[0].location}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-[#B9784F]">${Math.round((resorts[0].rating || 4.8) * 125)}</span>
                      <span className="text-[10px] text-[#8a8a8a] font-bold block">/ night</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stacked Small Cards */}
              <div className="md:col-span-4 flex flex-col gap-8 justify-between stagger-card">
                {[resorts[1], resorts[2]].filter(Boolean).map((r) => {
                  const rateVal = r.rating || 4.85;
                  return (
                    <div key={r.id} onClick={() => router.push(`/book/${r.id}`)} className="group cursor-pointer flex flex-col flex-1">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 flex-1">
                        <img src={r.images?.[0]} alt={r.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                        <div className="absolute top-4 left-4 bg-[#141414]/85 border border-white/10 py-1 px-2.5 rounded-full flex items-center gap-1 shadow-md">
                          <Star className="h-3 w-3 fill-amber-450 text-amber-500 shrink-0" />
                          <span className="text-[10px] font-black text-white">{rateVal.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-baseline justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors truncate max-w-[190px]">{r.name}</h4>
                          <span className="text-[10px] text-[#8a8a8a] block mt-0.5">{r.location}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-[#B9784F]">${Math.round(rateVal * 115)}</span>
                          <span className="text-[9px] text-[#8a8a8a] font-bold block">/ night</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </section>

      {/* 4. NEW SECTION 1: EPICUREAN DINING SANCTUM (Bento layout) */}
      <section ref={diningSectionRef} className="scroll-skew-el w-full bg-[#141414]/95 backdrop-blur-md px-6 md:px-16 py-20 border-b border-white/5 relative z-10 text-left">
        <div className="max-w-7xl mx-auto">
          
          <span className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.25em] block mb-2">EPICUREAN EXPERIENCE</span>
          <h2 className="font-heading text-3xl md:text-5xl font-normal text-white tracking-tight leading-tight mb-12 overflow-hidden">
            <span className="reveal-text block">The Art of Culinary Rejuvenation</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Dining Backdrop Image Block */}
            <div className="lg:col-span-5 relative rounded-3xl overflow-hidden min-h-[300px] border border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800" 
                alt="Culinary dining setup" 
                className="parallax-image absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[9px] font-bold text-brand-accent uppercase tracking-widest block mb-1">LOCAL INGREDIENTS</span>
                <span className="text-sm font-bold text-white block">Sourced Fresh from Island Organic Farms</span>
              </div>
            </div>

            {/* Menu Interactive Tab Block */}
            <div className="lg:col-span-7 bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 flex flex-col justify-between min-h-[340px]">
              <div>
                <div className="flex gap-4 border-b border-white/5 pb-4 mb-6">
                  {([
                    { id: 'breakfast', label: 'Breakfast' },
                    { id: 'tea', label: 'High Tea' },
                    { id: 'dinner', label: 'Sunset Dinner' }
                  ] as const).map((menu) => (
                    <button 
                      key={menu.id} 
                      onClick={() => setActiveDiningMenu(menu.id)}
                      className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 bg-transparent cursor-pointer transition-colors ${
                        activeDiningMenu === menu.id ? 'border-brand-accent text-white' : 'border-transparent text-[#8a8a8a] hover:text-white'
                      }`}
                    >
                      {menu.label}
                    </button>
                  ))}
                </div>

                <div className="animate-fade-in">
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest bg-brand-accent/10 py-1 px-2.5 rounded-md inline-block">
                    {diningMenus[activeDiningMenu].tag}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-4">{diningMenus[activeDiningMenu].title}</h3>
                  <p className="text-xs text-[#8a8a8a] leading-relaxed mt-2.5 max-w-lg">
                    {diningMenus[activeDiningMenu].desc}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-6">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-brand-accent" />
                  <span className="text-xs font-bold text-white">{diningMenus[activeDiningMenu].price}</span>
                </div>
                <Button className="bg-transparent border border-white/15 text-white hover:bg-white/5 py-5 px-6 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  Reserve Table
                </Button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. NEW SECTION 2: WELLNESS & SPA OASIS */}
      <section ref={spaSectionRef} className="scroll-skew-el w-full bg-[#141414]/90 backdrop-blur-md px-6 md:px-16 py-20 border-b border-white/5 relative z-10 text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Details list */}
          <div className="lg:col-span-5 flex flex-col justify-center order-2 lg:order-1">
            <span className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.25em] block mb-2">WELLNESS &amp; SPA</span>
            <h2 className="font-heading text-3xl md:text-5xl font-normal text-white tracking-tight leading-tight mb-8 overflow-hidden">
              <span className="reveal-text block">Breathe. Realign. Reset.</span>
            </h2>
            
            <div className="flex flex-col gap-5">
              {([
                { id: 'massage', label: 'Balinese Ritual Massage', details: '90 Min · Volcanic Hot Stone' },
                { id: 'spring', label: 'Sulfur Thermal Hot Springs', details: '60 Min · Natural Cave pool' },
                { id: 'yoga', label: 'Overwater Sunset Yoga Session', details: '75 Min · Native master guidance' }
              ] as const).map((service) => (
                <div 
                  key={service.id} 
                  onClick={() => setActiveSpaService(service.id)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    activeSpaService === service.id 
                      ? 'bg-[#1A1A1A] border-brand-accent/50 text-white' 
                      : 'bg-[#141414]/60 border-white/5 text-[#8a8a8a] hover:border-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold block">{service.label}</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${activeSpaService === service.id ? 'translate-x-1 text-brand-accent' : ''}`} />
                  </div>
                  <span className="text-[10px] block mt-1 opacity-70 font-semibold">{service.details}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive display board */}
          <div className="lg:col-span-7 bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row gap-6 min-h-[380px] order-1 lg:order-2">
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 h-48 md:h-auto select-none">
              <img 
                src={
                  activeSpaService === 'massage' 
                    ? 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600'
                    : activeSpaService === 'spring'
                    ? 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600'
                    : 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600'
                } 
                alt="Spa service render" 
                className="parallax-image absolute inset-0 w-full h-full object-cover" 
              />
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block">SESSION CARD</span>
                <h3 className="text-lg font-bold text-white mt-3">{spaServices[activeSpaService].title}</h3>
                <p className="text-xs text-[#8a8a8a] leading-relaxed mt-2">
                  {spaServices[activeSpaService].desc}
                </p>
              </div>

              <div className="flex justify-between items-end border-t border-white/5 pt-4 mt-6">
                <div>
                  <span className="text-[9px] text-[#555] font-black uppercase tracking-widest block">RATE</span>
                  <span className="text-lg font-black text-white block mt-0.5">{spaServices[activeSpaService].price}</span>
                </div>
                <Button className="bg-brand-accent hover:bg-brand-accent-hover text-white text-[10px] font-bold uppercase tracking-wider py-4 px-6 rounded-lg">
                  Book Session
                </Button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. NEW SECTION 3: BESPOKE EXCURSIONS TIMELINE */}
      <section ref={excursionsSectionRef} className="scroll-skew-el w-full bg-[#141414]/95 backdrop-blur-md px-6 md:px-16 py-20 border-b border-white/5 relative z-10 text-left">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16 select-none">
            <span className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.25em] block mb-2">BESPOKE EXCURSIONS</span>
            <h2 className="font-heading text-3xl md:text-5xl font-normal text-white tracking-tight leading-tight overflow-hidden">
              <span className="reveal-text block">Curate Your Adventure</span>
            </h2>
            <p className="text-xs text-[#8a8a8a] mt-3 font-semibold">
              From deep-sea diving in private coral reefs to custom helicopter transfers and sunset yacht charters.
            </p>
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Center Timeline Path Line drawing on scroll - hidden on mobile */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-[1.5px] bg-[#333] z-0 hidden md:block">
              <div className="w-full h-full bg-brand-accent origin-top transform scale-y-0 timeline-path-line" />
            </div>

            <div className="space-y-8 md:space-y-16">
              {[
                { 
                  icon: Compass, 
                  title: 'Deep Sea Coral Reef Diving', 
                  desc: 'Guided deep dive inside protected marine sanctuaries. Encounter native sea turtles, dolphins, and untouched coral ecosystems.', 
                  duration: '4 Hours', 
                  price: '$160 / guest',
                  alignRight: false
                },
                { 
                  icon: Wind, 
                  title: 'Helicopter Island Sightseeing', 
                  desc: 'A premium aerial tour showcasing active volcano craters, black sand shorelines, and secret coastal bays.', 
                  duration: '2 Hours', 
                  price: '$380 / guest',
                  alignRight: true
                },
                { 
                  icon: Anchor, 
                  title: 'Sunset Luxury Yacht Cruise', 
                  desc: 'Board our high-end 60ft catamaran sailing along ocean ridges at golden hour. Champagne toast and oysters served onboard.', 
                  duration: '3 Hours', 
                  price: '$280 / guest',
                  alignRight: false
                }
              ].map((excursion, idx) => {
                const Icon = excursion.icon;
                return (
                  <div key={idx} className={`relative flex flex-col md:flex-row items-start md:items-center justify-between w-full group ${excursion.alignRight ? 'md:flex-row-reverse' : ''}`}>
                    
                    {/* Left/Right Text Card */}
                    <div className="w-full md:w-[45%] bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 md:p-6 relative z-10 transition-transform group-hover:-translate-y-1">
                      <span className="text-[8px] font-black text-brand-accent uppercase tracking-widest">{excursion.duration}</span>
                      <h3 className="text-sm font-bold text-white mt-1.5">{excursion.title}</h3>
                      <p className="text-[11px] text-[#8a8a8a] leading-relaxed mt-2">{excursion.desc}</p>
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                        <span className="text-[11px] font-bold text-white">{excursion.price}</span>
                        <Link href="/about" className="text-[10px] font-bold text-brand-accent hover:text-white uppercase tracking-wider flex items-center gap-1">
                          Inquire <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Timeline center bubble marker - hidden on mobile */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-9 h-9 rounded-full bg-[#1A1A1A] border-2 border-[#333] group-hover:border-brand-accent items-center justify-center transition-colors z-10 hidden md:flex">
                      <Icon className="h-4 w-4 text-[#8a8a8a] group-hover:text-brand-accent transition-colors" />
                    </div>

                    {/* Empty placeholder spacer - hidden on mobile */}
                    <div className="w-[45%] hidden md:block" />
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* 7. DYNAMIC STAY & COST CALCULATOR */}
      <section ref={calcSectionRef} className="scroll-skew-el w-full bg-[#141414]/90 backdrop-blur-md px-6 md:px-16 py-20 border-b border-white/5 relative z-10 text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 flex flex-col">
            <span className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.25em] block mb-2">DECISION SUPPORT TOOL</span>
            <h3 className="font-heading text-2xl md:text-4xl font-normal text-white leading-tight tracking-tight mb-8 overflow-hidden">
              <span className="reveal-text block">Stay Cost &amp; Match Estimator</span>
            </h3>
            
            <div className="space-y-8">
              {/* Slider 1: Budget */}
              <div className="flex flex-col">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-[#8a8a8a] uppercase tracking-wider">Nightly Budget</span>
                  <span className="text-sm font-black text-brand-accent">${calcRate}</span>
                </div>
                <input 
                  type="range" 
                  min="120" 
                  max="1500" 
                  step="20"
                  value={calcRate} 
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full accent-brand-accent cursor-pointer bg-white/10 h-1.5 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-[#555] font-bold mt-1.5">
                  <span>$120</span>
                  <span>$1,500</span>
                </div>
              </div>

              {/* Slider 2: Duration */}
              <div className="flex flex-col">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-[#8a8a8a] uppercase tracking-wider">Duration of Stay</span>
                  <span className="text-sm font-black text-brand-accent">{calcNights} Nights</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="21" 
                  value={calcNights} 
                  onChange={(e) => setCalcNights(Number(e.target.value))}
                  className="w-full accent-brand-accent cursor-pointer bg-white/10 h-1.5 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-[#555] font-bold mt-1.5">
                  <span>1 Night</span>
                  <span>21 Nights</span>
                </div>
              </div>

              {/* Slider 3: Guests count */}
              <div className="flex flex-col">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-[#8a8a8a] uppercase tracking-wider">Travelers</span>
                  <span className="text-sm font-black text-brand-accent">{calcGuests} Guests</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="6" 
                  value={calcGuests} 
                  onChange={(e) => setCalcGuests(Number(e.target.value))}
                  className="w-full accent-brand-accent cursor-pointer bg-white/10 h-1.5 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-[#555] font-bold mt-1.5">
                  <span>1 Guest</span>
                  <span>6 Guests</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#1A1A1A] border border-white/10 rounded-[28px] p-8 flex flex-col justify-between h-[360px] md:h-[400px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[220px] h-[220px] rounded-full bg-brand-accent/5 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-start pb-4 border-b border-white/5">
              <div>
                <span className="text-[9px] font-black text-[#8a8a8a] uppercase tracking-widest block">MATCH CLASSIFICATION</span>
                <span className="text-sm font-extrabold text-white block mt-1">{matchClassification()}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-[#8a8a8a] uppercase tracking-widest block">TOTAL INVOICE</span>
                <span className="text-base font-black text-brand-accent mt-1 block">${totalStayCost}</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-end py-5 relative">
              <span className="absolute top-2 left-0 text-[9px] text-[#555] font-bold uppercase tracking-wider">Estimated Availability Index</span>
              
              <svg className="w-full h-32 text-brand-accent/30" viewBox="0 0 500 120" preserveAspectRatio="none">
                <path 
                  d={`M 0 100 Q 100 ${100 - (calcRate * 0.05)} 200 ${80 - (calcNights * 2)} T 400 ${90 - (calcGuests * 8)} T 500 110`} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                />
                <path 
                  d={`M 0 100 Q 100 ${100 - (calcRate * 0.05)} 200 ${80 - (calcNights * 2)} T 400 ${90 - (calcGuests * 8)} T 500 110 L 500 120 L 0 120 Z`} 
                  fill="url(#calc-grad)" 
                  opacity="0.12" 
                />
                <defs>
                  <linearGradient id="calc-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B9784F" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5 text-xs font-semibold">
              <div className="flex items-center gap-1 text-[#8a8a8a]">
                <Globe className="h-4 w-4 text-brand-accent" />
                <span>Computed Booking Probability:</span>
                <span className="text-white font-extrabold">{Math.min(99, Math.round(92 - (calcNights * 1.5) - (calcRate * 0.02)))}%</span>
              </div>
              <Button 
                onClick={() => router.push(`/resorts?maxPrice=${calcRate * 1.1}`)}
                className="bg-transparent border border-white/10 text-white hover:text-brand-accent hover:bg-brand-accent/10 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              >
                Match Properties
              </Button>
            </div>

          </div>

        </div>
      </section>

      {/* 8. NUMERICAL TRUST BAND */}
      <section ref={statsSectionRef} className="w-full bg-[#0D0D0D]/90 backdrop-blur-md px-6 md:px-16 py-16 border-b border-white/5 relative z-10 select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="text-4xl md:text-5xl font-light text-white tracking-tight leading-none">98.2%</span>
            <span className="text-[10px] font-black text-[#8a8a8a] uppercase tracking-[0.25em] mt-3">GUEST SATISFACTION</span>
          </div>
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left border-y sm:border-y-0 sm:border-x border-white/10 py-6 sm:py-0 sm:px-12">
            <span className="text-4xl md:text-5xl font-light text-white tracking-tight leading-none">15+</span>
            <span className="text-[10px] font-black text-[#8a8a8a] uppercase tracking-[0.25em] mt-3">YEARS OF SERVICE</span>
          </div>
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="text-4xl md:text-5xl font-light text-white tracking-tight leading-none">42</span>
            <span className="text-[10px] font-black text-[#8a8a8a] uppercase tracking-[0.25em] mt-3">INDUSTRY AWARDS</span>
          </div>
        </div>
      </section>

      {/* 9. WHY CHOOSE US - LIGHT SECTION */}
      <section ref={featuresSectionRef} className="scroll-skew-el w-full bg-[#F6F4F2] text-[#141414] px-6 md:px-16 py-20 border-b border-stone-200 relative z-10 text-left">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-3xl mb-16">
            <span className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.25em] block mb-2">WHY BOOK WITH US</span>
            <h2 className="font-heading text-3xl md:text-5xl font-normal tracking-tight leading-tight text-stone-900 overflow-hidden">
              <span className="reveal-text block">Quiet Luxury Meets Seamless Convenience</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Shield, title: 'Best Rate Guarantee', desc: 'Secure direct bookings at the best online rates. If you find a lower price, we will beat it by 10%.' },
              { icon: Clock, title: 'Free Cancellation', desc: 'Travel requirements shift. Cancel up to 24 hours prior to check-in with absolute zero penalties.' },
              { icon: Headphones, title: '24/7 Concierge Support', desc: 'Our dedicated guest services hosts are available around the clock to arrange airport shuttles, spa stays, or excursions.' },
            ].map(({ icon: Icon, title, desc }, idx) => (
              <div key={idx} className="flex flex-col items-start border-t border-stone-300 pt-8 group">
                <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-sm">
                  <Icon className="h-5 w-5 text-brand-accent" />
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-3">{title}</h3>
                <p className="text-xs leading-relaxed font-medium text-stone-600">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 10. DESTINATIONS CAROUSEL */}
      <section ref={destinationSectionRef} className="scroll-skew-el w-full bg-[#141414]/90 backdrop-blur-md px-6 md:px-16 py-20 border-b border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col text-left">
          
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-[0.25em] block mb-2">DESTINATIONS</span>
              <h2 className="font-heading text-3xl md:text-5xl font-normal text-white tracking-tight leading-tight overflow-hidden">
                <span className="reveal-text block">Explore Regional Escapes</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => scrollCarousel(destScrollRef, 'left')} className="p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white shadow-sm transition-all active:scale-95 cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => scrollCarousel(destScrollRef, 'right')} className="p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white shadow-sm transition-all active:scale-95 cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={destScrollRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-none scroll-smooth">
            {[
              { name: 'Maldives', count: '14 properties', img: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=400' },
              { name: 'Bali', count: '21 properties', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=400' },
              { name: 'Santorini', count: '9 properties', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=400' },
              { name: 'Aspen', count: '11 properties', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=400' },
              { name: 'Venice', count: '7 properties', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=400' },
            ].map((dest, idx) => (
              <div 
                key={idx} 
                onClick={() => router.push(`/resorts?query=${encodeURIComponent(dest.name)}`)}
                className="relative shrink-0 w-[240px] md:w-[280px] h-[340px] rounded-2xl overflow-hidden cursor-pointer group border border-white/10"
              >
                <img 
                  src={dest.img} 
                  alt={dest.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d]/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h3 className="text-base font-bold tracking-wide">{dest.name}</h3>
                  <span className="text-[10px] text-[#A0A0A0] font-bold block mt-1 uppercase tracking-widest">{dest.count}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 11. TESTIMONIALS */}
      <section ref={testimonialSectionRef} className="scroll-skew-el w-full bg-[#141414]/95 backdrop-blur-md px-6 md:px-16 py-20 border-b border-white/5 relative z-10 text-left">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center select-none">
          <Quote className="h-10 w-10 text-brand-accent/20 mb-8" />
          <p className="font-heading text-xl md:text-3xl italic leading-relaxed text-white font-light">
            "An absolutely magical getaway. The overwater villa in the Maldives was beyond anything we could have pictured. The hospitality and direct hosts arranged everything perfectly."
          </p>
          <div className="mt-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-brand-accent/15 border border-white/10 flex items-center justify-center mb-3">
              <span className="text-sm font-black text-brand-accent">SM</span>
            </div>
            <span className="text-xs font-bold text-white tracking-wide">Sarah Mitchell</span>
            <span className="text-[10px] text-[#8a8a8a] uppercase tracking-widest mt-1">Travel Blogger · Stayed at Maldives</span>
          </div>
        </div>
      </section>

      {/* 12. NEWSLETTER CTA BAND */}
      <section ref={newsletterSectionRef} className="scroll-skew-el w-full bg-[#0D0D0D]/95 backdrop-blur-md px-6 md:px-16 py-20 border-b border-white/5 relative z-10 text-left">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
          
          <div className="max-w-md">
            <h3 className="font-heading text-2xl md:text-4xl text-white leading-tight tracking-tight overflow-hidden">
              <span className="reveal-text block">Ready for your next escape?</span>
            </h3>
            <p className="text-xs text-[#8a8a8a] mt-3 font-semibold">
              Subscribe to get secret stays, members-only rates, and destination guides straight to your inbox.
            </p>
          </div>

          {isSubscribed ? (
            <div className="flex flex-col items-center bg-[#1A1A1A] border border-brand-accent/20 rounded-xl p-5 text-center max-w-sm w-full animate-fade-in">
              <div className="w-9 h-9 rounded-full bg-brand-accent flex items-center justify-center mb-2.5">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
              </div>
              <span className="block text-xs font-bold text-white">Successfully Subscribed!</span>
              <span className="block text-[9px] text-[#8a8a8a] mt-0.5">Welcome. Check your email for direct codes.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex w-full lg:w-auto items-center bg-[#1A1A1A] border border-white/10 rounded-lg p-1.5 shadow-xl max-w-md">
              <div className="flex items-center gap-2.5 flex-1 pl-3.5">
                <Send className="h-4 w-4 text-[#8a8a8a] shrink-0" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="bg-transparent text-white outline-none text-xs w-full font-bold placeholder:text-[#555] border-none p-0 focus:ring-0 focus:outline-none" 
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={subscribing} 
                className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-[10px] uppercase tracking-wider px-5 py-3 rounded-md shrink-0 transition-all disabled:opacity-50 border-none cursor-pointer"
              >
                {subscribing ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'Subscribe'}
              </button>
            </form>
          )}

        </div>
      </section>

      {/* 13. FOOTER OUTRO */}
      <footer className="w-full bg-[#0D0D0D]/95 backdrop-blur-md text-[#8a8a8a] py-16 px-6 md:px-16 relative overflow-hidden z-10">
        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 select-none opacity-[0.02] pointer-events-none z-0">
          <span className="font-heading text-[120px] sm:text-[180px] md:text-[240px] font-bold text-white leading-none tracking-tighter">
            BOOKME
          </span>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col gap-12 relative z-10">
          
          <div className="flex flex-col md:flex-row items-center justify-between pb-8 border-b border-white/10 gap-6 text-left">
            <div className="flex items-center gap-1 select-none">
              <span className="font-heading text-2xl font-bold tracking-tight text-white">
                BOOKME<span className="text-brand-accent">.COM</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#8a8a8a] font-semibold">Ready to get started?</span>
              <button 
                onClick={() => router.push('/login')}
                className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold px-6 py-3 rounded-lg shadow-md transition-all border-none cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase text-brand-accent tracking-[0.2em] mb-1">Services</span>
              <Link href="/resorts" className="text-xs hover:text-white transition-colors">Direct Bookings</Link>
              <Link href="/resorts" className="text-xs hover:text-white transition-colors">Exclusive Packages</Link>
              <Link href="/about" className="text-xs hover:text-white transition-colors">Spa &amp; Wellness</Link>
              <Link href="/about" className="text-xs hover:text-white transition-colors">Local Excursions</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase text-brand-accent tracking-[0.2em] mb-1">Company</span>
              <Link href="/about" className="text-xs hover:text-white transition-colors">Our Story</Link>
              <Link href="/about" className="text-xs hover:text-white transition-colors">Partner Benefits</Link>
              <Link href="/about" className="text-xs hover:text-white transition-colors">Concierge Team</Link>
              <Link href="/about" className="text-xs hover:text-white transition-colors">Careers</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase text-brand-accent tracking-[0.2em] mb-1">Support</span>
              <Link href="/about" className="text-xs hover:text-white transition-colors">FAQs</Link>
              <Link href="/about" className="text-xs hover:text-white transition-colors">Contact Hosts</Link>
              <Link href="/about" className="text-xs hover:text-white transition-colors">Privacy Settings</Link>
            </div>
            <div className="flex flex-col gap-3.5">
              <span className="text-[10px] font-black uppercase text-brand-accent tracking-[0.2em] mb-1">Direct Connect</span>
              <form onSubmit={handleSubscribe} className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden p-1">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address" 
                  className="bg-transparent text-xs text-white placeholder:text-[#555] font-medium px-3.5 outline-none w-full border-none p-0 focus:ring-0 focus:outline-none"
                  required
                />
                <button type="submit" className="bg-brand-accent text-white p-2 rounded-md hover:bg-brand-accent-hover transition-colors border-none cursor-pointer">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/10 text-[10px] text-[#555] gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <span>© 2026 Bookme.com. All rights reserved.</span>
              <div className="flex gap-4">
                <Link href="/about" className="hover:text-stone-300 transition-colors">Terms &amp; Conditions</Link>
                <Link href="/about" className="hover:text-stone-300 transition-colors">Privacy Policy</Link>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[#8a8a8a]">
              <a href="#" className="hover:text-white transition-colors">
                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

        </div>
      </footer>

      {/* 1.5 MODAL OVERLAY FOR FLOATING CARDS */}
      {selectedCard && (
        <div 
          onClick={() => setSelectedCard(null)}
          className="fixed inset-0 bg-[#0D0D0D]/90 backdrop-blur-md z-50 flex items-center justify-center cursor-zoom-out animate-modal-fade"
        >
          <div 
            className="relative max-w-4xl max-h-[85vh] w-11/12 md:w-3/4 rounded-3xl border border-white/10 overflow-hidden bg-[#1A1A1A] shadow-2xl flex flex-col cursor-default animate-modal-zoom"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedCard.src} 
              alt={selectedCard.title} 
              className="w-full h-auto max-h-[65vh] object-cover"
            />
            <div className="p-6 text-left border-t border-white/5 bg-[#141414]">
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">{selectedCard.subtitle}</span>
              <h3 className="text-xl font-bold text-white mt-1">{selectedCard.title}</h3>
              <button 
                onClick={() => setSelectedCard(null)}
                className="absolute top-4 right-4 bg-[#141414]/80 border border-white/10 p-2.5 rounded-full text-white hover:text-brand-accent transition-colors shadow-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
