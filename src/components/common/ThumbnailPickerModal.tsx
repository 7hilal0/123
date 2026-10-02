import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ThumbnailSelector } from './ThumbnailSelector';
import { X, Sparkles, Check, Save } from 'lucide-react';
import { DEFAULT_USER_AVATAR } from '../../utils/avatarConstants';

interface ThumbnailPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThumbnailPickerModal: React.FC<ThumbnailPickerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateCurrentUserProfile, language, showToast } = useApp();
  const [selectedThumb, setSelectedThumb] = useState<string>(
    currentUser?.avatar || DEFAULT_USER_AVATAR
  );
  const [saving, setSaving] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCurrentUserProfile({
        avatar: selectedThumb,
      });
      showToast(
        language === 'ar'
          ? 'تم حفظ الصورة المصغرة بنجاح وستظهر لجميع المستخدمين!'
          : 'Thumbnail saved successfully and visible to all users!',
        'success'
      );
      onClose();
    } catch {
      showToast(
        language === 'ar' ? 'تعذر حفظ الصورة المصغرة، يرجى المحاولة ثانية' : 'Failed to save thumbnail',
        'warning'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900 border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 text-start"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">
                {language === 'ar' ? 'اختيار صورة مصغرة للحساب' : 'Choose Account Thumbnail'}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {language === 'ar'
                  ? 'ستظهر صورتك المصغرة لكل المستخدمين في المنشورات والتعليقات والملف الشخصي'
                  : 'Your thumbnail will appear to all users on posts, comments, and profile'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5">
          <ThumbnailSelector
            selectedUrl={selectedThumb}
            onSelect={(url) => setSelectedThumb(url)}
          />

          {/* Action Buttons */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {saving
                  ? (language === 'ar' ? 'جارٍ الحفظ والمزامنة...' : 'Saving & syncing...')
                  : (language === 'ar' ? 'حفظ وظهور لكل المستخدمين' : 'Save & Show to Everyone')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
