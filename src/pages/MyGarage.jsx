import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Car, Edit2, Trash2, PlusCircle, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { EditVehicleModal } from '../components/modals/EditVehicleModal';

export const MyGarage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, formatETB } = useApp();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const { language } = useLanguage();

  const fetchGarage = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('My Garage Vehicles:', data);
      setVehicles(data || []);
    } catch (err) {
      console.error('Error fetching garage:', err);
      showToast('Failed to load your garage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      fetchGarage();
    }
  }, [user, navigate]);

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', vehicleId);

        if (error) throw error;
        
        setVehicles(prev => prev.filter(v => v.id !== vehicleId));
        showToast('Listing deleted successfully');
      } catch (err) {
        console.error('Error deleting vehicle:', err);
        showToast('Failed to delete listing');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6 fade-in">
      <Link 
        to="/" 
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'am' ? 'ወደ ገበያ ይመለሱ' : 'Back to Marketplace'}</span>
      </Link>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content flex items-center gap-2">
            <Car className="w-6 h-6 text-brand" /> My Garage
          </h1>
          <p className="text-muted text-sm mt-1">Manage your vehicle listings</p>
        </div>
        <button
          onClick={() => navigate('/list-car')}
          className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm flex items-center gap-2 transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Add Car
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-content mb-2">No vehicles in your garage</h3>
          <p className="text-muted text-sm mb-6">List your first car to start earning with Hule የመኪና ኪራይ.</p>
          <button
            onClick={() => navigate('/list-car')}
            className="bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm"
          >
            List a Car Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(v => (
            <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group">
              <div className="relative aspect-[4/3] w-full bg-slate-100">
                <img 
                  src={v.image || v.image_url || (v.images && v.images[0]) || 'https://placehold.co/600x400?text=No+Image'} 
                  alt={`${v.make} ${v.model}`}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur text-white px-2 py-0.5 rounded text-[10px] font-bold">
                  {v.status === 'active' ? '🟢 Active' : (v.status === 'pending_review' ? '🟡 Pending' : '🔴 ' + v.status)}
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-content leading-tight mb-1">
                  {v.make} {v.model} ({v.year})
                </h3>
                <p className="text-xs text-muted font-medium mb-3">
                  {v.category} • {v.zone}
                </p>
                <div className="text-brand font-black mb-2">
                  {formatETB(v.daily_rate || v.dailyRate)} <span className="text-xs text-muted font-medium">/ day</span>
                </div>

                <div className="flex items-center gap-1 text-green-600 text-xs font-semibold mb-4">
                  <ShieldCheck className="w-3.5 h-3.5" /> 5/5 Broker Verified
                </div>
                
                <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setEditingVehicle(v)}
                    className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(v.id)}
                    className="flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingVehicle && (
        <EditVehicleModal
          isOpen={true}
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSuccess={() => {
            setEditingVehicle(null);
            fetchGarage();
          }}
        />
      )}
    </div>
  );
};
