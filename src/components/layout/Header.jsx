import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CarFront, ShieldCheck, PlusCircle, Bell, Heart, User, UserCheck, Car, Briefcase, LogOut, Globe, Menu, X, Compass, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { savedIds, openModal, setViewMode } = useApp();
  const { user, signOut, isAdmin } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (mobileRef.current && !mobileRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSavedClick = () => {
    setViewMode('saved');
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleMarketplaceClick = () => {
    setViewMode('explore');
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleListCarClick = () => {
    setMobileMenuOpen(false);
    if (!user) {
      openModal('auth');
    } else {
      navigate('/list-car');
    }
  };

  const getButtonLabel = () => {
    if (!user) return t.signIn || 'Sign In';
    const name = user.name || user.email;
    if (!name) return 'User';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return parts[0];
  };

  return (
    <header className="sticky top-0 z-50 bg-brand text-white shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between py-2 md:py-4 relative">
          
          {/* Left: Hamburger Toggle */}
          <div className="flex-1 flex justify-start">
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-black/10 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Center: Brand Logo & Name */}
          <div className="flex-1 flex justify-center">
            <Link to="/" onClick={handleMarketplaceClick} className="flex items-center gap-2 group cursor-pointer">
              <div className="w-9 h-9 bg-white text-brand rounded-xl shadow-sm flex items-center justify-center transition-colors">
                <CarFront className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5 font-display leading-none">
                  Hule የመኪና ኪራይ <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                </h1>
              </div>
            </Link>
          </div>

          {/* Right: User Profile */}
          <div className="flex-1 flex justify-end gap-2 items-center">
            {user && (
              <button
                onClick={() => navigate('/my-garage')}
                className="hidden md:flex items-center gap-1.5 bg-black/10 hover:bg-black/20 text-white px-4 py-2 rounded-full text-xs font-bold transition-colors border border-white/10"
              >
                <Car className="w-4 h-4" /> {t.myGarage || 'My Garage'}
              </button>
            )}
            <button 
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all active:scale-95"
            >
              {language === 'am' ? 'EN' : 'አማ'}
            </button>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)} 
                className="h-10 px-3 bg-black/10 hover:bg-black/20 rounded-full flex items-center gap-2 text-white transition-colors border border-white/10"
              >
                <User className="w-6 h-6 text-white" />
                <span className="text-xs font-bold hidden sm:inline">
                  {getButtonLabel()}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute top-11 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 scale-in">
                  {!user ? (
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">{t.welcome || 'Welcome to Hule የመኪና ኪራይ'}</p>
                      <button 
                        onClick={() => { setUserMenuOpen(false); openModal('auth'); }} 
                        className="mt-2 text-xs font-bold bg-brand hover:bg-brand-hover text-white w-full py-2 rounded-xl shadow-sm transition-colors"
                      >
                        {t.signIn || 'Sign In / Register'}
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-content">{user.name || user.email}</p>
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {t.verifiedAccount || 'Verified Renter'}
                      </p>
                    </div>
                  )}

                  <div className="py-1">
                    <button 
                      onClick={() => { setUserMenuOpen(false); navigate('/profile'); }} 
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <UserCheck className="w-4 h-4 text-slate-400" /> {t.profile || 'User Account'}
                    </button>
                    <button 
                      onClick={() => { setUserMenuOpen(false); navigate('/my-garage'); }} 
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Car className="w-4 h-4 text-slate-400" /> {t.myGarage || 'My Garage'}
                    </button>
                    <button 
                      onClick={() => { setUserMenuOpen(false); handleSavedClick(); }} 
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between text-slate-700"
                    >
                      <span className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-slate-400" /> {t.savedVehicles || 'Saved Vehicles'}
                      </span>
                      {savedIds.size > 0 && (
                        <span className="bg-brand/10 text-brand text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {savedIds.size}
                        </span>
                      )}
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => { setUserMenuOpen(false); navigate('/admin'); }} 
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 text-brand font-bold"
                      >
                        <Briefcase className="w-4 h-4" /> {t.admin || 'Broker Console'}
                      </button>
                    )}
                  </div>

                  {user && (
                    <div className="py-1 border-t border-slate-100">
                      <button 
                        onClick={() => { setUserMenuOpen(false); signOut(); }} 
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 text-rose-600"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" /> {t.signOut || 'Sign Out'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown (lg:hidden) */}
      {mobileMenuOpen && (
        <div ref={mobileRef} className="lg:hidden border-t border-slate-200/80 bg-white px-4 py-4 space-y-3 shadow-lg fade-in">
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={handleMarketplaceClick}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                location.pathname === '/' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4 text-brand" />
              {t.marketplace || 'Explore Fleet'}
            </button>

            <button
              onClick={handleListCarClick}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                location.pathname === '/list-car' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-brand" />
              {t.listCar || 'List Your Car'}
            </button>

            <button
              onClick={handleSavedClick}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between"
            >
              <span className="flex items-center gap-2.5">
                <Heart className={`w-4 h-4 ${savedIds.size > 0 ? 'text-brand fill-brand' : 'text-slate-400'}`} />
                {t.saved || 'Saved Vehicles'}
              </span>
              <span className="bg-brand/10 text-brand text-xs font-bold px-2 py-0.5 rounded-full">
                {savedIds.size}
              </span>
            </button>
          </div>

          {/* Added Mobile Actions */}
          <div className="grid grid-cols-1 gap-1 pt-2 border-t border-slate-100">
            <button 
              onClick={() => { setMobileMenuOpen(false); toggleLanguage(); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 text-slate-700 hover:bg-slate-100"
            >
              <Globe className="w-4 h-4 text-brand" />
              {language === 'en' ? 'Switch to አማርኛ' : 'Switch to English'}
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); openModal('notif'); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 text-slate-700 hover:bg-slate-100"
            >
              <Bell className="w-4 h-4 text-brand" />
              Notifications
            </button>
            {user && (
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/my-garage'); }} 
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 mt-1 hover:bg-slate-200"
              >
                <Car className="w-4 h-4 stroke-[3]" />
                {t.myGarage || 'My Garage'}
              </button>
            )}
            <button 
              onClick={handleListCarClick} 
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 bg-brand text-white mt-1"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {t.postCar || 'Post Car'}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }}
              className="text-xs font-bold text-slate-600 hover:text-content"
            >
              {t.profile || 'User Account'}
            </button>
            {isAdmin && (
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }}
                className="text-xs font-extrabold text-brand hover:underline"
              >
                {t.admin || 'Broker Console'}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
