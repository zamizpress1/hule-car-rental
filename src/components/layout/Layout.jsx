import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AuthModal } from '../modals/AuthModal';
import { SmartMatchModal } from '../modals/SmartMatchModal';
import { NotificationsModal } from '../modals/NotificationsModal';
import { BookingSummaryModal } from '../modals/BookingSummaryModal';
import { BookingTimelineModal } from '../modals/BookingTimelineModal';
import { CommandModal } from '../modals/CommandModal';
import { Toast } from '../ui/Toast';
import { Chatbot } from '../Chatbot';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  const { user } = useAuth();
  const { openModal } = useApp();

  return (
    <div className="min-h-screen bg-background text-content flex flex-col font-sans">
      {/* Sticky Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6">
        <Outlet />
      </main>

      {/* Traditional Web Footer */}
      <Footer />

      {/* Global Modals */}
      <AuthModal />
      <SmartMatchModal />
      <NotificationsModal />
      <BookingSummaryModal />
      <BookingTimelineModal />
      <CommandModal />

      {/* Floating Toast Notification */}
      <Toast />

      {/* Floating Chatbot Widget */}
      <Chatbot />

      {/* Floating Post Car Button */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate('/post-car');
        }}
        className="fixed bottom-6 right-24 sm:right-24 z-50 bg-orange-600 text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-full font-bold shadow-xl hover:bg-orange-700 hover:shadow-2xl transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95 text-xs sm:text-sm border border-white/20"
      >
        <PlusCircle className="w-4 h-4 stroke-[2.5]" />
        <span>+ Post car</span>
      </button>
    </div>
  );
};

