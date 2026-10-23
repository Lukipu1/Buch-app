import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

import { PageSide, SplitMode } from '@/types/models';

import { isDocumentScannerAvailable, nativeScanner } from './nativeScanner';

/**
 * Scan pipeline facade. Prefers the native Apple implementation (VisionKit
 * document camera, Vision page detection, gutter-aware spread splitting) and
 * falls back to expo-image-manipulator where the native module is missing.
 */

export interface ProcessedImage {
  uri: string;
  width?: number;
  height?: number;
  side: PageSide;
}

export interface ProcessOptions {
  splitMode: SplitMode;
  autoCrop: boolean;
}

/** Width/height ratio above which an image counts as a double-page spread. */
const SPREAD_RATIO = 1.12;
const JPEG_QUALITY = 0.85;

export const imageProcessing = {
  /** Whether the Apple document camera is available on this device/build. */
  hasDocumentCamera(): boolean {
    return isDocumentScannerAvailable();
  },

  /**
   * Opens Apple's document camera. Resolves with one image per book page
   * (spreads already split), or an empty array when the user cancels.
   */
  async scanWithDocumentCamera(options: ProcessOptions): Promise<ProcessedImage[]> {
    if (!nativeScanner) {
      throw new Error('Der Apple-Dokumentenscanner ist in diesem Build nicht verfügbar.');
    }
    return nativeScanner.scanDocument({
      splitMode: options.splitMode,
      autoCrop: false,
      quality: JPEG_QUALITY,
    });
  },

  /** Crops (optional) and splits a camera photo or imported image. */
  async process(uri: string, options: ProcessOptions): Promise<ProcessedImage[]> {
    if (nativeScanner) {
      try {
        return await nativeScanner.processImage(uri, {
          splitMode: options.splitMode,
          autoCrop: options.autoCrop,
          quality: JPEG_QUALITY,
        });
      } catch {
        // Fall back to the JS pipeline below.
      }
    }
    return splitWithManipulator(uri, options.splitMode);
  },

  /** Forces a split of one image into a left and right page. */
  async split(uri: string): Promise<ProcessedImage[]> {
    return this.process(uri, { splitMode: 'always', autoCrop: false });
  },

  /** Rotates an image clockwise by 90°. */
  async rotate(uri: string): Promise<ProcessedImage> {
    const result = await ImageManipulator.manipulateAsync(uri, [{ rotate: 90 }], {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return { uri: result.uri, width: result.width, height: result.height, side: 'single' };
  },
};

async function splitWithManipulator(
  uri: string,
  splitMode: SplitMode,
): Promise<ProcessedImage[]> {
  const size = await getImageSize(uri).catch(() => null);
  if (!size) return [{ uri, side: 'single' }];

  const isSpread = size.width / Math.max(1, size.height) > SPREAD_RATIO;
  const shouldSplit = splitMode === 'always' || (splitMode === 'auto' && isSpread);
  if (!shouldSplit) {
    return [{ uri, width: size.width, height: size.height, side: 'single' }];
  }

  const half = Math.floor(size.width / 2);
  const trim = Math.max(2, Math.floor(size.width / 160));
  const crop = async (originX: number, width: number, side: PageSide) => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: { originX, originY: 0, width, height: size.height } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
    );
    return { uri: result.uri, width: result.width, height: result.height, side };
  };

  return [
    await crop(0, half - trim, 'left'),
    await crop(half + trim, size.width - half - trim, 'right'),
  ];
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}
