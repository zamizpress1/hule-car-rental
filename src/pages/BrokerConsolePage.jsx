import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CarFront, 
  CalendarCheck, 
  Users, 
  Settings, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  DollarSign, 
  Save, 
  Clock, 
  RefreshCw, 
  Phone, 
  Send,
  PlusCircle,
  Star,
  FileCheck,
  ShieldAlert,
  CheckCircle,
  UserCheck,
  Trash2,
  MessageCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import { AdminPostModal } from '../components/modals/AdminPostModal';

export const BrokerConsolePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const { 
    vehicles = [], 
    pendingVehicles = [], 
    bookings = [], 
    usersList = [], 
    setVehicles,
    approveVehicle, 
    rejectVehicle, 
    toggleUserVerification, 
    openModal, 
    formatETB,
    refetchVehicles,
    refetchPendingVehicles,
    refetchBookings,
    refetchUsers,
    showToast
  } = useApp();

  const { settings, updateSettings } = useSettings();

  const { t } = useLanguage();

  // Support /admin?tab=approvals parameter
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTabState] = useState(initialTab === 'moderation' ? 'approvals' : initialTab);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId });
  };

  const [realUsers, setRealUsers] = useState([]);

  useEffect(() => {
    const fetchRealUsers = async () => {
      if (activeTab === 'users') {
        const { data, error } = await supabase.from('profiles').select('*');
        if (data && !error) {
          setRealUsers(data);
        }
      }
    };
    fetchRealUsers();
  }, [activeTab]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'approvals' || tabParam === 'moderation') {
      setActiveTabState('approvals');
    } else if (tabParam) {
      setActiveTabState(tabParam);
    }
  }, [searchParams]);

  const [settingsForm, setSettingsForm] = useState({
    commissionPercentage: settings?.commissionPercentage || 10,
    brokerPhone: settings?.brokerPhone || '+251 911 000 000',
    telegramHandle: settings?.telegramHandle || '@fetandrive_admin',
    moderationMode: settings?.moderationMode || 'manual'
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        commissionPercentage: settings.commissionPercentage || 10,
        brokerPhone: settings.brokerPhone || '+251 911 000 000',
        telegramHandle: settings.telegramHandle || '@fetandrive_admin',
        moderationMode: settings.moderationMode || 'manual'
      });
      setIsLoading(false);
    }
  }, [settings]);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    const result = await updateSettings(settingsForm);
    if (result?.success) {
      if (showToast) showToast('Settings saved successfully!', 'success');
    } else if (result?.error) {
      if (showToast) showToast(`Failed to save settings: ${result.error}`, 'error');
    }
  };

  // Live Supabase calculations
  const activeFleetCount = vehicles?.length || 0;
  const pendingCount = pendingVehicles?.length || 0;
  const activeRentalsCount = bookings?.filter(b => ['new_request', 'vehicle_matched', 'in_progress'].includes((b?.stage || b?.status || '').toLowerCase())).length || 0;
  const totalGrossValue = bookings?.reduce((sum, b) => sum + Number(b?.val || 0), 0) || 0;
  const estimatedRevenue = (totalGrossValue * (settingsForm.commissionPercentage || 10)) / 100;

  const tabs = [
    { id: 'overview', label: t('overviewMetrics'), icon: LayoutDashboard },
    { id: 'approvals', label: `${t('carApprovals')} [${pendingCount}]`, icon: ShieldAlert, badge: pendingCount },
    { id: 'active_fleet', label: 'Active Fleet', icon: CarFront },
    { id: 'pipeline', label: t('bookingsPipeline'), icon: CalendarCheck },
    { id: 'users', label: t('suppliersUsers'), icon: Users },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const kanbanColumns = [
    { id: 'new_request', label: 'New Requests', color: 'bg-amber-500' },
    { id: 'vehicle_matched', label: 'Vehicle Matched', color: 'bg-blue-500' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-indigo-500' },
    { id: 'completed', label: 'Completed', color: 'bg-emerald-500' }
  ];

  useEffect(() => {
    // Safe state access inside the realtime subscription
    const channel = supabase
      .channel('vehicles_realtime_dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicles' }, (payload) => {
        if (typeof setVehicles === 'function') {
          setVehicles(prev => {
            const currentPrev = Array.isArray(prev) ? prev : [];
            const exists = currentPrev.find(v => String(v.id) === String(payload.new.id));
            if (exists) return currentPrev;
            return [payload.new, ...currentPrev];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setVehicles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-background">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-brand animate-spin mx-auto" />
          <p className="text-sm font-bold text-muted">Loading Admin Console Data...</p>
        </div>
      </div>
    );
  }

  const togglePremiumStatus = async (vehicleId, currentPremium) => {
    setVehicles(prev => prev.map(v => String(v.id) === String(vehicleId) ? { ...v, is_premium: !currentPremium } : v));
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_premium: !currentPremium })
        .eq('id', vehicleId);
      if (error) {
        console.error('Error updating premium status', error);
        setVehicles(prev => prev.map(v => String(v.id) === String(vehicleId) ? { ...v, is_premium: currentPremium } : v));
      }
    } catch (err) {
      console.error(err);
      setVehicles(prev => prev.map(v => String(v.id) === String(vehicleId) ? { ...v, is_premium: currentPremium } : v));
    }
  };

  const updateUrgencyTag = async (vehicleId, tag) => {
    const newTag = tag === 'None' ? null : tag;
    const oldTag = vehicles.find(v => String(v.id) === String(vehicleId))?.urgency_tag;
    setVehicles(prev => prev.map(v => String(v.id) === String(vehicleId) ? { ...v, urgency_tag: newTag } : v));
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ urgency_tag: newTag })
        .eq('id', vehicleId);
      if (error) {
        console.error('Error updating urgency tag', error);
        setVehicles(prev => prev.map(v => String(v.id) === String(vehicleId) ? { ...v, urgency_tag: oldTag } : v));
      }
    } catch (err) {
      console.error(err);
      setVehicles(prev => prev.map(v => String(v.id) === String(vehicleId) ? { ...v, urgency_tag: oldTag } : v));
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    
    // Optimistic remove
    setVehicles(prev => prev.filter(v => String(v.id) !== String(vehicleId)));
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
      if (error) {
        console.error('Error deleting vehicle', error);
        refetchVehicles();
      }
    } catch (err) {
      console.error(err);
      refetchVehicles();
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hrs ago";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + " mins ago";
    return "just now";
  };

  const recentlyAdded24hCount = vehicles?.filter(v => {
    return (new Date() - new Date(v.created_at)) < 24 * 60 * 60 * 1000;
  }).length || 0;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] -mx-4 sm:-mx-6 lg:-mx-8 -my-4 bg-background">
      
      {/* Fixed Left Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-border shrink-0 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Brand & Broker Status */}
          <div className="p-3 bg-background rounded-2xl border border-border space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand text-white rounded-lg flex items-center justify-center font-bold">
                <CarFront className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-content">{t('adminTitle')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-success pt-1">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Master Broker Online
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="space-y-1">
            {tabs.map(tabItem => {
              const Icon = tabItem.icon;
              const isActive = activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => setActiveTab(tabItem.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${isActive ? 'bg-content text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-content'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-muted'}`} />
                    <span>{tabItem.label}</span>
                  </div>
                  {tabItem.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-brand text-white' : 'bg-amber-500 text-white shadow-soft animate-pulse'}`}>
                      {tabItem.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Exit to Marketplace Link */}
        <div className="pt-6 border-t border-border mt-6">
          <button 
            onClick={() => navigate('/')} 
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted" />
            <span>{t('exitToMarketplace')}</span>
          </button>
        </div>
      </aside>

      {/* Main Tab Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* ================= TAB 1: OVERVIEW & METRICS ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-content tracking-tight">{t('overviewMetrics')}</h2>
                <p className="text-xs text-muted font-medium mt-0.5">Real-time KPIs and live Supabase system activity across Addis Ababa car rental fleet.</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPostModalOpen(true)} 
                  className="bg-[#8B0000] hover:bg-[#6b0000] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add Premium Post (+)
                </button>
                <button 
                  onClick={() => { refetchVehicles(); refetchPendingVehicles(); refetchBookings(); refetchUsers(); }} 
                  className="bg-white border border-border text-xs font-bold px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1.5 hover:bg-slate-50 text-content"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-border shadow-sm space-y-2">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('activeFleet')}</span>
                  <CarFront className="w-4 h-4 text-brand" />
                </div>
                <p className="text-2xl font-black text-content">{activeFleetCount}</p>
                <p className="text-[10px] font-bold text-success flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live on marketplace
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-border shadow-sm space-y-2">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('pendingApprovals')}</span>
                  <Clock className="w-4 h-4 text-warning" />
                </div>
                <p className="text-2xl font-black text-content">{pendingCount}</p>
                <p className="text-[10px] font-bold text-warning flex items-center gap-1">
                  <FileCheck className="w-3 h-3" /> Awaiting review
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-border shadow-sm space-y-2">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('activeRentals')}</span>
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-content">{activeRentalsCount}</p>
                <p className="text-[10px] font-bold text-indigo-600">In pipeline / matched</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-border shadow-sm space-y-2">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('brokerRevenue')}</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-brand">{formatETB(estimatedRevenue)}</p>
                <p className="text-[10px] font-bold text-muted">Based on {settingsForm.commissionPercentage}% commission</p>
              </div>
            </div>

            {/* Live Activity Table */}
            <div className="bg-white rounded-3xl border border-border shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-content">Live Activity Log</h3>
              {(!pendingVehicles?.length && !bookings?.length) ? (
                <p className="text-xs text-muted font-medium py-6 text-center">No recent activity recorded in Supabase.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Reference / Vehicle</th>
                        <th className="py-2.5 px-3">Party</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pendingVehicles?.map((v, i) => (
                        <tr key={`p-${i}`} className="hover:bg-slate-50">
                          <td className="py-3 px-3"><span className="bg-amber-500/10 text-amber-700 font-bold px-2 py-0.5 rounded text-[10px]">Submission</span></td>
                          <td className="py-3 px-3 font-bold text-content">{v?.make} {v?.model} ({v?.year})</td>
                          <td className="py-3 px-3">{v?.supplier?.name || 'Owner'}</td>
                          <td className="py-3 px-3 font-bold text-brand">{formatETB(v?.dailyRate || 0)} /d</td>
                          <td className="py-3 px-3"><span className="bg-warning/10 text-warning font-bold px-2 py-0.5 rounded text-[10px] uppercase">Pending Review</span></td>
                        </tr>
                      ))}
                      {bookings?.map((b, i) => (
                        <tr key={`b-${i}`} className="hover:bg-slate-50">
                          <td className="py-3 px-3"><span className="bg-blue-500/10 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">Booking</span></td>
                          <td className="py-3 px-3 font-bold text-content">{b?.ref} - {b?.car}</td>
                          <td className="py-3 px-3">{b?.renter}</td>
                          <td className="py-3 px-3 font-bold text-brand">{formatETB(b?.val || 0)}</td>
                          <td className="py-3 px-3"><span className="bg-success/10 text-success font-bold px-2 py-0.5 rounded text-[10px] uppercase">{b?.stage}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: DEDICATED CAR APPROVALS VIEW ================= */}
        {activeTab === 'approvals' && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-content tracking-tight flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" /> {t('carApprovals')}
                </h2>
                <p className="text-xs text-muted font-medium mt-0.5">Review vehicles with status = 'pending_review' ordered by created_at DESC.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-white font-black px-3 py-1 rounded-full text-xs animate-pulse">
                  {pendingCount} Pending
                </span>
                <button 
                  onClick={refetchPendingVehicles} 
                  className="bg-white border border-border text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1 hover:bg-slate-50 text-content"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            {/* Empty State Banner */}
            {pendingCount === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-border shadow-sm space-y-3">
                <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-content">{t('allCaughtUp')}</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">All submitted car listings in Supabase have been approved or processed by the master broker team.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingVehicles?.map(v => (
                  <div key={v?.id} className="bg-white rounded-3xl p-5 border border-border shadow-sm flex flex-col space-y-4 hover:shadow-md transition-all">
                    
                    {/* Car Photo & Key Specs Header */}
                    <div className="flex gap-4 items-start">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-background shrink-0 border border-border">
                        <img 
                          src={v.image || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=800&auto=format&fit=crop'} 
                          alt={`${v.make} ${v.model}`}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded mb-1 inline-block">
                          {v.category} • {v.zone}
                        </span>
                        <h3 className="font-extrabold text-lg text-content leading-tight truncate">
                          {v.make} {v.model} ({v.year})
                        </h3>
                        <p className="text-xs text-muted font-semibold mt-0.5">
                          {v.transmission} • {v.driverMode}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Submitted: {new Date(v.created_at).toLocaleString()}
                        </p>
                        <p className="text-lg font-black text-brand mt-1">
                          {formatETB(v.dailyRate)} <span className="text-xs text-muted font-normal">/ day</span>
                        </p>
                      </div>
                    </div>

                    {/* Supplier / Owner Info */}
                    <div className="bg-background p-3.5 rounded-2xl border border-border text-xs space-y-1">
                      <p className="font-bold text-content text-[11px] uppercase tracking-wider flex items-center justify-between">
                        <span>Owner Details:</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v.poster_role === 'Broker' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                          {v.poster_role || 'Private Owner'}
                        </span>
                      </p>
                      <p className="font-extrabold text-content">{v.supplier?.name || 'Owner'}</p>
                      {v.owner_phone ? (
                        <p className="font-mono flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-muted" />
                          <a href={`tel:${v.owner_phone}`} className="text-orange-600 font-bold hover:underline">
                            {v.owner_phone}
                          </a>
                        </p>
                      ) : v.supplier?.phone ? (
                        <p className="font-mono text-slate-600 flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-muted" /> {v.supplier.phone}
                        </p>
                      ) : null}
                    </div>

                    {/* Rental Collateral Requirements */}
                    <div className="bg-background p-3.5 rounded-2xl border border-border text-xs space-y-1.5 font-medium">
                      <p className="font-bold text-content text-[11px] uppercase tracking-wider">Rental Collateral Requirements:</p>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
                        <div className="bg-white p-2 rounded-xl border border-border">
                          <p className="text-muted text-[9px] uppercase font-bold">Check Required</p>
                          <p className="font-extrabold text-content mt-0.5">{v.requires_check ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-border">
                          <p className="text-muted text-[9px] uppercase font-bold">Deposit Amount</p>
                          <p className="font-extrabold text-content mt-0.5">{v.deposit_amount ? formatETB(v.deposit_amount) : 'None'}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-border">
                          <p className="text-muted text-[9px] uppercase font-bold">Advance Pay</p>
                          <p className="font-extrabold text-content mt-0.5">{v.advanced_payment_days ? `${v.advanced_payment_days} Days` : 'Standard'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Description */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted uppercase">Vehicle Description:</p>
                      <p className="text-xs text-slate-600 line-clamp-3 italic font-medium">
                        "{v.description || 'Clean vehicle listed by owner.'}"
                      </p>
                    </div>

                    {/* Interactive Broker Actions */}
                    <div className="flex gap-2 pt-3 border-t border-border mt-auto">
                      <button 
                        onClick={() => rejectVehicle(v.id)} 
                        className="w-1/3 bg-background hover:bg-rose-50 text-rose-600 border border-border py-3 rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> {t('reject')}
                      </button>
                      <button 
                        onClick={() => approveVehicle(v.id)} 
                        className="w-2/3 bg-success hover:bg-emerald-600 text-white py-3 rounded-full text-xs font-bold transition-colors shadow-soft flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> {t('approveGoLive')}
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2.5: ACTIVE FLEET ================= */}
        {activeTab === 'active_fleet' && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-content tracking-tight flex items-center gap-2">
                  <CarFront className="w-5 h-5 text-brand" /> Active Fleet
                </h2>
                <p className="text-xs text-muted font-medium mt-0.5">Manage live vehicles and promote to Premium placements.</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPostModalOpen(true)} 
                  className="bg-[#8B0000] hover:bg-[#6b0000] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add Premium Post (+)
                </button>
                <button 
                  onClick={refetchVehicles} 
                  className="bg-white border border-border text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1 hover:bg-slate-50 text-content"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            {/* Dynamic Summary Ribbon */}
            <div className="flex items-center gap-6 bg-white border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Total Fleet</span>
                <span className="text-xl font-black text-content">{vehicles?.length || 0}</span>
              </div>
              <div className="w-px h-10 bg-border"></div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Recently Added (24h)</span>
                <span className="text-xl font-black text-brand">{recentlyAdded24hCount}</span>
              </div>
            </div>

            {/* Professional Data Table */}
            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto hide-scrollbar">
                <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-muted uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-bold">Vehicle</th>
                      <th className="py-3 px-4 font-bold">Submitted By</th>
                      <th className="py-3 px-4 font-bold">Contact Info</th>
                      <th className="py-3 px-4 font-bold">Usage</th>
                      <th className="py-3 px-4 font-bold">Pricing</th>
                      <th className="py-3 px-4 font-bold sticky right-0 bg-slate-50 border-l border-border z-10 text-center shadow-[-4px_0_10px_-5px_rgba(0,0,0,0.05)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vehicles?.map((v, index) => {
                      const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                      return (
                        <tr key={v?.id} className={`group hover:bg-slate-50 transition-colors ${rowBg}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-background shrink-0 border border-border relative">
                                <img src={v?.image || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=200&auto=format&fit=crop'} alt={v?.make} className="w-full h-full object-cover" />
                                {v.is_premium && (
                                  <div className="absolute top-0 right-0 bg-amber-400 text-white p-[2px] rounded-bl-md shadow-xs">
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-extrabold text-content text-sm">{v?.make} {v?.model}</p>
                                <p className="text-[11px] text-muted font-semibold">{v?.year} • {v?.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v?.poster_role === 'Broker' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                                {v?.poster_role || 'Unknown'}
                              </span>
                              <span className="text-[11px] text-muted font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {getTimeAgo(v?.created_at)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {v?.owner_phone ? <a href={"tel:" + v?.owner_phone} className="text-blue-600 font-bold hover:underline">{v?.owner_phone}</a> : <span className="text-gray-400 italic">No Number</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
                              {v?.usage_type || 'Personal'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm font-black text-brand">{formatETB(v?.dailyRate || v?.daily_rate || 0)}</p>
                            <p className="text-[10px] text-muted font-medium">per day</p>
                          </td>
                          <td className={`py-3 px-4 sticky right-0 border-l border-border z-10 shadow-[-4px_0_10px_-5px_rgba(0,0,0,0.05)] transition-colors group-hover:bg-slate-50 ${rowBg}`}>
                            <div className="flex items-center justify-center gap-2">
                              {v?.owner_phone ? (
                                <>
                                  <a 
                                    href={`tel:${v.owner_phone}`} 
                                    className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center transition-colors"
                                    title="Call Owner"
                                  >
                                    <Phone className="w-4 h-4" />
                                  </a>
                                  <a 
                                    href={`https://wa.me/${v.owner_phone?.replace('+', '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition-colors"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </a>
                                </>
                              ) : (
                                <>
                                  <button disabled className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center cursor-not-allowed">
                                    <Phone className="w-4 h-4" />
                                  </button>
                                  <button disabled className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center cursor-not-allowed">
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => handleDeleteVehicle(v?.id)}
                                className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-orange-600 flex items-center justify-center transition-colors ml-1"
                                title="Delete/Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!vehicles || vehicles.length === 0) && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-muted text-sm font-medium">
                          No vehicles found in the active fleet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: BOOKINGS PIPELINE (KANBAN BOARD) ================= */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-content tracking-tight">{t('bookingsPipeline')}</h2>
                <p className="text-xs text-muted font-medium mt-0.5">Click any booking card to open commandModal, reassign, or change status in real-time.</p>
              </div>
              <button onClick={refetchBookings} className="bg-white border border-border text-xs font-bold px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1.5 hover:bg-slate-50 text-content">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-border shadow-sm overflow-x-auto hide-scrollbar">
              <div className="flex gap-4 min-w-max">
                {kanbanColumns.map(col => {
                  const items = bookings?.filter(b => {
                    const st = (b?.stage || b?.status || '').toLowerCase();
                    if (col.id === 'new_request') return st === 'new_request' || st === 'new';
                    if (col.id === 'vehicle_matched') return st === 'vehicle_matched' || st === 'matched';
                    if (col.id === 'in_progress') return st === 'in_progress' || st === 'active';
                    if (col.id === 'completed') return st === 'completed' || st === 'done';
                    return st === col.id;
                  });

                  return (
                    <div 
                      key={col.id}
                      className="snap-align-start shrink-0 w-[280px] bg-background border border-border rounded-2xl p-3 flex flex-col h-[550px]"
                    >
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-bold text-content flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                          {col.label}
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-muted border border-border">
                          {items.length}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 hide-scrollbar">
                        {items?.length > 0 ? (
                          items.map(b => (
                            <div 
                              key={b?.id}
                              onClick={() => openModal('command', b)}
                              className="bg-white p-3.5 rounded-2xl shadow-xs border border-border text-xs cursor-pointer hover:border-brand hover:shadow-md transition-all group"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <p className="font-extrabold text-content group-hover:text-brand transition-colors">{b.renter}</p>
                                <span className="text-[10px] font-mono font-bold text-muted">{b.ref}</span>
                              </div>
                              <p className="text-content font-semibold text-xs mt-0.5">{b.car}</p>
                              {b.lister && (
                                <p className="text-[10px] text-muted font-medium flex items-center gap-1 mt-1">
                                  <Building2 className="w-3 h-3 text-muted" /> {b.lister}
                                </p>
                              )}
                              <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-border">
                                <span className="text-[10px] text-muted font-bold uppercase">Gross</span>
                                <span className="text-brand font-black text-xs">{formatETB(b.val)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-[10px] text-muted font-medium">No bookings in this stage</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SUPPLIERS & USERS ================= */}
        {activeTab === 'users' && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-content tracking-tight">{t('suppliersUsers')}</h2>
                <p className="text-xs text-muted font-medium mt-0.5">Manage identity verifications for car owners and renters across Addis Ababa.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-border shadow-sm p-6">
              {!realUsers?.length ? (
                <p className="text-xs text-muted font-medium py-8 text-center">No registered profiles in Supabase yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">User / Supplier Name</th>
                        <th className="py-3 px-4">Phone Contact</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Fleet Count</th>
                        <th className="py-3 px-4">Verification</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {realUsers?.map(u => {
                        const displayName = u.full_name || u.name || 'Unknown User';
                        return (
                        <tr key={u?.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-extrabold text-content flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                              {displayName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            {displayName}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                            {u.phone ? u.phone : <span className="text-gray-400 italic">No Number</span>}
                          </td>
                          <td className="py-3.5 px-4"><span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'Owner' || u.role === 'Broker' ? 'bg-purple-500/10 text-purple-700' : 'bg-blue-500/10 text-blue-700'}`}>{u.role || 'Member'}</span></td>
                          <td className="py-3.5 px-4 font-bold text-content">{u.fleet_count || 0} vehicles</td>
                          <td className="py-3.5 px-4">
                            {u.is_verified ? (
                              <span className="text-[10px] font-bold text-success flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified Member</span>
                            ) : (
                              <span className="text-[10px] font-bold text-muted">Unverified</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => toggleUserVerification(u.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${u.is_verified ? 'bg-background text-content hover:bg-slate-200' : 'bg-brand text-white hover:bg-brand-hover shadow-xs'}`}
                            >
                              {u.is_verified ? 'Unverify' : 'Verify User'}
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: PLATFORM SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 fade-in max-w-2xl">
            <div>
              <h2 className="text-xl font-extrabold text-content tracking-tight">{t('settings')}</h2>
              <p className="text-xs text-muted font-medium mt-0.5">Configure master broker platform commission, contact handles, and moderation rules.</p>
            </div>

            <form onSubmit={handleSettingsSubmit} className="bg-white rounded-3xl border border-border shadow-sm p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-content block mb-1">Broker Commission Percentage (%)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={settingsForm.commissionPercentage}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, commissionPercentage: e.target.value }))}
                    className="w-full bg-background rounded-2xl p-3 text-sm font-bold text-content focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-content block mb-1">Master Broker Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input 
                    type="text"
                    value={settingsForm.brokerPhone}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, brokerPhone: e.target.value }))}
                    className="w-full bg-background rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-content focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-content block mb-1">Telegram Contact Handle</label>
                <div className="relative">
                  <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-telegram" />
                  <input 
                    type="text"
                    value={settingsForm.telegramHandle}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, telegramHandle: e.target.value }))}
                    className="w-full bg-background rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-content focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-content block">Listing Moderation Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-4 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${settingsForm.moderationMode === 'manual' ? 'border-brand bg-brand/5 text-brand' : 'border-border bg-white text-content'}`}>
                    <input 
                      type="radio" 
                      name="moderation"
                      value="manual"
                      checked={settingsForm.moderationMode === 'manual'}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, moderationMode: e.target.value }))}
                      className="sr-only"
                    />
                    <p className="font-extrabold text-sm mb-0.5">Manual Review</p>
                    <p className="text-[10px] font-medium text-muted">Admin must approve cars before going live</p>
                  </label>

                  <label className={`p-4 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${settingsForm.moderationMode === 'auto' ? 'border-brand bg-brand/5 text-brand' : 'border-border bg-white text-content'}`}>
                    <input 
                      type="radio" 
                      name="moderation"
                      value="auto"
                      checked={settingsForm.moderationMode === 'auto'}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, moderationMode: e.target.value }))}
                      className="sr-only"
                    />
                    <p className="font-extrabold text-sm mb-0.5">Auto-Approve</p>
                    <p className="text-[10px] font-medium text-muted">New owner listings go live immediately</p>
                  </label>
                </div>
              </div>

              <div className="pt-3">
                <button 
                  type="submit" 
                  className="w-full bg-brand hover:bg-brand-hover text-white py-3.5 rounded-full font-bold text-xs shadow-floating transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> {t('saveSettings')}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <AdminPostModal 
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSuccess={() => {
          setIsPostModalOpen(false);
          refetchVehicles();
        }}
      />
    </div>
  );
};
