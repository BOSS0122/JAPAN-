import { localImageStorage } from "./local";
import type { ImageStorage } from "./types";

export * from "./types";

/**
 * Registry. Set IMAGE_STORAGE=s3 and register the adapter here once a bucket
 * exists; the editor console and every page that renders a photo stay as they
 * are, because they only ever saw the URL.
 */
const adapters: Record<string, ImageStorage> = {
  local: localImageStorage,
};

export function getImageStorage(): ImageStorage {
  const key = process.env.IMAGE_STORAGE ?? "local";
  return adapters[key] ?? localImageStorage;
}
