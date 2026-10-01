/**
 * Image file reading & resizing utility
 * Converts user-uploaded files from desktop / phone into optimized Base64 data URLs
 * to ensure smooth storage in localStorage and instant client-side preview.
 */

export const readImageFile = (
  file: File,
  maxDimension = 1200,
  quality = 0.85
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

      // Never draw GIFs on a canvas: that would keep only the first frame.
      // Returning the original data URL preserves the animation for avatars
      // and banners while still allowing regular images to be optimized.
      if (file.type === 'image/gif' || file.type === 'image/svg+xml' || file.size < 80 * 1024) {
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
