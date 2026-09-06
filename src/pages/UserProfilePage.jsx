import React, { useState, useEffect } from 'react';
import { CheckCircle, Calendar, Car, Clock, ShieldCheck, Info, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export const UserProfilePage = () => {
  const { user, savedIds, myGarage, openModal, formatETB, bookings } = useApp();
  const { t } = useLanguage();

  const [activeRentalsCount, setActiveRentalsCount] = useState(0);

  useEffect(() => {
    // Attempt to calculate real active rentals count from context bookings first
    // assuming normalizeBooking includes renter name which we can match
    if (user.name) {
      const active = bookings.filter(b => 
        b.renter === user.name && 
        ['new_request', 'vehicle_matched', 'in_progress'].includes((b.stage || '').toLowerCase())
      ).length;
      if (active > 0) {
        setActiveRentalsCount(active);
        return;
      }
    }

    // Fallback: Query Supabase directly
    const fetchActiveRentals = async () => {
      if (!user.id) return;
      try {
        const { count, error } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['new_request', 'vehicle_matched', 'in_progress']);
        
        if (!error && count !== null) {
          setActiveRentalsCount(count);
        }
      } catch (err) {
        console.error('Error fetching active rentals:', err);
      }
    };
    fetchActiveRentals();
  }, [user.id, user.name, bookings]);

  return (
    <section className="space-y-6 max-w-4xl mx-auto fade-in">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="w-20 h-20 rounded-full bg-brand/10 text-brand flex items-center justify-center font-extrabold text-2xl border-2 border-brand/20">
          {(user.name || user.phone || 'User').slice(0, 2).toUpperCase()}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-content">{user.name || user.phone || 'Bekele Tadesse'}</h2>
          <p className="text-xs font-bold text-success flex items-center justify-center sm:justify-start gap-1">
            <CheckCircle className="w-4 h-4" /> {t('verifiedAccount')}
          </p>
          <p className="text-xs text-muted">Bole, Addis Ababa · Member since 2025</p>
        </div>
      </div>

      {/* Profile Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-soft border border-slate-100 text-center">
          <p className="text-[10px] uppercase font-bold text-muted">Active Rentals</p>
          <p className="text-xl font-black text-brand mt-1">{activeRentalsCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-soft border border-slate-100 text-center">
          <p className="text-[10px] uppercase font-bold text-muted">Listed Fleet</p>
          <p className="text-xl font-black text-content mt-1">{myGarage.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-soft border border-slate-100 text-center">
          <p className="text-[10px] uppercase font-bold text-muted">Saved Cars</p>
          <p className="text-xl font-black text-content mt-1">{savedIds.size}</p>
        </div>
      </div>

      {/* Owner's Garage List with 'Under Review / በማረጋገጥ ላይ' Badges */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-content flex items-center gap-2">
            <Car className="w-5 h-5 text-brand" /> {t('myGarage')}
          </h3>
          <span className="text-xs font-bold text-muted bg-background px-3 py-1 rounded-full border border-slate-100">
            {myGarage.length} {t('vehiclesCount')}
          </span>
        </div>

        {myGarage.length === 0 ? (
          <div className="text-center py-8 bg-background rounded-2xl border border-slate-100 text-muted text-xs font-medium space-y-1">
            <p className="font-bold text-content text-sm">No vehicles listed in your garage yet.</p>
            <p>List your car to start earning with Hule የመኪና ኪራይ broker network.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myGarage.map((g, idx) => {
              const isPending = g.status === 'pending_review';
              return (
                <div key={g.id || idx} className="bg-background p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-content text-base">{g.make} {g.model} <span className="text-xs text-muted font-normal">({g.year})</span></h4>
                      <p className="text-xs text-muted font-semibold mt-0.5">{g.zone} • {formatETB(g.dailyRate)} / day</p>
                    </div>
                    {g.status === 'active' && (
                      <span className="bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <ShieldCheck className="w-3 h-3" /> Live on Marketplace
                      </span>
                    )}
                    {g.status === 'pending_review' && (
                      <span className="bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" /> Under Review / በማረጋገጥ ላይ
                      </span>
                    )}
                    {(g.status === 'delisted' || g.status === 'rejected') && (
                      <span className="bg-rose-500/10 text-rose-700 border border-rose-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <XCircle className="w-3 h-3" /> Delisted
                      </span>
                    )}
                  </div>

                  {g.status === 'pending_review' && (
                    <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 text-[11px] text-amber-900 font-medium flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{t('verifyingNotice')}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-600 font-semibold flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span>Driver: {g.driverMode || 'Self-Drive'}</span>
                    {g.deposit_amount > 0 && <span>Deposit: {formatETB(g.deposit_amount)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Bookings Status */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 space-y-4">
        <h3 className="font-bold text-lg text-content flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand" /> Active Booking Status
        </h3>
        <div className="p-4 bg-background rounded-2xl border border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold text-brand">#FD-1042</span>
            <span className="text-[10px] bg-success/10 text-success font-bold px-2 py-0.5 rounded">
              Active Rental
            </span>
          </div>
          <p className="font-bold text-sm text-content">Toyota Vitz (2022)</p>
          <p className="text-xs text-muted font-medium">Dates: Aug 22 → Aug 26 · Total: 14,000 ETB</p>
          <button 
            onClick={() => openModal('bookingTimeline')} 
            className="w-full bg-white text-content py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            View Live Timeline
          </button>
        </div>
      </div>
    </section>
  );
};
