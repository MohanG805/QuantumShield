const express = require('express');
const fs = require('fs');
const path = require('path');
const FileMeta = require('../models/FileMeta');

// ensure uploads dir exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Export router factory that accepts multer instance
module.exports = function(upload) {
  const router = express.Router();

  // POST /files/upload
  // expects multipart/form-data with:
  //   - filename: string (original filename)
  //   - fileIvB64: string (base64 IV)
  //   - recipients: JSON string (array of recipient objects)
  //   - encryptedFile: binary blob (encrypted file bytes, NOT base64)
  router.post('/upload', upload.single('encryptedFile'), async (req, res) => {
  try {
    const { filename, fileIvB64, recipients: recipientsStr, uploader } = req.body;
    const encryptedFile = req.file; // multer parsed binary file

    if (!filename || !fileIvB64 || !recipientsStr || !encryptedFile) {
      return res.status(400).json({ error: 'missing filename, fileIvB64, recipients, or encryptedFile' });
    }

    let recipients;
    try {
      recipients = JSON.parse(recipientsStr);
    } catch (e) {
      return res.status(400).json({ error: 'invalid recipients JSON' });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'recipients must be non-empty array' });
    }

    // Save encrypted file bytes directly (no base64 conversion needed)
    const fileId = new Date().getTime().toString() + '-' + Math.random().toString(36).slice(2, 8);
    const storedFilename = `${fileId}-${filename}`;
    const storedPath = path.join(UPLOADS_DIR, storedFilename);

    fs.writeFileSync(storedPath, encryptedFile.buffer);
    console.log('✓ Wrote encrypted file to:', storedPath, `(${encryptedFile.buffer.length} bytes)`);

    // Save metadata (no need to store base64 in DB; file is on disk)
    const doc = new FileMeta({
      filename,
      storedPath,
      fileCipherB64: undefined, // binary is on disk
      fileIvB64,
      recipients,
      uploader
    });

    await doc.save();

    res.json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('files/upload error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /files/:id -> return metadata + encrypted file as binary (Content-Type: application/octet-stream)
// Response format: { metadata: {...}, file: ArrayBuffer }
router.get('/:id', async (req, res) => {
  try {
    const doc = await FileMeta.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'not found' });

    // Read encrypted file from disk
    if (!doc.storedPath || !fs.existsSync(doc.storedPath)) {
      return res.status(404).json({ error: 'file data missing' });
    }

    const fileBuffer = fs.readFileSync(doc.storedPath);

    // Return JSON response with metadata + binary file as base64 for browser compatibility
    const response = {
      id: doc._id,
      filename: doc.filename,
      fileIvB64: doc.fileIvB64,
      fileCipherB64: fileBuffer.toString('base64'), // convert binary to base64 for JSON transport
      recipients: doc.recipients,
      createdAt: doc.createdAt
    };
    res.json(response);
  } catch (err) {
    console.error('files/get error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /files/:id/download -> returns encrypted file bytes (base64) + iv (or stream file)
router.get('/:id/download', async (req, res) => {
  try {
    const doc = await FileMeta.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'not found' });

    if (doc.storedPath && fs.existsSync(doc.storedPath)) {
      // stream file back
      res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}.enc"`);
      const stream = fs.createReadStream(doc.storedPath);
      stream.pipe(res);
    } else if (doc.fileCipherB64) {
      const buf = Buffer.from(doc.fileCipherB64, 'base64');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}.enc"`);
      res.send(buf);
    } else {
      return res.status(404).json({ error: 'file data missing' });
    }
  } catch (err) {
    console.error('files/download error', err);
    res.status(500).json({ error: 'server error' });
  }
});

  return router;
};

