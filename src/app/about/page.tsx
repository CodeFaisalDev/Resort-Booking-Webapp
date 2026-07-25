'use client';
import React, { useState } from 'react';
import { Compass, Mail, Phone, MapPin, CheckCircle, Info, MessageSquare, Loader2 } from 'lucide-react';

export default function AboutPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMsg, setSentMsg] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSentMsg('');

    try {
      // Simulate sending customer inquiry
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSentMsg('Inquiry submitted. Our concierge team will reach out to you within 2 hours.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#141414] text-[#E5E5E5] pb-16 sm:pb-20 pt-24 sm:pt-28 relative overflow-x-hidden">
      
      {/* Glow Backdrops */}
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* 1. Header Banner */}
      <section className="py-10 sm:py-16 px-4 sm:px-8 text-center space-y-4 relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-accent border border-brand-accent/20">
          <span>bookme.com Concierge</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight px-2">
          Contact Customer Services
        </h1>
        <p className="mx-auto max-w-xl text-[#A0A0A0] text-xs sm:text-sm font-medium leading-relaxed px-2">
          Our global operations team and resort concierges are available 24/7. Connect with us for custom spa arrangements, airport charters, or group reservations.
        </p>
      </section>
 
      {/* 2. Main Content */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 relative z-10">
        
        {/* Left Column: Support Form */}
        <div className="bg-[#1A1A1A]/80 backdrop-blur-md rounded-3xl p-5 sm:p-8 border border-white/5 shadow-2xl space-y-6">
          <div>
            <h2 className="font-sans text-xl font-bold text-white">Submit Support Ticket</h2>
            <span className="text-[10px] text-[#8a8a8a] font-bold uppercase tracking-wider block mt-1">Fast concierge responses</span>
          </div>
 
          {sentMsg && (
            <div className="rounded-xl bg-brand-accent/10 border border-brand-accent/20 p-4 text-xs text-brand-accent font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-4.5 w-4.5 text-brand-accent shrink-0" />
              <span>{sentMsg}</span>
            </div>
          )}
 
          <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Liam Gallagher"
                className="w-full rounded-xl bg-white/5 border border-white/5 py-3.5 px-4 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors"
              />
            </div>
 
            <div>
              <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. liam@oasis.com"
                className="w-full rounded-xl bg-white/5 border border-white/5 py-3.5 px-4 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors"
              />
            </div>
 
            <div>
              <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider">How can our concierge assist?</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe details of your transport options, custom dining needs, etc..."
                className="w-full rounded-xl bg-white/5 border border-white/5 py-3.5 px-4 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors resize-none"
              />
            </div>
 
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-bold uppercase tracking-wider py-4 text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Submitting request...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  <span>Submit Inquiry</span>
                </>
              )}
            </button>
          </form>
        </div>
 
        {/* Right Column: Info cards */}
        <div className="space-y-6 flex flex-col justify-center">
          
          <div className="bg-[#1A1A1A]/60 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20 shrink-0">
              <Phone className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="block text-[8px] text-[#8a8a8a] font-bold uppercase tracking-wider">Telephony Support</span>
              <span className="text-sm font-bold text-white">+1 800-BOOKME-COM</span>
            </div>
          </div>
 
          <div className="bg-[#1A1A1A]/60 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20 shrink-0">
              <Mail className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="block text-[8px] text-[#8a8a8a] font-bold uppercase tracking-wider">Email Correspondence</span>
              <span className="text-sm font-bold text-white">concierge@bookme.com</span>
            </div>
          </div>
 
          <div className="bg-[#1A1A1A]/60 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20 shrink-0">
              <MapPin className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="block text-[8px] text-[#8a8a8a] font-bold uppercase tracking-wider">Global Operations Headquarters</span>
              <span className="text-sm font-bold text-white">750 Luxury Promenade, Maldives Sector B</span>
            </div>
          </div>
 
          <div className="bg-brand-accent/5 rounded-2xl p-6 border border-brand-accent/10 space-y-2">
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Info className="h-4.5 w-4.5 text-brand-accent shrink-0" />
              <span>Concierge Policy</span>
            </h3>
            <p className="text-[#A0A0A0] text-[11px] leading-relaxed">
              Resort reservations submitted online compile instantly. If you require cancellation or date adjustments, please reference your confirmation invoice ID when communicating with our teams.
            </p>
          </div>
 
        </div>
 
      </section>
      
    </div>
  );
}
