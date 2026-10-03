import { decompressFrames, parseGIF, type ParsedFrame } from 'gifuct-js';
import { GIFEncoder, applyPalette, quantize } from 'gifenc';

export interface GifThumbnailOptions {
  size?: number;
  cropSquare?: boolean;
  maxFrames?: number;
  maxColors?: number;
  maxBytes?: number;
}

const DEFAULT_OPTIONS: Required<GifThumbnailOptions> = {
  size: 256,
  cropSquare: true,
  maxFrames: 36,
  maxColors: 128,
  maxBytes: 1_500_000,
};

const readAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف GIF'));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });

const canvasToRgba = (canvas: HTMLCanvasElement): Uint8ClampedArray => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('المتصفح لا يدعم معالجة الصور');
  return context.getImageData(0, 0, canvas.width, canvas.height).data;
};

const drawFramePatch = (
  context: CanvasRenderingContext2D,
  frame: ParsedFrame,
  scale = 1,
) => {
  const patchCanvas = document.createElement('canvas');
  patchCanvas.width = frame.dims.width;
  patchCanvas.height = frame.dims.height;
  const patchContext = patchCanvas.getContext('2d');
  if (!patchContext) throw new Error('تعذر تجهيز إطار GIF');
  patchContext.putImageData(
    new ImageData(new Uint8ClampedArray(frame.patch) as unknown as ImageDataArray, frame.dims.width, frame.dims.height),
    0,
    0,
  );
  context.drawImage(
    patchCanvas,
    frame.dims.left * scale,
    frame.dims.top * scale,
    frame.dims.width * scale,
    frame.dims.height * scale,
  );
};

const coverCrop = (
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  cropSquare: boolean,
) => {
  const context = target.getContext('2d');
  if (!context) throw new Error('تعذر تجهيز الصورة المصغرة');
  context.clearRect(0, 0, target.width, target.height);
  if (!cropSquare) {
    context.drawImage(source, 0, 0, target.width, target.height);
    return;
  }
  const sourceSize = Math.min(source.width, source.height);
  const sourceX = (source.width - sourceSize) / 2;
  const sourceY = (source.height - sourceSize) / 2;
  context.drawImage(source, sourceX, sourceY, sourceSize, sourceSize, 0, 0, target.width, target.height);
};

const selectFrameIndexes = (frames: ParsedFrame[], maxFrames: number) => {
  if (frames.length <= maxFrames) return frames.map((_, index) => index);
  const indexes: number[] = [];
  for (let index = 0; index < maxFrames; index += 1) {
    indexes.push(Math.min(frames.length - 1, Math.round((index * (frames.length - 1)) / (maxFrames - 1))));
  }
  return [...new Set(indexes)];
};

/**
 * Re-encodes an animated GIF as a small square GIF. Frames are composited first
 * so GIFs that use partial frame patches remain visually correct after resizing.
 */
export async function createAnimatedGifThumbnail(
  file: File,
  requestedOptions: GifThumbnailOptions = {},
): Promise<string> {
  const options = { ...DEFAULT_OPTIONS, ...requestedOptions };
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('حجم GIF أكبر من الحد المسموح 25MB');
  }
  const parsed = parseGIF(await readAsArrayBuffer(file));
  const frames = decompressFrames(parsed, true).filter((frame): frame is ParsedFrame => 'patch' in frame);
  if (frames.length === 0 || parsed.lsd.width <= 0 || parsed.lsd.height <= 0) {
    throw new Error('ملف GIF لا يحتوي على إطارات صالحة');
  }

  const sourceScale = Math.min(1, 720 / Math.max(parsed.lsd.width, parsed.lsd.height));
  const width = Math.max(1, Math.round(parsed.lsd.width * sourceScale));
  const height = Math.max(1, Math.round(parsed.lsd.height * sourceScale));
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) throw new Error('المتصفح لا يدعم معالجة GIF');
  sourceContext.fillStyle = '#0d1014';
  sourceContext.fillRect(0, 0, width, height);

  const targetCanvas = document.createElement('canvas');
  if (options.cropSquare) {
    targetCanvas.width = options.size;
    targetCanvas.height = options.size;
  } else if (width >= height) {
    targetCanvas.width = options.size;
    targetCanvas.height = Math.max(1, Math.round((height * options.size) / width));
  } else {
    targetCanvas.height = options.size;
    targetCanvas.width = Math.max(1, Math.round((width * options.size) / height));
  }

  const encoder = GIFEncoder({ initialCapacity: Math.min(Math.max(file.size, 4096), 8_000_000) });
  const selectedIndexes = selectFrameIndexes(frames, options.maxFrames);
  let selectedCursor = 0;
  let pendingDelay = 0;

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index];
    const frameBeforePatch = frame.disposalType === 3
      ? sourceContext.getImageData(0, 0, width, height)
      : null;
    drawFramePatch(sourceContext, frame, sourceScale);
    pendingDelay += Math.max(20, frame.delay || 80);

    if (index === selectedIndexes[selectedCursor]) {
      coverCrop(sourceCanvas, targetCanvas, options.cropSquare);
      const rgba = canvasToRgba(targetCanvas);
      const palette = quantize(rgba, options.maxColors, { format: 'rgb565' });
      const indexed = applyPalette(rgba, palette, 'rgb565');
      const isFirst = selectedCursor === 0;
      encoder.writeFrame(indexed, targetCanvas.width, targetCanvas.height, {
        palette,
        delay: pendingDelay,
        repeat: isFirst ? 0 : undefined,
        dispose: frame.disposalType === 2 || frame.disposalType === 3 ? 1 : 0,
      });
      pendingDelay = 0;
      selectedCursor += 1;
    }

    if (frame.disposalType === 2) {
      sourceContext.fillStyle = '#0d1014';
      sourceContext.fillRect(0, 0, width, height);
    } else if (frame.disposalType === 3 && frameBeforePatch) {
      sourceContext.putImageData(frameBeforePatch, 0, 0);
    }

    if (selectedCursor >= selectedIndexes.length) break;
  }

  encoder.finish();
  const bytes = encoder.bytes();
  if (bytes.byteLength > options.maxBytes && options.size > 192) {
    return createAnimatedGifThumbnail(file, { ...options, size: 192, maxFrames: Math.min(options.maxFrames, 28), maxColors: 96 });
  }

  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  return `data:image/gif;base64,${btoa(binary)}`;
}
