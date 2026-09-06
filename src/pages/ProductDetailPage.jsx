import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Heart, ShieldCheck, MapPin, Sliders, FileText, Building2, Lock, Loader2, Phone, CheckCircle, MessageSquare } from 'lucide-react';
import { useApp, normalizeVehicle } from '../context/AppContext';
import { sanitizeDescription } from '../utils/textFilters';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, savedIds, toggleSave, openModal, formatETB, showToast } = useApp();
  const { language, t } = useLanguage();
  const { settings } = useSettings();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultEndStr = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [calculatedDays, setCalculatedDays] = useState(3);
  const [totalSum, setTotalSum] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadVehicle = async () => {
      setLoading(true);

      // Check active context state first
      const existing = vehicles.find(v => String(v.id) === String(id) && v.status === 'active');
      if (existing) {
        if (isMounted) {
          setVehicle(existing);
          setLoading(false);
        }
        return;
      }

      // Query Supabase for active vehicle
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.warn('Supabase fetch vehicle details notice:', error.message);
        }

        if (data && isMounted) {
          setVehicle(normalizeVehicle(data));
        } else if (isMounted) {
          const fallback = vehicles.find(v => String(v.id) === String(id)) || vehicles[0];
          setVehicle(fallback);
        }
      } catch (err) {
        console.error('Error fetching vehicle from Supabase:', err);
        if (isMounted) {
          const fallback = vehicles.find(v => String(v.id) === String(id)) || vehicles[0];
          setVehicle(fallback);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadVehicle();

    return () => {
      isMounted = false;
    };
  }, [id, vehicles]);

  useEffect(() => {
    if (vehicle) {
      const dailyRate = Number(vehicle.dailyRate || vehicle.daily_rate || 0);
      const s = new Date(startDate);
      const e = new Date(endDate);
      
      let days = 1;
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const diffMs = e.getTime() - s.getTime();
        days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }
      
      setCalculatedDays(days);
      setTotalSum(days * dailyRate);
    }
  }, [startDate, endDate, vehicle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-content">
        <Loader2 className="w-8 h-8 animate-spin text-brand mr-2" />
        <span className="text-sm font-bold">Loading vehicle details...</span>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-border shadow-sm max-w-xl mx-auto my-8 p-6">
        <p className="text-base font-bold text-content mb-2">{t('noVehicles')}</p>
        <p className="text-xs text-muted mb-4">{t('noVehiclesSub')}</p>
        <button onClick={() => navigate('/')} className="bg-brand text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-floating">
          {t('backToFleet')}
        </button>
      </div>
    );
  }

  const isSaved = savedIds.has(vehicle.id);

  const handleShare = () => {
    showToast(`Shared ${vehicle.make} ${vehicle.model} to Telegram`);
  };

  const handleRequestBooking = () => {
    openModal('bookingSummary', {
      vehicleId: vehicle.id,
      title: `${vehicle.make} ${vehicle.model}`,
      dailyRate: vehicle.dailyRate,
      days: calculatedDays,
      total: totalSum
    });
  };

  const BROKER_PHONE = settings?.brokerPhone || '+251900000000';
  const BROKER_TELEGRAM = settings?.telegramHandle?.replace('@', '') || 'fetandrive_admin';
  const leadMessage = encodeURIComponent(`Hi Hule የመኪና ኪራይ! I am interested in renting the ${vehicle.make} ${vehicle.model} listed for ${vehicle.dailyRate || vehicle.daily_rate} ETB/day.`);

  return (
    <section className="space-y-6 max-w-4xl mx-auto fade-in">
      {/* Top Action Navigation Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="bg-white px-4 py-2 rounded-full shadow-sm text-xs font-bold text-content hover:bg-slate-100 flex items-center gap-2 border border-border transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t('backToFleet')}
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-telegram border border-border hover:bg-slate-100 transition-colors"
            title="Share via Telegram"
          >
            <Send className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => toggleSave(vehicle.id, e)} 
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-content border border-border hover:bg-slate-100 transition-colors"
            title="Save Vehicle"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-brand text-brand' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Image Gallery */}
      <div className="bg-white rounded-3xl p-3 shadow-sm border border-border space-y-3">
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-background">
          <img 
            src={vehicle.images?.[activeImageIndex] || vehicle.image} 
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover transition-opacity duration-300" 
          />
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-content shadow-sm flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-success" /> {t('verifiedVehicle')}
          </div>
        </div>
        
        {/* Thumbnails */}
        {vehicle.images && vehicle.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {vehicle.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-brand opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-2.5 py-1 rounded-md mb-2 inline-block">
            {vehicle.category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
            {vehicle.make} {vehicle.model} ({vehicle.year})
          </h1>
          <p className="text-xs font-semibold text-muted flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" /> {vehicle.zone}
          </p>
        </div>
        <div className="sm:text-right">
          <div>
            <span className="text-3xl font-black text-brand tracking-tight">
              {formatETB(vehicle.dailyRate)}
            </span>
            <span className="text-xs font-bold text-muted"> {t('perDay')}</span>
          </div>
          {vehicle.advance_payment && (
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">
              {language === 'am' ? 'ቅድመ ክፍያ' : 'Advance'}:{' '}
              <span className="text-gray-800 font-semibold">
                {vehicle.advance_payment}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Broker Verified Checklist (New) */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 shadow-sm">
        <h3 className="text-base font-bold text-green-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-600" /> Broker Verified Checklist
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> Engine & Transmission Inspected
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> AC & Cooling System Verified
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> Interior Deep Cleaned
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> Tires & Brakes Checked
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-green-800 sm:col-span-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> Direct Broker Support
          </div>
        </div>
      </div>

      {/* Triple-Action Booking Panel: Secure This Vehicle */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-border space-y-4">
        <h3 className="text-xl font-black text-content text-center">Secure This Vehicle</h3>
        <div className="flex flex-col gap-3">
          <a 
            href={`tel:${BROKER_PHONE}`}
            className="flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white py-4 text-lg font-bold rounded-xl shadow-md transition-colors w-full"
          >
            <Phone className="w-6 h-6" /> Call Master Broker
          </a>
          <a 
            href={`sms:${BROKER_PHONE}?body=${leadMessage}`}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 text-lg font-bold rounded-xl shadow-md transition-colors w-full"
          >
            <MessageSquare className="w-6 h-6" /> Send SMS
          </a>
          <a 
            href={`https://t.me/${BROKER_TELEGRAM}?text=${leadMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white py-4 text-lg font-bold rounded-xl shadow-md transition-colors w-full"
          >
            <Send className="w-6 h-6" /> Telegram
          </a>
        </div>
      </div>

      {/* 12-POINT SPECIFICATIONS GRID */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-border space-y-4">
        <h3 className="text-lg font-bold text-content flex items-center gap-2">
          <Sliders className="w-5 h-5 text-brand" /> {t('fullSpecs')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div className="spec-item"><p>{t('make')}</p><p>{vehicle.make || 'Toyota'}</p></div>
          <div className="spec-item"><p>{t('model')}</p><p>{vehicle.model || 'Vitz'}</p></div>
          <div className="spec-item"><p>{t('year')}</p><p>{vehicle.year || 2022}</p></div>
          <div className="spec-item"><p>{t('fuel')}</p><p>{vehicle.fuel || 'Petrol'}</p></div>
          <div className="spec-item"><p>{t('transmission')}</p><p>{vehicle.transmission || 'Automatic'}</p></div>
          <div className="spec-item"><p>Body Type</p><p>{vehicle.body || 'Hatchback'}</p></div>
          <div className="spec-item"><p>{t('color')}</p><p>{vehicle.color || 'Silver'}</p></div>
          <div className="spec-item"><p>{t('engineCC')}</p><p>{vehicle.cc || '1.3L'}</p></div>
          <div className="spec-item"><p>{t('mileage')}</p><p>{vehicle.mileage || '45,000 km'}</p></div>
          <div className="spec-item"><p>{t('condition')}</p><p>{vehicle.condition || 'Used in Ethiopia'}</p></div>
          <div className="spec-item"><p>{t('seats')}</p><p>{vehicle.seats || 5}</p></div>
          <div className="spec-item"><p>{t('driverMode')}</p><p>{vehicle.driverMode || 'Self-Drive'}</p></div>
        </div>
      </div>

      {/* DESCRIPTION SECTION */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-border space-y-3">
        <h3 className="text-lg font-bold text-content flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand" /> {t('descriptionTitle')}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          {sanitizeDescription(vehicle.description)}
        </p>
      </div>

      {/* Broker Protection & Supplier Card */}
      <div className="bg-brand/5 border border-brand/20 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-content">{vehicle.supplier?.name || 'Hule የመኪና ኪራይ Partner'}</p>
            <p className="text-xs text-muted font-semibold">Hule የመኪና ኪራይ Verified Partner</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 font-medium pt-2 border-t border-brand/10 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-brand shrink-0" /> 
          {t('brokerProtection')}
        </p>
      </div>

    </section>
  );
};
