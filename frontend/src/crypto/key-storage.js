// PBKDF2 + AES-GCM to protect private key in localStorage
import { toBase64, fromBase64 } from "./utils.js";

const STORAGE_KEY = "kyber_priv";

function encText(s) { return new TextEncoder().encode(s); }

async function deriveKey(pass, saltBuf, iterations = 200000) {
  const base = await crypto.subtle.importKey("raw", encText(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBuf, iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptAndStorePrivateKey(pass, privateKeyB64) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt.buffer);
  const privRaw = fromBase64(privateKeyB64);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, privRaw);
  const payload = {
    algo: "PBKDF2+AES-GCM",
    salt: toBase64(salt.buffer),
    iv: toBase64(iv.buffer),
    ciphertext: toBase64(cipher)
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export async function decryptStoredPrivateKey(pass) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error("no stored private key");
  const obj = JSON.parse(raw);
  const salt = fromBase64(obj.salt);
  const iv = fromBase64(obj.iv);
  const cipher = fromBase64(obj.ciphertext);
  const key = await deriveKey(pass, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, cipher);
  return toBase64(plain); // return privateKeyB64
}

export function hasStoredPrivateKey() { return !!localStorage.getItem(STORAGE_KEY); }
export function removeStoredPrivateKey() { localStorage.removeItem(STORAGE_KEY); }

