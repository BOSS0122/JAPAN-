import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { EXTENSION, type ImageStorage, type StoredImage } from "./types";

/**
 * Writes into `public/uploads/places`, which Next serves as static files.
 *
 * Good enough for development and a single self-hosted box. On anything with
 * more than one instance, or an ephemeral filesystem, this loses images between
 * deploys — that is what the S3/R2 adapter is for, and why the interface exists.
 */

const DIR = path.join(process.cwd(), "public", "uploads", "places");
const PUBLIC_PREFIX = "/uploads/places";

export const localImageStorage: ImageStorage = {
  name: "local",

  async put({ bytes, contentType }): Promise<StoredImage> {
    await mkdir(DIR, { recursive: true });
    // The name is generated, never taken from the upload: a client-supplied
    // filename is a path-traversal and overwrite vector, and nothing needs it.
    const key = `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${
      EXTENSION[contentType] ?? "bin"
    }`;
    await writeFile(path.join(DIR, key), bytes);
    return { url: `${PUBLIC_PREFIX}/${key}`, key };
  },

  async remove(key: string): Promise<void> {
    // Defence in depth: keys are generated above, but a stored row is still
    // input, and a key must never escape the upload directory.
    if (key.includes("/") || key.includes("\\") || key.includes("..")) return;
    try {
      await unlink(path.join(DIR, key));
    } catch {
      // Already gone. Removing the database row is what matters.
    }
  },
};
