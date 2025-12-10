const express = require('express');
const router = express.Router();
const PublicKey = require('../models/PublicKey');

// POST /keys/register
router.post('/register', async (req, res) => {
  try {
    const { userId, publicKey } = req.body;
    if (!userId || !publicKey) return res.status(400).json({ error: 'userId and publicKey required' });

    await PublicKey.findOneAndUpdate({ userId }, { publicKey }, { upsert: true, new: true });
    return res.json({ ok: true });
  } catch (err) {
    console.error('keys/register error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// GET /keys/:userId
router.get('/:userId', async (req, res) => {
  try {
    const doc = await PublicKey.findOne({ userId: req.params.userId });
    if (!doc) return res.status(404).json({ error: 'key not found' });
    return res.json({ userId: doc.userId, publicKey: doc.publicKey });
  } catch (err) {
    console.error('keys/get error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;

