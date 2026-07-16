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
    <div className="w-full min-h-screen bg-stone-50 text-stone-900 pb-20">
      
      {/* 1. Header Banner */}
      <section className="bg-white border-b border-stone-200 py-16 px-4 sm:px-8 text-center space-y-4 shadow-sm">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-600 border border-orange-500/20">
          <span>ESKAPINN Concierge</span>
        </div>
        <h1 className="font-sans text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-900 leading-tight">
          Contact Customer Services
        </h1>
        <p className="mx-auto max-w-xl text-stone-500 text-xs sm:text-sm font-light leading-relaxed">
          Our global operations team and resort concierges are available 24/7. Connect with us for custom spa arrangements, airport charters, or group reservations.
        </p>
      </section>

      {/* 2. Main Content */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Left Column: Support Form */}
        <div className="bg-white rounded-[32px] p-8 border border-stone-200 shadow-sm space-y-6">
          <div>
            <h2 className="font-sans text-xl font-bold text-stone-900">Submit Support Ticket</h2>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Fast concierge responses</span>
          </div>

          {sentMsg && (
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 text-xs text-orange-700 font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-4.5 w-4.5 text-orange-500 shrink-0" />
              <span>{sentMsg}</span>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-500 uppercase mb-1.5 font-bold tracking-wider">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Liam Gallagher"
                className="w-full rounded-xl bg-stone-50 border border-stone-200 py-3.5 px-4 text-stone-855 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-stone-500 uppercase mb-1.5 font-bold tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. liam@oasis.com"
                className="w-full rounded-xl bg-stone-50 border border-stone-200 py-3.5 px-4 text-stone-855 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-stone-500 uppercase mb-1.5 font-bold tracking-wider">How can our concierge assist?</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe details of your transport options, custom dining needs, etc..."
                className="w-full rounded-xl bg-stone-50 border border-stone-200 py-3.5 px-4 text-stone-855 outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase tracking-wider py-4 text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10"
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
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shrink-0">
              <Phone className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="block text-[8px] text-stone-400 font-bold uppercase tracking-wider">Telephony Support</span>
              <span className="text-sm font-bold text-stone-850">+1 800-ESKAP-INN</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shrink-0">
              <Mail className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="block text-[8px] text-stone-400 font-bold uppercase tracking-wider">Email Correspondence</span>
              <span className="text-sm font-bold text-stone-850">concierge@eskapinn.com</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shrink-0">
              <MapPin className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="block text-[8px] text-stone-400 font-bold uppercase tracking-wider">Global Operations Headquarters</span>
              <span className="text-sm font-bold text-stone-850">750 Luxury Promenade, Maldives Sector B</span>
            </div>
          </div>

          <div className="bg-orange-500/5 rounded-2xl p-6 border border-orange-500/10 space-y-2">
            <h3 className="font-bold text-stone-850 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Info className="h-4.5 w-4.5 text-orange-500 shrink-0" />
              <span>Conceirge Policy</span>
            </h3>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Resort reservations submitted online compile instantly. If you require cancelation or date adjustments, please reference your confirmation invoice ID when communicating with our teams.
            </p>
          </div>

        </div>

      </section>
      
    </div>
  );
}
