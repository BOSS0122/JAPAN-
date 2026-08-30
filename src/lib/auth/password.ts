import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * scrypt with a per-password salt. Node ships it, so there is no dependency to
 * audit, and the cost parameters are stored alongside the hash rather than
 * assumed — raising them later leaves existing hashes verifiable.
 */

const KEYLEN = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, KEYLEN, PARAMS);
  return [
    "scrypt",
    `${PARAMS.N}:${PARAMS.r}:${PARAMS.p}`,
    salt.toString("hex"),
    key.toString("hex"),
  ].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, params, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !params || !saltHex || !keyHex) return false;

  const [N, r, p] = params.split(":").map(Number);
  if (!N || !r || !p) return false;

  const expected = Buffer.from(keyHex, "hex");
  let actual: Buffer;
  try {
    actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length, { N, r, p });
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Rejects the passwords that make an audit trail meaningless. */
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "パスワードは10文字以上にしてください。";
  if (/^\d+$/.test(password)) return "数字だけのパスワードは使えません。";
  return null;
}
