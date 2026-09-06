import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, Building2, User, Car } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CommandModal = () => {
  const { modals, closeModal, selectedBookingForCommand, updateBookingStatus, formatETB } = useApp();
  const [updating, setUpdating] = useState(false);
  const [targetStatus, setTargetStatus] = useState('vehicle_matched');

  const b = selectedBookingForCommand;

  useEffect(() => {
    if (b) {
      const current = (b.stage || b.status || '').toLowerCase();
      if (current === 'new_request' || current === 'new') {
        setTargetStatus('vehicle_matched');
      } else {
        setTargetStatus('new_request');
      }
    }
  }, [b]);

  if (!modals.command || !b) return null;

  const currentStage = (b.stage || b.status || 'new_request').toLowerCase();

  const handleUpdateStatus = async () => {
    setUpdating(true);
    await updateBookingStatus(b.id, targetStatus);
    setUpdating(false);
    closeModal('command');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 md:p-8 shadow-2xl relative scale-in border border-slate-100 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand block">Broker Command Center</span>
            <h3 className="font-extrabold text-lg text-content font-display">{b.ref}</h3>
          </div>
          <button 
            onClick={() => closeModal('command')} 
            className="text-slate-400 hover:text-content bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Booking Summary Card */}
        <div className="space-y-3 text-xs font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <p className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Renter:</span> 
            <span className="font-bold text-content">{b.renter}</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Vehicle:</span> 
            <span className="font-bold text-content">{b.car}</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Supplier:</span> 
            <span className="font-bold text-content">{b.lister}</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="text-slate-500">Current Status:</span> 
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${currentStage === 'vehicle_matched' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
              {currentStage === 'vehicle_matched' ? 'Vehicle Matched' : 'New Request'}
            </span>
          </p>
          <p className="flex justify-between items-center border-t border-slate-200 pt-2.5 mt-2">
            <span className="text-slate-500 font-bold">Gross Total:</span> 
            <span className="font-black text-brand text-sm">{formatETB(b.val)}</span>
          </p>
        </div>

        {/* Real-time Status Transition Control */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-content block">Select Target Stage:</label>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTargetStatus('new_request')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex flex-col justify-between h-20 ${targetStatus === 'new_request' ? 'border-brand bg-brand/5 text-brand shadow-xs' : 'border-slate-200 bg-white text-content hover:bg-slate-50'}`}
            >
              <span className="text-[10px] text-slate-400 font-normal uppercase">Stage 1</span>
              <span>New Request</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetStatus('vehicle_matched')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex flex-col justify-between h-20 ${targetStatus === 'vehicle_matched' ? 'border-brand bg-brand/5 text-brand shadow-xs' : 'border-slate-200 bg-white text-content hover:bg-slate-50'}`}
            >
              <span className="text-[10px] text-slate-400 font-normal uppercase">Stage 2</span>
              <span>Vehicle Matched</span>
            </button>
          </div>

          <button 
            onClick={handleUpdateStatus} 
            disabled={updating}
            className="w-full bg-slate-900 hover:bg-brand text-white py-3.5 rounded-full font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Status...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Update Booking Status</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
