import React, { useState } from 'react';
import { Check, ChevronLeft, Globe, KeyRound, LogOut, Mail, Settings, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    logout,
    setActiveTab,
    currentUser,
    updateAccountEmail,
    updateAccountPassword,
  } = useApp();

  const [newEmail, setNewEmail] = useState(currentUser?.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
                { value: 'fr' as const, flag: '🇫🇷', title: 'Français', detail: 'Interface en français' },
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

          {currentUser && (
            <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-5 shadow-xl shadow-black/10 md:col-span-2">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/10 p-2 text-violet-300"><KeyRound className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-sm font-bold text-white">{language === 'ar' ? 'معلومات الحساب' : 'Account information'}</h2>
                  <p className="text-xs text-neutral-500">{language === 'ar' ? 'غيّر البريد الإلكتروني أو كلمة المرور بأمان.' : 'Securely update your email or password.'}</p>
                </div>
              </div>
              <div className="mb-5 rounded-2xl border border-white/10 bg-neutral-950/50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{language === 'ar' ? 'اسم المستخدم' : 'Username'}</p>
                <p className="mt-1 font-mono text-sm text-white">@{currentUser.username}</p>
                <p className="mt-2 text-[11px] text-neutral-500">{language === 'ar' ? 'اسم المستخدم لا يتغير من هنا.' : 'Your username cannot be changed here.'}</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <form onSubmit={async (event) => { event.preventDefault(); if (!newEmail.trim() || !emailPassword) return; if (await updateAccountEmail(newEmail, emailPassword)) setEmailPassword(''); }} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white"><Mail className="h-4 w-4 text-sky-400" />{language === 'ar' ? 'تغيير البريد الإلكتروني' : 'Change email'}</div>
                  <input type="email" required value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="name@example.com" className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/60" />
                  <input type="password" required value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} placeholder={language === 'ar' ? 'كلمة المرور الحالية للتأكيد' : 'Current password to confirm'} className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/60" />
                  <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-500">{language === 'ar' ? 'حفظ البريد' : 'Save email'}</button>
                </form>
                <form onSubmit={async (event) => { event.preventDefault(); if (newPassword.length < 8 || newPassword !== confirmPassword || !currentPassword) return; if (await updateAccountPassword(newPassword, currentPassword)) { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); } }} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white"><KeyRound className="h-4 w-4 text-violet-300" />{language === 'ar' ? 'تغيير كلمة المرور' : 'Change password'}</div>
                  <input type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder={language === 'ar' ? 'كلمة المرور الحالية' : 'Current password'} className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60" />
                  <input type="password" required minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder={language === 'ar' ? 'كلمة المرور الجديدة (8 أحرف على الأقل)' : 'New password (8+ characters)'} className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60" />
                  <input type="password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm new password'} className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60" />
                  <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-500">{language === 'ar' ? 'حفظ كلمة المرور' : 'Save password'}</button>
                </form>
              </div>
            </div>
          )}


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
