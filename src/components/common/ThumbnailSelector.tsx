import React, { useState, useRef } from 'react';
import { PRESET_AVATARS, PresetThumbnail, DEFAULT_USER_AVATAR } from '../../utils/avatarConstants';
import { createSquareThumbnail } from '../../utils/fileUpload';
import { useApp } from '../../context/AppContext';
import { Upload, Check, Sparkles, RefreshCw } from 'lucide-react';

interface ThumbnailSelectorProps {
  selectedUrl: string;
  onSelect: (url: string) => void;
  className?: string;
  compact?: boolean;
}

export const ThumbnailSelector: React.FC<ThumbnailSelectorProps> = ({
  selectedUrl,
  onSelect,
  className = '',
  compact = false,
}) => {
  const { language, showToast } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [uploading, setUploading] = useState<boolean>(false);
  const [processingGif, setProcessingGif] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'all', nameAr: 'الكل', nameEn: 'All' },
    { id: 'dzcore', nameAr: '🇩🇿 ديزاد كور', nameEn: 'DZCORE' },
    { id: 'cyber', nameAr: '🚀 سايبر', nameEn: 'Cyber' },
    { id: 'gaming', nameAr: '🎮 ألعاب', nameEn: 'Gaming' },
    { id: 'beasts', nameAr: '🦁 كائنات', nameEn: 'Beasts' },
    { id: 'cosmic', nameAr: '🌌 فضاء', nameEn: 'Cosmic' },
    { id: 'art', nameAr: '🎨 فن', nameEn: 'Art' },
  ];

  const filteredPresets = activeCategory === 'all'
    ? PRESET_AVATARS
    : PRESET_AVATARS.filter((p) => p.category === activeCategory);

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProcessingGif(file.type === 'image/gif');
    try {
      const squareThumb = await createSquareThumbnail(file, 256, 0.88);
      onSelect(squareThumb);
      showToast(
        language === 'ar'
          ? (file.type === 'image/gif' ? 'تم ضغط GIF وحفظ حركته بنجاح!' : 'تم ضغط الصورة واختيارها بنجاح!')
          : (file.type === 'image/gif' ? 'GIF optimized with animation preserved!' : 'Image optimized successfully!'),
        'success'
      );
    } catch (err: any) {
      showToast(
        language === 'ar' ? (err.message || 'تعذر معالجة الصورة') : 'Failed to process image',
        'warning'
      );
    } finally {
      setUploading(false);
      setProcessingGif(false);
      if (e.target) e.target.value = '';
    }
  };

  const currentPreset = PRESET_AVATARS.find((p) => p.url === selectedUrl);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Active Thumbnail Preview & Upload Action */}
      <div className="flex min-w-0 flex-wrap items-center gap-3.5 rounded-2xl border border-white/10 bg-neutral-950/70 p-3 sm:flex-nowrap">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/30 shrink-0 bg-neutral-900 flex items-center justify-center">
          <img
            src={selectedUrl || DEFAULT_USER_AVATAR}
            alt="Selected thumbnail"
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1 end-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">
              {currentPreset
                ? (language === 'ar' ? currentPreset.nameAr : currentPreset.name)
                : (language === 'ar' ? 'صورة مصغرة مخصصة' : 'Custom Thumbnail')}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            {language === 'ar'
              ? 'تظهر لجميع المستخدمين في المنشورات والتعليقات'
              : 'Visible to everyone in posts, comments and profile'}
          </p>
          <span className="mt-1 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            {language === 'ar' ? '256px • ضغط تلقائي • GIF متحرك' : '256px • auto-compressed • animated GIF'}
          </span>
        </div>

        {/* Upload Custom Button */}
        <div className="ms-auto shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCustomUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/10 text-xs font-medium text-emerald-400 transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>{processingGif ? (language === 'ar' ? 'جارٍ ضغط GIF...' : 'Optimizing GIF...') : (language === 'ar' ? 'رفع صورة' : 'Upload')}</span>
          </button>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium text-[11px] ${
              activeCategory === cat.id
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-neutral-950/60 hover:bg-white/5 text-neutral-400 hover:text-neutral-200 border border-white/5'
            }`}
          >
            {language === 'ar' ? cat.nameAr : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Thumbnail Grid */}
      <div className={`grid gap-2.5 ${compact ? 'grid-cols-5 sm:grid-cols-6' : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-7'} max-h-56 overflow-y-auto p-1.5 rounded-2xl bg-neutral-950/50 border border-white/5`}>
        {filteredPresets.map((preset) => {
          const isSelected = selectedUrl === preset.url;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.url)}
              title={language === 'ar' ? preset.nameAr : preset.name}
              className={`group relative aspect-square rounded-2xl overflow-hidden p-1 transition-all cursor-pointer flex items-center justify-center bg-neutral-900 border ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-105 shadow-lg shadow-emerald-950/40'
                  : 'border-white/5 hover:border-emerald-400/40 hover:scale-105'
              }`}
            >
              <img
                src={preset.url}
                alt={preset.name}
                loading="lazy"
                className="w-full h-full object-cover rounded-xl"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-emerald-950/40 rounded-xl flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
