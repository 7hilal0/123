import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, User as UserIcon, Lock, Mail, ArrowRight, ArrowLeft, Upload } from 'lucide-react';
import { readImageFile } from '../../utils/fileUpload';
import { DEFAULT_USER_AVATAR, PRESET_AVATARS } from '../../utils/avatarConstants';
import { ThumbnailSelector } from '../common/ThumbnailSelector';


export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalMode,
    setAuthModalOpen,
    login,
    register,
    t,
    dir,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode || 'login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationBusy, setVerificationBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!authModalOpen) return null;

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const dataUrl = await readImageFile(file, 400, 0.85);
      setAvatarPreview(dataUrl);
      setErrorMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process image';
      setErrorMessage(msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'login') {
      if (!username.trim()) {
        setErrorMessage('Please enter your username or email');
        return;
      }
      setVerificationBusy(true);
      try {
        const success = await login(username.trim(), password.trim() || undefined);
        if (!success) setErrorMessage('تعذر تسجيل الدخول. تحقق من اسم المستخدم أو البريد وكلمة المرور.');
      } finally {
        setVerificationBusy(false);
      }
    } else {
      if (!username.trim() || !displayName.trim()) {
        setErrorMessage('Please fill in all required fields');
        return;
      }
      if (username.trim().replace(/[^a-zA-Z0-9_]/g, '').length < 3) {
        setErrorMessage('Username must contain at least 3 letters or numbers');
        return;
      }
      if (!email.trim()) {
        setErrorMessage('Email is required');
        return;
      }
      if (password.trim().length < 8) {
        setErrorMessage('Password must contain at least 8 characters');
        return;
      }
      setVerificationBusy(true);
      try {
        const success = await register(username.trim(), displayName.trim(), email.trim(), password.trim(), avatarPreview || undefined);
        if (!success) setErrorMessage('Username or email is already taken');
      } finally {
        setVerificationBusy(false);
      }
    }
  };

  const SubmitArrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-start">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">
                {mode === 'login' ? t.loginTitle : t.registerTitle}
              </h3>
              <p className="text-xs text-neutral-400">
                {mode === 'login' ? t.loginSub : t.registerSub}
              </p>
            </div>
          </div>

          <button
            onClick={() => setAuthModalOpen(false)}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex border-b border-white/5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors relative cursor-pointer ${
              mode === 'login' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>{t.navLogin}</span>
            {mode === 'login' && (
              <span className="absolute bottom-0 start-0 end-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors relative cursor-pointer ${
              mode === 'register' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>{t.navRegister}</span>
            {mode === 'register' && (
              <span className="absolute bottom-0 start-0 end-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {mode === 'register' && (
            <>
              {/* Thumbnail & Avatar Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {t.choosePresetAvatar || 'الصورة المصغرة للحساب'}
                </label>
                <ThumbnailSelector
                  compact={true}
                  selectedUrl={avatarPreview || DEFAULT_USER_AVATAR}
                  onSelect={(url) => setAvatarPreview(url)}
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {t.displayName} <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-500 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl ps-10 pe-3.5 py-2.5 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
                  />
                </div>
              </div>
            </>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.username} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="text-neutral-500 font-mono text-xs absolute start-3.5 top-1/2 -translate-y-1/2">
                @
              </span>
              <input
                type="text"
                required
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl ps-8 pe-3.5 py-2.5 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-start"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                {t.email} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl ps-10 pe-3.5 py-2.5 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.password} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl ps-10 pe-3.5 py-2.5 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
              />
            </div>
          </div>



          <button
            type="submit"
            disabled={verificationBusy}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 disabled:cursor-wait text-white font-semibold text-xs md:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
          >
            <span>{mode === 'login' ? t.loginBtn : 'Create account'}</span>
            <SubmitArrow className="w-4 h-4" />
          </button>

          <div className="pt-3 border-t border-white/5 text-[11px] text-neutral-400 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMessage('');
              }}
              className="text-emerald-400 hover:underline"
            >
              {mode === 'login' ? t.dontHaveAccount : t.alreadyHaveAccount}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
