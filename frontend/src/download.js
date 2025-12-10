import { get as apiGet } from "./api/client.js";
import { decryptStoredPrivateKey } from "./crypto/key-storage.js";
import { decapsulate } from "./crypto/kyber-loader.js";
import { importFileKey, decryptBlobWithKey, b64ToAb } from "./crypto/aes-helper.js";
import { deriveAesKeyFromSharedSecret, unwrapFileKey } from "./crypto/hkdf-wrap.js";
import { fromBase64 } from "./crypto/utils.js";

const fileIdInput = document.getElementById("fileId");
const fetchFileBtn = document.getElementById("fetchFileBtn");
const downloadOutput = document.getElementById("downloadOutput");
const userIdInput = document.getElementById("downloadUserId");
const passInput = document.getElementById("downloadPassphrase");

async function showDownloadStatus(msg) {
  console.log(msg);
  if (downloadOutput) downloadOutput.textContent = msg;
}

fetchFileBtn.onclick = async () => {
  try {
    const fileId = fileIdInput.value.trim();
    if (!fileId) return alert("Enter a file ID");

    const userId = (userIdInput && userIdInput.value || "").trim();
    if (!userId) return alert("Enter your userId");

    const passphrase = (passInput && passInput.value || "");
    if (!passphrase) return alert("Enter your passphrase (used to decrypt your private key)");

    await showDownloadStatus(`Fetching file metadata for ${fileId}...`);

    // 1. fetch file metadata
    const metaRes = await apiGet(`/files/${encodeURIComponent(fileId)}`);
    if (!metaRes.ok) {
      throw new Error(`Failed to fetch file: ${metaRes.status}`);
    }
    const fileMeta = await metaRes.json();

    // 2. check if user is a recipient
    const recipientEntry = fileMeta.recipients.find(r => r.userId === userId);
    if (!recipientEntry) {
      throw new Error(`You (${userId}) are not a recipient of this file`);
    }

    await showDownloadStatus(`Found recipient entry for ${userId}. Decrypting private key...`);

    // 3. decrypt stored private key using passphrase
    let privB64;
    try {
      privB64 = await decryptStoredPrivateKey(passphrase);
      await showDownloadStatus("Private key decrypted (local)");
    } catch (e) {
      console.error('decryptStoredPrivateKey error', e);
      throw new Error(`Failed to decrypt stored private key: ${e && e.message ? e.message : String(e)}`);
    }

    // 4. decapsulate to recover shared secret
    await showDownloadStatus("Decapsulating Kyber ciphertext...");
    let sharedSecretRaw;
    try {
      sharedSecretRaw = await decapsulate(recipientEntry.kyberCiphertext, privB64);
      await showDownloadStatus('Decapsulation succeeded');
    } catch (e) {
      console.error('decapsulate error', e, { kyberCiphertext: recipientEntry.kyberCiphertext });
      throw new Error(`Failed to decapsulate Kyber ciphertext: ${e && e.message ? e.message : String(e)}`);
    }

    // 5. derive AES key using stored salt
    await showDownloadStatus("Deriving AES key...");
    let derivedKey;
    try {
      if (!recipientEntry.hkdfSalt) throw new Error('missing hkdfSalt in recipient entry');
      // Properly decode base64 salt to Uint8Array
      const saltBuf = new Uint8Array(fromBase64(recipientEntry.hkdfSalt));
      const res = await deriveAesKeyFromSharedSecret(sharedSecretRaw, saltBuf, "file-wrap");
      derivedKey = res.derivedKey;
      await showDownloadStatus('HKDF-derived AES key');
    } catch (e) {
      console.error('deriveAesKeyFromSharedSecret error', e, { hkdfSalt: recipientEntry.hkdfSalt });
      throw new Error(`Failed to derive AES key from shared secret: ${e && e.message ? e.message : String(e)}`);
    }

    // 6. unwrap file key
    await showDownloadStatus("Unwrapping file key...");
    let fileKeyRaw;
    try {
      fileKeyRaw = await unwrapFileKey(derivedKey, recipientEntry.wrapIv, recipientEntry.wrappedFileKey);
    } catch (e) {
      console.error('unwrapFileKey error', e, { wrapIv: recipientEntry.wrapIv, wrappedFileKey: recipientEntry.wrappedFileKey });
      throw new Error(`Failed to unwrap file key: ${e && e.message ? e.message : String(e)}`);
    }

    let fileKey;
    try {
      fileKey = await importFileKey(fileKeyRaw);
    } catch (e) {
      console.error('importFileKey error', e);
      throw new Error(`Failed to import file key: ${e && e.message ? e.message : String(e)}`);
    }

    // 7. decrypt file
    await showDownloadStatus("Decrypting file...");
    let plainArrayBuffer;
    try {
      // validate server-provided base64 strings
      if (!fileMeta.fileCipherB64 || typeof fileMeta.fileCipherB64 !== 'string') {
        console.error('invalid fileCipherB64', fileMeta.fileCipherB64);
        throw new Error('fileCipherB64 missing or not a string');
      }
      if (!fileMeta.fileIvB64 || typeof fileMeta.fileIvB64 !== 'string') {
        console.error('invalid fileIvB64', fileMeta.fileIvB64);
        throw new Error('fileIvB64 missing or not a string');
      }

      // quick sanity logging to help debug bad base64
      console.log('fileCipherB64 length', fileMeta.fileCipherB64.length, 'startsWith', fileMeta.fileCipherB64.slice(0,40));
      console.log('fileIvB64 length', fileMeta.fileIvB64.length, 'value', fileMeta.fileIvB64);

      const cipherBuf = b64ToAb(fileMeta.fileCipherB64);
      const ivBuf = b64ToAb(fileMeta.fileIvB64);
      plainArrayBuffer = await decryptBlobWithKey(fileKey, cipherBuf, ivBuf);
    } catch (e) {
      console.error('decryptBlobWithKey error', e);
      throw new Error(`Failed to decrypt file with AES-GCM: ${e && e.message ? e.message : String(e)}`);
    }

    // 8. offer download
    await showDownloadStatus("File decrypted! Offering download...");
    const blob = new Blob([plainArrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileMeta.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    await showDownloadStatus(`Downloaded: ${fileMeta.filename}\n(${(plainArrayBuffer.byteLength / 1024).toFixed(2)} KB)`);
  } catch (err) {
    console.error("File download/decrypt error", err);
    await showDownloadStatus(`Error: ${err && err.message ? err.message : String(err)}`);
    alert("Download failed: " + (err && err.message ? err.message : String(err)));
  }
};

