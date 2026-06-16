import { createHash, timingSafeEqual } from "crypto";

export const DOCTRINE_COOKIE_NAME = "ce-doctrine-session";
const SALT = "ce-doctrine-os-v1";

export function expectedSessionValue(): string | null {
  const password = process.env.CE_INTERNAL_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(`${password}:${SALT}`).digest("hex");
}

export function isValidSession(cookieValue: string | undefined): boolean {
  const expected = expectedSessionValue();
  if (!expected || !cookieValue) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function checkPassword(candidate: string): boolean {
  const password = process.env.CE_INTERNAL_PASSWORD;
  if (!password || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
