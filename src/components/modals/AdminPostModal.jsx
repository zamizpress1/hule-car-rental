import React, { useState, useRef } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export const AdminPostModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, showToast } = useApp();
  
  const [submitting, setSubmitting] = useState(false);
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
    description: '',
    urgencyTag: 'None'
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [sanitizerMsg, setSanitizerMsg] = useState('');

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

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    handleChange('description', val);
    if (/(09|07|\+251)\d{8}/.test(val)) {
      setSanitizerMsg('Phone numbers hidden for broker protection');
    } else {
      setSanitizerMsg('');
    }
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
    if (selectedFiles.length < 1 || selectedFiles.length > 5) {
      showToast(`Please provide between 1 and 5 photos. You have ${selectedFiles.length}.`);
      return;
    }

    setSubmitting(true);

    let uploadedUrls = [];
    try {
      uploadedUrls = await Promise.all(
        selectedFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `${user?.id || 'admin'}/${safeFileName}`;

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
    } catch (error) {
      console.error('Full Submission Error:', error);
      showToast(`Upload failed: ${error.message}`);
      setSubmitting(false);
      return;
    }

    const vehicleRecord = {
      owner_id: user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      make: formData.make,
      model: formData.model,
      year: parseInt(formData.year) || 2023,
      category: formData.category || 'Economy',
      zone: formData.zone || 'Bole',
      daily_rate: parseFloat(formData.rate) || 3500,
      driver_mode: formData.driverMode || 'Self-Drive',
      transmission: formData.transmission || 'Automatic',
      fuel: formData.fuel || 'Petrol',
      condition: formData.condition || 'Used in Ethiopia',
      description: formData.description || '',
      image_url: uploadedUrls[0],
      images: uploadedUrls,
      requires_check: Boolean(formData.requirements.check),
      deposit_amount: parseFloat(formData.depositAmount) || 0,
      advanced_payment_days: parseInt(formData.advancedPaymentDays) || 0,
      status: 'active',
      is_premium: true,
      urgency_tag: formData.urgencyTag === 'None' ? null : formData.urgencyTag
    };

    try {
      const { error } = await supabase
        .from('vehicles')
        .insert([vehicleRecord]);

      if (error) {
        console.error('Insert error details:', error);
        showToast('Error publishing premium vehicle');
      } else {
        showToast('Premium vehicle published');
        setFormData({
          make: '',
          model: '',
          year: 2023,
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
          advancedPaymentDays: '',
          description: '',
          urgencyTag: 'None'
        });
        setSelectedFiles([]);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Error inserting vehicle into Supabase:', err);
      showToast('Error publishing premium vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 shadow-2xl relative scale-in border border-slate-100 hide-scrollbar">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-content">Add Premium Post</h2>
          <p className="text-muted text-xs font-medium">
            Vehicles posted here bypass review and are marked Premium automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Make *</label>
              <input 
                type="text" 
                value={formData.make}
                onChange={(e) => handleChange('make', e.target.value)}
                placeholder="e.g. Toyota" 
                required
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Model *</label>
              <input 
                type="text" 
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="e.g. Vitz" 
                required
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Year *</label>
              <input 
                type="number" 
                value={formData.year}
                onChange={(e) => handleChange('year', e.target.value)}
                required
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Condition</label>
              <select 
                value={formData.condition}
                onChange={(e) => handleChange('condition', e.target.value)}
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              >
                <option>Used in Ethiopia</option>
                <option>Used Abroad</option>
                <option>New</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Daily Rate *</label>
              <input 
                type="number" 
                value={formData.rate}
                onChange={(e) => handleChange('rate', e.target.value)}
                placeholder="e.g. 3500" 
                required
                className="w-full bg-background rounded-xl p-3 text-sm font-extrabold text-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              >
                <option value="Economy">Economy</option>
                <option value="SUV">SUV & 4x4</option>
                <option value="Luxury">Luxury</option>
                <option value="Van">Vans</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Zone</label>
              <select 
                value={formData.zone}
                onChange={(e) => handleChange('zone', e.target.value)}
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              >
                <option value="Bole">Bole</option>
                <option value="Sarbet">Sarbet</option>
                <option value="CMC">CMC</option>
                <option value="Kazanchis">Kazanchis</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Driver Mode</label>
              <select 
                value={formData.driverMode}
                onChange={(e) => handleChange('driverMode', e.target.value)}
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              >
                <option value="Self-Drive">Self-Drive</option>
                <option value="With Driver">With Driver</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Marketing Badge</label>
              <select 
                value={formData.urgencyTag}
                onChange={(e) => handleChange('urgencyTag', e.target.value)}
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              >
                <option value="None">None</option>
                <option value="🔥 High Demand">🔥 High Demand</option>
                <option value="⚡ Available Today">⚡ Available Today</option>
                <option value="⏳ Last 1 Available">⏳ Last 1 Available</option>
                <option value="💎 Broker Choice">💎 Broker Choice</option>
              </select>
            </div>
          </div>

          <label className="text-[10px] font-bold text-content ml-2 block">Required Collateral Documents</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <label className="bg-background p-3 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox" 
                checked={formData.requirements.kebeleId} 
                onChange={(e) => handleRequirementChange('kebeleId', e.target.checked)}
                className="accent-brand w-4 h-4" 
              />
              <span className="font-semibold text-content">Kebele ID</span>
            </label>
            <label className="bg-background p-3 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox" 
                checked={formData.requirements.driversLicense} 
                onChange={(e) => handleRequirementChange('driversLicense', e.target.checked)}
                className="accent-brand w-4 h-4" 
              />
              <span className="font-semibold text-content">Driver's License</span>
            </label>
            <label className="bg-background p-3 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox" 
                checked={formData.requirements.check} 
                onChange={(e) => handleRequirementChange('check', e.target.checked)}
                className="accent-brand w-4 h-4" 
              />
              <span className="font-semibold text-content">Blank Check</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Deposit Amount</label>
              <input 
                type="number" 
                value={formData.depositAmount}
                onChange={(e) => handleChange('depositAmount', e.target.value)}
                placeholder="e.g. 10000" 
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Advanced Pay (Days)</label>
              <select 
                value={formData.advancedPaymentDays}
                onChange={(e) => handleChange('advancedPaymentDays', parseInt(e.target.value))}
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              >
                <option value={0}>None</option>
                <option value={10}>10 Days</option>
                <option value={15}>15 Days</option>
                <option value={30}>1 Month</option>
                <option value={60}>2 Months</option>
                <option value={90}>3 Months</option>
                <option value={120}>4 Months</option>
                <option value={150}>5 Months</option>
                <option value={180}>6 Months</option>
                <option value={210}>7 Months</option>
                <option value={240}>8 Months</option>
              </select>
            </div>
          </div>

          <div className="bg-brand/5 border border-brand/20 p-4 rounded-2xl space-y-2">
            <span className="text-xs font-extrabold text-brand flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Description
            </span>
            <textarea 
              value={formData.description}
              onChange={handleDescriptionChange}
              rows={3} 
              placeholder="Describe the vehicle..."
              className="w-full bg-white rounded-xl p-3 text-xs font-medium focus:outline-none border border-slate-100"
            />
            {sanitizerMsg && (
              <p className="text-[10px] font-bold text-brand">{sanitizerMsg}</p>
            )}
          </div>

          {/* Section: Photos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-content">Photos</h3>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Upload Photos</label>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-100 hover:bg-slate-200 text-content px-4 py-3 rounded-xl text-xs font-bold w-full border border-slate-200 transition-colors"
              >
                Select Photos from Gallery
              </button>
              <p className="text-[10px] font-bold text-muted mt-2 ml-2">
                {selectedFiles.length}/5 photos (Min: 1)
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={URL.createObjectURL(file)} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={submitting || selectedFiles.length < 1 || selectedFiles.length > 5}
            className="w-full bg-[#8B0000] hover:bg-[#6b0000] text-white py-4 rounded-full font-extrabold text-sm shadow-floating transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Premium Vehicle...</span>
              </>
            ) : (
              <span>Add Premium Post (+)</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
