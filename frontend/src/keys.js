import { loadKyber, generateKeypair, encapsulate, decapsulate } from "./crypto/kyber-loader.js";
import { encryptAndStorePrivateKey, hasStoredPrivateKey } from "./crypto/key-storage.js";
import { post, get as apiGet } from "./api/client.js";

// expose Kyber helpers globally for console testing
window.loadKyber = loadKyber;
window.generateKeypair = generateKeypair;
window.encapsulate = encapsulate;
window.decapsulate = decapsulate;

// debug: confirm script loaded
console.log('keys.js loaded');
if (typeof window === 'object') {
  // show a tiny visual indicator if JS is running
  try {
    const dbg = document.createElement('div');
    dbg.id = 'debug-js-loaded';
    dbg.style.position = 'fixed';
    dbg.style.right = '8px';
    dbg.style.bottom = '8px';
    dbg.style.background = 'rgba(0,0,0,0.7)';
    dbg.style.color = 'white';
    dbg.style.padding = '6px 8px';
    dbg.style.fontSize = '12px';
    dbg.style.zIndex = '9999';
    dbg.textContent = 'JS loaded';
    document.body.appendChild(dbg);
  } catch (e) {
    console.warn('Could not add debug indicator', e);
  }
}


const genBtn = document.getElementById("genKeyBtn");
const uploadBtn = document.getElementById("uploadPubBtn");
const fetchBtn = document.getElementById("fetchPubBtn");
const userIdInput = document.getElementById("userId");
const passInput = document.getElementById("passphrase");
const keyOutput = document.getElementById("keyOutput");

let currentKeypair = null;

async function init() {
  // disable UI until initialization completes
  if (genBtn) genBtn.disabled = true;
  if (uploadBtn) uploadBtn.disabled = true;
  if (fetchBtn) fetchBtn.disabled = true;
  keyOutput.textContent = 'Initializing...';
  try {
    await loadKyber();
    if (hasStoredPrivateKey()) keyOutput.textContent = "Private key stored (locked).";
    else keyOutput.textContent = "No stored private key.";
  } catch (err) {
    console.error('Initialization error', err);
    keyOutput.textContent = 'Initialization error: ' + (err && err.message ? err.message : String(err));
  } finally {
    if (genBtn) genBtn.disabled = false;
    if (uploadBtn) uploadBtn.disabled = false;
    if (fetchBtn) fetchBtn.disabled = false;
  }
}
init();

if (genBtn) {
  genBtn.addEventListener('click', async (ev) => {
    console.log('Generate button clicked', ev);
    try {
      const pass = passInput.value;
      if (!pass) return alert("Enter a passphrase");
      const keys = await generateKeypair(); // { publicKeyB64, privateKeyB64 }
      currentKeypair = keys;
      await encryptAndStorePrivateKey(pass, keys.privateKeyB64);
      keyOutput.textContent = `Public key generated (first 120 chars):\n${keys.publicKeyB64.slice(0,120)}...`;
    } catch (err) {
      console.error('Error generating keypair', err);
      alert('Error generating keypair: ' + (err.message || err));
    }
  });
} else console.warn('genBtn not found');

if (uploadBtn) {
  uploadBtn.addEventListener('click', async (ev) => {
    console.log('Upload button clicked', ev);
    const uid = userIdInput.value.trim();
    if (!uid) return alert("Enter a userId");
    if (!currentKeypair) return alert("Generate keypair first (press Generate).");
    try {
      const res = await post("/keys/register", { userId: uid, publicKey: currentKeypair.publicKeyB64 });
      if (res.ok) {
        alert("Public key uploaded");
        keyOutput.textContent = `Uploaded public key for ${uid}`;
      } else {
        const txt = await res.text();
        alert("Upload failed: " + txt);
        keyOutput.textContent = `Upload failed: ${txt}`;
      }
    } catch (e) {
      console.error(e);
      alert("Network error");
    }
  });
} else console.warn('uploadBtn not found');

if (fetchBtn) {
  fetchBtn.addEventListener('click', async (ev) => {
    console.log('Fetch button clicked', ev);
    const uid = userIdInput.value.trim();
    if (!uid) return alert('Enter a userId');
    try {
      const res = await apiGet(`/keys/${encodeURIComponent(uid)}`);
      if (!res.ok) return alert('Not found');
      const obj = await res.json();
      keyOutput.textContent = `Public key for ${uid}:\n${obj.publicKey}`;
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  });
} else console.warn('fetchBtn not found');
