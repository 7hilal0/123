import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Check, Palette, RotateCw, Save, X } from 'lucide-react';
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToHsl(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const number = Number.parseInt(value.length === 3 ? value.split('').map((part) => part + part).join('') : value, 16);
  const r = ((number >> 16) & 255) / 255;
  const g = ((number >> 8) & 255) / 255;
  const b = (number & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(lightness * 100)];
  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;
  if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return [Math.round(hue * 60), Math.round(saturation * 100), Math.round(lightness * 100)];
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = l - chroma / 2;
  const [r, g, b] = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${[r, g, b].map((part) => Math.round((part + match) * 255).toString(16).padStart(2, '0')).join('')}`;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { currentUser, updateCurrentUserProfile, t, dir } = useApp();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');
  const [bannerUrl, setBannerUrl] = useState(currentUser?.banner || '');
  const [profileColor, setProfileColor] = useState(currentUser?.profileColor || '#10b981');
  const [displayNameColor, setDisplayNameColor] = useState(currentUser?.displayNameColor || '#ffffff');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState<'profile' | 'name'>('profile');
  const [pickerHue, setPickerHue] = useState(() => hexToHsl(currentUser?.profileColor || '#10b981')[0]);
  const [pickerSaturation, setPickerSaturation] = useState(() => hexToHsl(currentUser?.profileColor || '#10b981')[1]);
  const [pickerLightness, setPickerLightness] = useState(() => hexToHsl(currentUser?.profileColor || '#10b981')[2]);
  const [status, setStatus] = useState<UserStatus>(currentUser?.status || 'online');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!saving) return;
    const warnBeforeExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = 'Profile image is still uploading. Please wait.';
    };
    window.addEventListener('beforeunload', warnBeforeExit);
    return () => window.removeEventListener('beforeunload', warnBeforeExit);
  }, [saving]);
  const [imageEditor, setImageEditor] = useState<{ src: string; target: 'avatar' | 'banner'; setter: (value: string) => void; gif: boolean } | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const imageDragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (!currentUser) return null;

  const openColorPicker = (target: 'profile' | 'name') => {
    const source = target === 'name' ? displayNameColor : profileColor;
    setColorPickerTarget(target);
    const [hue, saturation, lightness] = hexToHsl(source);
    setPickerHue(hue);
    setPickerSaturation(saturation);
    setPickerLightness(lightness);
    setColorPickerOpen(true);
  };

  const updateColorSquare = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const saturation = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const lightness = clamp(100 - ((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    setPickerSaturation(Math.round(saturation));
    setPickerLightness(Math.round(lightness));
  };

  const confirmColor = () => {
    const color = hslToHex(pickerHue, pickerSaturation, pickerLightness);
    if (colorPickerTarget === 'name') setDisplayNameColor(color);
    else setProfileColor(color);
    setColorPickerOpen(false);
  };

  const handleImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void,
    target: 'avatar' | 'banner',
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const src = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('فشل قراءة الصورة'));
        reader.readAsDataURL(file);
      });
      setImageZoom(1);
      setImageRotation(0);
      setImageOffset({ x: 0, y: 0 });
      setImageEditor({ src, target, setter, gif: file.type === 'image/gif' });
    } catch (error) {
      console.error('Unable to read profile image', error);
    } finally {
      event.target.value = '';
    }
  };

  const getImageScale = () => Math.max(1.15, imageZoom);
  const getImageOffsetLimit = () => (getImageScale() - 1) * 50;
  const startImageDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    imageDragRef.current = { x: event.clientX, y: event.clientY, offsetX: imageOffset.x, offsetY: imageOffset.y };
  };
  const moveImageDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!imageDragRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const limit = getImageOffsetLimit();
    const nextX = imageDragRef.current.offsetX + ((event.clientX - imageDragRef.current.x) / rect.width) * 100;
    const nextY = imageDragRef.current.offsetY + ((event.clientY - imageDragRef.current.y) / rect.height) * 100;
    setImageOffset({ x: clamp(nextX, -limit, limit), y: clamp(nextY, -limit, limit) });
  };
  const stopImageDrag = () => { imageDragRef.current = null; };

  const saveImageEdit = () => {
    if (!imageEditor) return;
    // Drawing a GIF on canvas would remove its animation, so keep the original GIF.
    if (imageEditor.gif) {
      imageEditor.setter(imageEditor.src);
      setImageEditor(null);
      return;
    }
    const image = new Image();
    image.onload = () => {
      const width = imageEditor.target === 'avatar' ? 400 : 1200;
      const height = imageEditor.target === 'avatar' ? 400 : 500;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return;
      const scale = Math.max(width / image.width, height / image.height) * getImageScale();
      context.save();
      context.translate(width / 2 + (imageOffset.x / 100) * width, height / 2 + (imageOffset.y / 100) * height);
      context.rotate((imageRotation * Math.PI) / 180);
      context.drawImage(image, -image.width * scale / 2, -image.height * scale / 2, image.width * scale, image.height * scale);
      context.restore();
      imageEditor.setter(canvas.toDataURL('image/jpeg', 0.9));
      setImageEditor(null);
    };
    image.src = imageEditor.src;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await updateCurrentUserProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        customStatus: customStatus.trim(),
        avatar: avatarUrl,
        banner: bannerUrl,
        profileColor,
        displayNameColor,
        status,
      });
      onClose();
    } catch {
      // Keep the editor open so the user can retry an incomplete upload.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#080a0d] text-start">
      <div className="mx-auto min-h-screen w-full max-w-5xl bg-[#0d1014] shadow-2xl">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#0d1014]/95 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { if (!saving) onClose(); }}
              disabled={saving}
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
              onClick={() => { if (!saving) onClose(); }}
              disabled={saving}
            className="rounded-xl p-2 text-neutral-500 transition hover:bg-white/10 hover:text-white"
            aria-label={t.cancel}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <section className="relative" style={{ backgroundColor: `${profileColor}10` }}>
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
                onChange={(event) => handleImage(event, setBannerUrl, 'banner')}
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
                  onChange={(event) => handleImage(event, setAvatarUrl, 'avatar')}
                  className="hidden"
                />
              </div>
              <div className="pb-2">
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: displayNameColor }}>{displayName || currentUser.username}</h2>
                <p className="font-mono text-sm" style={{ color: `${profileColor}cc` }}>@{currentUser.username}</p>
              </div>
            </div>
          </section>

          <div className="mx-auto grid max-w-4xl gap-6 px-4 pb-12 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <section className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: `${profileColor}38`, backgroundColor: `${profileColor}0b` }}>
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
                      className="w-full rounded-xl border bg-black/20 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:ring-2" style={{ borderColor: `${profileColor}30` }}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-neutral-300">{t.statusMessage}</span>
                    <input
                      type="text"
                      value={customStatus}
                      onChange={(event) => setCustomStatus(event.target.value)}
                      placeholder="What are you working on today?"
                      className="w-full rounded-xl border bg-black/20 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:ring-2" style={{ borderColor: `${profileColor}30` }}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-neutral-300">{t.bio}</span>
                    <textarea
                      rows={4}
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="Tell the community about yourself..."
                      className="w-full resize-none rounded-xl border bg-black/20 p-3.5 text-sm leading-relaxed text-white outline-none transition placeholder:text-neutral-600 focus:ring-2" style={{ borderColor: `${profileColor}30` }}
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
                  <button
                    type="button"
                    onClick={() => openColorPicker('profile')}
                    className="relative h-10 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/20 transition hover:scale-105"
                    style={{ backgroundColor: profileColor }}
                    aria-label="Open profile background color picker"
                  />
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
                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-3">
                  <div>
                    <p className="text-xs font-semibold text-neutral-200">لون الاسم الظاهر</p>
                    <p className="mt-1 text-[11px] text-neutral-500">لون مستقل عن اسم المستخدم</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openColorPicker('name')}
                    className="h-10 w-14 shrink-0 rounded-xl border border-white/20 transition hover:scale-105"
                    style={{ backgroundColor: displayNameColor }}
                    aria-label="Open display name color picker"
                  />
                </div>
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
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" style={{ backgroundColor: profileColor, boxShadow: `0 10px 28px ${profileColor}45` }}>
                  <Save className={`h-4 w-4 ${saving ? 'animate-pulse' : ''}`} />
                  {saving ? (dir === 'rtl' ? 'جارٍ الحفظ...' : 'Saving...') : t.saveChanges}
                </button>
              </div>
            </div>
          </footer>
        </form>

        {imageEditor && (
          <div className="fixed inset-0 z-[80] flex flex-col bg-black/95 text-white" onClick={() => setImageEditor(null)}>
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-8">
              <button type="button" onClick={() => setImageEditor(null)} aria-label="Cancel"><X className="h-7 w-7" /></button>
              <h2 className="text-lg font-bold">Edit Image</h2>
              <button type="button" onClick={saveImageEdit} aria-label="Apply"><Check className="h-7 w-7" /></button>
            </header>
            <div className="flex flex-1 items-center justify-center p-5" onClick={(event) => event.stopPropagation()}>
              <div
                className={`relative cursor-grab touch-none overflow-hidden border border-white/70 bg-neutral-900 active:cursor-grabbing ${imageEditor.target === 'avatar' ? 'aspect-square w-[min(82vw,420px)] rounded-full' : 'aspect-[12/5] w-full max-w-3xl rounded-2xl'}`}
                onPointerDown={startImageDrag}
                onPointerMove={moveImageDrag}
                onPointerUp={stopImageDrag}
                onPointerCancel={stopImageDrag}
              >
                <img src={imageEditor.src} alt="Edit preview" draggable={false} className="h-full w-full select-none object-cover" style={{ transform: `translate(${imageOffset.x}%, ${imageOffset.y}%) scale(${getImageScale()}) rotate(${imageRotation}deg)` }} />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_33%,rgba(255,255,255,.5)_33%,rgba(255,255,255,.5)_33.3%,transparent_33.3%,transparent_66%,rgba(255,255,255,.5)_66%,rgba(255,255,255,.5)_66.3%,transparent_66.3%),linear-gradient(to_bottom,transparent_33%,rgba(255,255,255,.5)_33%,rgba(255,255,255,.5)_33.3%,transparent_33.3%,transparent_66%,rgba(255,255,255,.5)_66%,rgba(255,255,255,.5)_66.3%,transparent_66.3%)]" />
              </div>
            </div>
            <div className="space-y-5 border-t border-white/10 bg-[#101114] px-6 py-6 sm:px-12">
              <label className="flex items-center gap-4 text-sm"><span className="w-16">Scale</span><input type="range" min="1" max="3" step="0.01" value={imageZoom} onChange={(event) => { setImageZoom(Number(event.target.value)); setImageOffset({ x: 0, y: 0 }); }} className="w-full accent-white" /></label>
              <p className="text-center text-xs text-neutral-400">Drag the image to position it inside the frame</p>
              <button type="button" onClick={() => setImageRotation((value) => (value + 90) % 360)} className="mx-auto flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm"><RotateCw className="h-4 w-4" /> Rotate</button>
              {imageEditor.gif && <p className="text-center text-xs text-neutral-400">GIF animation will be preserved. Crop controls preview the frame, while the original animation is saved.</p>}
            </div>
          </div>
        )}

        {colorPickerOpen && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setColorPickerOpen(false)}>
            <div className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#101216] p-5 shadow-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-white">Pick a Colour</h2>
                <button type="button" onClick={confirmColor} className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15">Select</button>
              </div>
              <input
                value={hslToHex(pickerHue, pickerSaturation, pickerLightness)}
                onChange={(event) => {
                  const value = event.target.value;
                  if (colorPickerTarget === 'name') setDisplayNameColor(value);
                  else setProfileColor(value);
                  if (/^#[0-9a-f]{6}$/i.test(value)) {
                    const [hue, saturation, lightness] = hexToHsl(value);
                    setPickerHue(hue);
                    setPickerSaturation(saturation);
                    setPickerLightness(lightness);
                  }
                }}
                className="mb-5 w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-lg text-white outline-none focus:border-white/50"
                aria-label="HEX color value"
              />
              <div className="mb-5 flex justify-center gap-5">
                {PROFILE_COLORS.slice(0, 5).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      const [hue, saturation, lightness] = hexToHsl(color);
                      setPickerHue(hue); setPickerSaturation(saturation); setPickerLightness(lightness);
                    }}
                    className={`h-12 w-12 rounded-lg border-2 transition hover:scale-105 ${hslToHex(pickerHue, pickerSaturation, pickerLightness) === color ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Preset ${color}`}
                  />
                ))}
              </div>
              <div
                className="relative h-64 w-full cursor-crosshair overflow-hidden rounded-xl"
                style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${pickerHue} 100% 50%))` }}
                onPointerDown={updateColorSquare}
                onPointerMove={(event) => { if (event.buttons === 1) updateColorSquare(event); }}
              >
                <span className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,.7)]" style={{ left: `${pickerSaturation}%`, top: `${100 - pickerLightness}%` }} />
              </div>
              <div className="relative mt-5 h-7 overflow-hidden rounded-full border-2 border-white/20" style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}>
                <input type="range" min="0" max="359" value={pickerHue} onChange={(event) => setPickerHue(Number(event.target.value))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Hue" />
                <span className="pointer-events-none absolute top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-transparent shadow-[0_0_0_2px_rgba(0,0,0,.65)]" style={{ left: `${(pickerHue / 359) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
