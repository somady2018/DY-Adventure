// 4자리 PIN을 평문으로 저장하지 않기 위한 해시 유틸리티.
// 이 앱은 한 가정에서 도영이 한 명이 쓰는 로컬 MVP이므로, 서버 인증 수준의
// 보안은 필요하지 않습니다. 다만 "브라우저 저장소를 열어보면 PIN이 그대로
// 보인다"는 상황만은 피하기 위해 SHA-256 해시 + 디바이스 고정 salt를 사용합니다.
// (주의: 이 방식은 같은 브라우저 안에서 평문 노출을 막는 수준의 보호이며,
//  실제 서비스로 확장할 때는 서버 측 인증으로 교체해야 합니다.)

import { mirrorRemove, mirrorSet } from "./nativeMirror";

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hasWebCryptoDigest() {
  return !!(
    globalThis.crypto &&
    globalThis.crypto.subtle &&
    typeof globalThis.crypto.subtle.digest === "function" &&
    typeof TextEncoder !== "undefined"
  );
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

function localHashHex(text) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}

function createSalt() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateSalt(storageKey) {
  let salt = null;
  try {
    salt = localStorage.getItem(storageKey);
  } catch {
    // If localStorage is blocked, keep the app responsive with a session-only salt.
  }

  if (!salt) {
    salt = createSalt();
    try {
      localStorage.setItem(storageKey, salt);
      mirrorSet(storageKey, salt);
    } catch {
      // A storage failure will be handled when the app state is saved.
    }
  }
  return salt;
}

export const SALT_KEY = "adventure.pinSalt.v1";

export function getPinSalt() {
  try {
    return localStorage.getItem(SALT_KEY);
  } catch {
    return null;
  }
}

export function setPinSalt(salt) {
  if (!salt || typeof salt !== "string") return false;
  try {
    localStorage.setItem(SALT_KEY, salt);
    mirrorSet(SALT_KEY, salt);
    return true;
  } catch {
    return false;
  }
}

export function clearPinSalt() {
  try {
    localStorage.removeItem(SALT_KEY);
    mirrorRemove(SALT_KEY);
  } catch {
    // ignore
  }
}

export async function hashPin(pin) {
  const salt = getOrCreateSalt(SALT_KEY);
  const text = `${salt}:${pin}`;
  if (hasWebCryptoDigest()) {
    return `sha256:${await sha256Hex(text)}`;
  }
  return `local:${localHashHex(text)}`;
}

export async function verifyPin(pin, storedHash) {
  const salt = getOrCreateSalt(SALT_KEY);
  const text = `${salt}:${pin}`;

  if (storedHash?.startsWith("sha256:")) {
    return hasWebCryptoDigest() && `sha256:${await sha256Hex(text)}` === storedHash;
  }

  if (storedHash?.startsWith("local:")) {
    return `local:${localHashHex(text)}` === storedHash;
  }

  if (hasWebCryptoDigest()) {
    return (await sha256Hex(text)) === storedHash;
  }

  return false;
}

export function isValidPinFormat(pin) {
  return /^\d{4}$/.test(pin);
}
