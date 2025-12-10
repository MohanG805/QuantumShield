import { toBase64, fromBase64 } from "./utils.js";

/**
 * Derive an AES-GCM CryptoKey from sharedSecret (ArrayBuffer) via HKDF-SHA256.
 * Returns { derivedKey, salt } where salt is Uint8Array (store with recipient data).
 */
export async function deriveAesKeyFromSharedSecret(sharedSecretRaw, salt = null, info = null) {
  const saltBuf = salt ? (salt instanceof Uint8Array ? salt : new Uint8Array(salt)) : crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey("raw", sharedSecretRaw, "HKDF", false, ["deriveKey"]);
  const derivedKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: saltBuf, info: info ? new TextEncoder().encode(info) : new Uint8Array() },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return { derivedKey, salt: saltBuf };
}

/** Wrap (encrypt) a fileKey (ArrayBuffer) using derivedKey */
export async function wrapFileKey(derivedKey, fileKeyRaw) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, derivedKey, fileKeyRaw);
  return { ivB64: toBase64(iv.buffer), wrappedB64: toBase64(cipher) };
}

/** Unwrap returns raw fileKey ArrayBuffer */
export async function unwrapFileKey(derivedKey, ivB64, wrappedB64) {
  // Properly decode base64 to ArrayBuffer/Uint8Array
  const iv = new Uint8Array(fromBase64(ivB64));
  const cipher = fromBase64(wrappedB64);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, derivedKey, cipher);
  return plain;
}

