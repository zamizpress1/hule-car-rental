import React, { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SmartMatchModal = () => {
  const { modals, closeModal, showToast } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [criteria, setCriteria] = useState('');

  if (!modals.smartMatch) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!criteria.trim()) {
      showToast('Please enter your vehicle requirements');
      return;
    }
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setCriteria('');
    closeModal('smartMatch');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 md:p-8 shadow-2xl relative scale-in border border-slate-100">
        <button 
          onClick={handleClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-content font-display">Smart Vehicle Match</h3>
              <p className="text-xs text-muted mt-1">Tell us your criteria and our local broker network will source matching vehicles across Addis Ababa within hours.</p>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1.5">Vehicle Requirements & Location</label>
              <textarea 
                rows={3}
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="e.g. Need a clean SUV for 5 days in Bole starting tomorrow under 8,000 ETB/day..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold text-content focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all resize-none"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-brand hover:bg-brand-hover text-white py-3.5 rounded-full font-bold text-xs shadow-md transition-all"
            >
              Dispatch Smart Match Request
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-extrabold text-lg text-content font-display">Request Dispatched to Brokers</h4>
              <p className="text-xs text-muted max-w-xs mx-auto mt-1">Our Addis Ababa broker network is reviewing your criteria and will contact you shortly.</p>
            </div>
            <button 
              onClick={handleClose} 
              className="w-full bg-slate-900 text-white py-3.5 rounded-full font-bold text-xs hover:bg-brand transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
