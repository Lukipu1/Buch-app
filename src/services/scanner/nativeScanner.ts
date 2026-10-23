import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import { PageSide, SplitMode } from '@/types/models';

/**
 * Typed access to the local `BuchScanner` Expo module
 * (`modules/buch-scanner`). It is only present in iOS development/production
 * builds — in Expo Go, on Android and on the web this resolves to `null` and
 * callers fall back to the JavaScript implementations.
 */

export interface NativeProcessOptions {
  splitMode: SplitMode;
  autoCrop: boolean;
  quality: number;
}

export interface NativePage {
  uri: string;
  width: number;
  height: number;
  side: PageSide;
}

/** One recognised text line, normalised 0–1 with a top-left origin. */
export interface NativeTextLine {
  text: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BuchScannerModule {
  isDocumentScannerAvailable(): boolean;
  scanDocument(options: NativeProcessOptions): Promise<NativePage[]>;
  processImage(uri: string, options: NativeProcessOptions): Promise<NativePage[]>;
  recognizeText(uri: string, languages: string[]): Promise<NativeTextLine[]>;
}

export const nativeScanner: BuchScannerModule | null =
  Platform.OS === 'ios'
    ? requireOptionalNativeModule<BuchScannerModule>('BuchScanner')
    : null;

/** True when Apple's VisionKit document camera can be presented. */
export function isDocumentScannerAvailable(): boolean {
  try {
    return nativeScanner?.isDocumentScannerAvailable() ?? false;
  } catch {
    return false;
  }
}
