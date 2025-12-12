# QuantumShield File Share - Complete Project Description

## 📋 Overview

**QuantumShield File Share** is a secure file sharing application that uses **post-quantum cryptography** to protect files from future quantum computer attacks. It combines:
- **Kyber** (post-quantum key exchange) for secure key sharing
- **AES-256-GCM** (symmetric encryption) for fast file encryption
- **Hybrid encryption** approach for best security and performance

---

## 🎯 Project Purpose

The goal is to allow users to securely share encrypted files where:
1. Only intended recipients can decrypt files
2. The server never sees unencrypted file contents
3. Even if quantum computers break current encryption, files remain secure
4. Files are encrypted end-to-end

---

## 🔐 Phase 1: Initial Setup - Key Generation & Registration

### Step 1: User Generates Post-Quantum Key Pair

**Location:** `frontend/src/keys.js`

**What happens:**
1. User opens the web application
2. User enters a **passphrase** (password to protect their private key)
3. User clicks "Generate Keypair"
4. System generates a **Kyber key pair**:
   - **Public Key**: Can be shared with anyone (stored on server)
   - **Private Key**: Must be kept secret (encrypted and stored in browser's localStorage)

**Technical Details:**
- Uses `pqc-kyber` library (post-quantum cryptography)
- Generates a key pair: `{ publicKeyB64, privateKeyB64 }`
- Private key is encrypted using:
  - **PBKDF2** (200,000 iterations) to derive key from passphrase
  - **AES-256-GCM** to encrypt the private key
  - Stored in browser's `localStorage` (encrypted)

**Code Flow:**
```javascript
// User clicks "Generate Keypair"
const keys = await generateKeypair(); // Kyber key pair
await encryptAndStorePrivateKey(passphrase, keys.privateKeyB64); // Encrypt & store
```

### Step 2: User Registers Public Key

**Location:** `frontend/src/keys.js` → `backend/src/routes/keys.js`

**What happens:**
1. User enters their **userId** (e.g., "alice", "bob")
2. User clicks "Upload Public Key"
3. Frontend sends public key to backend: `POST /keys/register`
4. Backend stores public key in MongoDB:
   - Collection: `PublicKey`
   - Fields: `userId`, `publicKey`, `createdAt`

**Database Schema:**
```javascript
{
  userId: "alice",
  publicKey: "base64-encoded-public-key...",
  createdAt: "2025-01-10T..."
}
```

**Why this matters:** Other users need your public key to send you encrypted files.

---

## 📤 Phase 2: File Upload Flow (Complete Process)

### Overview
When Alice wants to send a file to Bob and Charlie, the system:
1. Encrypts the file with AES
2. Wraps the AES key for each recipient using their public keys
3. Sends encrypted file + wrapped keys to server

### Step-by-Step Upload Process

#### Step 1: User Selects File
**Location:** `frontend/src/upload.js`

- User selects a file (via file picker or drag-drop)
- System shows file name and size
- User enters recipient userIds (comma-separated): `"bob,charlie"`

#### Step 2: Generate File Encryption Key
**Location:** `frontend/src/crypto/aes-helper.js`

```javascript
const fileKeyCrypto = await generateFileKey(); // AES-256-GCM key
const fileKeyRaw = await exportKeyRaw(fileKeyCrypto); // Convert to raw bytes
```

- Generates a random **AES-256-GCM** key
- This key will encrypt the entire file
- Key is temporary (only used for this file)

#### Step 3: Encrypt the File
**Location:** `frontend/src/crypto/aes-helper.js`

```javascript
const { cipherBuffer, iv } = await encryptBlobWithKey(fileKeyCrypto, fileArrayBuffer);
```

**What happens:**
- File is read as `ArrayBuffer`
- Encrypted using **AES-256-GCM** with:
  - Random **IV (Initialization Vector)** - 12 bytes
  - The file encryption key
- Result: `cipherBuffer` (encrypted file bytes) + `iv` (needed for decryption)

**Why AES?** Fast and secure for large files. Post-quantum algorithms are slower.

#### Step 4: Wrap File Key for Each Recipient

**For each recipient (Bob, Charlie):**

##### 4a. Fetch Recipient's Public Key
**Location:** `frontend/src/upload.js` → `backend/src/routes/keys.js`

```javascript
const res = await apiGet(`/keys/${recipientUserId}`);
const { publicKey } = await res.json();
```

- Retrieves recipient's public key from MongoDB
- This public key is used for key exchange

##### 4b. Perform Kyber Key Encapsulation
**Location:** `frontend/src/crypto/kyber-loader.js`

```javascript
const { ciphertextB64, sharedSecretRaw } = await encapsulate(recipientPublicKey);
```

**What happens:**
- Uses recipient's public key to create a **shared secret**
- Produces `kyberCiphertext` (can only be decrypted by recipient's private key)
- Produces `sharedSecretRaw` (secret bytes known only to sender and recipient)

**Post-Quantum Security:** Even quantum computers can't break this.

##### 4c. Derive AES Key from Shared Secret
**Location:** `frontend/src/crypto/hkdf-wrap.js`

```javascript
const { derivedKey, salt } = await deriveAesKeyFromSharedSecret(
  sharedSecretRaw, 
  null, 
  "file-wrap"
);
```

**What happens:**
- Uses **HKDF-SHA256** (Key Derivation Function) to convert shared secret into an AES key
- Generates random `salt` (stored with recipient data)
- Result: `derivedKey` (AES key for wrapping)

##### 4d. Wrap (Encrypt) the File Key
**Location:** `frontend/src/crypto/hkdf-wrap.js`

```javascript
const wrapped = await wrapFileKey(derivedKey, fileKeyRaw);
// Returns: { wrappedB64, ivB64 }
```

**What happens:**
- Encrypts the file encryption key using the derived AES key
- Uses **AES-GCM** with random IV
- Result: `wrappedFileKey` (encrypted file key) + `wrapIv` (IV for unwrapping)

**Why wrap?** The file key is encrypted separately for each recipient, so only they can decrypt it.

##### 4e. Create Recipient Entry
```javascript
recipientsEntries.push({
  userId: "bob",
  kyberCiphertext: "...",      // Kyber ciphertext
  wrappedFileKey: "...",        // Encrypted file key
  wrapIv: "...",                // IV for unwrapping
  hkdfSalt: "..."               // Salt for key derivation
});
```

**Repeat for each recipient.**

#### Step 5: Send to Backend
**Location:** `frontend/src/upload.js` → `backend/src/routes/files.js`

**Frontend sends:**
```javascript
FormData {
  filename: "document.pdf",
  fileIvB64: "base64-iv...",
  recipients: JSON.stringify(recipientsEntries),
  encryptedFile: Blob([cipherBuffer])  // Binary encrypted file
}
```

**Backend receives:**
1. **Multer** middleware parses the multipart form data
2. Extracts encrypted file (binary), filename, IV, recipients array
3. Generates unique `fileId`: `timestamp-randomString`
4. Saves encrypted file to disk: `backend/uploads/{fileId}-{filename}`
5. Saves metadata to MongoDB:

**Database Entry (FileMeta):**
```javascript
{
  filename: "document.pdf",
  storedPath: "backend/uploads/1234567890-abc123-document.pdf",
  fileIvB64: "base64-iv...",
  recipients: [
    {
      userId: "bob",
      kyberCiphertext: "...",
      wrappedFileKey: "...",
      wrapIv: "...",
      hkdfSalt: "..."
    },
    {
      userId: "charlie",
      kyberCiphertext: "...",
      wrappedFileKey: "...",
      wrapIv: "...",
      hkdfSalt: "..."
    }
  ],
  uploader: "alice",
  createdAt: "2025-01-10T..."
}
```

**Backend Response:**
```json
{
  "ok": true,
  "id": "507f1f77bcf86cd799439011"
}
```

**Security Note:** Backend never sees:
- Original file contents
- File encryption key
- Shared secrets
- Private keys

---

## 📥 Phase 3: File Download Flow (Complete Process)

### Overview
When Bob wants to download a file sent to him:
1. Fetches file metadata from server
2. Uses his private key to recover shared secret
3. Derives AES key and unwraps file key
4. Decrypts the file

### Step-by-Step Download Process

#### Step 1: User Requests File
**Location:** `frontend/src/download.js`

- User enters:
  - **File ID** (from upload response or shared link)
  - **User ID** (their userId, e.g., "bob")
  - **Passphrase** (to decrypt their stored private key)

#### Step 2: Fetch File Metadata
**Location:** `frontend/src/download.js` → `backend/src/routes/files.js`

```javascript
const metaRes = await apiGet(`/files/${fileId}`);
const fileMeta = await metaRes.json();
```

**Backend:**
1. Looks up file in MongoDB by `fileId`
2. Reads encrypted file from disk
3. Converts file to base64 for JSON transport
4. Returns metadata + encrypted file:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "filename": "document.pdf",
  "fileIvB64": "base64-iv...",
  "fileCipherB64": "base64-encrypted-file...",
  "recipients": [
    {
      "userId": "bob",
      "kyberCiphertext": "...",
      "wrappedFileKey": "...",
      "wrapIv": "...",
      "hkdfSalt": "..."
    }
  ]
}
```

#### Step 3: Verify User is Recipient
**Location:** `frontend/src/download.js`

```javascript
const recipientEntry = fileMeta.recipients.find(r => r.userId === userId);
if (!recipientEntry) throw new Error("Not a recipient");
```

- Checks if user's ID is in recipients list
- If not, access is denied

#### Step 4: Decrypt Stored Private Key
**Location:** `frontend/src/crypto/key-storage.js`

```javascript
const privB64 = await decryptStoredPrivateKey(passphrase);
```

**What happens:**
1. Retrieves encrypted private key from `localStorage`
2. Uses passphrase with **PBKDF2** to derive decryption key
3. Decrypts using **AES-GCM**
4. Returns decrypted private key (base64)

**Security:** Private key is never stored unencrypted.

#### Step 5: Decapsulate Kyber Ciphertext
**Location:** `frontend/src/crypto/kyber-loader.js`

```javascript
const sharedSecretRaw = await decapsulate(
  recipientEntry.kyberCiphertext, 
  privB64
);
```

**What happens:**
- Uses recipient's private key to decrypt `kyberCiphertext`
- Recovers the **shared secret** (same one created during upload)
- Only the recipient with matching private key can do this

#### Step 6: Derive AES Key (Same Process as Upload)
**Location:** `frontend/src/crypto/hkdf-wrap.js`

```javascript
const saltBuf = new Uint8Array(fromBase64(recipientEntry.hkdfSalt));
const { derivedKey } = await deriveAesKeyFromSharedSecret(
  sharedSecretRaw, 
  saltBuf, 
  "file-wrap"
);
```

**What happens:**
- Uses the **same salt** stored in recipient entry
- Derives the same AES key that was used to wrap the file key
- Result: `derivedKey` (same as upload step 4c)

#### Step 7: Unwrap (Decrypt) File Key
**Location:** `frontend/src/crypto/hkdf-wrap.js`

```javascript
const fileKeyRaw = await unwrapFileKey(
  derivedKey, 
  recipientEntry.wrapIv, 
  recipientEntry.wrappedFileKey
);
```

**What happens:**
- Decrypts `wrappedFileKey` using `derivedKey` and `wrapIv`
- Recovers the original **file encryption key** (raw bytes)
- This is the key that encrypted the actual file

#### Step 8: Import File Key
**Location:** `frontend/src/crypto/aes-helper.js`

```javascript
const fileKey = await importFileKey(fileKeyRaw);
```

- Converts raw key bytes into Web Crypto API `CryptoKey` object
- Ready for decryption

#### Step 9: Decrypt the File
**Location:** `frontend/src/crypto/aes-helper.js`

```javascript
const cipherBuf = b64ToAb(fileMeta.fileCipherB64);
const ivBuf = b64ToAb(fileMeta.fileIvB64);
const plainArrayBuffer = await decryptBlobWithKey(fileKey, cipherBuf, ivBuf);
```

**What happens:**
- Converts base64 encrypted file back to binary
- Decrypts using **AES-256-GCM** with:
  - File encryption key (recovered in step 7)
  - IV (from metadata)
- Result: Original file contents as `ArrayBuffer`

#### Step 10: Download File
**Location:** `frontend/src/download.js`

```javascript
const blob = new Blob([plainArrayBuffer], { type: "application/octet-stream" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = fileMeta.filename;
a.click();
```

- Creates a downloadable blob
- Triggers browser download
- User receives the original, decrypted file

---

## 🏗️ System Architecture

### Frontend (Client-Side)
- **Framework:** Vanilla JavaScript (no framework)
- **Build Tool:** Vite
- **Cryptography:**
  - `pqc-kyber` - Post-quantum key exchange
  - Web Crypto API - AES encryption, HKDF, PBKDF2
- **Storage:** Browser `localStorage` (encrypted private keys)

### Backend (Server-Side)
- **Framework:** Express.js (Node.js)
- **Database:** MongoDB
  - `PublicKey` collection - User public keys
  - `FileMeta` collection - File metadata and recipient info
- **File Storage:** Local filesystem (`backend/uploads/`)
- **Middleware:**
  - Multer - File upload handling
  - CORS - Cross-origin requests
  - Express JSON parser

### Data Flow Diagram

```
┌─────────────┐
│   Alice     │
│  (Sender)   │
└──────┬──────┘
       │
       │ 1. Generate Keypair
       │ 2. Register Public Key
       ▼
┌─────────────────┐
│   Frontend      │
│  (Browser)      │
└──────┬──────────┘
       │
       │ 3. Encrypt File (AES)
       │ 4. Wrap Keys (Kyber + HKDF)
       │ 5. Upload Encrypted File
       ▼
┌─────────────────┐
│    Backend      │
│   (Express)     │
└──────┬──────────┘
       │
       ├──► MongoDB (Metadata)
       │    - PublicKey
       │    - FileMeta
       │
       └──► Filesystem (Encrypted Files)
            - backend/uploads/

       │
       │ 6. Bob Requests File
       ▼
┌─────────────────┐
│    Backend      │
│   (Express)     │
└──────┬──────────┘
       │
       │ 7. Return Metadata + Encrypted File
       ▼
┌─────────────────┐
│   Frontend      │
│  (Browser)      │
└──────┬──────────┘
       │
       │ 8. Decapsulate (Kyber)
       │ 9. Derive Key (HKDF)
       │ 10. Unwrap File Key
       │ 11. Decrypt File (AES)
       ▼
┌─────────────┐
│     Bob     │
│ (Recipient) │
└─────────────┘
```

---

## 🔒 Security Features

### 1. **Post-Quantum Cryptography**
- Uses **Kyber** algorithm (NIST standardized)
- Resistant to attacks from quantum computers
- Future-proof encryption

### 2. **End-to-End Encryption**
- Files encrypted on client before upload
- Server never sees plaintext
- Only recipients can decrypt

### 3. **Hybrid Encryption**
- **Kyber** for key exchange (post-quantum)
- **AES-256-GCM** for file encryption (fast, secure)
- Best of both worlds

### 4. **Key Wrapping**
- File key encrypted separately for each recipient
- Uses HKDF for key derivation
- Salt ensures uniqueness

### 5. **Private Key Protection**
- Encrypted with PBKDF2 (200,000 iterations)
- Stored in browser localStorage
- Requires passphrase to decrypt

### 6. **Access Control**
- Only listed recipients can decrypt
- Server verifies recipient status
- No unauthorized access

---

## 📊 Database Schema

### PublicKey Collection
```javascript
{
  userId: String,        // Unique user identifier
  publicKey: String,    // Base64 encoded Kyber public key
  createdAt: Date       // Registration timestamp
}
```

### FileMeta Collection
```javascript
{
  filename: String,                    // Original filename
  storedPath: String,                   // Path to encrypted file on disk
  fileIvB64: String,                   // AES IV (base64)
  recipients: [{
    userId: String,                     // Recipient identifier
    kyberCiphertext: String,            // Kyber ciphertext
    wrappedFileKey: String,             // Encrypted file key
    wrapIv: String,                     // Wrapping IV
    hkdfSalt: String                    // Key derivation salt
  }],
  uploader: String,                    // Sender's userId
  createdAt: Date                      // Upload timestamp
}
```

---

## 🚀 Deployment

### Frontend
- **Platform:** Netlify (or any static host)
- **Config:** `netlify.toml`
- **Build:** `npm run build` (Vite)
- **Environment:** Set `VITE_API_BASE_URL` to backend URL

### Backend
- **Platform:** Render.com (or any Node.js host)
- **Config:** `render.yaml`
- **Requirements:**
  - MongoDB database (MongoDB Atlas or self-hosted)
  - Environment variables:
    - `MONGO_URI` - MongoDB connection string
    - `PORT` - Server port (default: 5000)
    - `HOST` - Server host (default: 0.0.0.0)

---

## 🔄 Complete User Journey Example

### Scenario: Alice sends "secret.pdf" to Bob and Charlie

1. **Alice's Setup:**
   - Opens app → Generates keypair (passphrase: "alice123")
   - Registers public key with userId: "alice"

2. **Bob's Setup:**
   - Opens app → Generates keypair (passphrase: "bob456")
   - Registers public key with userId: "bob"

3. **Charlie's Setup:**
   - Opens app → Generates keypair (passphrase: "charlie789")
   - Registers public key with userId: "charlie"

4. **Alice Uploads File:**
   - Selects "secret.pdf"
   - Enters recipients: "bob,charlie"
   - Clicks "Encrypt & Send"
   - System:
     - Encrypts file with AES
     - Fetches Bob's and Charlie's public keys
     - Wraps file key for each recipient
     - Uploads to server
   - Receives file ID: "507f1f77bcf86cd799439011"

5. **Bob Downloads File:**
   - Enters file ID: "507f1f77bcf86cd799439011"
   - Enters userId: "bob"
   - Enters passphrase: "bob456"
   - Clicks "Fetch & Decrypt"
   - System:
     - Fetches file metadata
     - Decrypts Bob's private key
     - Decapsulates to get shared secret
     - Derives AES key and unwraps file key
     - Decrypts file
   - Downloads "secret.pdf"

6. **Charlie Downloads File:**
   - Same process as Bob (with his own credentials)
   - Successfully decrypts and downloads file

---

## 🎓 Key Concepts Explained

### Why Hybrid Encryption?
- **Kyber** is secure but slow for large files
- **AES** is fast but needs secure key exchange
- **Solution:** Use Kyber to securely share AES keys, then use AES to encrypt files

### What is Key Wrapping?
- The file encryption key is encrypted separately for each recipient
- Each recipient gets their own "wrapped" version
- Only they can unwrap (decrypt) it with their private key

### What is HKDF?
- **HKDF** (HMAC-based Key Derivation Function)
- Converts a shared secret into a usable encryption key
- Adds salt for uniqueness and security

### Why Post-Quantum?
- Current encryption (RSA, ECC) can be broken by quantum computers
- **Kyber** is designed to resist quantum attacks
- Ensures files remain secure in the future

---

## 📝 Summary

**QuantumShield File Share** is a complete end-to-end encrypted file sharing system that:

1. ✅ Uses post-quantum cryptography for future security
2. ✅ Encrypts files before upload (server never sees plaintext)
3. ✅ Allows multiple recipients per file
4. ✅ Protects private keys with passphrase encryption
5. ✅ Uses hybrid encryption for best performance and security
6. ✅ Provides secure key exchange and file decryption

The system ensures that only intended recipients can access files, and even if the server is compromised, files remain encrypted and secure.

