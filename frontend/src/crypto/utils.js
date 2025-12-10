// base64 & buffer helpers
export function toBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
export function fromBase64(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}
export function uint8ToBase64(u8) { return toBase64(u8.buffer); }
export function base64ToUint8(b64) { return new Uint8Array(fromBase64(b64)); }

