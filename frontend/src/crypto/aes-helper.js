// simple whole-blob AES-GCM encrypt/decrypt helpers
export async function generateFileKey() {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
export async function exportKeyRaw(key) {
  return await crypto.subtle.exportKey("raw", key); // ArrayBuffer
}
export async function importFileKey(raw) {
  return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Encrypt a Blob or ArrayBuffer -> returns {cipherB64, ivB64} (cipher is ArrayBuffer) */
export async function encryptBlobWithKey(key, dataBuffer) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, dataBuffer);
  return { cipherBuffer: cipher, iv: iv.buffer };
}

/** Decrypt: cipherBuffer ArrayBuffer + iv (ArrayBuffer) -> returns ArrayBuffer plaintext */
export async function decryptBlobWithKey(key, cipherBuffer, ivBuffer) {
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(ivBuffer) }, key, cipherBuffer);
  return plain;
}

/** Helper: ArrayBuffer <-> base64 */
export function abToB64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
export function b64ToAb(b64) { const s = atob(b64); const a = new Uint8Array(s.length); for (let i=0;i<s.length;i++) a[i]=s.charCodeAt(i); return a.buffer; }

// at end of frontend/src/crypto/aes-helper.js
export function arrayBufferToBase64(buf) { return abToB64(buf); }
export function base64ToArrayBuffer(b64) { return b64ToAb(b64); }
