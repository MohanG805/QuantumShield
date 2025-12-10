# Where Your Data is Stored

## 📍 Data Storage Locations

### 1. **Public Keys** 🔑
**Location:** MongoDB Atlas (Cloud Database)

- **Database:** `securefiles`
- **Collection:** `PublicKey`
- **What's stored:**
  - `userId` (e.g., "alice", "bob")
  - `publicKey` (base64 encoded Kyber public key)
  - `createdAt` (timestamp)

**How to view:**
1. Go to https://cloud.mongodb.com
2. Click on your cluster
3. Click "Browse Collections"
4. Select `securefiles` database
5. Click on `PublicKey` collection
6. You'll see all registered public keys

**Persistence:** ✅ **Permanent** - Stored in MongoDB Atlas, won't be lost

---

### 2. **File Metadata** 📄
**Location:** MongoDB Atlas (Cloud Database)

- **Database:** `securefiles`
- **Collection:** `FileMeta`
- **What's stored:**
  - `filename` (original filename)
  - `fileIvB64` (encryption IV)
  - `recipients` (array of recipient data with wrapped keys)
  - `storedPath` (path to encrypted file on server)
  - `uploader` (who uploaded it)
  - `createdAt` (timestamp)
  - `_id` (file ID - used to download files)

**How to view:**
1. Go to MongoDB Atlas
2. Browse Collections → `securefiles` → `FileMeta`
3. You'll see all uploaded files with their metadata

**Persistence:** ✅ **Permanent** - Stored in MongoDB Atlas

---

### 3. **Encrypted Files** 🔒
**Location:** Render Server Filesystem (Temporary!)

- **Path:** `/opt/render/project/src/backend/uploads/`
- **Format:** Encrypted binary files
- **Naming:** `{fileId}-{originalFilename}`

**⚠️ IMPORTANT WARNING:**
- **On Render Free Tier:** Files are stored on **ephemeral filesystem**
- **Files will be LOST when:**
  - Service restarts
  - Service redeploys
  - Service is idle for 15+ minutes (spins down)
  - Any server restart

**Persistence:** ❌ **Temporary** - Files will be lost on restart!

---

## 🔍 How to Access Your Data

### View Public Keys in MongoDB Atlas:
1. Go to https://cloud.mongodb.com
2. Login → Select your cluster
3. Click "Browse Collections"
4. Database: `securefiles`
5. Collection: `PublicKey`
6. See all registered users and their public keys

### View File Metadata in MongoDB Atlas:
1. Same as above
2. Collection: `FileMeta`
3. See all uploaded files, recipients, and file IDs

### View Files on Render (Temporary):
1. Go to Render dashboard
2. Your backend service → "Shell" tab
3. Run: `ls -la uploads/`
4. See encrypted files (but they'll be lost on restart)

---

## ⚠️ Current Limitations

### Problem: Files are Lost on Restart
Your encrypted files are stored on Render's filesystem, which is **ephemeral** (temporary) on the free tier.

**What happens:**
- ✅ File metadata stays in MongoDB (permanent)
- ❌ Encrypted file bytes are lost when Render restarts
- ❌ Users can't download files after server restart

### Solutions (For Production):

**Option 1: Use MongoDB GridFS** (Recommended)
- Store files directly in MongoDB
- Permanent storage
- No data loss

**Option 2: Use Cloud Storage**
- AWS S3
- Cloudinary
- Google Cloud Storage
- Permanent, scalable storage

**Option 3: Use Render Persistent Disk** (Paid)
- Add persistent disk to Render service
- Files survive restarts
- Costs money

---

## 📊 Summary Table

| Data Type | Storage Location | Persistence | Access Method |
|-----------|-----------------|------------|---------------|
| **Public Keys** | MongoDB Atlas | ✅ Permanent | MongoDB Atlas UI |
| **File Metadata** | MongoDB Atlas | ✅ Permanent | MongoDB Atlas UI |
| **Encrypted Files** | Render Filesystem | ❌ Temporary | Lost on restart |

---

## 🎯 What This Means

**Currently Working:**
- ✅ Public keys are permanently stored
- ✅ File metadata is permanently stored
- ✅ Files work until server restarts

**Not Working Long-term:**
- ❌ Files are lost on server restart
- ❌ Can't download old files after restart
- ❌ Not suitable for production use

**For Testing/Demo:**
- Current setup is fine
- Files work as long as server stays running
- Good for development and demos

**For Production:**
- Need to implement cloud storage or GridFS
- Files must be stored permanently
- Can't rely on ephemeral filesystem

---

## 🔧 Quick Check: Where is Your Data?

1. **MongoDB Atlas:**
   - Public keys: `securefiles` → `PublicKey` collection
   - File metadata: `securefiles` → `FileMeta` collection

2. **Render Server:**
   - Encrypted files: `uploads/` directory (temporary!)

3. **Frontend (Netlify):**
   - No data stored (just the UI)

---

## 💡 Recommendation

For now (testing/demo):
- Current setup is fine
- Be aware files are temporary

For production:
- Implement MongoDB GridFS or cloud storage
- Ensure files persist across restarts

