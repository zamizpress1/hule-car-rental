'use client';

import React, { useState } from 'react';
import { Sparkles, Search, ShieldCheck, Heart, MapPin, Car, Gauge, Mountain, Gem, Bus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { normalizeServerVehicle, RawVehicle } from '../lib/supabase-server';

export interface Vehicle {
  id: string;
  owner_id?: string | null;
  make: string;
  model: string;
  year: number;
  category: string;
  zone: string;
  dailyRate: number;
  driverMode: string;
  transmission: string;
  fuel: string;
  body: string;
  color: string;
  cc: string;
  mileage: string;
  condition: string;
  seats: number;
  usage_type: string;
  poster_role: string;
  owner_phone?: string;
  status: string;
  is_premium: boolean;
  requires_check: boolean;
  deposit_amount: number;
  advanced_payment_days: number;
  supplier: { name: string; phone: string };
  collateral: string[];
  description: string;
  image: string;
  images: string[];
  created_at: string;
  urgency_tag?: string;
  advance_days?: number;
}

interface CarListingClientProps {
  initialCars: Vehicle[];
}

function formatTimeAgo(dateString?: string) {
  if (!dateString) return 'Recently';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
}

export const CarListingClient: React.FC<CarListingClientProps> = ({ initialCars }) => {
  // Vehicles state seeded directly from Server Component stream (continuous feed)
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialCars || []);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo.trim()) return;

    setWaitlistStatus('submitting');
    try {
      const { error } = await supabase
        .from('saved_search_alerts')
        .insert([{ renter_contact: contactInfo, search_keyword: search }]);

      if (error) throw error;
      setWaitlistStatus('success');
    } catch (err) {
      console.error('Waitlist submit error:', err);
      setWaitlistStatus('idle');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setZone('all');
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
  };

  // Filtered cars computed instantly on client & sorted newest first
  const filteredFleet = vehicles
    .filter(v => {
      const matchesSearch = !search.trim() || 
        `${v.make} ${v.model} ${v.zone} ${v.category}`.toLowerCase().includes(search.toLowerCase().trim());
      const matchesZone = zone === 'all' || v.zone === zone;
      const matchesCategory = category === 'all' || v.category === category;
      const matchesMinPrice = !minPrice || v.dailyRate >= Number(minPrice);
      const matchesMaxPrice = !maxPrice || v.dailyRate <= Number(maxPrice);

      return matchesSearch && matchesZone && matchesCategory && matchesMinPrice && matchesMaxPrice;
    })
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  const categories = [
    { id: 'all', label: 'All', icon: Car },
    { id: 'Economy', label: 'Economy', icon: Gauge },
    { id: 'SUV', label: 'SUV & 4x4', icon: Mountain },
    { id: 'Luxury', label: 'Luxury', icon: Gem },
    { id: 'Van', label: 'Vans', icon: Bus }
  ];

  return (
    <div className="space-y-6">
      {/* SEARCH & FILTERS CONTROLS */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 md:p-6 space-y-4">
        {/* Row 1: Search & Zone */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search make, model, location (e.g. Toyota, Bole)..."
              className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm font-medium text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">All Locations</option>
              <option value="Bole">Bole</option>
              <option value="Sarbet">Sarbet</option>
              <option value="CMC">CMC</option>
              <option value="Kazanchis">Kazanchis</option>
            </select>
          </div>
        </div>

        {/* Row 2: Price Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min Price (ETB)"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-slate-800"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max Price (ETB)"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-slate-800"
          />
        </div>

        {/* Row 3: Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CAR GRID CONTAINER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 md:px-0">
          <h2 className="text-sm md:text-base font-extrabold text-slate-800">
            Available Rental Cars ({filteredFleet.length})
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Server Streamed
          </span>
        </div>

        {/* Empty State */}
        {filteredFleet.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-xl border border-slate-200 shadow-xs text-center max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Can't find your vehicle?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Leave your phone number or Telegram handle, and our master brokers will source this exact car for you within hours.
            </p>

            {waitlistStatus === 'success' ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl font-bold border border-green-200 flex items-center justify-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4" />
                You are on the list! A broker will contact you shortly.
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="w-full space-y-3">
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Phone number or @telegram"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-800 text-center"
                  disabled={waitlistStatus === 'submitting'}
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === 'submitting'}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  {waitlistStatus === 'submitting' ? 'Submitting...' : 'Source My Car'}
                </button>
              </form>
            )}

            <button
              onClick={resetFilters}
              className="mt-4 text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Grid of Car Cards */}
        {filteredFleet.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-6 px-2 md:px-0">
            {filteredFleet.map(v => {
              const isSaved = savedIds.has(v.id);
              let rawAdv = Number(v.advanced_payment_days || v.advance_days || 0);
              if (!rawAdv && v.advance_payment) {
                const match = String(v.advance_payment).match(/\d+/);
                if (match) rawAdv = parseInt(match[0], 10);
              }
              const calculatedMonths = rawAdv > 0 ? (rawAdv >= 30 ? Math.round(rawAdv / 30) : rawAdv) : 0;

              return (
                <div
                  key={v.id}
                  className="bg-white rounded-lg border border-slate-200 flex flex-col group cursor-pointer hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="relative w-full h-32 md:h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={v.image || (v.images && v.images[0]) || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=800&auto=format&fit=crop'}
                      alt={`${v.make} ${v.model}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Verified Badge */}
                    <div className="absolute top-2 right-0 bg-cyan-600 text-white px-2 py-0.5 rounded-l-md text-[10px] font-bold shadow-xs z-10">
                      Verified
                    </div>

                    {/* Price & Advance Overlay */}
                    <div className="absolute bottom-0 left-0 flex items-center z-10">
                      <div className="bg-black/80 text-white text-xs md:text-sm font-bold px-2 py-1 rounded-tr-md">
                        ETB {v.dailyRate} / day
                      </div>
                      {calculatedMonths > 0 && (
                        <div className="bg-amber-600 text-white text-[10px] md:text-xs font-semibold px-2 py-1 rounded-tr-md ml-0.5 shadow-xs">
                          {calculatedMonths} ወር ቅድመ ክፍያ
                        </div>
                      )}
                    </div>

                    {/* Save Heart Button */}
                    <button
                      onClick={(e) => handleToggleSave(v.id, e)}
                      className="absolute top-2 left-2 bg-white/90 backdrop-blur w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-slate-400 shadow-xs hover:text-red-500 transition-colors z-10"
                      title="Save vehicle"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>

                    {/* Commission Badge */}
                    <div className="absolute top-2 left-9 sm:left-10 bg-orange-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-xs z-10">
                      10% Commission
                    </div>
                  </div>

                  <div className="p-2.5 flex flex-col gap-1 flex-1">
                    <h3 className="text-xs md:text-sm font-bold truncate text-slate-800">
                      {v.make} {v.model}
                    </h3>

                    <p className="text-[10px] text-slate-500 truncate">
                      {v.year} • {v.usage_type || 'Personal Use'} • {formatTimeAgo(v.created_at)}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                      <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">
                        {v.poster_role === 'Broker' ? 'Broker Managed' : 'Private Owner'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarListingClient;
