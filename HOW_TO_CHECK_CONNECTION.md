# How to Check if Your Backend is Connected to MongoDB

## Method 1: Start the Backend Server (Easiest)

### Step 1: Start the Backend
Open terminal in your project folder and run:
```bash
cd backend
npm start
```

### Step 2: Look for These Messages

**✅ SUCCESS - Connected:**
You should see:
```
MongoDB connected
Backend listening on http://0.0.0.0:5000
Local access: http://localhost:5000
```

**❌ ERROR - Not Connected:**
You might see:
```
Mongo connection error: [error details]
```

### Common Success Messages:
- `MongoDB connected` ✅
- `Backend listening on http://0.0.0.0:5000` ✅
- Server starts without errors ✅

### Common Error Messages:
- `Mongo connection error:` ❌
- `MongooseServerSelectionError` ❌
- `Authentication failed` ❌
- `Network timeout` ❌

---

## Method 2: Test the API Endpoints

Once your backend is running, test if it's working:

### Test 1: Check Keys Endpoint
Open your browser or use curl:
```
http://localhost:5000/keys
```

**Expected Response:**
- Should return `[]` (empty array) or JSON data
- Status code: 200

**If you get an error:**
- Connection might not be working
- Check the server logs

### Test 2: Check Server Response
```
http://localhost:5000/
```

**Expected Response:**
- Might show an error page (that's OK - there's no root route)
- But the server should respond (not "connection refused")

---

## Method 3: Check MongoDB Atlas Dashboard

1. Go to https://cloud.mongodb.com
2. Log in to your account
3. Click on your cluster → **"Metrics"** tab
4. Look for **"Connections"** - you should see active connections when your backend is running

---

## Troubleshooting Connection Issues

### Problem: "Mongo connection error"

**Check 1: Is your IP whitelisted?**
- Go to MongoDB Atlas → **Network Access**
- Make sure your IP address is added (or `0.0.0.0/0` for all IPs)
- Click **"Add IP Address"** → **"Allow Access from Anywhere"**

**Check 2: Is the connection string correct?**
- Verify your `.env` file has the correct `MONGO_URI`
- Make sure password doesn't have special characters that need encoding
- Format should be: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

**Check 3: Is the database user correct?**
- Go to MongoDB Atlas → **Database Access**
- Verify the username and password match your connection string
- Make sure the user has proper permissions

**Check 4: Check the error message**
- Read the full error message in the console
- It will tell you exactly what's wrong:
  - `Authentication failed` → Wrong username/password
  - `Network timeout` → IP not whitelisted or network issue
  - `Server selection timed out` → Can't reach MongoDB servers

---

## Quick Test Script

You can also create a simple test file to check the connection:

**Create `backend/test-connection.js`:**
```javascript
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/securefiles';

console.log('Attempting to connect to MongoDB...');
console.log('Connection string:', MONGO_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:');
    console.error(err.message);
    process.exit(1);
  });
```

**Run it:**
```bash
cd backend
node test-connection.js
```

---

## What to Look For When Starting the Server

### ✅ Good Output (Connected):
```
> backend@0.1.0 start
> node src/index.js

MongoDB connected
Backend listening on http://0.0.0.0:5000
Local access: http://localhost:5000
Network access: http://192.168.1.100:5000
```

### ❌ Bad Output (Not Connected):
```
> backend@0.1.0 start
> node src/index.js

Mongo connection error: MongooseServerSelectionError: connect ECONNREFUSED
Backend listening on http://0.0.0.0:5000
```

**Note:** Even if MongoDB fails to connect, the server might still start, but it won't work properly.

---

## Summary

**Quick Check:**
1. Run `npm start` in the backend folder
2. Look for `MongoDB connected` message ✅
3. If you see errors, check MongoDB Atlas IP whitelist and connection string

**Your backend is connected if:**
- ✅ You see "MongoDB connected" message
- ✅ Server starts without connection errors
- ✅ You can access `http://localhost:5000/keys` and get a response

