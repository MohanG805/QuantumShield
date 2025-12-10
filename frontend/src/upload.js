import { get as apiGet, post, API_BASE } from "./api/client.js";
import { encryptBlobWithKey, generateFileKey, exportKeyRaw, importFileKey, abToB64 } from "./crypto/aes-helper.js";
import { encapsulate } from "./crypto/kyber-loader.js";
import { deriveAesKeyFromSharedSecret, wrapFileKey } from "./crypto/hkdf-wrap.js";
import { toBase64 } from "./crypto/utils.js";

const fileInput = document.getElementById("fileInput");
const recipientsInput = document.getElementById("recipients");
const sendBtn = document.getElementById("sendBtn");
const fileOutput = document.getElementById("fileOutput");

async function showFileStatus(msg) {
  console.log(msg);
  if (fileOutput) fileOutput.textContent = msg;
}

// listen for file selection (via picker or drag-drop) to show immediate feedback
// Use requestAnimationFrame to prevent blocking UI when files are selected
fileInput.addEventListener('change', () => {
  // Defer status update to prevent blocking
  requestAnimationFrame(() => {
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      // show immediate feedback without blocking UI
      showFileStatus(`Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)\nClick "Encrypt & Send File" to proceed`);
    }
  });
}, { passive: true });

sendBtn.onclick = async () => {
  try {
    const file = fileInput.files[0];
    if (!file) return alert("Choose file");
    
    const recipients = recipientsInput.value.split(",").map(s => s.trim()).filter(Boolean);
    if (recipients.length === 0) return alert("Add recipient userIds");

    // disable button during upload to prevent duplicate submissions
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.6';
    
    // defer heavy crypto work to next frame to keep UI responsive
    await new Promise(resolve => requestIdleCallback(resolve, { timeout: 100 }));

    await showFileStatus(`Encrypting file: ${file.name}...`);

    // 1. generate fileKey (AES)
    const fileKeyCrypto = await generateFileKey();
    const fileKeyRaw = await exportKeyRaw(fileKeyCrypto);

    // 2. encrypt file (whole blob)
    const arrayBuffer = await file.arrayBuffer();
    const { cipherBuffer, iv } = await encryptBlobWithKey(fileKeyCrypto, arrayBuffer);
    await showFileStatus(`File encrypted. Wrapping key for ${recipients.length} recipient(s)...`);

    // 3. for each recipient, fetch publicKey and produce recipient entry
    const recipientsEntries = [];
    for (const uid of recipients) {
      await showFileStatus(`Fetching public key for ${uid}...`);
      const res = await apiGet(`/keys/${encodeURIComponent(uid)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch public key for ${uid}: ${res.status}`);
      }
      const j = await res.json();
      const pubB64 = j.publicKey;
      
      // encapsulate using Kyber
      const { ciphertextB64, sharedSecretRaw } = await encapsulate(pubB64);
      
      // derive AES key and wrap file key
      const { derivedKey, salt } = await deriveAesKeyFromSharedSecret(sharedSecretRaw, null, "file-wrap");
      const wrapped = await wrapFileKey(derivedKey, fileKeyRaw);
      
      recipientsEntries.push({
        userId: uid,
        kyberCiphertext: ciphertextB64,
        wrappedFileKey: wrapped.wrappedB64,
        wrapIv: wrapped.ivB64,
        hkdfSalt: toBase64(salt.buffer) // salt is Uint8Array, convert via .buffer
      });
      await showFileStatus(`Wrapped key for ${uid}. (${recipientsEntries.length}/${recipients.length})`);
    }

    // 4. send encrypted file and metadata to backend via FormData (binary upload, no base64)
    await showFileStatus("Uploading encrypted file to server...");
    
    const formData = new FormData();
    formData.append('filename', file.name);
    formData.append('fileIvB64', abToB64(iv));
    formData.append('recipients', JSON.stringify(recipientsEntries));
    formData.append('encryptedFile', new Blob([cipherBuffer]), 'file.bin');

    const uploadUrl = API_BASE + "/files/upload";
    console.log('Uploading to:', uploadUrl);
    
    let r2;
    try {
      r2 = await fetch(uploadUrl, {
        method: "POST",
        body: formData
        // NOTE: do NOT set Content-Type header; browser will set it to multipart/form-data automatically
      });
    } catch (networkError) {
      console.error('Network error during upload:', networkError);
      console.error('API_BASE:', API_BASE);
      throw new Error(`Network error: Failed to connect to backend at ${uploadUrl}. Check if VITE_API_BASE_URL is set correctly in your deployment settings. Error: ${networkError.message}`);
    }

    if (r2.ok) {
      const result = await r2.json();
      await showFileStatus(`File uploaded successfully!\nFile ID: ${result.id}\nRecipients: ${recipients.join(", ")}`);
      alert("File uploaded");
    } else {
      const errText = await r2.text();
      console.error('Upload failed:', r2.status, errText);
      console.error('Response URL:', r2.url);
      throw new Error(`Upload failed (${r2.status}): ${errText || 'Unknown error'}`);
    }
  } catch (err) {
    console.error("File upload error", err);
    await showFileStatus(`Error: ${err && err.message ? err.message : String(err)}`);
    alert("Upload failed: " + (err && err.message ? err.message : String(err)));
  } finally {
    // re-enable button after upload completes or fails
    sendBtn.disabled = false;
    sendBtn.style.opacity = '1';
  }
};

