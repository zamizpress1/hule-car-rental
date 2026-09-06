import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Loader2, X } from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export const EditVehicleModal = ({ isOpen, vehicle, onClose, onSuccess }) => {
  const { showToast } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: 2022,
    condition: 'Used in Ethiopia',
    rate: '',
    category: 'Economy',
    zone: 'Bole',
    driverMode: 'Self-Drive',
    requirements: {
      kebeleId: true,
      driversLicense: true,
      check: false
    },
    depositAmount: '',
    advancedPaymentDays: 0,
    description: ''
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sanitizerMsg, setSanitizerMsg] = useState('');

  useEffect(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || 2022,
        condition: vehicle.condition || 'Used in Ethiopia',
        rate: vehicle.daily_rate || vehicle.dailyRate || '',
        category: vehicle.category || 'Economy',
        zone: vehicle.zone || 'Bole',
        driverMode: vehicle.driver_mode || vehicle.driverMode || 'Self-Drive',
        requirements: {
          kebeleId: vehicle.requires_kebele_id ?? true,
          driversLicense: vehicle.requires_drivers_license ?? true,
          check: vehicle.requires_check ?? false
        },
        depositAmount: vehicle.deposit_amount || '',
        advancedPaymentDays: vehicle.advanced_payment_days || 0,
        description: vehicle.description || ''
      });
      // Optionally we could load existing images here, but for simplicity we will just let them add new ones or keep existing on backend if array is empty
    }
  }, [vehicle]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRequirementChange = (key, checked) => {
    setFormData(prev => ({
      ...prev,
      requirements: { ...prev.requirements, [key]: checked }
    }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (selectedFiles.length + files.length > 5) {
      showToast('You can only upload up to 5 photos.');
      return;
    }

    try {
      const compressedFiles = await Promise.all(
        files.map(file => compressImage(file))
      );
      setSelectedFiles(prev => [...prev, ...compressedFiles]);
    } catch (error) {
      console.error('Error compressing images:', error);
      showToast('Error compressing some images.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.make || !formData.model) {
      showToast('Please fill in vehicle Make and Model');
      return;
    }
    if (!formData.rate) {
      showToast('Please enter a daily rate');
      return;
    }

    setSubmitting(true);
    let uploadedUrls = vehicle.images || [];

    if (selectedFiles.length > 0) {
      try {
        const newUrls = await Promise.all(
          selectedFiles.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `${vehicle.owner_id || 'update'}/${safeFileName}`;

            const { error } = await supabase.storage
              .from('vehicle_images')
              .upload(filePath, file);

            if (error) throw error;

            const { data } = supabase.storage
              .from('vehicle_images')
              .getPublicUrl(filePath);

            return data.publicUrl;
          })
        );
        uploadedUrls = newUrls; // Override if new ones provided
      } catch (error) {
        console.error('Full Submission Error:', error);
        showToast(`Upload failed: ${error.message}`);
        setSubmitting(false);
        return;
      }
    }

    const requiresCheck = Boolean(formData.requirements.check);
    const depositAmt = Number(formData.depositAmount) || 0;
    const advDays = Number(formData.advancedPaymentDays) || 0;

    const updateRecord = {
      make: formData.make,
      model: formData.model,
      year: Number(formData.year) || 2022,
      condition: formData.condition || 'Used in Ethiopia',
      daily_rate: Number(formData.rate) || 3500,
      category: formData.category || 'Economy',
      zone: formData.zone || 'Bole',
      driver_mode: formData.driverMode || 'Self-Drive',
      requires_kebele_id: Boolean(formData.requirements.kebeleId),
      requires_drivers_license: Boolean(formData.requirements.driversLicense),
      requires_check: requiresCheck,
      deposit_amount: depositAmt,
      advanced_payment_days: advDays,
      description: formData.description,
    };

    if (uploadedUrls.length > 0) {
        updateRecord.images = uploadedUrls;
        updateRecord.image_url = uploadedUrls[0];
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .update(updateRecord)
        .eq('id', vehicle.id);

      if (error) throw error;
      
      showToast('Vehicle updated successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error updating vehicle in Supabase:', err);
      showToast('Failed to update vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 shadow-2xl relative scale-in hide-scrollbar">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-content">Edit Vehicle</h2>
          <p className="text-muted text-xs font-medium">Update your vehicle information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Spec Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Make *</label>
              <input type="text" value={formData.make} onChange={(e) => handleChange('make', e.target.value)} required className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Model *</label>
              <input type="text" value={formData.model} onChange={(e) => handleChange('model', e.target.value)} required className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Year *</label>
              <input type="number" value={formData.year} onChange={(e) => handleChange('year', e.target.value)} required className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Condition</label>
              <select value={formData.condition} onChange={(e) => handleChange('condition', e.target.value)} className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none">
                <option>Used in Ethiopia</option>
                <option>Used Abroad</option>
                <option>New</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Daily Rate *</label>
              <input type="number" value={formData.rate} onChange={(e) => handleChange('rate', e.target.value)} required className="w-full bg-background rounded-xl p-3 text-sm font-extrabold text-brand focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Category</label>
              <select value={formData.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none">
                <option value="Economy">Economy</option>
                <option value="SUV">SUV & 4x4</option>
                <option value="Luxury">Luxury</option>
                <option value="Van">Vans</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Zone</label>
              <select value={formData.zone} onChange={(e) => handleChange('zone', e.target.value)} className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none">
                <option value="Bole">Bole</option>
                <option value="Sarbet">Sarbet</option>
                <option value="CMC">CMC</option>
                <option value="Kazanchis">Kazanchis</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Driver Mode</label>
              <select value={formData.driverMode} onChange={(e) => handleChange('driverMode', e.target.value)} className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none">
                <option value="Self-Drive">Self-Drive</option>
                <option value="With Driver">With Driver</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="text-[10px] font-bold text-content ml-2 block mb-1">Photos (Leave empty to keep existing)</label>
            <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-slate-100 hover:bg-slate-200 text-content px-4 py-3 rounded-xl text-xs font-bold w-full border border-slate-200">
              Select New Photos
            </button>
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-50">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-brand hover:bg-brand-hover text-white py-4 rounded-full font-extrabold text-sm flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Vehicle</span>}
          </button>
        </form>
      </div>
    </div>
  );
};
