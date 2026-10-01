import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Palette, Save, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserStatus } from '../../types';
import { readImageFile } from '../../utils/fileUpload';
import { DEFAULT_USER_AVATAR } from '../../utils/avatarConstants';

interface EditProfileModalProps {
  onClose: () => void;
}

const PROFILE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { currentUser, updateCurrentUserProfile, t, dir } = useApp();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');
  const [bannerUrl, setBannerUrl] = useState(currentUser?.banner || '');
  const [profileColor, setProfileColor] = useState(currentUser?.profileColor || '#10b981');
  const [status, setStatus] = useState<UserStatus>(currentUser?.status || 'online');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (!currentUser) return null;

  const handleImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void,
    width: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setter(await readImageFile(file, width, 0.85));
    } catch (error) {
      console.error('Unable to read profile image', error);
    } finally {
      event.target.value = '';
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateCurrentUserProfile({
      displayName: displayName.trim(),
      bio: bio.trim(),
      customStatus: customStatus.trim(),
      avatar: avatarUrl,
      banner: bannerUrl,
      profileColor,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#080a0d] text-start">
      <div className="mx-auto min-h-screen w-full max-w-5xl bg-[#0d1014] shadow-2xl">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#0d1014]/95 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white"
              aria-label={t.cancel}
            >
              <BackIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white sm:text-base">{t.editProfile}</h1>
              <p className="text-[11px] text-neutral-500">Customize your public profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-500 transition hover:bg-white/10 hover:text-white"
            aria-label={t.cancel}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <section className="relative">
            <div className="relative h-44 overflow-hidden bg-neutral-900 sm:h-56 md:h-64">
              <img
                src={bannerUrl || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1600&q=85'}
                alt="Profile banner"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1014] via-black/10 to-black/20" />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute end-4 top-4 flex items-center gap-2 rounded-xl border border-white/20 bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/75"
              >
                <Camera className="h-4 w-4" />
                {t.bannerUpload}
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => handleImage(event, setBannerUrl, 1200)}
                className="hidden"
              />
            </div>

            <div className="relative mx-auto -mt-12 flex max-w-4xl flex-col gap-4 px-4 sm:-mt-16 sm:px-8 md:flex-row md:items-end">
              <div className="relative shrink-0 self-start">
                <div className="rounded-full border-8 border-[#0d1014] bg-[#0d1014] shadow-2xl">
                  <img
                    src={avatarUrl || DEFAULT_USER_AVATAR}
                    alt={displayName}
                    className="h-24 w-24 rounded-full object-cover sm:h-32 sm:w-32"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-1 end-1 rounded-full border-4 border-[#0d1014] bg-emerald-500 p-2 text-white shadow-lg transition hover:bg-emerald-400"
                  aria-label={t.avatarUpload}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImage(event, setAvatarUrl, 400)}
                  className="hidden"
                />
              </div>
              <div className="pb-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">{displayName || currentUser.username}</h2>
                <p className="font-mono text-sm text-neutral-500">@{currentUser.username}</p>
              </div>
            </div>
          </section>

          <div className="mx-auto grid max-w-4xl gap-6 px-4 pb-12 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white">Profile information</h3>
                  <p className="mt-1 text-xs text-neutral-500">This is how people will see you across DZCORE.</p>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-neutral-300">{t.displayName}</span>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-neutral-300">{t.statusMessage}</span>
                    <input
                      type="text"
                      value={customStatus}
                      onChange={(event) => setCustomStatus(event.target.value)}
                      placeholder="What are you working on today?"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-neutral-300">{t.bio}</span>
                    <textarea
                      rows={4}
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="Tell the community about yourself..."
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3.5 text-sm leading-relaxed text-white outline-none transition placeholder:text-neutral-600 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400"><Palette className="h-4 w-4" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Profile appearance</h3>
                    <p className="mt-1 text-xs text-neutral-500">Choose the accent used behind your profile details.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-3">
                  <div>
                    <p className="text-xs font-semibold text-neutral-200">لون خلفية الحساب</p>
                    <p className="mt-1 text-[11px] text-neutral-500">لا يغيّر لون اسمك أو منشوراتك</p>
                  </div>
                  <label className="relative h-10 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/20" style={{ backgroundColor: profileColor }}>
                    <input
                      type="color"
                      value={profileColor}
                      onChange={(event) => setProfileColor(event.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label="Profile background color"
                    />
                  </label>
                </div>
                <div className="mt-3 grid grid-cols-9 gap-2">
                  {PROFILE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setProfileColor(color)}
                      aria-label={`Choose ${color}`}
                      className={`h-7 w-7 rounded-full border-2 transition hover:scale-110 ${profileColor.toLowerCase() === color ? 'border-white ring-2 ring-white/30' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-neutral-500">اختر من الألوان أو اضغط على المربع لاختيار أي درجة وتشبع.</p>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                <h3 className="mb-3 text-sm font-bold text-white">Presence</h3>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as UserStatus)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500/70"
                >
                  <option value="online">{t.statusOnline}</option>
                  <option value="idle">{t.statusIdle}</option>
                  <option value="dnd">{t.statusDnd}</option>
                  <option value="offline">{t.statusOffline}</option>
                </select>
              </section>
            </aside>
          </div>

          <footer className="sticky bottom-0 z-20 border-t border-white/10 bg-[#0d1014]/95 px-4 py-3 backdrop-blur-xl sm:px-8">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
              <p className="hidden text-xs text-neutral-500 sm:block">Changes are saved to your profile.</p>
              <div className="ms-auto flex items-center gap-2">
                <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-neutral-400 transition hover:bg-white/10 hover:text-white">
                  {t.cancel}
                </button>
                <button type="submit" className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
                  <Save className="h-4 w-4" />
                  {t.saveChanges}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};
