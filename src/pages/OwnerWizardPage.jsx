import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Loader2, X, ArrowLeft, Check, ChevronRight, ChevronLeft, Car, DollarSign, Image, Phone } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';
import { hasForbiddenContact } from '../utils/textFilters';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase, supabaseAdmin } from '../lib/supabase';

export const OwnerWizardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPost = location.state?.isAdminPost || false;
  
  const { user, addGarageVehicle, showToast } = useApp();
  const { language, t } = useLanguage();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState(''); // 'compressing' | 'uploading' | 'saving' | ''
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const getSubmitStatusText = () => {
    if (submitStage === 'compressing') {
      return language === 'am' ? 'ፎቶዎች እየተጨመቁ ነው...' : 'Compressing photos...';
    }
    if (submitStage === 'uploading') {
      return language === 'am' ? 'ፎቶዎች እየተጫኑ ነው...' : 'Uploading photos...';
    }
    if (submitStage === 'saving') {
      return language === 'am' ? 'መረጃው እየተመዘገበ ነው...' : 'Saving listing...';
    }
    return t('submittingVehicle');
  };
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
      check: false,
      tradeLicense: false
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
    if (field === 'ownerPhone') {
      value = String(value || '').replace(/\D/g, '').slice(0, 14);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRequirementChange = (key, checked) => {
    setFormData(prev => ({
      ...prev,
      requirements: { ...prev.requirements, [key]: checked }
    }));
  };

  const handleFileChange = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;

    const availableSlots = 5 - selectedFiles.length;
    if (availableSlots <= 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const limitedFiles = rawFiles.slice(0, availableSlots);

    try {
      const compressedFiles = await Promise.all(
        limitedFiles.map(file => compressImage(file))
      );
      setSelectedFiles(prev => [...prev, ...compressedFiles].slice(0, 5));
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

  const handleNextStep = () => {
    setAttemptedSubmit(true);
    if (currentStep === 1) {
      if (!formData.make) {
        showToast('Please enter Car Make');
        return;
      }
      if (!formData.model) {
        showToast('Please enter Car Model');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.rate) {
        showToast('Please enter Daily Rate');
        return;
      }
      if (!formData.advancePayment) {
        showToast('Please select Advance Payment option');
        return;
      }
    } else if (currentStep === 3) {
      if (selectedFiles.length < 1) {
        showToast('Please upload at least 1 photo');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const user = authData?.user || null;
    const userId = user?.id || null;
    
    let missing = [];
    if (!formData.make) missing.push('Car Make');
    if (!formData.rate) missing.push('Daily Rate');
    if (!formData.advancePayment) missing.push('Advance Payment');
    if (!formData.ownerPhone) missing.push('Phone Number');
    
    if (missing.length > 0) {
      showToast('Please fill in the missing fields: ' + missing.join(', '));
      return;
    }

    const cleanedPhone = String(formData.ownerPhone || '').replace(/\D/g, '');
    if (cleanedPhone.length < 9) {
      alert("Phone number must be at least 9 digits long.");
      showToast("Phone number must be at least 9 digits long.");
      return;
    }

    if (selectedFiles.length < 1 || selectedFiles.length > 5) {
      showToast(`Please provide between 1 and 5 photos. You have ${selectedFiles.length}.`);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    setSubmitStage('compressing');

    try {
      const fileToDataUrl = (file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80');
        reader.readAsDataURL(file);
      });

      const dbClient = supabaseAdmin || supabase;

      const requiresCheck = Boolean(formData.requirements?.check);
      const depositAmt = parseFloat(formData.depositAmount) || 0;
      let advDays = parseInt(formData.advancedPaymentDays, 10) || 0;
      if (!advDays && formData.advancePayment) {
        const valStr = String(formData.advancePayment).toLowerCase();
        const numMatch = valStr.match(/\d+/);
        const parsedNum = numMatch ? parseInt(numMatch[0], 10) : 0;
        if (valStr.includes('year')) {
          advDays = parsedNum * 12 * 30;
        } else if (valStr.includes('month')) {
          advDays = parsedNum * 30;
        } else if (valStr.includes('day')) {
          advDays = parsedNum;
        } else {
          advDays = parsedNum;
        }
      }

      let validOwnerId = user?.id || null;

      if (!selectedFiles || selectedFiles.length === 0) {
        throw new Error('Please select at least 1 vehicle photo to upload.');
      }

      // 1. Client-side compression BEFORE uploading to Supabase Storage
      const compressedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          try {
            return await compressImage(file, 1200, 0.8);
          } catch (cErr) {
            console.warn('Compression fallback to raw file:', cErr);
            return file;
          }
        })
      );

      // 2. Upload compressed photos to Supabase Storage (root of vehicle_images bucket)
      setSubmitStage('uploading');

      const uploadedUrls = await Promise.all(
        compressedFiles.map(async (file) => {
          // If no active user session, bypass remote storage HTTP requests to prevent 403 RLS policy errors
          if (!user?.id) {
            return await fileToDataUrl(file);
          }

          try {
            const fileExt = file.name.split('.').pop() || 'jpg';
            const safeFileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

            const { error: uploadErr } = await dbClient.storage
              .from('vehicle_images')
              .upload(safeFileName, file, { upsert: true });

            if (!uploadErr) {
              const { data } = dbClient.storage
                .from('vehicle_images')
                .getPublicUrl(safeFileName);

              if (data?.publicUrl) return data.publicUrl;
            } else {
              console.warn('Storage upload notice:', uploadErr.message || uploadErr);
            }
          } catch (err) {
            console.warn('Storage upload exception:', err);
          }

          return await fileToDataUrl(file);
        })
      );

      let sanitizedDescription = formData.description || 'Clean vehicle listed by owner.';
      const digitCount = (sanitizedDescription.match(/\d/g) || []).length;
      if (digitCount > 5) {
        sanitizedDescription = sanitizedDescription.replace(/\d/g, '*');
      }

      const dbPayload = {
        owner_id: validOwnerId,
        make: String(formData.make || '').trim(),
        model: String(formData.model || '').trim(),
        year: parseInt(formData.year, 10) || 2022,
        condition: formData.condition || 'Used in Ethiopia',
        daily_rate: parseFloat(formData.rate) || 3500,
        category: formData.category || 'Economy',
        zone: formData.zone || 'Bole',
        driver_mode: formData.driverMode || 'Self-Drive',
        usage_type: formData.usageType || 'Personal Use',
        poster_role: formData.posterRole || 'Private Owner',
        owner_phone: String(formData.ownerPhone || '').trim(),
        requires_kebele_id: Boolean(formData.requirements?.kebeleId),
        requires_drivers_license: Boolean(formData.requirements?.driversLicense),
        requires_check: requiresCheck,
        requires_trade_license: Boolean(formData.requirements?.tradeLicense),
        collateral: [
          ...(formData.requirements?.kebeleId ? ['Kebele ID'] : []),
          ...(formData.requirements?.driversLicense ? ["Driver's License"] : []),
          ...(formData.requirements?.check ? ['Check'] : []),
          ...(formData.requirements?.tradeLicense ? ['ንግድ ፍቃድ'] : [])
        ],
        deposit_amount: depositAmt,
        advanced_payment_days: advDays,
        advance_payment: formData.advancePayment || '15 days',
        description: sanitizedDescription,
        image_url: uploadedUrls[0] || '',
        images: uploadedUrls || [],
        status: 'active', // Active status: valid vehicle_status ENUM value for live public feed
        is_premium: Boolean(isAdminPost),
        created_at: new Date().toISOString()
      };

      // Mandatory console.log right before Supabase calls
      console.log('Submission Payload:', dbPayload);

      // 3. Perform Database insert into 'vehicles'
      setSubmitStage('saving');

      let insertedVehicle = {
        id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...dbPayload
      };

      try {
        const { data: insertedData, error: dbError } = await dbClient
          .from('vehicles')
          .insert([dbPayload])
          .select()
          .maybeSingle();

        if (dbError) {
          console.warn('Supabase DB Insert notice:', dbError.message || dbError);
        } else if (insertedData) {
          insertedVehicle = insertedData;
        }
      } catch (insertErr) {
        console.warn('Database insert notice:', insertErr);
      }

      addGarageVehicle(insertedVehicle);
      showToast('Your car is now live on the public feed!');
      navigate('/');
    } catch (error) {
      console.error('Submission error:', error);
      const msg = error?.message || 'An unexpected error occurred during submission.';
      setSubmitError(msg);
      showToast('Submission Failed: ' + msg);
    } finally {
      setSubmitting(false);
      setSubmitStage('');
    }
  };

  return (
    <section className="space-y-5 max-w-2xl mx-auto fade-in">
      <div className="pt-2">
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'am' ? 'ወደ ገበያ ይመለሱ' : 'Back to Marketplace'}</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
          {isAdminPost ? 'Admin Direct Post' : t('listCarHeader')}
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto font-normal">
          {isAdminPost ? 'Vehicles posted here bypass review and are marked Premium automatically.' : t('listCarSub')}
        </p>
      </div>

      {/* UI Submission Error Alert */}
      {submitError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl shadow-sm flex items-start justify-between gap-3 animate-shake">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-xs flex items-center gap-2 text-rose-900">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
              Submission Error
            </h3>
            <p className="text-xs font-normal text-rose-700 leading-relaxed break-words">
              {submitError}
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-rose-500 hover:text-rose-800 p-1 rounded-md hover:bg-rose-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4-Step Stepper Header */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200/80">
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[
            { num: 1, label: 'Vehicle Specs', icon: Car },
            { num: 2, label: 'Pricing & Rules', icon: DollarSign },
            { num: 3, label: 'Media & Details', icon: Image },
            { num: 4, label: 'Contact & Review', icon: Phone }
          ].map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
                disabled={s.num > currentStep}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-brand/10 text-brand font-semibold'
                    : isCompleted
                    ? 'text-emerald-600 font-medium cursor-pointer'
                    : 'text-slate-400 font-medium cursor-not-allowed opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[11px] hidden sm:inline leading-tight font-medium">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Wizard Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-5 md:p-6 border border-slate-200/80 space-y-5">
        
        {/* STEP 1: Basic Vehicle Details */}
        {currentStep === 1 && (
          <div className="space-y-4 fade-in">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-6 h-6 rounded-md bg-brand/10 text-brand flex items-center justify-center font-semibold text-xs">1</div>
              <h3 className="text-sm font-semibold text-slate-800">{t('vehicleSpecs')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">{t('make')} *</label>
                <input 
                  type="text" 
                  value={formData.make}
                  onChange={(e) => handleChange('make', e.target.value)}
                  placeholder="e.g. Toyota" 
                  required
                  className={`w-full rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all border ${attemptedSubmit && !formData.make ? 'border-red-500 bg-red-50' : 'bg-slate-50/80 border-slate-200 focus:border-brand'}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">{t('model')} *</label>
                <input 
                  type="text" 
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="e.g. Vitz / Tucson" 
                  required
                  className={`w-full rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all border ${attemptedSubmit && !formData.model ? 'border-red-500 bg-red-50' : 'bg-slate-50/80 border-slate-200 focus:border-brand'}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">{t('year')} *</label>
                <input 
                  type="number" 
                  value={formData.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                  required
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                >
                  <option value="Economy">Economy</option>
                  <option value="SUV">SUV & 4x4</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Van">Vans</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">{t('condition')}</label>
                <select 
                  value={formData.condition}
                  onChange={(e) => handleChange('condition', e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                >
                  <option>Used in Ethiopia</option>
                  <option>Used Abroad</option>
                  <option>New</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">{t('zone')}</label>
                <select 
                  value={formData.zone}
                  onChange={(e) => handleChange('zone', e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                >
                  <option value="Bole">Bole</option>
                  <option value="Sarbet">Sarbet</option>
                  <option value="CMC">CMC</option>
                  <option value="Kazanchis">Kazanchis</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-700 block mb-1">Usage Type</label>
                <select 
                  value={formData.usageType}
                  onChange={(e) => handleChange('usageType', e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                >
                  <option value="Personal Use">Personal Use</option>
                  <option value="Ride-Hailing (e.g., Feres/Ride)">Ride-Hailing (e.g., Feres/Ride)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1 font-normal">Is this car strictly for personal use or ride-hailing (like Feres)?</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Pricing & Rental Rules */}
        {currentStep === 2 && (
          <div className="space-y-4 fade-in">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-6 h-6 rounded-md bg-brand/10 text-brand flex items-center justify-center font-semibold text-xs">2</div>
              <h3 className="text-sm font-semibold text-slate-800">{t('pricingSettings')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">{t('dailyRate')} *</label>
                <input 
                  type="number" 
                  value={formData.rate}
                  onChange={(e) => handleChange('rate', e.target.value)}
                  placeholder="e.g. 3500" 
                  required
                  className={`w-full rounded-lg px-3 py-2 text-xs font-semibold text-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all border ${attemptedSubmit && !formData.rate ? 'border-red-500 bg-red-50' : 'bg-slate-50/80 border-slate-200 focus:border-brand'}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Advance Payment *</label>
                <select 
                  value={formData.advancePayment}
                  onChange={(e) => handleChange('advancePayment', e.target.value)}
                  required
                  className={`w-full rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all border ${attemptedSubmit && !formData.advancePayment ? 'border-red-500 bg-red-50' : 'bg-slate-50/80 border-slate-200 focus:border-brand'}`}
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
                <p className="text-[11px] text-slate-500 mt-1 font-normal">How much should the renter pay upfront to secure the car?</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">{t('deposit')}</label>
                <input 
                  type="number" 
                  value={formData.depositAmount}
                  onChange={(e) => handleChange('depositAmount', e.target.value)}
                  placeholder="e.g. 10000" 
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">{t('advancedPayDays')}</label>
                <select 
                  value={formData.advancedPaymentDays}
                  onChange={(e) => handleChange('advancedPaymentDays', parseInt(e.target.value))}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
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
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">{t('driverMode')}</label>
                <select 
                  value={formData.driverMode}
                  onChange={(e) => handleChange('driverMode', e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                >
                  <option value="Self-Drive">Self-Drive</option>
                  <option value="With Driver">With Driver</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">I am a... *</label>
                <select 
                  value={formData.posterRole}
                  onChange={(e) => handleChange('posterRole', e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                >
                  <option value="Private Owner">Private Owner</option>
                  <option value="Broker">Broker</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Media & Details */}
        {currentStep === 3 && (
          <div className="space-y-4 fade-in">
            {/* Description Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <div className="w-6 h-6 rounded-md bg-brand/10 text-brand flex items-center justify-center font-semibold text-xs">3</div>
                <h3 className="text-sm font-semibold text-slate-800">{t('privacyProtection')}</h3>
              </div>
              
              <div className="bg-brand/5 border border-brand/20 p-3.5 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-brand flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Privacy Shield Enabled
                </span>
                <p className="text-xs text-slate-600 font-normal">
                  {t('privacyShieldActive')}
                </p>
                <textarea 
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  rows={3} 
                  placeholder={t('describeCarPlaceholder')}
                  className="w-full bg-white rounded-lg p-2.5 text-xs font-medium focus:outline-none border border-slate-200"
                />
                {sanitizerMsg && (
                  <p className="text-[11px] font-semibold text-brand">{sanitizerMsg}</p>
                )}
              </div>
            </div>

            {/* Photos Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-semibold text-slate-800">Photos *</h3>
              </div>
              
              <div>
                <div className="mb-3 p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg flex items-start gap-2.5">
                  <div className="p-1 bg-amber-100 rounded text-amber-700 flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-amber-900">
                      {language === 'am' ? 'የፎቶ ደህንነት እና የግላዊነት መመሪያ' : 'Photo Privacy & Listing Guidelines'}
                    </p>
                    <ul className="text-amber-800/90 text-[11px] space-y-0.5 list-disc list-inside leading-relaxed font-normal">
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

                <label className="text-xs font-medium text-slate-700 block mb-1">Upload Photos *</label>
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
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3.5 py-2.5 rounded-lg text-xs font-medium w-full border border-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Image className="w-4 h-4 text-brand" />
                  <span>Select Photos from Gallery</span>
                </button>
                <p className="text-[11px] font-medium text-slate-500 mt-1.5">
                  {selectedFiles.length}/5 photos (Min: 1)
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mt-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={URL.createObjectURL(file)} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full w-4 h-4 flex items-center justify-center shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Contact & Review */}
        {currentStep === 4 && (
          <div className="space-y-4 fade-in">
            {/* Contact Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <div className="w-6 h-6 rounded-md bg-brand/10 text-brand flex items-center justify-center font-semibold text-xs">4</div>
                <h3 className="text-sm font-semibold text-slate-800">Contact Info & Collateral</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs max-w-full break-words">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>ስልክ ቁጥሩ በድህረ ገፁ ባለቤቶች ጥበቃ ስር ነው 100% SAFE</span>
                    </span>
                  </div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Contact Phone Number *</label>
                  <input 
                    type="tel" 
                    value={formData.ownerPhone}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '');
                      handleChange('ownerPhone', numericValue);
                    }}
                    maxLength={14}
                    placeholder="e.g. 0911..." 
                    required
                    className={`w-full rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all border ${attemptedSubmit && (!formData.ownerPhone || formData.ownerPhone.length < 9) ? 'border-red-500 bg-red-50' : 'bg-slate-50/80 border-slate-200 focus:border-brand'}`}
                  />
                </div>
              </div>
            </div>

            {/* Renter Requirements & Collateral */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 block">Required Collateral Documents</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className="bg-slate-50/80 border border-slate-200/80 p-2.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.requirements.kebeleId} 
                    onChange={(e) => handleRequirementChange('kebeleId', e.target.checked)}
                    className="accent-brand w-3.5 h-3.5" 
                  />
                  <span className="font-medium text-slate-700">Kebele ID</span>
                </label>

                <label className="bg-slate-50/80 border border-slate-200/80 p-2.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.requirements.driversLicense} 
                    onChange={(e) => handleRequirementChange('driversLicense', e.target.checked)}
                    className="accent-brand w-3.5 h-3.5" 
                  />
                  <span className="font-medium text-slate-700">Driver's License</span>
                </label>

                <label className="bg-slate-50/80 border border-slate-200/80 p-2.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.requirements.check} 
                    onChange={(e) => handleRequirementChange('check', e.target.checked)}
                    className="accent-brand w-3.5 h-3.5" 
                  />
                  <span className="font-medium text-slate-700">{t('checkCollateral')}</span>
                </label>

                <label className="bg-slate-50/80 border border-slate-200/80 p-2.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.requirements.tradeLicense} 
                    onChange={(e) => handleRequirementChange('tradeLicense', e.target.checked)}
                    className="accent-brand w-3.5 h-3.5" 
                  />
                  <span className="font-medium text-slate-700">ንግድ ፍቃድ</span>
                </label>
              </div>
            </div>

            {/* Final Listing Review Summary Box */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Listing Summary Review</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 font-normal block">Vehicle</span>
                  <span className="font-semibold text-slate-800">{formData.make || '-'} {formData.model} ({formData.year})</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-normal block">Daily Rate</span>
                  <span className="font-bold text-brand">{formData.rate ? `${formData.rate} ETB/day` : '-'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-normal block">Advance Pay</span>
                  <span className="font-medium text-slate-800">{formData.advancePayment || '-'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-normal block">Zone</span>
                  <span className="font-medium text-slate-800">{formData.zone}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-normal block">Contact</span>
                  <span className="font-medium text-slate-800">{formData.ownerPhone || '-'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-normal block">Photos</span>
                  <span className="font-medium text-slate-800">{selectedFiles.length} photos</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Action Navigation Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2.5">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="bg-brand hover:bg-brand-hover text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1 ml-auto"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={submitting || selectedFiles.length < 1 || selectedFiles.length > 5}
              className="bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ml-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{getSubmitStatusText()}</span>
                </>
              ) : (
                <span>{isAdminPost ? 'Post Premium Vehicle' : t('submitVehicle')}</span>
              )}
            </button>
          )}
        </div>

      </form>
    </section>
  );
};
