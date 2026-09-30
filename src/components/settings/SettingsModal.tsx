import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Globe, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t } = useApp();
  if (!isOpen) return null;

  const options = [
    { value: 'en' as const, flag: '🇬🇧', title: 'English', detail: 'Left-to-right (LTR)' },
    { value: 'ar' as const, flag: '🇩🇿', title: 'العربية (Arabic)', detail: 'واجهة عربية مع اتجاه ثابت' },
    { value: 'fr' as const, flag: '🇫🇷', title: 'Français', detail: 'Interface en français' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 text-start shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white"><Globe className="h-4 w-4" /></div>
            <div><h3 className="font-display text-base font-bold text-white">{t.settingsTitle}</h3><p className="text-xs text-neutral-400">{t.languageDescription}</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-neutral-400 transition-colors hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">{t.languageSetting}</h4>
          {options.map((option) => (
            <button key={option.value} type="button" onClick={() => setLanguage(option.value)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-start transition ${language === option.value ? 'border-emerald-500/40 bg-emerald-600/15 ring-1 ring-emerald-500/20' : 'border-white/10 bg-neutral-950/70 hover:bg-white/5'}`}>
              <span className="flex items-center gap-3"><span className="text-xl">{option.flag}</span><span><span className="block text-sm font-semibold text-white">{option.title}</span><span className="mt-1 block text-[11px] text-neutral-500">{option.detail}</span></span></span>
              {language === option.value && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" /></span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
