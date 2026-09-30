import React from 'react';
import { Check, ChevronLeft, Database, Globe, LogOut, RotateCcw, Settings, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    resetAllData,
    logout,
    setActiveTab,
    currentUser,
  } = useApp();

  const goBack = () => setActiveTab(currentUser ? 'profile' : 'feed');

  const handleLogout = () => {
    const message = language === 'ar'
      ? 'هل تريد تسجيل الخروج من حسابك؟'
      : 'Do you want to sign out of your account?';
    if (window.confirm(message)) {
      logout();
      setActiveTab('feed');
    }
  };

  const handleReset = () => {
    const message = language === 'ar'
      ? 'هل تريد إعادة ضبط البيانات المحلية؟'
      : 'Reset local data on this device?';
    if (window.confirm(message)) resetAllData();
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-neutral-950 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/20">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">DZCORE</p>
              <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{t.settingsTitle}</h1>
              <p className="mt-1 text-sm text-neutral-400">{t.languageDescription}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-5 shadow-xl shadow-black/10 md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-sky-500/10 p-2 text-sky-400"><Globe className="h-5 w-5" /></div>
              <div>
                <h2 className="text-sm font-bold text-white">{t.languageSetting}</h2>
                <p className="text-xs text-neutral-500">{t.languageDescription}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { value: 'en' as const, flag: '🇬🇧', title: 'English', detail: 'Left-to-right (LTR)' },
                { value: 'ar' as const, flag: '🇩🇿', title: 'العربية (Arabic)', detail: 'واجهة عربية مع اتجاه ثابت' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLanguage(option.value)}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-start transition ${language === option.value ? 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'border-white/10 bg-neutral-950/60 hover:border-white/20 hover:bg-white/[0.04]'}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{option.flag}</span>
                    <span><span className="block text-sm font-semibold text-white">{option.title}</span><span className="mt-1 block text-[11px] text-neutral-500">{option.detail}</span></span>
                  </span>
                  {language === option.value && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" /></span>}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-5 shadow-xl shadow-black/10">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-2 text-violet-400"><Database className="h-5 w-5" /></div>
              <div><h2 className="text-sm font-bold text-white">{t.dataSetting}</h2><p className="text-xs text-neutral-500">{t.resetAllDataHint}</p></div>
            </div>
            <button type="button" onClick={handleReset} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-neutral-950/60 p-4 text-start transition hover:border-rose-500/30 hover:bg-rose-500/5">
              <span><span className="block text-sm font-semibold text-neutral-200">{t.resetAllData}</span><span className="mt-1 block text-xs text-neutral-500">{language === 'ar' ? 'يمسح البيانات المحلية على هذا الجهاز فقط' : 'Clears local data on this device only'}</span></span>
              <RotateCcw className="h-4 w-4 shrink-0 text-neutral-400" />
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-5 shadow-xl shadow-black/10">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400"><ShieldCheck className="h-5 w-5" /></div>
              <div><h2 className="text-sm font-bold text-white">{language === 'ar' ? 'الحساب والجلسة' : 'Account & session'}</h2><p className="text-xs text-neutral-500">{currentUser ? `@${currentUser.username}` : (language === 'ar' ? 'زائر' : 'Guest')}</p></div>
            </div>
            {currentUser ? (
              <button type="button" onClick={handleLogout} className="flex w-full items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-start transition hover:border-rose-500/40 hover:bg-rose-500/10">
                <span><span className="block text-sm font-semibold text-rose-300">{t.navLogout}</span><span className="mt-1 block text-xs text-neutral-500">{language === 'ar' ? 'الخروج من هذا الجهاز' : 'Sign out from this device'}</span></span>
                <LogOut className="h-4 w-4 text-rose-400" />
              </button>
            ) : (
              <button type="button" onClick={() => setActiveTab('feed')} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-neutral-200 transition hover:bg-white/[0.08]">{language === 'ar' ? 'العودة للرئيسية' : 'Return home'}</button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
