# Storage Limits - MongoDB Atlas

## 📊 MongoDB Atlas Free Tier (M0)

### Storage Limits:
- **Total Storage:** 512 MB (0.5 GB)
- **Database Storage:** Shared across all databases in your cluster
- **Includes:**
  - All collections (PublicKey, FileMeta)
  - GridFS files (encryptedFiles.chunks, encryptedFiles.files)
  - Indexes
  - Metadata

### Other Free Tier Limits:
- **RAM:** 512 MB
- **vCPU:** Shared
- **Network Transfer:** Limited
- **Backups:** Not included (manual backups only)

---

## 💾 What This Means for Your App

### Current Storage Usage:
1. **Public Keys:** Very small (~1-2 KB per key)
   - 1000 keys = ~1-2 MB
   - Not a concern

2. **File Metadata:** Small (~1-5 KB per file)
   - 1000 files = ~1-5 MB
   - Not a concern

3. **Encrypted Files (GridFS):** This is the main usage
   - Each encrypted file uses space
   - File size = original file size (encrypted, not compressed)
   - 512 MB total limit

### Example Capacity:
- **Small files (1-5 MB each):** ~100-500 files
- **Medium files (10-20 MB each):** ~25-50 files
- **Large files (50-100 MB each):** ~5-10 files
- **Very large files (100+ MB):** Limited to a few files

---

## 📈 Paid Tier Options

### M2 (Shared) - $9/month
- **Storage:** 2 GB
- **RAM:** 2 GB
- **Better performance**

### M5 (Dedicated) - $57/month
- **Storage:** 5 GB
- **RAM:** 2 GB
- **Dedicated resources**

### M10+ (Higher tiers)
- More storage available
- Scales with your needs

---

## ⚠️ What Happens When You Hit the Limit?

### At 80% Storage:
- MongoDB Atlas sends email warnings
- Monitor in dashboard

### At 100% Storage:
- ❌ **New uploads will fail**
- ❌ **Database operations may fail**
- ✅ **Existing files still accessible**
- ✅ **Can still read/download files**

### Solutions:
1. **Upgrade MongoDB plan** (paid)
2. **Delete old files** (if not needed)
3. **Use external storage** (AWS S3, Cloudinary, etc.)

---

## 🔍 How to Monitor Storage

### In MongoDB Atlas:
1. Go to https://cloud.mongodb.com
2. Click on your cluster
3. Click **"Metrics"** tab
4. See **"Storage"** graph
5. Shows current usage vs limit

### Check Storage Usage:
1. MongoDB Atlas → Cluster → **"Metrics"**
2. Look for **"Storage"** section
3. See percentage used
4. See actual GB used

---

## 💡 Storage Optimization Tips

### 1. Monitor Regularly
- Check MongoDB Atlas dashboard weekly
- Set up email alerts (automatic at 80%)

### 2. Clean Up Old Files
- Delete files that are no longer needed
- Implement file expiration (auto-delete after X days)

### 3. Compress Files (Before Encryption)
- Compress files before uploading
- Reduces storage usage
- Your encryption happens after compression

### 4. Use External Storage for Large Files
- For files > 50 MB, consider:
  - AWS S3 (pay per GB)
  - Cloudinary (free tier available)
  - Google Cloud Storage

---

## 📊 Storage Breakdown Example

### Typical Usage:
```
Public Keys:        ~1 MB    (1000 users)
File Metadata:      ~5 MB    (1000 files)
Encrypted Files:    ~400 MB  (varies by file sizes)
Indexes:           ~10 MB   (database indexes)
Total:             ~416 MB  (81% of 512 MB limit)
```

### Safe Usage:
- **Stay under 400 MB** for comfortable margin
- **Monitor when approaching 450 MB**
- **Plan upgrade or cleanup at 480 MB**

---

## 🎯 Recommendations

### For Testing/Demo:
- ✅ **512 MB is sufficient**
- ✅ Monitor usage
- ✅ Clean up test files regularly

### For Production:
- ⚠️ **Consider upgrading** if expecting many files
- ⚠️ **Monitor closely** in first few months
- ⚠️ **Plan for growth**

### For Large Files:
- 💡 **Use external storage** (S3, Cloudinary)
- 💡 **Keep metadata in MongoDB**
- 💡 **Store file URL in FileMeta**

---

## 📝 Summary

| Tier | Storage | Cost | Best For |
|------|---------|------|----------|
| **M0 (Free)** | 512 MB | Free | Testing, small apps |
| **M2** | 2 GB | $9/mo | Small production |
| **M5** | 5 GB | $57/mo | Medium production |
| **M10+** | 10+ GB | $100+/mo | Large production |

**Your Current Setup:**
- ✅ Free tier (512 MB)
- ✅ Good for testing and demos
- ⚠️ Monitor usage as you add files
- 💡 Upgrade when needed

---

## 🔔 Monitoring Alerts

MongoDB Atlas automatically sends emails when:
- Storage reaches 80% (warning)
- Storage reaches 100% (critical)
- Check your email for these alerts

---

## ✅ Action Items

1. **Monitor storage** in MongoDB Atlas dashboard
2. **Set up email notifications** (automatic)
3. **Plan for upgrade** if expecting heavy usage
4. **Clean up old files** regularly
5. **Consider external storage** for large files

Your 512 MB free tier should be sufficient for testing and small-scale use! 🚀

