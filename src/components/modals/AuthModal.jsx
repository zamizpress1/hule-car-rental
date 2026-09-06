import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, User, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const AuthModal = () => {
  const navigate = useNavigate();
  const { modals, closeModal, showToast } = useApp();
  const { signIn, signUp } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSignInLoading, setIsSignInLoading] = useState(false);
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const [error, setError] = useState('');

  if (!modals.auth) return null;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsSignInLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message);
        showToast('Login failed');
      } else {
        handleSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsSignInLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || !fullName) {
      setError('Please fill in all fields to create an account');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSignUpLoading(true);
    try {
      const { error: signUpError } = await signUp(email, password, fullName);
      
      if (signUpError) {
        setError(signUpError.message);
      } else {
        handleSuccess();
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSignUpLoading(false);
    }
  };

  const handleSuccess = () => {
    showToast('Welcome to Hule የመኪና ኪራይ!');
    closeModal('auth');
    navigate('/list-car');
    
    // Reset form
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
    closeModal('auth');
  };

  return (
    <div className="fixed inset-0 z-50 flex md:items-center justify-center bg-slate-950/70 backdrop-blur-md p-0 md:p-4 transition-opacity">
      {/* 
        Mobile First UI:
        - Mobile: fixed to bottom, rounded top corners
        - Desktop (md): centered, fully rounded 
      */}
      <div className="bg-white max-w-md w-full fixed bottom-0 md:relative rounded-t-3xl md:rounded-3xl p-6 md:p-8 shadow-2xl transition-transform transform translate-y-0 border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={handleClose} 
          className="absolute top-5 right-5 text-muted hover:text-content bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden"></div>

        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => { 
              setIsLoginMode(true); 
              setError(''); 
              setPassword('');
              setShowPassword(false);
            }}
            className={`flex-1 pb-3 text-sm font-bold transition-colors ${isLoginMode ? 'border-b-2 border-brand text-brand' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { 
              setIsLoginMode(false); 
              setError(''); 
              setPassword('');
              setShowPassword(false);
            }}
            className={`flex-1 pb-3 text-sm font-bold transition-colors ${!isLoginMode ? 'border-b-2 border-brand text-brand' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Sign Up
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-content leading-none mb-1">
              {isLoginMode ? 'Welcome Back' : 'Create Account'}
            </h3>
            <p className="text-xs text-muted">
              {isLoginMode ? 'Sign in to manage your fleet and bookings.' : 'Join Hule የመኪና ኪራይ to list your cars.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs font-semibold text-danger">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="text-[10px] font-bold text-content ml-2 mb-1 block">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Bekele Tadesse" 
                  className="w-full bg-background rounded-2xl pl-10 pr-3.5 py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-content ml-2 mb-1 block">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@fetandrive.com" 
                className="w-full bg-background rounded-2xl pl-10 pr-3.5 py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-content ml-2 mb-1 block">Password *</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-background rounded-2xl pl-10 pr-12 py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-content transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="pt-2 flex flex-col gap-4">
            {isLoginMode ? (
              <>
                <button 
                  type="button" 
                  onClick={handleSignIn}
                  disabled={isSignInLoading}
                  className="w-full bg-content hover:bg-slate-800 text-white py-3.5 rounded-full font-bold text-sm shadow-soft transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSignInLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => { 
                      setIsLoginMode(false); 
                      setError(''); 
                      setPassword('');
                      setShowPassword(false);
                    }}
                    className="text-xs font-semibold text-muted hover:text-brand transition-colors"
                  >
                    Don't have an account? Sign up
                  </button>
                </div>
              </>
            ) : (
              <>
                <button 
                  type="button" 
                  onClick={handleSignUp}
                  disabled={isSignUpLoading}
                  className="w-full bg-brand hover:bg-brand-hover text-white py-3.5 rounded-full font-bold text-sm shadow-floating transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSignUpLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => { 
                      setIsLoginMode(true); 
                      setError(''); 
                      setPassword('');
                      setShowPassword(false);
                    }}
                    className="text-xs font-semibold text-muted hover:text-brand transition-colors"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
