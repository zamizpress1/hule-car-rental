import React from 'react';
import { X, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationsModal = () => {
  const { modals, closeModal } = useApp();

  if (!modals.notif) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 md:p-8 shadow-2xl relative scale-in border border-slate-100">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-content flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand" /> Notifications
          </h3>
          <button 
            onClick={() => closeModal('notif')} 
            className="text-muted hover:text-content bg-background w-7 h-7 rounded-full flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-2 text-xs font-medium">
          <div className="p-3 bg-brand/5 rounded-2xl border border-brand/10">
            <p className="font-bold text-brand">Booking Confirmed</p>
            <p className="text-content mt-0.5">Toyota Vitz #FD-1042 matched successfully.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="font-bold text-content">Welcome to Hule የመኪና ኪራይ</p>
            <p className="text-muted mt-0.5">Explore verified managed vehicle rentals in Addis Ababa.</p>
          </div>
        </div>
        <button 
          onClick={() => closeModal('notif')} 
          className="w-full bg-background text-content py-3 rounded-full font-bold text-xs mt-4 hover:bg-slate-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
