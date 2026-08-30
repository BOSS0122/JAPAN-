/**
 * Where uploaded images live.
 *
 * Same shape as the OTA providers: the app talks to the interface, and moving
 * from a disk to S3/R2/Cloudinary is registering a different implementation.
 * Nothing above this file learns which one is in use.
 */

export interface StoredImage {
  /** Public URL the browser can load. */
  url: string;
  /** Adapter-private handle, kept so a delete can remove the object too. */
  key: string;
}

export interface ImageStorage {
  readonly name: string;
  put(input: { bytes: Buffer; contentType: string }): Promise<StoredImage>;
  remove(key: string): Promise<void>;
}

/** Formats every current browser decodes, and nothing that can carry a script. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Returns a reason to reject, or null. */
export function imageProblem(file: { size: number; type: string }): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "JPEG・PNG・WebP・AVIF のみ登録できます。";
  }
  if (file.size > MAX_IMAGE_BYTES) return "画像は8MBまでです。";
  if (file.size === 0) return "ファイルが空です。";
  return null;
}
