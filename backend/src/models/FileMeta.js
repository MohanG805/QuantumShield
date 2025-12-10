const mongoose = require('mongoose');

const RecipientSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  kyberCiphertext: { type: String, required: true },
  wrappedFileKey: { type: String, required: true },
  wrapIv: { type: String, required: true },
  hkdfSalt: { type: String, required: true }
}, { _id: false });

const FileMetaSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  storedPath: { type: String }, // path to saved encrypted file bytes
  fileCipherB64: { type: String }, // optional - store inline small files
  fileIvB64: { type: String, required: true },
  recipients: { type: [RecipientSchema], required: true },
  uploader: { type: String }, // optional
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FileMeta', FileMetaSchema);

