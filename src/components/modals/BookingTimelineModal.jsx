import React from 'react';
import { X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BookingTimelineModal = () => {
  const { modals, closeModal } = useApp();

  if (!modals.bookingTimeline) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 md:p-8 shadow-2xl relative scale-in text-center border border-slate-100">
        <button 
          onClick={() => closeModal('bookingTimeline')} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Check className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-content mb-1 font-display">Booking Request #FD-1042</h3>
        <p className="text-xs text-muted mb-6">Status: Sent to Hule የመኪና ኪራይ Broker Network</p>
        
        <div className="text-left space-y-4 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div className="timeline-node pl-8 pb-4">
            <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">1</div>
            <p className="font-bold text-xs text-content">Request Submitted</p>
            <p className="text-[10px] text-slate-400">Aug 24, 2026 - 18:05 EAT</p>
          </div>
          <div className="timeline-node pl-8 pb-4">
            <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shadow-xs">2</div>
            <p className="font-bold text-xs text-content">Broker Verification & Vehicle Check</p>
            <p className="text-[10px] text-slate-400">In Progress with Local Hule የመኪና ኪራይ Broker</p>
          </div>
          <div className="timeline-node pl-8">
            <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">3</div>
            <p className="font-bold text-xs text-slate-400">Vehicle Handover & Agreement</p>
            <p className="text-[10px] text-slate-400">Pending broker confirmation</p>
          </div>
        </div>
        
        <button 
          onClick={() => closeModal('bookingTimeline')} 
          className="w-full bg-slate-900 text-white py-3.5 rounded-full font-bold text-xs hover:bg-brand transition-colors shadow-sm"
        >
          Close Dialog
        </button>
      </div>
    </div>
  );
};
