import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Upload, Camera } from 'lucide-react';
import { UserStatus } from '../../types';
import { readImageFile } from '../../utils/fileUpload';
import { DEFAULT_USER_AVATAR, PRESET_AVATARS } from '../../utils/avatarConstants';

interface EditProfileModalProps {
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { currentUser, updateCurrentUserProfile, t } = useApp();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');
  const [bannerUrl, setBannerUrl] = useState(currentUser?.banner || '');
  const [status, setStatus] = useState<UserStatus>(currentUser?.status || 'online');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file, 400, 0.85);
      setAvatarUrl(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file, 1200, 0.85);
      setBannerUrl(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUserProfile({
      displayName: displayName.trim(),
      bio: bio.trim(),
      customStatus: customStatus.trim(),
      avatar: avatarUrl,
      banner: bannerUrl,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 text-start">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        <div className="p-4 md:p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-white">
            {t.editProfile}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Banner Upload */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.bannerUpload}
            </label>
            <div className="relative h-28 rounded-xl overflow-hidden bg-neutral-950 border border-white/10 group mb-2">
              <img
                src={bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white text-xs font-semibold transition-opacity cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Change Banner</span>
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerFile}
                className="hidden"
              />
            </div>
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.bannerUpload}</span>
            </button>
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.avatarUpload}
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-neutral-950 border border-white/10 shrink-0">
                <img
                  src={avatarUrl || DEFAULT_USER_AVATAR}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t.avatarUpload}</span>
                </button>
              </div>
            </div>

            {/* Preset Avatars Selection */}
            <div className="mt-2.5 pt-2 border-t border-white/5">
              <span className="text-[11px] text-neutral-400 block mb-1.5">
                {t.choosePresetAvatar}
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = (avatarUrl || DEFAULT_USER_AVATAR) === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      title={preset.name}
                      className={`w-9 h-9 rounded-full overflow-hidden shrink-0 transition-transform hover:scale-105 cursor-pointer ring-2 ${
                        isSelected ? 'ring-emerald-500 scale-105' : 'ring-white/10 hover:ring-white/30'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.displayName}
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
            />
          </div>

          {/* Custom Status */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.statusMessage}
            </label>
            <input
              type="text"
              placeholder="What are you working on today?"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
            />
          </div>

          {/* Online Presence */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.presenceStatus}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs md:text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
            >
              <option value="online">{t.statusOnline}</option>
              <option value="idle">{t.statusIdle}</option>
              <option value="dnd">{t.statusDnd}</option>
              <option value="offline">{t.statusOffline}</option>
            </select>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.bio}
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself..."
              className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none text-start leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold shadow-md transition-colors cursor-pointer"
            >
              {t.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
