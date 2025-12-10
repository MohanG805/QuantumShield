require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');

const keysRouter = require('./routes/keys');

const app = express();

// CORS setup - allow all origins and methods
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes

app.use(express.json({ limit: '50mb' })); // increase for larger metadata

// multer setup for file uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// serve native-wasm static (frontend/native-wasm) so /native-wasm/... works
app.use('/native-wasm', express.static(path.join(__dirname, '../../frontend/native-wasm')));

// serve static frontend in production (optional)
// app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// routes
app.use('/keys', keysRouter);

const filesRouter = require('./routes/files')(upload); // pass multer instance to files router
app.use('/files', filesRouter);


// connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/securefiles';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('Mongo connection error:', err));

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for network access
app.listen(PORT, HOST, ()=> {
  console.log(`Backend listening on http://${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  // Get local IP address for network access
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        console.log(`Network access: http://${addr.address}:${PORT}`);
      }
    }
  }
});

