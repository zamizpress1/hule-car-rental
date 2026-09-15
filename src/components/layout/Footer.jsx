import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CarFront, ShieldCheck, Phone, Send, MapPin, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useSettings } from '../../context/SettingsContext';

export const Footer = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setViewMode } = useApp();
  const { settings } = useSettings();

  const handleExploreClick = () => {
    setViewMode('explore');
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavedClick = () => {
    setViewMode('saved');
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-16 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-3.5">
            <Link to="/" onClick={handleExploreClick} className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-brand rounded-xl shadow-lg flex items-center justify-center text-white">
                <CarFront className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5 font-display">
                Hule የመኪና ኪራይ <ShieldCheck className="w-4 h-4 text-brand" />
              </span>
            </Link>

            {/* Trust Badge */}
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/90 text-emerald-400 border border-emerald-700/60 max-w-full break-words shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>መረጃዎ በድህረ ገፁ ባለቤቶች የተጠበቀ ነው 100% SAFE</span>
              </span>
            </div>

            {/* Official Amharic Business Bio */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm font-medium break-words">
              ማንኛውም አይነት መኪና ለመከራየት ወይም ለማከራየት ከፈለጉ ድህረ ገፃችንን ይጠቀሙ ለተጨማሪ መረጃ በዚ ስልክ ይደውሉ 🙏👇
            </p>

            {/* Prominent Orange Phone Number */}
            <div>
              <a
                href="tel:+251930175564"
                className="inline-flex items-center gap-2 text-lg sm:text-xl font-extrabold text-brand hover:text-brand-hover transition-colors tracking-wide"
              >
                <Phone className="w-5 h-5 text-brand shrink-0" />
                +251930175564
              </a>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Addis Ababa, ET
              </span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-100 font-display">Quick Links</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <button 
                  onClick={handleExploreClick} 
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-slate-300"
                >
                  Explore Fleet
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate('/post-car');
                  }} 
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-slate-300"
                >
                  List Your Car
                </button>
              </li>
              <li>
                <button 
                  onClick={handleSavedClick} 
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-slate-300"
                >
                  Saved Vehicles
                </button>
              </li>
              <li>
                <Link 
                  to="/profile" 
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-slate-300"
                >
                  User Account & Garage
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin" 
                  className="text-brand hover:text-brand-hover transition-colors font-semibold flex items-center gap-1.5"
                >
                  Broker Operations Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-100 font-display">Contact & Location</h4>
            <div className="space-y-3 text-xs font-medium text-slate-300">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-brand mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Broker Helpline</p>
                  <p className="font-bold text-white tracking-wide text-sm">{settings?.brokerPhone || '+251 911 234 567'}</p>
                  <p className="text-[11px] text-slate-400">Available 8:00 AM - 8:00 PM (EAT)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-sky-400 mt-0.5">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Telegram Channel & Broker</p>
                  <a 
                    href={`https://t.me/${(settings?.telegramHandle || '').replace('@', '')}`}
                    target="_blank" 
                    rel="noreferrer" 
                    className="font-bold text-sky-400 hover:underline inline-flex items-center gap-1"
                  >
                    {settings?.telegramHandle || '@HuleCars_Broker'} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Hule የመኪና ኪራይ. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-200 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-200 transition-colors cursor-pointer">Broker Agreement</span>
            <span className="hover:text-slate-200 transition-colors cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
