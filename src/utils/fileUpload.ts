/**
 * Image file reading & resizing utility
 * Converts user-uploaded files from desktop / phone into optimized Base64 data URLs
 * to ensure smooth storage in localStorage and instant client-side preview.
 */

import { createAnimatedGifThumbnail } from './gifThumbnail';

export const readImageFile = (
  file: File,
  maxDimension = 1200,
  quality = 0.85,
  gifMaxBytes = 1_500_000
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('الملف المختار ليس صورة صالحة'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('ملف الصورة فارغ'));
        return;
      }

      if (file.type === 'image/gif') {
        createAnimatedGifThumbnail(file, {
          size: Math.min(maxDimension, 720),
          cropSquare: false,
          maxFrames: 36,
          maxColors: 128,
          maxBytes: gifMaxBytes,
        }).then(resolve).catch(reject);
        return;
      }

      if (file.type === 'image/svg+xml' || file.size < 80 * 1024) {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };

      img.onerror = () => {
        resolve(result); // Fallback to raw data url if canvas fails
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Creates a clean, compressed square thumbnail suitable for user avatars / thumbnails.
 * Centers and crops to square (e.g. 256x256), converting to high-performance WebP (~15-25KB).
 */
export const createSquareThumbnail = (
  fileOrDataUrl: File | string,
  targetSize = 256,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const processDataUrl = (dataUrl: string) => {
      if (dataUrl.startsWith('data:image/svg+xml')) {
        resolve(dataUrl);
        return;
      }

      if (dataUrl.startsWith('data:image/gif')) {
        fetch(dataUrl)
          .then((response) => response.blob())
          .then((blob) => createAnimatedGifThumbnail(new File([blob], 'thumbnail.gif', { type: 'image/gif' }), {
            size: targetSize,
            maxFrames: 36,
            maxColors: 128,
          }))
          .then(resolve)
          .catch(reject);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Center crop to square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
        try {
          const thumb = canvas.toDataURL('image/webp', quality);
          resolve(thumb);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };

    if (typeof fileOrDataUrl === 'string') {
      processDataUrl(fileOrDataUrl);
    } else {
      if (!fileOrDataUrl.type.startsWith('image/')) {
        reject(new Error('الملف المختار ليس صورة صالحة'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => processDataUrl(String(e.target?.result || ''));
      reader.onerror = () => reject(new Error('فشل قراءة الملف'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};
