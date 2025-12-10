const mongoose = require('mongoose');

const PublicKeySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  publicKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PublicKey', PublicKeySchema);

