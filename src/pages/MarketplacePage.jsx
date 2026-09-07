import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, SlidersHorizontal, X, ShieldCheck, Heart, MapPin, Car, Gauge, Mountain, Gem, Bus, UserCheck, ChevronRight, Phone, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';

function formatTimeAgo(dateString) {
  if (!dateString) return 'Recently';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);

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

const getCategoryIcon = (iconName, className) => {
  switch (iconName) {
    case 'Gauge': return <Gauge className={className} />;
    case 'Mountain': return <Mountain className={className} />;
    case 'Gem': return <Gem className={className} />;
    case 'Bus': return <Bus className={className} />;
    default: return <Car className={className} />;
  }
};

export const MarketplacePage = () => {
  const navigate = useNavigate();
  const { vehicles, savedIds, categories, filters, setFilters, viewMode, setViewMode, openModal, toggleSave, formatETB, showToast, refetchVehicles } = useApp();
  const { language, toggleLanguage, t } = useLanguage();
  const { settings } = useSettings();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        await refetchVehicles();
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [contactInfo, setContactInfo] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('idle');

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!contactInfo.trim()) return;

    setWaitlistStatus('submitting');
    try {
      const { error } = await supabase
        .from('saved_search_alerts')
        .insert([{ renter_contact: contactInfo, search_keyword: filters.search }]);

      if (error) throw error;

      setWaitlistStatus('success');
      setContactInfo('');

      setTimeout(() => setWaitlistStatus('idle'), 5000);
    } catch (err) {
      console.error('Error submitting waitlist:', err);
      showToast('Error joining waitlist. Please try again.');
      setWaitlistStatus('idle');
    }
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleZoneChange = (e) => {
    setFilters(prev => ({ ...prev, zone: e.target.value }));
  };

  const handleCategorySelect = (catId) => {
    setFilters(prev => ({ ...prev, category: catId }));
    if (viewMode === 'saved') setViewMode('explore');
  };

  const handleDriverChange = (e) => {
    setFilters(prev => ({ ...prev, driverMode: e.target.value }));
  };

  const resetFilters = () => {
    setFilters({ search: '', zone: 'all', category: 'all', driverMode: 'all' });
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    showToast(t('reset') || 'Filters reset');
  };

  const activeVehicles = vehicles.filter(v => !v.status || v.status === 'active');

  const filteredVehicles = activeVehicles.filter(v => {
    if (viewMode === 'saved' && !savedIds.has(v.id)) return false;

    const searchMatch = !filters.search ||
      `${v.make} ${v.model} ${v.zone || ''} ${v.category || ''} ${v.description || ''}`.toLowerCase().includes(filters.search.toLowerCase());

    const zoneMatch = filters.zone === 'all' || v.zone === filters.zone;
    const categoryMatch = filters.category === 'all' || v.category === filters.category;
    const driverMatch = filters.driverMode === 'all' || v.driverMode === filters.driverMode || v.driverMode === 'Both';

    // Price range match
    const minP = minPrice ? Number(minPrice) : 0;
    const maxP = maxPrice ? Number(maxPrice) : Infinity;
    const dailyRate = Number(v.dailyRate || 0);
    const priceMatch = dailyRate >= minP && dailyRate <= maxP;

    return searchMatch && zoneMatch && categoryMatch && driverMatch && priceMatch;
  });

  const premiumVehicles = filteredVehicles.filter(v => v.is_premium === true);

  const filteredFleet = filteredVehicles
    .filter(v => v.is_premium !== true)
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() < new Date(a.created_at || 0).getTime() ? 1 : -1;
      if (sortBy === 'price_asc') return Number(a.dailyRate) - Number(b.dailyRate);
      if (sortBy === 'price_desc') return Number(b.dailyRate) - Number(a.dailyRate);
      return 0;
    });

  return (
    <section className="space-y-4 md:space-y-6 fade-in pb-8">

      {/* PREMIUM POSTS SECTION */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold tracking-tight text-content">
            {t.premiumPosts || 'Premium posts'}
          </h2>
          <span className="text-[10px] sm:text-xs text-slate-500">
            Published in the last 10 days
          </span>
        </div>

        {/* The Container */}
        <div className="flex overflow-x-auto gap-4 snap-x hide-scrollbar pb-2">
          {premiumVehicles.map(v => {
            const isSaved = savedIds.has(v.id);
            const advanceValue = v.advanced_payment_days || v.advance_days;

            return (
              <div
                key={v.id}
                onClick={() => navigate(`/vehicle/${v.id}`)}
                className="shrink-0 w-[45%] sm:w-[220px] md:w-[280px] snap-center bg-white rounded-lg border border-gray-200 flex flex-col group cursor-pointer hover:shadow-md transition-all overflow-hidden"
              >
                <div className="relative w-full h-32 md:h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={v.image || v.image_url || (v.images && v.images[0]) || 'https://placehold.co/600x400?text=No+Image'}
                    alt={`${v.make} ${v.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {v.urgency_tag && (
                    <div className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-md absolute top-0 left-0 z-10">
                      {v.urgency_tag}
                    </div>
                  )}

                  {/* Premium Badge */}
                  <div className="absolute top-2 right-0 bg-slate-900 text-white px-2 py-0.5 rounded-l-md text-[10px] font-bold shadow-sm z-10">
                    Premium
                  </div>

                  {/* Price & Advance Overlay */}
                  <div className="absolute bottom-0 left-0 flex items-center z-10">
                    <div className="bg-black/80 text-white text-xs md:text-sm font-bold px-2 py-1 rounded-tr-md">
                      {t.etb || 'ETB'} {v.dailyRate || v.daily_rate} / {t.day || 'day'}
                    </div>
                    {advanceValue && (
                      <div className="bg-amber-600 text-white text-[10px] md:text-xs font-semibold px-2 py-1 rounded-tr-md ml-0.5 shadow-sm">
                        {advanceValue} {language === 'am' ? 'ቀን ቅድመ ክፍያ' : 'days advance'}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => toggleSave(v.id, e)}
                    className="absolute top-2 left-2 bg-white/90 backdrop-blur w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-slate-400 shadow-sm hover:text-brand transition-colors z-10"
                    title="Save vehicle"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-brand text-brand' : ''}`} />
                  </button>
                </div>

                <div className="p-2 flex flex-col gap-1 flex-1">
                  <h3 className="text-xs md:text-sm font-bold truncate text-gray-800">
                    {v.make} {v.model}
                  </h3>

                  <p className="text-[10px] text-gray-500 truncate">{v.year} • {v.usage_type || 'Personal Use'} • {formatTimeAgo(v.created_at)}</p>

                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                    <span className="self-end text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">
                      {v.poster_role === 'Broker' ? (t.brokerManaged || 'Broker Managed') : (t.privateOwner || 'Private Owner')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {premiumVehicles.length === 0 && (
            <div className="w-full py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No premium posts currently available.
            </div>
          )}
        </div>
      </div>

      {/* WEB HERO SECTION */}
      <div className="bg-white py-6">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-8 space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-content tracking-tight leading-[1.1] font-display">
            Find the right rental car in Addis Ababa
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Search across all verified fleet by keyword, location, and type
          </p>

          {/* INTEGRATED HERO SEARCH & FILTER CONTAINER */}
          <div className="pt-4 text-left">
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-3">
              <div className="flex flex-col gap-3">

                {/* Row 1: Search & Zone */}
                <div className="flex flex-col md:flex-row gap-3 w-full">
                  <div className="w-full md:flex-grow relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={handleSearchChange}
                      placeholder={t.searchPlaceholder || "Search brand, model, or keyword"}
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-brand rounded-md pl-10 pr-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <select
                      value={filters.zone}
                      onChange={handleZoneChange}
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-brand rounded-md px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="all">All Locations</option>
                      <option value="Bole">Bole</option>
                      <option value="Sarbet">Sarbet</option>
                      <option value="CMC">CMC</option>
                      <option value="Kazanchis">Kazanchis</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Price Filters & Sort */}
                <div className="flex flex-col md:flex-row gap-3 w-full">
                  <div className="w-full md:flex-1">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min Price (ETB)"
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-brand rounded-md px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div className="w-full md:flex-1">
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max Price (ETB)"
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-brand rounded-md px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div className="w-full md:flex-1">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-brand rounded-md px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="newest">Newest Added</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                  </div>
                  <div className="w-full md:w-32">
                    <button
                      onClick={() => { }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-md text-sm font-bold transition-all shadow-sm"
                    >
                      Search
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Main Post CTA */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate('/list-car')}
                className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-full text-sm font-extrabold shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
              >
                {t.postCar || 'የሚከራይ መኪና እዚህ ያስገቡ | List your rental car here'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VEHICLE FLEET SECTION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-2xl font-black tracking-tight text-content font-display">
            Available Fleet
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Recently added
          </span>
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-6 px-2 md:px-0">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm animate-pulse">
                <div className="w-full h-32 md:h-48 bg-slate-200" />
                <div className="p-2.5 space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  <div className="flex justify-between items-center pt-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredFleet.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center mx-auto max-w-md mt-10 shadow-sm">
              <h3 className="text-xl font-bold text-content mb-2">{t.noCars || "Can't find your Hule የመኪና ኪራይ?"}</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">
                Leave your phone number or Telegram handle, and our master brokers will source this exact car for you within hours.
              </p>

              {waitlistStatus === 'success' ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl font-bold border border-green-200 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  You are on the list! A Hule የመኪና ኪራይ broker will contact you shortly.
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Phone number or @telegram"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all text-center"
                    disabled={waitlistStatus === 'submitting'}
                  />
                  <button
                    type="submit"
                    disabled={waitlistStatus === 'submitting'}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {waitlistStatus === 'submitting' ? 'Submitting...' : 'Source My Car'}
                  </button>
                </form>
              )}

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-3">
                <button
                  onClick={resetFilters}
                  className="text-slate-500 font-semibold text-xs hover:text-slate-800 transition-colors"
                >
                  Clear search filters
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && filteredFleet.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-6 px-2 md:px-0 animate-fadeIn transition-opacity duration-300 opacity-100">
            {filteredFleet.map(v => {
              const isSaved = savedIds.has(v.id);
              const advanceValue = v.advanced_payment_days || v.advance_days;
              return (
                <div
                  key={v.id}
                  onClick={() => navigate(`/vehicle/${v.id}`)}
                  className="bg-white rounded-lg border border-gray-200 flex flex-col group cursor-pointer hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="relative w-full h-32 md:h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={v.image || v.image_url || (v.images && v.images[0]) || 'https://placehold.co/600x400?text=No+Image'}
                      alt={`${v.make} ${v.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {v.urgency_tag && (
                      <div className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-md absolute top-0 left-0 z-10">
                        {v.urgency_tag}
                      </div>
                    )}

                    {/* Verified Badge */}
                    <div className="absolute top-2 right-0 bg-cyan-500 text-white px-2 py-0.5 rounded-l-md text-[10px] font-bold shadow-sm z-10">
                      Verified
                    </div>

                    {/* Price & Advance Overlay */}
                    <div className="absolute bottom-0 left-0 flex items-center z-10">
                      <div className="bg-black/80 text-white text-xs md:text-sm font-bold px-2 py-1 rounded-tr-md">
                        {t.etb || 'ETB'} {v.dailyRate || v.daily_rate} / {t.day || 'day'}
                      </div>
                      {advanceValue && (
                        <div className="bg-amber-600 text-white text-[10px] md:text-xs font-semibold px-2 py-1 rounded-tr-md ml-0.5 shadow-sm">
                          {advanceValue} {language === 'am' ? 'ቀን ቅድመ ክፍያ' : 'days advance'}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => toggleSave(v.id, e)}
                      className="absolute top-2 left-2 bg-white/90 backdrop-blur w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-slate-400 shadow-sm hover:text-brand transition-colors z-10"
                      title="Save vehicle"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-brand text-brand' : ''}`} />
                    </button>
                  </div>

                  <div className="p-2 flex flex-col gap-1 flex-1">
                    <h3 className="text-xs md:text-sm font-bold truncate text-gray-800">
                      {v.make} {v.model}
                    </h3>

                    <p className="text-[10px] text-gray-500 truncate">{v.year} • {v.usage_type || 'Personal Use'} • {formatTimeAgo(v.created_at)}</p>

                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                      <span className="self-end text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">
                        {v.poster_role === 'Broker' ? (t.brokerManaged || 'Broker Managed') : (t.privateOwner || 'Private Owner')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};