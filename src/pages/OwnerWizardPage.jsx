import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Loader2, X, ArrowLeft } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';
import { hasForbiddenContact } from '../utils/textFilters';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export const OwnerWizardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPost = location.state?.isAdminPost || false;
  
  const { user, addGarageVehicle, showToast } = useApp();
  const { language, t } = useLanguage();

  const [submitting, setSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: 2022,
    condition: 'Used in Ethiopia',
    rate: '',
    category: 'Economy',
    zone: 'Bole',
    driverMode: 'Self-Drive',
    usageType: 'Personal Use',
    posterRole: 'Private Owner',
    ownerPhone: '',
    requirements: {
      kebeleId: true,
      driversLicense: true,
      check: false
    },
    depositAmount: '',
    advancedPaymentDays: 0,
    advancePayment: '',
    description: ''
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [sanitizerMsg, setSanitizerMsg] = useState('');

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
      setSanitizerMsg(t('privacyShieldActive'));
    } else {
      setSanitizerMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) { alert('Auth Error: Could not verify your user ID.'); return; }
    
    let missing = [];
    if (!formData.make) missing.push('Car Make');
    if (!formData.rate) missing.push('Daily Rate');
    if (!formData.advancePayment) missing.push('Advance Payment');
    if (!formData.ownerPhone) missing.push('Phone Number');
    
    if (missing.length > 0) {
      showToast('Please fill in the missing fields: ' + missing.join(', '));
      return;
    }

    if (selectedFiles.length < 1 || selectedFiles.length > 5) {
      showToast(`Please provide between 1 and 5 photos. You have ${selectedFiles.length}.`);
      return;
    }

    if (hasForbiddenContact(formData.description)) {
      showToast(
        language === 'am'
          ? 'ለደህንነት ሲባል በዝርዝር መግለጫ ውስጥ ስልክ ቁጥር፣ ቴሌግራም (@handle) ወይም ሊንክ ማስገባት አይቻልም።'
          : 'Phone numbers, Telegram handles (@username), and external links are not allowed in the description.'
      );
      return;
    }

    setSubmitting(true);

    try {
      let uploadedUrls = [];
      uploadedUrls = await Promise.all(
        selectedFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `${user.id}/${safeFileName}`;

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

      const requiresCheck = Boolean(formData.requirements.check);
      const depositAmt = Number(formData.depositAmount) || 0;
      const advDays = Number(formData.advancedPaymentDays) || 0;

      const vehicleRecord = {
        owner_id: user.id,
        make: formData.make,
        model: formData.model,
        year: Number(formData.year) || 2022,
        condition: formData.condition || 'Used in Ethiopia',
        daily_rate: Number(formData.rate) || 3500,
        category: formData.category || 'Economy',
        zone: formData.zone || 'Bole',
        driver_mode: formData.driverMode || 'Self-Drive',
        usage_type: formData.usageType,
        poster_role: formData.posterRole,
        owner_phone: formData.ownerPhone,
        requires_kebele_id: Boolean(formData.requirements.kebeleId),
        requires_drivers_license: Boolean(formData.requirements.driversLicense),
        requires_check: requiresCheck,
        deposit_amount: depositAmt,
        advanced_payment_days: advDays,
        advance_payment: formData.advancePayment,
        description: formData.description || 'Clean vehicle listed by owner.',
        image_url: uploadedUrls[0],
        images: uploadedUrls,
        status: 'active',
        is_premium: Boolean(isAdminPost),
        created_at: new Date().toISOString()
      };

      // Ensure user profile exists in 'profiles' table first to prevent foreign key violation on vehicles.owner_id
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Car Owner',
            phone: formData.ownerPhone,
            role: formData.posterRole || 'Private Owner'
          }, { onConflict: 'id' });

        if (profileError) {
          console.warn('Profile upsert notice:', profileError.message || profileError);
          // Fallback: minimal upsert in case optional columns are restricted
          await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' });
        }
      } catch (pErr) {
        console.warn('Profile sync notice:', pErr);
      }

      const { data, error: dbError } = await supabase
        .from('vehicles')
        .insert([vehicleRecord])
        .select()
        .maybeSingle();

      if (dbError) throw dbError;

      const insertedVehicle = data || vehicleRecord;
      addGarageVehicle(insertedVehicle);
      
      showToast('Your car is now live!');
      
      // Redirect user to their garage page
      navigate('/my-garage');
    } catch (error) {
      console.error('FULL ERROR LOG:', error);
      alert('CRITICAL SUBMISSION ERROR: ' + (error.message || JSON.stringify(error)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-8 max-w-3xl mx-auto fade-in">
      <div className="pt-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'am' ? 'ወደ ገበያ ይመለሱ' : 'Back to Marketplace'}</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content">
          {isAdminPost ? 'Admin Direct Post' : t('listCarHeader')}
        </h1>
        <p className="text-muted text-xs sm:text-sm max-w-lg mx-auto font-medium">
          {isAdminPost ? 'Vehicles posted here bypass review and are marked Premium automatically.' : t('listCarSub')}
        </p>
      </div>

      {/* Streamlined Single Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-soft p-6 md:p-8 border border-slate-100 space-y-8">
        
        {/* Section 1: Vehicle Specifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">1</div>
            <h3 className="text-base font-bold text-content">{t('vehicleSpecs')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">{t('make')} *</label>
              <input 
                type="text" 
                value={formData.make}
                onChange={(e) => handleChange('make', e.target.value)}
                placeholder="e.g. Toyota" 
                required
                className={`w-full rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all border ${attemptedSubmit && !formData.make ? 'border-red-500 bg-red-50' : 'bg-background border-transparent'}`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">{t('model')} *</label>
              <input 
                type="text" 
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="e.g. Vitz / Tucson" 
                required
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">{t('year')} *</label>
              <input 
                type="number" 
                value={formData.year}
                onChange={(e) => handleChange('year', e.target.value)}
                required
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">{t('condition')}</label>
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
          </div>
        </div>

        {/* Section 2: Pricing & Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">2</div>
            <h3 className="text-base font-bold text-content">{t('pricingSettings')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">{t('dailyRate')} *</label>
              <input 
                type="number" 
                value={formData.rate}
                onChange={(e) => handleChange('rate', e.target.value)}
                placeholder="e.g. 3500" 
                required
                className={`w-full rounded-xl p-3 text-sm font-extrabold text-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all border ${attemptedSubmit && !formData.rate ? 'border-red-500 bg-red-50' : 'bg-background border-transparent'}`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Advance Payment *</label>
              <select 
                value={formData.advancePayment}
                onChange={(e) => handleChange('advancePayment', e.target.value)}
                required
                className={`w-full rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all border ${attemptedSubmit && !formData.advancePayment ? 'border-red-500 bg-red-50' : 'bg-background border-transparent'}`}
              >
                <option value="" disabled>Choose advance payment...</option>
                <option value="15 days">15 days</option>
                <option value="1 month">1 month</option>
                <option value="2 months">2 months</option>
                <option value="3 months">3 months</option>
                <option value="4 months">4 months</option>
                <option value="5 months">5 months</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
              </select>
              <p className="text-[10px] text-gray-500 mt-1 ml-2 font-medium">How much should the renter pay upfront to secure the car?</p>
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
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">{t('zone')}</label>
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
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">{t('driverMode')}</label>
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
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Usage Type</label>
              <select 
                value={formData.usageType}
                onChange={(e) => handleChange('usageType', e.target.value)}
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              >
                <option value="Personal Use">Personal Use</option>
                <option value="Ride-Hailing (e.g., Feres/Ride)">Ride-Hailing (e.g., Feres/Ride)</option>
              </select>
              <p className="text-[10px] text-gray-500 mt-1 ml-2 font-medium">Is this car strictly for personal use or ride-hailing (like Feres)?</p>
            </div>
          </div>
        </div>

        {/* Section 3: Owner Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">3</div>
            <h3 className="text-base font-bold text-content">Owner Details</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">I am a... *</label>
              <select 
                value={formData.posterRole}
                onChange={(e) => handleChange('posterRole', e.target.value)}
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              >
                <option value="Private Owner">Private Owner</option>
                <option value="Broker">Broker</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">Contact Phone Number *</label>
              <input 
                type="tel" 
                value={formData.ownerPhone}
                onChange={(e) => handleChange('ownerPhone', e.target.value)}
                placeholder="e.g. 0911..." 
                required
                className={`w-full rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all border ${attemptedSubmit && !formData.ownerPhone ? 'border-red-500 bg-red-50' : 'bg-background border-transparent'}`}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Renter Requirements & Collateral */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">4</div>
            <h3 className="text-base font-bold text-content">{t('renterRequirements')}</h3>
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
              <span className="font-semibold text-content">{t('checkCollateral')}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">{t('deposit')}</label>
              <input 
                type="number" 
                value={formData.depositAmount}
                onChange={(e) => handleChange('depositAmount', e.target.value)}
                placeholder="e.g. 10000" 
                className="w-full bg-background rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-content ml-2 block mb-1">{t('advancedPayDays')}</label>
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
        </div>

        {/* Section 5: Privacy & Description */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">5</div>
            <h3 className="text-base font-bold text-content">{t('privacyProtection')}</h3>
          </div>
          
          <div className="bg-brand/5 border border-brand/20 p-4 rounded-2xl space-y-2">
            <span className="text-xs font-extrabold text-brand flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Privacy Shield Enabled
            </span>
            <p className="text-xs text-content font-medium">
              {t('privacyShieldActive')}
            </p>
            <textarea 
              value={formData.description}
              onChange={handleDescriptionChange}
              rows={3} 
              placeholder={t('describeCarPlaceholder')}
              className={`w-full bg-white rounded-xl p-3 text-xs font-medium focus:outline-none border ${hasForbiddenContact(formData.description) ? 'border-red-500 bg-red-50' : 'border-slate-100'}`}
            />
            {sanitizerMsg && (
              <p className="text-[10px] font-bold text-brand">{sanitizerMsg}</p>
            )}
          </div>
        </div>

        {/* Section 6: Photos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">6</div>
            <h3 className="text-base font-bold text-content">Photos</h3>
          </div>
          
          <div>
            <div className="mb-4 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-semibold text-amber-900">
                  {language === 'am' ? 'የፎቶ ደህንነት እና የግላዊነት መመሪያ' : 'Photo Privacy & Listing Guidelines'}
                </p>
                <ul className="text-amber-800 space-y-0.5 list-disc list-inside leading-relaxed">
                  <li>
                    {language === 'am' 
                      ? 'የመኪናውን ታርጋ ቁጥር ከመጫንዎ በፊት ይሸፍኑ ወይም ይሰርዙ (Crop/Blur ያድርጉ)::' 
                      : 'Please blur, cover, or crop out your vehicle license plate before uploading.'}
                  </li>
                  <li>
                    {language === 'am'
                      ? 'በፎቶው ላይ ምንም አይነት ስልክ ቁጥር ወይም ማስታወቂያ አያስቀምጡ::'
                      : 'Do not include phone numbers, watermark logos, or banners on photos.'}
                  </li>
                </ul>
              </div>
            </div>

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

        {/* Single Submit Button */}
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={submitting || selectedFiles.length < 1 || selectedFiles.length > 5}
            className="w-full bg-brand hover:bg-brand-hover text-white py-4 rounded-full font-extrabold text-sm shadow-floating transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('submittingVehicle')}</span>
              </>
            ) : (
              <span>{isAdminPost ? 'Post Premium Vehicle' : t('submitVehicle')}</span>
            )}
          </button>
        </div>

      </form>
    </section>
  );
};
