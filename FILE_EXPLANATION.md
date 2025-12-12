# File Structure Explanation - QuantumShield File Share

## 📁 Root Level Files

### Configuration Files
- **`package.json`** - Root workspace configuration, manages both frontend and backend as workspaces
- **`.gitignore`** - Tells Git which files to ignore (node_modules, .env, uploads, etc.)
- **`.nvmrc`** - Specifies Node.js version for the project
- **`netlify.toml`** - Configuration for deploying frontend to Netlify
- **`render.yaml`** - Configuration for deploying backend to Render.com

### Documentation Files
- **`README.md`** - Main project documentation with setup and usage instructions
- **`DEPLOYMENT.md`** - Guide for deploying the application
- **`DEPLOYMENT_READINESS_CHECKLIST.md`** - Checklist before deploying
- **`GITHUB_SETUP.md`** - Instructions for GitHub setup
- **`HOW_TO_CHECK_CONNECTION.md`** - Guide for testing connections
- **`LINK_BACKEND_TO_FRONTEND.md`** - Instructions for connecting frontend to backend
- **`NETLIFY_FIX.md`** - Solutions for Netlify deployment issues
- **`STEP_BY_STEP_DEPLOYMENT.md`** - Detailed deployment steps
- **`STORAGE_LIMITS.md`** - Information about file storage limits
- **`WHERE_DATA_IS_STORED.md`** - Explains where uploaded files and data are stored

---

## 🔧 Backend Files (`/backend`)

### Main Entry Point
- **`src/index.js`** - Main server file that:
  - Starts Express server
  - Connects to MongoDB
  - Sets up CORS (allows cross-origin requests)
  - Configures file upload handling (Multer)
  - Registers API routes
  - Listens on port 5000

### Configuration
- **`src/config/db.js`** - Database connection configuration (if separated)

### Models (Database Schemas)
- **`src/models/FileMeta.js`** - MongoDB schema for file metadata:
  - Stores filename, file ID, encryption IV, recipients, uploader info
  - Tracks who can access which files
- **`src/models/PublicKey.js`** - MongoDB schema for user public keys:
  - Stores user IDs and their post-quantum public keys
  - Used for key exchange

### Routes (API Endpoints)
- **`src/routes/files.js`** - Handles file operations:
  - `POST /files/upload` - Receives encrypted files and saves them
  - `GET /files/:fileId` - Downloads encrypted files
  - `GET /files` - Lists files for a user
- **`src/routes/keys.js`** - Handles public key management:
  - `POST /keys/register` - Registers a user's public key
  - `GET /keys/:userId` - Retrieves a user's public key
- **`src/routes/auth.js`** - Authentication routes (if implemented)

### Middleware
- **`src/middleware/auth.js`** - Authentication middleware (validates user tokens)
- **`src/middleware/limiter.js`** - Rate limiting middleware (prevents abuse)

### Services (Business Logic)
- **`src/services/cryptoService.js`** - Cryptographic operations on backend
- **`src/services/storageService.js`** - File storage management
- **`src/services/userService.js`** - User management operations

### Other
- **`package.json`** - Backend dependencies (Express, MongoDB, Multer, CORS)
- **`uploads/`** - Directory where encrypted files are stored on disk

---

## 🎨 Frontend Files (`/frontend`)

### Main Entry Points
- **`index.html`** - Main HTML page (entry point for the web app)
- **`src/app.js`** - Main frontend application logic (if exists)
- **`script.js`** - Alternative script entry point

### API Communication
- **`src/api/client.js`** - HTTP client for communicating with backend API:
  - Handles GET/POST requests
  - Manages API base URL
  - Handles errors

### Core Features
- **`src/upload.js`** - File upload functionality:
  - Handles file selection
  - Encrypts files using AES
  - Uses post-quantum key exchange (Kyber) for recipients
  - Sends encrypted files to backend
- **`src/download.js`** - File download functionality:
  - Fetches encrypted files from backend
  - Decrypts files using stored keys
  - Allows users to download decrypted files
- **`src/keys.js`** - Key management UI:
  - Generates post-quantum key pairs
  - Registers public keys with backend
  - Retrieves recipient public keys

### Cryptography (`/src/crypto`)
- **`kyber-loader.js`** - Loads and initializes post-quantum Kyber cryptography library:
  - Handles different package export formats
  - Provides `encapsulate()` and `decapsulate()` functions
  - Manages WASM (WebAssembly) loading
- **`aes-helper.js`** - AES encryption/decryption helpers:
  - `generateFileKey()` - Creates AES keys for file encryption
  - `encryptBlobWithKey()` - Encrypts files with AES
  - `decryptBlobWithKey()` - Decrypts files
  - Key import/export functions
- **`hkdf-wrap.js`** - Key derivation and wrapping:
  - `deriveAesKeyFromSharedSecret()` - Derives AES keys from Kyber shared secrets
  - `wrapFileKey()` - Wraps file encryption keys for recipients
- **`key-storage.js`** - Stores encryption keys in browser (localStorage/IndexedDB)
- **`utils.js`** - Cryptographic utility functions (base64 encoding, etc.)

### Styling & Assets
- **`style.css`** - Main stylesheet for the web interface
- **`favicon.svg`** - Website icon
- **`svg-export-4x*.png`** - Image assets/logos

### Configuration
- **`package.json`** - Frontend dependencies (Vite, post-quantum crypto library)
- **`vite.config.js`** - Vite build tool configuration:
  - Configures development server
  - Sets up WASM plugin for crypto libraries
  - Build settings

### Other
- **`public/script.js`** - Public scripts (if any)
- **`.nvmrc`** - Node.js version for frontend

---

## 📊 Documentation Files (`/docs`)
- **`architecture-diagram.png`** - Visual diagram of system architecture
- **`report.txt`** - Project report/documentation

---

## 🔐 How It Works (Quick Summary)

1. **Key Exchange**: Users generate post-quantum key pairs (Kyber) and register public keys
2. **File Upload**: 
   - File is encrypted with AES
   - AES key is wrapped using recipient's public key (via Kyber)
   - Encrypted file + metadata sent to backend
3. **File Storage**: Backend saves encrypted files to disk, metadata to MongoDB
4. **File Download**: 
   - User requests file
   - Backend sends encrypted file
   - Frontend decrypts using stored private key

---

## 🚀 Deployment Files

- **`netlify.toml`** - Frontend deployment to Netlify
- **`render.yaml`** - Backend deployment to Render.com


