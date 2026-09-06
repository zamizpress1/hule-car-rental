import React from 'react';
import { X, Calendar, ShieldCheck, Car } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BookingSummaryModal = () => {
  const { modals, closeModal, openModal, bookingDraft, formatETB } = useApp();

  if (!modals.bookingSummary || !bookingDraft) return null;

  const handleConfirm = () => {
    closeModal('bookingSummary');
    openModal('bookingTimeline');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 md:p-8 shadow-2xl relative scale-in border border-slate-100">
        <button 
          onClick={() => closeModal('bookingSummary')} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-content font-display leading-tight">Confirm Rental Request</h3>
            <p className="text-xs text-muted">Review booking breakdown before broker dispatch</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 space-y-3 text-xs font-semibold mb-6 border border-slate-200/80">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500">Vehicle</span>
            <span className="font-extrabold text-content text-sm">{bookingDraft.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Daily Rate</span>
            <span className="text-content font-bold">{formatETB(bookingDraft.dailyRate)} / day</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Rental Duration</span>
            <span className="text-content font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {bookingDraft.days} Days
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-3 text-brand font-black text-base">
            <span>Estimated Total</span>
            <span className="text-xl">{formatETB(bookingDraft.total)}</span>
          </div>
        </div>

        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 mb-6 border border-emerald-200/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>No instant payment required. Hule የመኪና ኪራይ broker will confirm car availability first.</span>
        </div>

        <button 
          onClick={handleConfirm} 
          className="w-full bg-brand hover:bg-brand-hover text-white py-3.5 rounded-full font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          Confirm & Submit Request
        </button>
      </div>
    </div>
  );
};
