import React, { useEffect, useState } from 'react';
import { UserStatus } from '../../types';
import { DEFAULT_USER_AVATAR } from '../../utils/avatarConstants';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: UserStatus;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const statusSizes = {
  xs: 'w-2 h-2 ring-1',
  sm: 'w-2.5 h-2.5 ring-2',
  md: 'w-3 h-3 ring-2',
  lg: 'w-3.5 h-3.5 ring-2',
  xl: 'w-4 h-4 ring-2',
  '2xl': 'w-6 h-6 ring-4',
};

const statusColors: Record<UserStatus, string> = {
  online: 'bg-emerald-500',
  idle: 'bg-amber-500',
  dnd: 'bg-rose-500',
  offline: 'bg-neutral-500',
};

const THUMB_DB = 'dzcore_avatar_thumbnails_v1';
const THUMB_STORE = 'thumbnails';
const thumbMemory = new Map<string, string>();
const thumbJobs = new Map<string, Promise<string | null>>();

function thumbKey(src: string) {
  return `${src.length}:${src.slice(0, 96)}:${src.slice(-96)}`;
}

function openThumbDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(THUMB_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(THUMB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function createThumbnail(src: string): Promise<string | null> {
  const key = thumbKey(src);
  if (thumbMemory.has(key)) return thumbMemory.get(key) || null;
  if (thumbJobs.has(key)) return thumbJobs.get(key) || null;
  const job = (async () => {
    try {
      const db = await openThumbDb();
      const cached = await new Promise<string | undefined>((resolve, reject) => {
        const request = db.transaction(THUMB_STORE, 'readonly').objectStore(THUMB_STORE).get(key);
        request.onsuccess = () => resolve(request.result as string | undefined);
        request.onerror = () => reject(request.error);
      });
      db.close();
      if (cached) { thumbMemory.set(key, cached); return cached; }

      const image = new Image();
      image.decoding = 'async';
      image.src = src;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.drawImage(image, 0, 0, 128, 128);
      const preview = canvas.toDataURL('image/webp', 0.72);
      thumbMemory.set(key, preview);
      const writeDb = await openThumbDb();
      await new Promise<void>((resolve, reject) => {
        const request = writeDb.transaction(THUMB_STORE, 'readwrite').objectStore(THUMB_STORE).put(preview, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      writeDb.close();
      return preview;
    } catch {
      return null;
    } finally {
      thumbJobs.delete(key);
    }
  })();
  thumbJobs.set(key, job);
  return job;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', status, className = '' }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    setImageFailed(false);
    setThumbnail(null);
    // Small cards use a cached first-frame thumbnail instead of decoding a
    // multi-megabyte animated GIF. Large profile avatars keep the original.
    if (src && src.length > 50_000 && size !== '2xl') {
      void createThumbnail(src).then((preview) => { if (preview) setThumbnail(preview); });
    }
  }, [src, size]);

  const isLargeMedia = Boolean(src && src.length > 50_000 && size !== '2xl');
  const displaySrc = (!src || imageFailed || (isLargeMedia && !thumbnail))
    ? DEFAULT_USER_AVATAR
    : (thumbnail || src);

  return (
    <div className={`relative inline-block shrink-0 ${sizeClasses[size]} ${className}`}>
      <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900 ring-1 ring-white/10 flex items-center justify-center select-none font-semibold text-neutral-200">
        <img
          src={displaySrc}
          alt={alt || 'Avatar'}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={() => { if (!imageFailed) setImageFailed(true); }}
          className="w-full h-full object-cover"
        />
      </div>
      {status && (
        <span className={`absolute bottom-0 right-0 rounded-full ring-neutral-950 ${statusColors[status]} ${statusSizes[size]}`} title={`Status: ${status}`} />
      )}
    </div>
  );
};
