# QuantumShield File Share - Module-Wise Pseudocode

## 📋 Table of Contents
1. [Frontend Modules](#frontend-modules)
2. [Backend Modules](#backend-modules)
3. [Cryptographic Modules](#cryptographic-modules)
4. [Data Models](#data-models)

---

## 🔵 FRONTEND MODULES

### Module 1: Key Generation (`frontend/src/keys.js`)

```
MODULE KeyGeneration
BEGIN
    FUNCTION initialize()
        DISABLE UI buttons
        SET status = "Initializing..."
        TRY
            CALL loadKyber()
            IF hasStoredPrivateKey() THEN
                SET status = "Private key stored (locked)"
            ELSE
                SET status = "No stored private key"
            END IF
        CATCH error
            SET status = "Initialization error: " + error.message
        FINALLY
            ENABLE UI buttons
        END TRY
    END FUNCTION

    FUNCTION generateKeypair()
        INPUT: passphrase (string)
        OUTPUT: { publicKeyB64, privateKeyB64 }
        
        BEGIN
            IF passphrase IS EMPTY THEN
                ALERT "Enter a passphrase"
                RETURN
            END IF
            
            // Generate post-quantum key pair
            keys = CALL generateKeypair() // Returns { publicKeyB64, privateKeyB64 }
            currentKeypair = keys
            
            // Encrypt and store private key
            CALL encryptAndStorePrivateKey(passphrase, keys.privateKeyB64)
            
            DISPLAY "Public key generated: " + keys.publicKeyB64[0:120] + "..."
        END
    END FUNCTION

    FUNCTION registerPublicKey()
        INPUT: userId (string), publicKeyB64 (string)
        OUTPUT: success (boolean)
        
        BEGIN
            IF userId IS EMPTY THEN
                ALERT "Enter a userId"
                RETURN false
            END IF
            
            IF currentKeypair IS NULL THEN
                ALERT "Generate keypair first"
                RETURN false
            END IF
            
            TRY
                response = CALL POST("/keys/register", {
                    userId: userId,
                    publicKey: currentKeypair.publicKeyB64
                })
                
                IF response.status == 200 THEN
                    ALERT "Public key uploaded"
                    DISPLAY "Uploaded public key for " + userId
                    RETURN true
                ELSE
                    errorText = CALL response.text()
                    ALERT "Upload failed: " + errorText
                    RETURN false
                END IF
            CATCH networkError
                ALERT "Network error"
                RETURN false
            END TRY
        END
    END FUNCTION

    FUNCTION fetchPublicKey()
        INPUT: userId (string)
        OUTPUT: publicKeyB64 (string)
        
        BEGIN
            IF userId IS EMPTY THEN
                ALERT "Enter a userId"
                RETURN null
            END IF
            
            TRY
                response = CALL GET("/keys/" + userId)
                
                IF response.status != 200 THEN
                    ALERT "Public key not found"
                    RETURN null
                END IF
                
                data = CALL response.json()
                DISPLAY "Public key for " + userId + ": " + data.publicKey
                RETURN data.publicKey
            CATCH networkError
                ALERT "Network error"
                RETURN null
            END TRY
        END
    END FUNCTION
END MODULE
```

---

### Module 2: File Upload (`frontend/src/upload.js`)

```
MODULE FileUpload
BEGIN
    FUNCTION handleFileSelection()
        INPUT: file (File object)
        
        BEGIN
            IF file EXISTS THEN
                fileSizeMB = file.size / 1024 / 1024
                DISPLAY "Selected: " + file.name + " (" + fileSizeMB + " MB)"
                DISPLAY "Click 'Encrypt & Send File' to proceed"
            END IF
        END
    END FUNCTION

    FUNCTION uploadFile()
        INPUT: file (File), recipients (string array)
        OUTPUT: fileId (string)
        
        BEGIN
            // Step 1: Validate inputs
            IF file IS NULL THEN
                ALERT "Choose file"
                RETURN null
            END IF
            
            IF recipients IS EMPTY THEN
                ALERT "Add recipient userIds"
                RETURN null
            END IF
            
            DISABLE upload button
            SET uploadStatus = "Encrypting file..."
            
            TRY
                // Step 2: Generate file encryption key
                fileKeyCrypto = CALL generateFileKey() // AES-256-GCM
                fileKeyRaw = CALL exportKeyRaw(fileKeyCrypto)
                
                // Step 3: Encrypt file
                fileArrayBuffer = CALL file.arrayBuffer()
                encryptionResult = CALL encryptBlobWithKey(fileKeyCrypto, fileArrayBuffer)
                cipherBuffer = encryptionResult.cipherBuffer
                iv = encryptionResult.iv
                
                SET uploadStatus = "File encrypted. Wrapping key for recipients..."
                
                // Step 4: Wrap file key for each recipient
                recipientsEntries = []
                
                FOR EACH recipientId IN recipients DO
                    SET uploadStatus = "Fetching public key for " + recipientId
                    
                    // Fetch recipient's public key
                    response = CALL GET("/keys/" + recipientId)
                    IF response.status != 200 THEN
                        THROW ERROR "Failed to fetch public key for " + recipientId
                    END IF
                    
                    recipientData = CALL response.json()
                    recipientPublicKey = recipientData.publicKey
                    
                    // Perform Kyber encapsulation
                    kyberResult = CALL encapsulate(recipientPublicKey)
                    kyberCiphertext = kyberResult.ciphertextB64
                    sharedSecret = kyberResult.sharedSecretRaw
                    
                    // Derive AES key from shared secret
                    hkdfResult = CALL deriveAesKeyFromSharedSecret(
                        sharedSecret, 
                        null, 
                        "file-wrap"
                    )
                    derivedKey = hkdfResult.derivedKey
                    salt = hkdfResult.salt
                    
                    // Wrap file key
                    wrappedResult = CALL wrapFileKey(derivedKey, fileKeyRaw)
                    
                    // Create recipient entry
                    recipientEntry = {
                        userId: recipientId,
                        kyberCiphertext: kyberCiphertext,
                        wrappedFileKey: wrappedResult.wrappedB64,
                        wrapIv: wrappedResult.ivB64,
                        hkdfSalt: CALL toBase64(salt.buffer)
                    }
                    
                    ADD recipientEntry TO recipientsEntries
                    SET uploadStatus = "Wrapped key for " + recipientId + 
                                      " (" + recipientsEntries.length + "/" + recipients.length + ")"
                END FOR
                
                // Step 5: Upload to backend
                SET uploadStatus = "Uploading encrypted file to server..."
                
                formData = NEW FormData()
                CALL formData.append('filename', file.name)
                CALL formData.append('fileIvB64', CALL abToB64(iv))
                CALL formData.append('recipients', CALL JSON.stringify(recipientsEntries))
                CALL formData.append('encryptedFile', NEW Blob([cipherBuffer]), 'file.bin')
                
                uploadResponse = CALL fetch(API_BASE + "/files/upload", {
                    method: "POST",
                    body: formData
                })
                
                IF uploadResponse.status == 200 THEN
                    result = CALL uploadResponse.json()
                    fileId = result.id
                    SET uploadStatus = "File uploaded successfully! File ID: " + fileId
                    ALERT "File uploaded"
                    RETURN fileId
                ELSE
                    errorText = CALL uploadResponse.text()
                    THROW ERROR "Upload failed (" + uploadResponse.status + "): " + errorText
                END IF
                
            CATCH error
                SET uploadStatus = "Error: " + error.message
                ALERT "Upload failed: " + error.message
                RETURN null
            FINALLY
                ENABLE upload button
            END TRY
        END
    END FUNCTION
END MODULE
```

---

### Module 3: File Download (`frontend/src/download.js`)

```
MODULE FileDownload
BEGIN
    FUNCTION downloadFile()
        INPUT: fileId (string), userId (string), passphrase (string)
        OUTPUT: decryptedFile (Blob)
        
        BEGIN
            // Step 1: Validate inputs
            IF fileId IS EMPTY THEN
                ALERT "Enter a file ID"
                RETURN null
            END IF
            
            IF userId IS EMPTY THEN
                ALERT "Enter your userId"
                RETURN null
            END IF
            
            IF passphrase IS EMPTY THEN
                ALERT "Enter your passphrase"
                RETURN null
            END IF
            
            SET downloadStatus = "Fetching file metadata..."
            
            TRY
                // Step 2: Fetch file metadata
                metaResponse = CALL GET("/files/" + fileId)
                
                IF metaResponse.status != 200 THEN
                    THROW ERROR "Failed to fetch file: " + metaResponse.status
                END IF
                
                fileMeta = CALL metaResponse.json()
                
                // Step 3: Verify user is recipient
                recipientEntry = FIND fileMeta.recipients WHERE userId == userId
                
                IF recipientEntry IS NULL THEN
                    THROW ERROR "You are not a recipient of this file"
                END IF
                
                SET downloadStatus = "Found recipient entry. Decrypting private key..."
                
                // Step 4: Decrypt stored private key
                privateKeyB64 = CALL decryptStoredPrivateKey(passphrase)
                SET downloadStatus = "Private key decrypted"
                
                // Step 5: Decapsulate Kyber ciphertext
                SET downloadStatus = "Decapsulating Kyber ciphertext..."
                sharedSecretRaw = CALL decapsulate(
                    recipientEntry.kyberCiphertext, 
                    privateKeyB64
                )
                SET downloadStatus = "Decapsulation succeeded"
                
                // Step 6: Derive AES key
                SET downloadStatus = "Deriving AES key..."
                saltBuf = NEW Uint8Array(CALL fromBase64(recipientEntry.hkdfSalt))
                hkdfResult = CALL deriveAesKeyFromSharedSecret(
                    sharedSecretRaw, 
                    saltBuf, 
                    "file-wrap"
                )
                derivedKey = hkdfResult.derivedKey
                SET downloadStatus = "HKDF-derived AES key"
                
                // Step 7: Unwrap file key
                SET downloadStatus = "Unwrapping file key..."
                fileKeyRaw = CALL unwrapFileKey(
                    derivedKey, 
                    recipientEntry.wrapIv, 
                    recipientEntry.wrappedFileKey
                )
                
                fileKey = CALL importFileKey(fileKeyRaw)
                
                // Step 8: Decrypt file
                SET downloadStatus = "Decrypting file..."
                cipherBuf = CALL b64ToAb(fileMeta.fileCipherB64)
                ivBuf = CALL b64ToAb(fileMeta.fileIvB64)
                plainArrayBuffer = CALL decryptBlobWithKey(fileKey, cipherBuf, ivBuf)
                
                // Step 9: Offer download
                SET downloadStatus = "File decrypted! Offering download..."
                decryptedBlob = NEW Blob([plainArrayBuffer])
                downloadUrl = CALL URL.createObjectURL(decryptedBlob)
                
                CREATE downloadLink WITH href = downloadUrl AND download = fileMeta.filename
                CLICK downloadLink
                REMOVE downloadLink
                CALL URL.revokeObjectURL(downloadUrl)
                
                SET downloadStatus = "Downloaded: " + fileMeta.filename
                RETURN decryptedBlob
                
            CATCH error
                SET downloadStatus = "Error: " + error.message
                ALERT "Download failed: " + error.message
                RETURN null
            END TRY
        END
    END FUNCTION
END MODULE
```

---

### Module 4: API Client (`frontend/src/api/client.js`)

```
MODULE APIClient
BEGIN
    FUNCTION getApiBase()
        OUTPUT: apiBaseUrl (string)
        
        BEGIN
            // Check environment variable
            IF VITE_API_BASE_URL EXISTS THEN
                url = VITE_API_BASE_URL.trim()
                IF url ENDS WITH "/" THEN
                    url = url.substring(0, url.length - 1)
                END IF
                RETURN url
            END IF
            
            // Auto-detect from current hostname
            hostname = window.location.hostname
            port = VITE_API_PORT OR "5000"
            protocol = window.location.protocol
            
            IF hostname == "localhost" OR hostname == "127.0.0.1" THEN
                RETURN "http://localhost:" + port
            ELSE
                RETURN protocol + "//" + hostname + ":" + port
            END IF
        END
    END FUNCTION

    FUNCTION POST(path, body)
        INPUT: path (string), body (object)
        OUTPUT: response (Response)
        
        BEGIN
            response = CALL fetch(API_BASE + path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: CALL JSON.stringify(body)
            })
            RETURN response
        END
    END FUNCTION

    FUNCTION GET(path)
        INPUT: path (string)
        OUTPUT: response (Response)
        
        BEGIN
            response = CALL fetch(API_BASE + path)
            RETURN response
        END
    END FUNCTION
END MODULE
```

---

## 🔐 CRYPTOGRAPHIC MODULES

### Module 5: Kyber Loader (`frontend/src/crypto/kyber-loader.js`)

```
MODULE KyberLoader
BEGIN
    VARIABLE kyberInstance = null

    FUNCTION ensure()
        OUTPUT: kyberInstance (object)
        
        BEGIN
            IF kyberInstance IS NOT NULL THEN
                RETURN kyberInstance
            END IF
            
            // Dynamic import of pqc-kyber package
            pkg = CALL import('pqc-kyber')
            
            // Try multiple initialization strategies
            IF pkg.Kyber IS FUNCTION THEN
                kyberInstance = NEW pkg.Kyber()
            ELSE IF pkg.default IS FUNCTION THEN
                kyberInstance = NEW pkg.default()
            ELSE IF pkg.default.Kyber IS FUNCTION THEN
                kyberInstance = NEW pkg.default.Kyber()
            ELSE IF pkg.create IS FUNCTION THEN
                kyberInstance = CALL pkg.create()
            ELSE IF pkg.default.create IS FUNCTION THEN
                kyberInstance = CALL pkg.default.create()
            ELSE IF pkg.keypair IS FUNCTION THEN
                kyberInstance = {
                    keypair: pkg.keypair,
                    encapsulate: pkg.encapsulate,
                    decapsulate: pkg.decapsulate
                }
            END IF
            
            IF kyberInstance IS NULL THEN
                THROW ERROR "Could not initialize pqc-kyber"
            END IF
            
            RETURN kyberInstance
        END
    END FUNCTION

    FUNCTION generateKeypair()
        OUTPUT: { publicKeyB64, privateKeyB64 }
        
        BEGIN
            kyber = CALL ensure()
            
            IF kyber.keypair IS FUNCTION THEN
                keypair = CALL kyber.keypair()
                publicKey = keypair.publicKey OR keypair.pubkey OR keypair.pub
                privateKey = keypair.privateKey OR keypair.secret OR keypair.priv
                
                RETURN {
                    publicKeyB64: CALL toBase64(publicKey.buffer),
                    privateKeyB64: CALL toBase64(privateKey.buffer)
                }
            ELSE
                THROW ERROR "Keypair generation not available"
            END IF
        END
    END FUNCTION

    FUNCTION encapsulate(publicKeyB64)
        INPUT: publicKeyB64 (string)
        OUTPUT: { ciphertextB64, sharedSecretRaw }
        
        BEGIN
            kyber = CALL ensure()
            publicKey = NEW Uint8Array(CALL fromBase64(publicKeyB64))
            
            IF kyber.encapsulate IS FUNCTION THEN
                result = CALL kyber.encapsulate(publicKey)
                RETURN {
                    ciphertextB64: CALL toBase64(result.ciphertext.buffer),
                    sharedSecretRaw: result.sharedSecret.buffer
                }
            ELSE
                THROW ERROR "Encapsulation not available"
            END IF
        END
    END FUNCTION

    FUNCTION decapsulate(ciphertextB64, privateKeyB64)
        INPUT: ciphertextB64 (string), privateKeyB64 (string)
        OUTPUT: sharedSecretRaw (ArrayBuffer)
        
        BEGIN
            kyber = CALL ensure()
            ciphertext = NEW Uint8Array(CALL fromBase64(ciphertextB64))
            privateKey = NEW Uint8Array(CALL fromBase64(privateKeyB64))
            
            IF kyber.decapsulate IS FUNCTION THEN
                sharedSecret = CALL kyber.decapsulate(ciphertext, privateKey)
                RETURN sharedSecret.buffer
            ELSE
                THROW ERROR "Decapsulation not available"
            END IF
        END
    END FUNCTION
END MODULE
```

---

### Module 6: AES Helper (`frontend/src/crypto/aes-helper.js`)

```
MODULE AESHelper
BEGIN
    FUNCTION generateFileKey()
        OUTPUT: fileKey (CryptoKey)
        
        BEGIN
            fileKey = CALL crypto.subtle.generateKey({
                name: "AES-GCM",
                length: 256
            }, true, ["encrypt", "decrypt"])
            
            RETURN fileKey
        END
    END FUNCTION

    FUNCTION exportKeyRaw(key)
        INPUT: key (CryptoKey)
        OUTPUT: keyRaw (ArrayBuffer)
        
        BEGIN
            keyRaw = CALL crypto.subtle.exportKey("raw", key)
            RETURN keyRaw
        END
    END FUNCTION

    FUNCTION importFileKey(raw)
        INPUT: raw (ArrayBuffer)
        OUTPUT: fileKey (CryptoKey)
        
        BEGIN
            fileKey = CALL crypto.subtle.importKey(
                "raw", 
                raw, 
                "AES-GCM", 
                false, 
                ["encrypt", "decrypt"]
            )
            RETURN fileKey
        END
    END FUNCTION

    FUNCTION encryptBlobWithKey(key, dataBuffer)
        INPUT: key (CryptoKey), dataBuffer (ArrayBuffer)
        OUTPUT: { cipherBuffer, iv }
        
        BEGIN
            iv = CALL crypto.getRandomValues(NEW Uint8Array(12))
            cipherBuffer = CALL crypto.subtle.encrypt({
                name: "AES-GCM",
                iv: iv
            }, key, dataBuffer)
            
            RETURN {
                cipherBuffer: cipherBuffer,
                iv: iv.buffer
            }
        END
    END FUNCTION

    FUNCTION decryptBlobWithKey(key, cipherBuffer, ivBuffer)
        INPUT: key (CryptoKey), cipherBuffer (ArrayBuffer), ivBuffer (ArrayBuffer)
        OUTPUT: plainBuffer (ArrayBuffer)
        
        BEGIN
            iv = NEW Uint8Array(ivBuffer)
            plainBuffer = CALL crypto.subtle.decrypt({
                name: "AES-GCM",
                iv: iv
            }, key, cipherBuffer)
            
            RETURN plainBuffer
        END
    END FUNCTION

    FUNCTION abToB64(buffer)
        INPUT: buffer (ArrayBuffer)
        OUTPUT: base64String (string)
        
        BEGIN
            uint8Array = NEW Uint8Array(buffer)
            base64String = CALL btoa(String.fromCharCode(...uint8Array))
            RETURN base64String
        END
    END FUNCTION

    FUNCTION b64ToAb(base64String)
        INPUT: base64String (string)
        OUTPUT: buffer (ArrayBuffer)
        
        BEGIN
            binaryString = CALL atob(base64String)
            uint8Array = NEW Uint8Array(binaryString.length)
            
            FOR i = 0 TO binaryString.length - 1 DO
                uint8Array[i] = binaryString.charCodeAt(i)
            END FOR
            
            RETURN uint8Array.buffer
        END
    END FUNCTION
END MODULE
```

---

### Module 7: HKDF Key Wrapping (`frontend/src/crypto/hkdf-wrap.js`)

```
MODULE HKDFWrap
BEGIN
    FUNCTION deriveAesKeyFromSharedSecret(sharedSecretRaw, salt, info)
        INPUT: sharedSecretRaw (ArrayBuffer), salt (Uint8Array or null), info (string)
        OUTPUT: { derivedKey, salt }
        
        BEGIN
            // Generate salt if not provided
            IF salt IS NULL THEN
                saltBuf = CALL crypto.getRandomValues(NEW Uint8Array(16))
            ELSE
                saltBuf = salt
            END IF
            
            // Import shared secret as HKDF key
            baseKey = CALL crypto.subtle.importKey(
                "raw",
                sharedSecretRaw,
                "HKDF",
                false,
                ["deriveKey"]
            )
            
            // Derive AES key using HKDF
            infoBytes = NEW TextEncoder().encode(info OR "")
            
            derivedKey = CALL crypto.subtle.deriveKey(
                {
                    name: "HKDF",
                    hash: "SHA-256",
                    salt: saltBuf,
                    info: infoBytes
                },
                baseKey,
                {
                    name: "AES-GCM",
                    length: 256
                },
                true,
                ["encrypt", "decrypt"]
            )
            
            RETURN {
                derivedKey: derivedKey,
                salt: saltBuf
            }
        END
    END FUNCTION

    FUNCTION wrapFileKey(derivedKey, fileKeyRaw)
        INPUT: derivedKey (CryptoKey), fileKeyRaw (ArrayBuffer)
        OUTPUT: { wrappedB64, ivB64 }
        
        BEGIN
            iv = CALL crypto.getRandomValues(NEW Uint8Array(12))
            wrappedCipher = CALL crypto.subtle.encrypt({
                name: "AES-GCM",
                iv: iv
            }, derivedKey, fileKeyRaw)
            
            RETURN {
                wrappedB64: CALL toBase64(wrappedCipher),
                ivB64: CALL toBase64(iv.buffer)
            }
        END
    END FUNCTION

    FUNCTION unwrapFileKey(derivedKey, ivB64, wrappedB64)
        INPUT: derivedKey (CryptoKey), ivB64 (string), wrappedB64 (string)
        OUTPUT: fileKeyRaw (ArrayBuffer)
        
        BEGIN
            iv = NEW Uint8Array(CALL fromBase64(ivB64))
            wrappedCipher = CALL fromBase64(wrappedB64)
            
            fileKeyRaw = CALL crypto.subtle.decrypt({
                name: "AES-GCM",
                iv: iv
            }, derivedKey, wrappedCipher)
            
            RETURN fileKeyRaw
        END
    END FUNCTION
END MODULE
```

---

### Module 8: Key Storage (`frontend/src/crypto/key-storage.js`)

```
MODULE KeyStorage
BEGIN
    CONSTANT STORAGE_KEY = "kyber_priv"

    FUNCTION deriveKey(passphrase, saltBuf, iterations)
        INPUT: passphrase (string), saltBuf (Uint8Array), iterations (integer)
        OUTPUT: key (CryptoKey)
        
        BEGIN
            passBytes = NEW TextEncoder().encode(passphrase)
            baseKey = CALL crypto.subtle.importKey(
                "raw",
                passBytes,
                "PBKDF2",
                false,
                ["deriveKey"]
            )
            
            key = CALL crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: saltBuf,
                    iterations: iterations OR 200000,
                    hash: "SHA-256"
                },
                baseKey,
                {
                    name: "AES-GCM",
                    length: 256
                },
                false,
                ["encrypt", "decrypt"]
            )
            
            RETURN key
        END
    END FUNCTION

    FUNCTION encryptAndStorePrivateKey(passphrase, privateKeyB64)
        INPUT: passphrase (string), privateKeyB64 (string)
        OUTPUT: payload (object)
        
        BEGIN
            salt = CALL crypto.getRandomValues(NEW Uint8Array(16))
            iv = CALL crypto.getRandomValues(NEW Uint8Array(12))
            
            key = CALL deriveKey(passphrase, salt.buffer, 200000)
            privateKeyRaw = CALL fromBase64(privateKeyB64)
            
            ciphertext = CALL crypto.subtle.encrypt({
                name: "AES-GCM",
                iv: iv
            }, key, privateKeyRaw)
            
            payload = {
                algo: "PBKDF2+AES-GCM",
                salt: CALL toBase64(salt.buffer),
                iv: CALL toBase64(iv.buffer),
                ciphertext: CALL toBase64(ciphertext)
            }
            
            CALL localStorage.setItem(STORAGE_KEY, CALL JSON.stringify(payload))
            RETURN payload
        END
    END FUNCTION

    FUNCTION decryptStoredPrivateKey(passphrase)
        INPUT: passphrase (string)
        OUTPUT: privateKeyB64 (string)
        
        BEGIN
            storedData = CALL localStorage.getItem(STORAGE_KEY)
            
            IF storedData IS NULL THEN
                THROW ERROR "No stored private key"
            END IF
            
            payload = CALL JSON.parse(storedData)
            salt = CALL fromBase64(payload.salt)
            iv = CALL fromBase64(payload.iv)
            ciphertext = CALL fromBase64(payload.ciphertext)
            
            key = CALL deriveKey(passphrase, salt, 200000)
            
            privateKeyRaw = CALL crypto.subtle.decrypt({
                name: "AES-GCM",
                iv: NEW Uint8Array(iv)
            }, key, ciphertext)
            
            RETURN CALL toBase64(privateKeyRaw)
        END
    END FUNCTION

    FUNCTION hasStoredPrivateKey()
        OUTPUT: exists (boolean)
        
        BEGIN
            RETURN localStorage.getItem(STORAGE_KEY) IS NOT NULL
        END
    END FUNCTION

    FUNCTION removeStoredPrivateKey()
        BEGIN
            CALL localStorage.removeItem(STORAGE_KEY)
        END
    END FUNCTION
END MODULE
```

---

### Module 9: Crypto Utils (`frontend/src/crypto/utils.js`)

```
MODULE CryptoUtils
BEGIN
    FUNCTION toBase64(buffer)
        INPUT: buffer (ArrayBuffer)
        OUTPUT: base64String (string)
        
        BEGIN
            uint8Array = NEW Uint8Array(buffer)
            base64String = CALL btoa(String.fromCharCode(...uint8Array))
            RETURN base64String
        END
    END FUNCTION

    FUNCTION fromBase64(base64String)
        INPUT: base64String (string)
        OUTPUT: buffer (ArrayBuffer)
        
        BEGIN
            binaryString = CALL atob(base64String)
            uint8Array = NEW Uint8Array(binaryString.length)
            
            FOR i = 0 TO binaryString.length - 1 DO
                uint8Array[i] = binaryString.charCodeAt(i)
            END FOR
            
            RETURN uint8Array.buffer
        END
    END FUNCTION
END MODULE
```

---

## 🔴 BACKEND MODULES

### Module 10: Server Initialization (`backend/src/index.js`)

```
MODULE ServerInitialization
BEGIN
    FUNCTION initializeServer()
        BEGIN
            // Load environment variables
            CALL loadEnvironmentVariables()
            
            // Initialize Express app
            app = NEW Express()
            
            // Configure CORS
            CALL configureCORS(app)
            
            // Configure JSON parser
            CALL app.use(express.json({ limit: '50mb' }))
            
            // Configure file upload middleware
            upload = CALL configureMulter()
            
            // Connect to MongoDB
            CALL connectToMongoDB()
            
            // Register routes
            CALL registerRoutes(app, upload)
            
            // Start server
            CALL startServer(app)
        END
    END FUNCTION

    FUNCTION configureCORS(app)
        BEGIN
            corsOptions = {
                origin: '*',
                methods: ['GET', 'POST', 'OPTIONS'],
                allowedHeaders: ['Content-Type']
            }
            CALL app.use(cors(corsOptions))
            CALL app.options('*', cors(corsOptions))
        END
    END FUNCTION

    FUNCTION configureMulter()
        OUTPUT: upload (Multer instance)
        
        BEGIN
            storage = multer.memoryStorage()
            upload = multer({
                storage: storage,
                limits: { fileSize: 500 * 1024 * 1024 } // 500MB
            })
            RETURN upload
        END
    END FUNCTION

    FUNCTION connectToMongoDB()
        BEGIN
            mongoUri = process.env.MONGO_URI OR "mongodb://127.0.0.1:27017/securefiles"
            
            CALL mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            })
            
            ON CONNECTION SUCCESS:
                PRINT "MongoDB connected"
            ON CONNECTION ERROR:
                PRINT "Mongo connection error: " + error
        END
    END FUNCTION

    FUNCTION registerRoutes(app, upload)
        BEGIN
            // Key management routes
            CALL app.use('/keys', keysRouter)
            
            // File management routes
            filesRouter = CALL createFilesRouter(upload)
            CALL app.use('/files', filesRouter)
        END
    END FUNCTION

    FUNCTION startServer(app)
        BEGIN
            port = process.env.PORT OR 5000
            host = process.env.HOST OR '0.0.0.0'
            
            CALL app.listen(port, host, FUNCTION() {
                PRINT "Backend listening on http://" + host + ":" + port
                PRINT "Local access: http://localhost:" + port
                
                // Display network IP addresses
                networkInterfaces = CALL os.networkInterfaces()
                FOR EACH interface IN networkInterfaces DO
                    FOR EACH address IN interface.addresses DO
                        IF address.family == 'IPv4' AND NOT address.internal THEN
                            PRINT "Network access: http://" + address.address + ":" + port
                        END IF
                    END FOR
                END FOR
            })
        END
    END FUNCTION
END MODULE
```

---

### Module 11: Key Routes (`backend/src/routes/keys.js`)

```
MODULE KeyRoutes
BEGIN
    FUNCTION registerPublicKey()
        INPUT: userId (string), publicKey (string)
        OUTPUT: { ok: boolean }
        
        BEGIN
            // Validate inputs
            IF userId IS EMPTY OR publicKey IS EMPTY THEN
                RETURN { status: 400, error: "userId and publicKey required" }
            END IF
            
            TRY
                // Upsert public key (update if exists, create if not)
                result = CALL PublicKey.findOneAndUpdate(
                    { userId: userId },
                    { publicKey: publicKey },
                    { upsert: true, new: true }
                )
                
                RETURN { status: 200, ok: true }
            CATCH error
                PRINT "keys/register error: " + error
                RETURN { status: 500, error: "server error" }
            END TRY
        END
    END FUNCTION

    FUNCTION getPublicKey()
        INPUT: userId (string)
        OUTPUT: { userId: string, publicKey: string }
        
        BEGIN
            TRY
                publicKeyDoc = CALL PublicKey.findOne({ userId: userId })
                
                IF publicKeyDoc IS NULL THEN
                    RETURN { status: 404, error: "key not found" }
                END IF
                
                RETURN {
                    status: 200,
                    userId: publicKeyDoc.userId,
                    publicKey: publicKeyDoc.publicKey
                }
            CATCH error
                PRINT "keys/get error: " + error
                RETURN { status: 500, error: "server error" }
            END TRY
        END
    END FUNCTION

    FUNCTION setupRoutes(router)
        BEGIN
            CALL router.post('/register', registerPublicKey)
            CALL router.get('/:userId', getPublicKey)
        END
    END FUNCTION
END MODULE
```

---

### Module 12: File Routes (`backend/src/routes/files.js`)

```
MODULE FileRoutes
BEGIN
    FUNCTION createFilesRouter(upload)
        INPUT: upload (Multer instance)
        OUTPUT: router (Express Router)
        
        BEGIN
            router = NEW Express.Router()
            
            // Ensure uploads directory exists
            uploadsDir = path.join(__dirname, '../../uploads')
            IF NOT directoryExists(uploadsDir) THEN
                CALL createDirectory(uploadsDir)
            END IF
            
            // Register routes
            CALL router.post('/upload', upload.single('encryptedFile'), handleFileUpload)
            CALL router.get('/:id', handleFileDownload)
            CALL router.get('/:id/download', handleFileStream)
            
            RETURN router
        END
    END FUNCTION

    FUNCTION handleFileUpload(request, response)
        BEGIN
            TRY
                // Extract form data
                filename = request.body.filename
                fileIvB64 = request.body.fileIvB64
                recipientsStr = request.body.recipients
                encryptedFile = request.file // Multer parsed file
                
                // Validate inputs
                IF filename IS EMPTY OR fileIvB64 IS EMPTY OR 
                   recipientsStr IS EMPTY OR encryptedFile IS NULL THEN
                    RETURN response.status(400).json({
                        error: 'missing filename, fileIvB64, recipients, or encryptedFile'
                    })
                END IF
                
                // Parse recipients JSON
                TRY
                    recipients = CALL JSON.parse(recipientsStr)
                CATCH parseError
                    RETURN response.status(400).json({ error: 'invalid recipients JSON' })
                END TRY
                
                IF recipients IS NOT ARRAY OR recipients.length == 0 THEN
                    RETURN response.status(400).json({
                        error: 'recipients must be non-empty array'
                    })
                END IF
                
                // Generate unique file ID
                fileId = CALL generateFileId()
                storedFilename = fileId + "-" + filename
                storedPath = path.join(uploadsDir, storedFilename)
                
                // Save encrypted file to disk
                CALL writeFile(storedPath, encryptedFile.buffer)
                PRINT "Wrote encrypted file to: " + storedPath + 
                      " (" + encryptedFile.buffer.length + " bytes)"
                
                // Create file metadata document
                fileMeta = NEW FileMeta({
                    filename: filename,
                    storedPath: storedPath,
                    fileIvB64: fileIvB64,
                    recipients: recipients,
                    uploader: request.body.uploader
                })
                
                // Save to database
                savedDoc = CALL fileMeta.save()
                
                RETURN response.json({ ok: true, id: savedDoc._id })
                
            CATCH error
                PRINT "files/upload error: " + error
                RETURN response.status(500).json({ error: 'server error' })
            END TRY
        END
    END FUNCTION

    FUNCTION handleFileDownload(request, response)
        BEGIN
            TRY
                fileId = request.params.id
                
                // Find file metadata
                fileMeta = CALL FileMeta.findById(fileId).lean()
                
                IF fileMeta IS NULL THEN
                    RETURN response.status(404).json({ error: 'not found' })
                END IF
                
                // Read encrypted file from disk
                IF fileMeta.storedPath IS EMPTY OR 
                   NOT fileExists(fileMeta.storedPath) THEN
                    RETURN response.status(404).json({ error: 'file data missing' })
                END IF
                
                fileBuffer = CALL readFile(fileMeta.storedPath)
                
                // Return metadata + encrypted file as base64
                response.json({
                    id: fileMeta._id,
                    filename: fileMeta.filename,
                    fileIvB64: fileMeta.fileIvB64,
                    fileCipherB64: CALL fileBuffer.toString('base64'),
                    recipients: fileMeta.recipients,
                    createdAt: fileMeta.createdAt
                })
                
            CATCH error
                PRINT "files/get error: " + error
                RETURN response.status(500).json({ error: 'server error' })
            END TRY
        END
    END FUNCTION

    FUNCTION handleFileStream(request, response)
        BEGIN
            TRY
                fileId = request.params.id
                
                fileMeta = CALL FileMeta.findById(fileId).lean()
                
                IF fileMeta IS NULL THEN
                    RETURN response.status(404).json({ error: 'not found' })
                END IF
                
                IF fileMeta.storedPath EXISTS AND fileExists(fileMeta.storedPath) THEN
                    SET response header 'Content-Disposition' = 
                        'attachment; filename="' + fileMeta.filename + '.enc"'
                    CREATE file stream FROM fileMeta.storedPath
                    PIPE stream TO response
                ELSE IF fileMeta.fileCipherB64 EXISTS THEN
                    fileBuffer = CALL Buffer.from(fileMeta.fileCipherB64, 'base64')
                    SET response header 'Content-Disposition' = 
                        'attachment; filename="' + fileMeta.filename + '.enc"'
                    SEND fileBuffer TO response
                ELSE
                    RETURN response.status(404).json({ error: 'file data missing' })
                END IF
                
            CATCH error
                PRINT "files/download error: " + error
                RETURN response.status(500).json({ error: 'server error' })
            END TRY
        END
    END FUNCTION

    FUNCTION generateFileId()
        OUTPUT: fileId (string)
        
        BEGIN
            timestamp = CALL getCurrentTimestamp()
            randomString = CALL generateRandomString(6)
            fileId = timestamp + "-" + randomString
            RETURN fileId
        END
    END FUNCTION
END MODULE
```

---

## 📊 DATA MODELS

### Module 13: PublicKey Model (`backend/src/models/PublicKey.js`)

```
MODULE PublicKeyModel
BEGIN
    SCHEMA PublicKeySchema
        BEGIN
            userId: {
                type: String,
                required: true,
                unique: true
            },
            publicKey: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        END
    END SCHEMA

    MODEL PublicKey
        METHODS:
            findOne(query) -> Returns matching document
            findOneAndUpdate(query, update, options) -> Updates or creates document
            findById(id) -> Returns document by ID
    END MODEL
END MODULE
```

---

### Module 14: FileMeta Model (`backend/src/models/FileMeta.js`)

```
MODULE FileMetaModel
BEGIN
    SCHEMA RecipientSchema
        BEGIN
            userId: {
                type: String,
                required: true
            },
            kyberCiphertext: {
                type: String,
                required: true
            },
            wrappedFileKey: {
                type: String,
                required: true
            },
            wrapIv: {
                type: String,
                required: true
            },
            hkdfSalt: {
                type: String,
                required: true
            }
        END
    END SCHEMA

    SCHEMA FileMetaSchema
        BEGIN
            filename: {
                type: String,
                required: true
            },
            storedPath: {
                type: String
            },
            fileCipherB64: {
                type: String
            },
            fileIvB64: {
                type: String,
                required: true
            },
            recipients: {
                type: [RecipientSchema],
                required: true
            },
            uploader: {
                type: String
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        END
    END SCHEMA

    MODEL FileMeta
        METHODS:
            save() -> Saves document to database
            findById(id) -> Returns document by ID
            find(query) -> Returns matching documents
    END MODEL
END MODULE
```

---

## 🔄 COMPLETE FLOW PSEUDOCODE

### Upload Flow (Complete)

```
FUNCTION CompleteUploadFlow(file, recipients, userId)
    BEGIN
        // 1. Generate file encryption key
        fileKey = CALL generateFileKey()
        fileKeyRaw = CALL exportKeyRaw(fileKey)
        
        // 2. Encrypt file
        fileBuffer = CALL file.arrayBuffer()
        encryptionResult = CALL encryptBlobWithKey(fileKey, fileBuffer)
        cipherBuffer = encryptionResult.cipherBuffer
        iv = encryptionResult.iv
        
        // 3. Process each recipient
        recipientsEntries = []
        FOR EACH recipientId IN recipients DO
            // 3a. Get recipient's public key
            publicKey = CALL GET("/keys/" + recipientId)
            
            // 3b. Encapsulate (create shared secret)
            kyberResult = CALL encapsulate(publicKey)
            
            // 3c. Derive wrapping key
            hkdfResult = CALL deriveAesKeyFromSharedSecret(
                kyberResult.sharedSecretRaw, 
                null, 
                "file-wrap"
            )
            
            // 3d. Wrap file key
            wrapped = CALL wrapFileKey(hkdfResult.derivedKey, fileKeyRaw)
            
            // 3e. Store recipient entry
            ADD {
                userId: recipientId,
                kyberCiphertext: kyberResult.ciphertextB64,
                wrappedFileKey: wrapped.wrappedB64,
                wrapIv: wrapped.ivB64,
                hkdfSalt: CALL toBase64(hkdfResult.salt.buffer)
            } TO recipientsEntries
        END FOR
        
        // 4. Upload to server
        formData = CREATE FormData()
        CALL formData.append('filename', file.name)
        CALL formData.append('fileIvB64', CALL abToB64(iv))
        CALL formData.append('recipients', CALL JSON.stringify(recipientsEntries))
        CALL formData.append('encryptedFile', NEW Blob([cipherBuffer]))
        
        response = CALL POST("/files/upload", formData)
        RETURN response.json().id
    END
END FUNCTION
```

---

### Download Flow (Complete)

```
FUNCTION CompleteDownloadFlow(fileId, userId, passphrase)
    BEGIN
        // 1. Fetch file metadata
        fileMeta = CALL GET("/files/" + fileId)
        
        // 2. Find recipient entry
        recipientEntry = FIND fileMeta.recipients WHERE userId == userId
        
        // 3. Decrypt private key
        privateKeyB64 = CALL decryptStoredPrivateKey(passphrase)
        
        // 4. Decapsulate (recover shared secret)
        sharedSecretRaw = CALL decapsulate(
            recipientEntry.kyberCiphertext,
            privateKeyB64
        )
        
        // 5. Derive wrapping key
        saltBuf = NEW Uint8Array(CALL fromBase64(recipientEntry.hkdfSalt))
        hkdfResult = CALL deriveAesKeyFromSharedSecret(
            sharedSecretRaw,
            saltBuf,
            "file-wrap"
        )
        
        // 6. Unwrap file key
        fileKeyRaw = CALL unwrapFileKey(
            hkdfResult.derivedKey,
            recipientEntry.wrapIv,
            recipientEntry.wrappedFileKey
        )
        
        // 7. Import file key
        fileKey = CALL importFileKey(fileKeyRaw)
        
        // 8. Decrypt file
        cipherBuf = CALL b64ToAb(fileMeta.fileCipherB64)
        ivBuf = CALL b64ToAb(fileMeta.fileIvB64)
        plainBuffer = CALL decryptBlobWithKey(fileKey, cipherBuf, ivBuf)
        
        // 9. Return decrypted file
        RETURN NEW Blob([plainBuffer])
    END
END FUNCTION
```

---

## 📝 Notes

1. **Error Handling**: All modules should include proper error handling (shown as TRY-CATCH blocks)
2. **Validation**: Input validation is performed at each module boundary
3. **Security**: All cryptographic operations use secure random number generation
4. **Storage**: Private keys are encrypted before storage; files are encrypted before upload
5. **Modularity**: Each module has a single responsibility and can be tested independently

---

## 🔑 Key Algorithms Used

- **Kyber**: Post-quantum key encapsulation mechanism (KEM)
- **AES-256-GCM**: Symmetric encryption for files
- **HKDF-SHA256**: Key derivation function
- **PBKDF2-SHA256**: Password-based key derivation (200,000 iterations)
- **Base64**: Encoding for binary data transport

---

This pseudocode provides a complete module-wise breakdown of the QuantumShield File Share system, showing the logic flow for each component.

