import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const normalizeVehicle = (row) => ({
  id: String(row.id),
  owner_id: row.owner_id || null,
  make: row.make || row.brand || '',
  model: row.model || '',
  year: row.year || new Date().getFullYear(),
  category: row.category || 'Economy',
  zone: row.zone || row.location || 'Bole',
  dailyRate: Number(row.daily_rate || row.dailyRate || row.price || 0),
  driverMode: row.driver_mode || row.driverMode || 'Self-Drive',
  transmission: row.transmission || 'Auto',
  fuel: row.fuel || row.fuel_type || 'Petrol',
  body: row.body || row.body_type || 'Hatchback',
  color: row.color || 'Silver',
  cc: row.cc || row.engine || '1.3L',
  mileage: row.mileage || '45,000 km',
  condition: row.condition || 'Used in Ethiopia',
  seats: row.seats || 5,
  usage_type: row.usage_type || 'Personal Use',
  poster_role: row.poster_role || 'Private Owner',
  owner_phone: row.owner_phone || '',
  status: row.status || 'active',
  is_premium: Boolean(row.is_premium),
  requires_check: Boolean(row.requires_check),
  deposit_amount: Number(row.deposit_amount || 0),
  advanced_payment_days: Number(row.advanced_payment_days || 0),
  supplier: typeof row.supplier === 'object' && row.supplier !== null 
    ? row.supplier 
    : { name: row.profiles?.full_name || row.supplier_name || row.supplier || 'Verified Partner', phone: row.profiles?.phone_number || row.owner_phone || row.phone || '' },
  collateral: row.collateral || ['Kebele ID', 'Deposit'],
  description: row.description || 'Well-maintained vehicle in excellent condition. Ideal for city driving or long-distance rentals across Ethiopia.',
  image: row.image || row.image_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=800&auto=format&fit=crop',
  images: Array.isArray(row.images) && row.images.length > 0 ? row.images : [row.image_url || row.image || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=800&auto=format&fit=crop'],
  created_at: row.created_at || new Date().toISOString()
});

export const normalizeBooking = (row) => {
  const profileData = row['profiles'] || row.profiles; // Fallback if exact alias isn't returned
  const renterName = profileData?.full_name || row.renter_name || row.renter || 'Renter';
  const vehicleTitle = row.vehicles 
    ? `${row.vehicles.make} ${row.vehicles.model}` 
    : (row.car_title || row.car || 'Vehicle');
  const supplierName = row.vehicles?.profiles?.full_name || row.lister || 'Hule የመኪና ኪራይ Partner';
  const val = Number(row.gross_amount || row.val || row.total || 0);
  const status = row.status || row.stage || 'new_request';

  return {
    id: String(row.id),
    ref: row.ref || row.booking_ref || `#FD-${row.id.toString().slice(-4)}`,
    renter: renterName,
    car: vehicleTitle,
    val: val,
    stage: status,
    lister: supplierName,
    rawStatus: status
  };
};

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'Car' },
  { id: 'Economy', label: 'Economy', icon: 'Gauge' },
  { id: 'SUV', label: 'SUV & 4x4', icon: 'Mountain' },
  { id: 'Luxury', label: 'Luxury', icon: 'Gem' },
  { id: 'Van', label: 'Vans', icon: 'Bus' }
];

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());
  const [vehicles, setVehicles] = useState([]);
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const [myGarage, setMyGarage] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [filters, setFilters] = useState({ search: '', zone: 'all', category: 'all', driverMode: 'all' });
  const [viewMode, setViewMode] = useState('explore'); // 'explore' or 'saved'
  const [selectedBookingForCommand, setSelectedBookingForCommand] = useState(null);

  // Modals state
  const [modals, setModals] = useState({
    auth: false,
    notif: false,
    smartMatch: false,
    bookingSummary: false,
    bookingTimeline: false,
    command: false
  });

  const [bookingDraft, setBookingDraft] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '' });

  // Query live active vehicles from Supabase
  const fetchActiveVehiclesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase vehicles fetch notice:', error.message);
        return;
      }

      console.log('Fetched Active Vehicles:', data);

      if (data) {
        const activeRows = data.map(normalizeVehicle);
        setVehicles(activeRows);
      }
    } catch (err) {
      console.error('Error fetching active vehicles from Supabase:', err);
    }
  };

  // Query pending_review vehicles ordered by created_at DESC
  const fetchPendingVehiclesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase pending vehicles fetch notice:', error.message);
        return;
      }

      if (data) {
        const pendingRows = data.map(normalizeVehicle);
        setPendingVehicles(pendingRows);
      }
    } catch (err) {
      console.error('Error fetching pending vehicles from Supabase:', err);
    }
  };

  // Query owner garage vehicles for logged-in user
  const fetchMyGarageFromSupabase = async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase owner garage fetch notice:', error.message);
        return;
      }

      if (data) {
        const garageRows = data.map(normalizeVehicle);
        setMyGarage(garageRows);
      }
    } catch (err) {
      console.error('Error fetching owner garage from Supabase:', err);
    }
  };

  // Query bookings
  const fetchBookingsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_renter_id_fkey ( id, full_name, phone_number ),
          vehicles ( id, make, model, year, daily_rate, image_url, profiles ( full_name, phone_number ) )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase bookings fetch notice:', error.message);
        return;
      }

      if (data) {
        const normalized = data.map(normalizeBooking);
        setBookings(normalized);
      }
    } catch (err) {
      console.error('Error fetching bookings from Supabase:', err);
    }
  };

  // Query users / profiles
  const fetchUsersFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.warn('Supabase profiles fetch notice:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const formattedUsers = data.map(p => ({
          id: String(p.id),
          name: p.name || p.full_name || 'Registered User',
          phone: p.phone || p.phone_number || '+251 9XX XXX XXX',
          role: p.role || 'Member',
          fleetCount: Number(p.fleet_count || 0),
          is_verified: Boolean(p.is_verified)
        }));
        setUsersList(formattedUsers);
      }
    } catch (err) {
      console.error('Error fetching users from Supabase:', err);
    }
  };

  const approveVehicle = async (vehicleId) => {
    const vehicleToApprove = pendingVehicles.find(v => String(v.id) === String(vehicleId));
    
    // Optimistic Update
    setPendingVehicles(prev => prev.filter(v => String(v.id) !== String(vehicleId)));
    if (vehicleToApprove) {
      setVehicles(prev => [{ ...vehicleToApprove, status: 'active' }, ...prev]);
    }
    if (user?.id && myGarage.some(v => String(v.id) === String(vehicleId))) {
      setMyGarage(prev => prev.map(v => String(v.id) === String(vehicleId) ? { ...v, status: 'active' } : v));
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ status: 'active' })
        .eq('id', vehicleId);

      if (error) {
        console.warn('Supabase approve vehicle notice:', error.message);
      }
    } catch (err) {
      console.error('Error approving vehicle in Supabase:', err);
    }

    showToast('Vehicle approved and is now live on marketplace!');
  };

  const rejectVehicle = async (vehicleId) => {
    // Optimistic Update
    setPendingVehicles(prev => prev.filter(v => String(v.id) !== String(vehicleId)));
    if (user?.id && myGarage.some(v => String(v.id) === String(vehicleId))) {
      setMyGarage(prev => prev.map(v => String(v.id) === String(vehicleId) ? { ...v, status: 'delisted' } : v));
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ status: 'delisted' })
        .eq('id', vehicleId);

      if (error) {
        console.warn('Supabase reject vehicle notice:', error.message);
      }
    } catch (err) {
      console.error('Error rejecting vehicle in Supabase:', err);
    }

    showToast('Vehicle rejected / delisted.');
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    setBookings(prev => prev.map(b => {
      if (String(b.id) === String(bookingId)) {
        return { ...b, stage: newStatus, rawStatus: newStatus };
      }
      return b;
    }));

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        console.warn('Supabase update booking notice:', error.message);
      }
    } catch (err) {
      console.error('Error updating booking in Supabase:', err);
    }

    showToast(`Booking status updated to ${newStatus}`);
  };

  const toggleUserVerification = async (userId) => {
    let nextStatus = true;
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        nextStatus = !u.is_verified;
        return { ...u, is_verified: nextStatus };
      }
      return u;
    }));

    try {
      await supabase
        .from('profiles')
        .update({ is_verified: nextStatus })
        .eq('id', userId);
    } catch (err) {
      // Ignore
    }

    showToast(`User verification status updated.`);
  };

  useEffect(() => {
    if (user?.id) {
      fetchMyGarageFromSupabase(user.id);
    } else {
      setMyGarage([]);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchActiveVehiclesFromSupabase();
    fetchPendingVehiclesFromSupabase();
    fetchBookingsFromSupabase();
    fetchUsersFromSupabase();
  }, []);

  const showToast = (msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 3000);
  };

  const toggleSave = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openModal = (name, payload = null) => {
    if (name === 'command') setSelectedBookingForCommand(payload);
    if (name === 'bookingSummary') setBookingDraft(payload);
    setModals(prev => ({ ...prev, [name]: true }));
  };

  const closeModal = (name) => {
    setModals(prev => ({ ...prev, [name]: false }));
  };



  const addGarageVehicle = (vehicleData) => {
    setMyGarage(prev => [normalizeVehicle(vehicleData), ...prev]);
    fetchPendingVehiclesFromSupabase();
    showToast('Vehicle submitted for verification');
  };

  const formatETB = (val) => Number(val).toLocaleString() + ' ETB';

  return (
    <AppContext.Provider value={{
      user,
      savedIds,
      vehicles,
      pendingVehicles,
      myGarage,
      setMyGarage,
      bookings,
      usersList,
      setVehicles,
      setBookings,
      filters,
      setFilters,
      categories: CATEGORIES,
      viewMode,
      setViewMode,
      modals,
      openModal,
      closeModal,
      toast,
      showToast,
      toggleSave,
      addGarageVehicle,
      approveVehicle,
      rejectVehicle,
      toggleUserVerification,
      bookingDraft,
      setBookingDraft,
      selectedBookingForCommand,
      formatETB,
      refetchVehicles: fetchActiveVehiclesFromSupabase,
      refetchPendingVehicles: fetchPendingVehiclesFromSupabase,
      refetchBookings: fetchBookingsFromSupabase,
      refetchUsers: fetchUsersFromSupabase,
      refetchMyGarage: fetchMyGarageFromSupabase,
      updateBookingStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
