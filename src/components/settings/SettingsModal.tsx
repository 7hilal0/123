import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Globe, Database, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Language } from '../../locales/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t, resetAllData } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 text-start">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">
                {t.settingsTitle}
              </h3>
              <p className="text-xs text-neutral-400">
                {t.languageDescription}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Language Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              {t.languageSetting}
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {/* English Option (Primary Default) */}
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  language === 'en'
                    ? 'bg-emerald-600/15 border-emerald-500/40 text-white shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-neutral-950/70 border-white/5 text-neutral-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🇬🇧</span>
                  <div className="text-start">
                    <div className="text-xs md:text-sm font-semibold flex items-center gap-1.5">
                      <span>English</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
                        Primary
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      Left-to-right (LTR)
                    </div>
                  </div>
                </div>

                {language === 'en' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Arabic Option */}
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  language === 'ar'
                    ? 'bg-emerald-600/15 border-emerald-500/40 text-white shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-neutral-950/70 border-white/5 text-neutral-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🇩🇿</span>
                  <div className="text-start">
                    <div className="text-xs md:text-sm font-semibold">
                      العربية (Arabic)
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      واجهة عربية مع اتجاه ثابت
                    </div>
                  </div>
                </div>

                {language === 'ar' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Data Reset */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              {t.dataSetting}
            </label>

            <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-white/5 flex items-center justify-between gap-3">
              <div className="text-start">
                <div className="text-xs font-semibold text-neutral-200">
                  {t.resetAllData}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                  {t.resetAllDataHint}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm(language === 'ar' ? 'هل تريد استعادة البيانات الافتراضية؟' : 'Reset local storage to fresh defaults?')) {
                    resetAllData();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 text-xs font-semibold text-neutral-300 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};
