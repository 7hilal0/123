import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, User as UserIcon, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { readImageFile } from '../../utils/fileUpload';


export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalMode,
    setAuthModalOpen,
    login,
    googleLogin,
    register,
    t,
    dir,
    language,
    setLanguage,
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
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    if (!authModalOpen || !googleButtonRef.current) return;
    let cancelled = false;

    const renderGoogleButton = () => {
      const container = googleButtonRef.current;
      const google = (window as any).google;
      if (cancelled || !container || !google?.accounts?.id) return;
      container.innerHTML = '';

      const isDzcoreApp = typeof navigator !== 'undefined' && navigator.userAgent.includes('DZCOREApp/1.0');
      if (isDzcoreApp) return;

      const googleConfig: any = {
        client_id: '991149566827-l73oec1hjpu6jb21hftr4a2e1gille3m.apps.googleusercontent.com',
        auto_select: false,
        // FedCM button UX is not reliable inside Android WebView and can
        // produce Google's "400 malformed request" page. Keep it disabled
        // for the native wrapper; normal browsers can continue using it.
        use_fedcm_for_button: !isDzcoreApp,
      };

      if (isDzcoreApp) {
        // In the Android WebView, use Google's full-page redirect flow.
        // The Cloudflare callback exchanges the Google credential for a
        // one-time app code and redirects back to dzcore://google-login.
        googleConfig.ux_mode = 'redirect';
        googleConfig.login_uri = 'https://dzcore.top/api/auth/google/app-callback';
      } else {
        googleConfig.ux_mode = 'popup';
        googleConfig.callback = async (response: { credential?: string }) => {
          if (cancelled) return;
          if (!response?.credential) {
            setErrorMessage('لم يتم استلام بيانات تسجيل الدخول من Google. حاول مرة أخرى.');
            return;
          }

          if (mode === 'register') {
            const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
            if (cleanUsername.length < 3) {
              setErrorMessage('أدخل اسم مستخدم من 3 أحرف أو أرقام على الأقل أولاً.');
              return;
            }
            if (cleanUsername !== username.trim()) {
              setErrorMessage('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام و _ فقط.');
              return;
            }
          }

          setGoogleBusy(true);
          setErrorMessage('');
          try {
            const success = await googleLogin(
              response.credential,
              mode === 'register'
                ? { username: username.trim(), ...(displayName.trim() ? { displayName: displayName.trim() } : {}) }
                : undefined
            );
            if (!success && !cancelled) setErrorMessage('تعذر تسجيل الدخول باستخدام Google. حاول مرة أخرى.');
          } catch (error) {
            console.error('[Google UI] Login failed:', error);
            if (!cancelled) setErrorMessage('حدث خطأ أثناء تسجيل الدخول باستخدام Google.');
          } finally {
            if (!cancelled) setGoogleBusy(false);
          }
        };
      }

      google.accounts.id.initialize(googleConfig);

      const availableWidth = container.clientWidth || 400;
      const buttonWidth = Math.min(400, Math.max(220, Math.floor(availableWidth)));
      google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: buttonWidth,
        logo_alignment: 'center',
        locale: language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en',
      });
    };

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement | null;
    if ((window as any).google?.accounts?.id) renderGoogleButton();
    else if (existing) existing.addEventListener('load', renderGoogleButton, { once: true });
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      script.onerror = () => {
        if (!cancelled) setErrorMessage('تعذر تحميل تسجيل الدخول بواسطة Google. تحقق من اتصال الإنترنت.');
      };
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (googleButtonRef.current) googleButtonRef.current.innerHTML = '';
    };
  }, [authModalOpen, mode, language, username, displayName, googleLogin]);

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
  const isDzcoreApp = typeof navigator !== 'undefined' && navigator.userAgent.includes('DZCOREApp/1.0');

  const startAppGoogleOAuth = () => {
    if (!isDzcoreApp) return;
    if (mode === 'register') {
      const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        setErrorMessage('أدخل اسم مستخدم من 3 أحرف أو أرقام على الأقل أولاً.');
        return;
      }
      if (cleanUsername !== username.trim()) {
        setErrorMessage('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام و _ فقط.');
        return;
      }
    }
    setGoogleBusy(true);
    setErrorMessage('');
    const params = new URLSearchParams({
      mode,
      username: mode === 'register' ? username.trim() : '',
      displayName: mode === 'register' ? displayName.trim() : '',
    });
    window.location.href = 'https://dzcore.top/api/auth/google/app-start?' + params.toString();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-start">
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-[28px] max-w-md w-full overflow-hidden shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25 shrink-0">
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

          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ar' | 'fr')}
              aria-label="Language"
              className="bg-neutral-800 border border-white/10 text-neutral-200 text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="en">EN</option>
              <option value="ar">العربية</option>
              <option value="fr">FR</option>
            </select>
            <button
              onClick={() => setAuthModalOpen(false)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex p-1.5 mx-5 mt-4 rounded-xl bg-neutral-950/70 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold text-center transition-all relative cursor-pointer ${
              mode === 'login' ? 'text-white bg-white/10 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>{t.navLogin}</span>
            {mode === 'login' && (
              <span className="hidden" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors relative cursor-pointer ${
              mode === 'register' ? 'text-white bg-white/10 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
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
        <form onSubmit={handleSubmit} className="p-5 md:p-6 pt-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {mode === 'register' && (
            <>
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
              {t.username}
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
                <input type="email" required placeholder="name@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl ps-10 pe-3.5 py-2.5 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.password} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input type="password" required placeholder="••••••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl ps-10 pe-3.5 py-2.5 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start" />
            </div>
          </div>

          <button
            type="submit"
            disabled={verificationBusy || googleBusy}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 disabled:cursor-wait text-white font-semibold text-xs md:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
          >
            <span>{mode === 'login' ? t.loginBtn : 'Create account'}</span>
            <SubmitArrow className="w-4 h-4" />
          </button>



          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-neutral-500">OR</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="w-full">
            <div
              onClick={isDzcoreApp ? startAppGoogleOAuth : undefined}
              className={"relative w-full h-12 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all overflow-hidden flex items-center justify-center " + (isDzcoreApp ? "cursor-pointer" : "")}
            >
              <span className="text-sm font-semibold text-white">Continue with Google</span>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="absolute start-3 w-6 h-6 object-contain z-10"
              />
              <div
                ref={googleButtonRef}
                className={"absolute inset-0 z-20 opacity-0 overflow-hidden rounded-xl " + (googleBusy || isDzcoreApp ? "pointer-events-none" : "")}
                aria-label="Continue with Google"
              />
            </div>
          </div>
          {mode === 'register' && !username.trim() && (
            <p className="text-[10px] text-neutral-500 text-center">
              أدخل اسم المستخدم أولاً عند إنشاء حساب جديد.
            </p>
          )}

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
