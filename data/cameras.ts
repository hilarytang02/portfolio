import type { MediumType } from '@/types/photo';

/**
 * Cameras are a closed set. `photos.json` stores the key; the UI renders the
 * label. Adding a camera later = one line here.
 */
export const CAMERAS = {
  'nikon-coolpix-s33': { label: 'Nikon Coolpix S33', type: 'digital' },
  'nikon-lite-touch-100w': { label: 'Nikon Lite Touch Zoom 100W', type: 'film' },
  'iphone-11': { label: 'iPhone 11', type: 'phone' },
  'iphone-11-pro': { label: 'iPhone 11 Pro', type: 'phone' },
  'iphone-15': { label: 'iPhone 15', type: 'phone' },
} as const satisfies Record<string, { label: string; type: MediumType }>;

export type CameraKey = keyof typeof CAMERAS;

export const CAMERA_KEYS = Object.keys(CAMERAS) as CameraKey[];

export function isCameraKey(key: string): key is CameraKey {
  return key in CAMERAS;
}

export function cameraLabel(key: string): string {
  return isCameraKey(key) ? CAMERAS[key].label : key;
}
