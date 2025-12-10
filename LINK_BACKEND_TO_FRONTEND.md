# How to Deploy Backend to Render and Link to Frontend

Follow these steps to deploy your backend to Render and connect it to your Netlify frontend.

---

## PART 1: Deploy Backend to Render

### Step 1: Push Code to GitHub (if not already done)
```bash
git add .
git commit -m "Ready for Render deployment"
git push
```

### Step 2: Create Render Account
1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended) or email
4. Authorize Render to access your repositories

### Step 3: Create Web Service
1. In Render dashboard, click **"New +"** (top right)
2. Click **"Web Service"**
3. Click **"Connect account"** if prompted
4. Find and select your repository
5. Click **"Connect"**

### Step 4: Configure Backend Service

Fill in these settings:

**Basic Settings:**
- **Name**: `secure-file-share-backend` (or any name)
- **Region**: Choose closest to you
- **Branch**: `main` (or `master`)
- **Root Directory**: `backend` ⚠️ **IMPORTANT**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plan:**
- Select **"Free"** (or paid if preferred)

### Step 5: Set Environment Variables

Scroll to **"Environment Variables"** and click **"Add Environment Variable"**:

**Variable 1:**
- **Key**: `NODE_ENV`
- **Value**: `production`
- Click **"Save"**

**Variable 2:**
- **Key**: `MONGO_URI`
- **Value**: `mongodb+srv://prajwalbijjaragi018_db_user:M8q2Agt5cdIF4DZK@cluster0.8qgoxws.mongodb.net/securefiles?retryWrites=true&w=majority`
- Click **"Save"**

**Note:** `PORT` is automatically set by Render, so you don't need to add it.

### Step 6: Deploy
1. Scroll to bottom
2. Click **"Create Web Service"**
3. Wait for deployment (5-10 minutes)
4. Watch build logs - should show:
   - Installing dependencies
   - Starting service...
   - "Your service is live"
5. **Copy your backend URL** (e.g., `https://secure-file-share-backend.onrender.com`)
   - Click on the URL or copy from top of page
   - **SAVE THIS URL** - you'll need it for Netlify!

### Step 7: Test Backend
1. Open your backend URL in browser
2. Try: `https://your-backend-url.onrender.com/keys`
   - Should return `[]` (empty array) - that's good!
3. Check logs in Render dashboard to verify MongoDB connected

---

## PART 2: Link Backend to Frontend (Netlify)

### Step 1: Get Your Render Backend URL
- From Render dashboard, copy your service URL
- Example: `https://secure-file-share-backend.onrender.com`
- **Make sure it starts with `https://`**

### Step 2: Set Environment Variable in Netlify
1. Go to https://app.netlify.com
2. Select your site
3. Go to **"Site settings"** → **"Environment variables"**
4. Click **"Add variable"**
5. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your Render backend URL (e.g., `https://secure-file-share-backend.onrender.com`)
   - **Scopes**: Check **"All scopes"** or **"Production"**
6. Click **"Add variable"**
7. Click **"Save"**

### Step 3: Redeploy Frontend
1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait for deployment to complete

### Step 4: Test Connection
1. Open your Netlify site URL
2. Open browser console (F12)
3. Try generating a keypair and uploading it
4. Check console for any errors
5. If you see CORS errors, verify backend URL is correct

---

## Verification Checklist

- [ ] Backend deployed on Render
- [ ] Backend URL accessible (returns JSON when visiting `/keys`)
- [ ] MongoDB connected (check Render logs)
- [ ] `VITE_API_BASE_URL` set in Netlify
- [ ] Frontend redeployed after setting environment variable
- [ ] Frontend can connect to backend (no CORS errors)
- [ ] Can generate and upload keys
- [ ] Can fetch keys
- [ ] Can upload files
- [ ] Can download files

---

## Troubleshooting

### Backend Issues

**Problem: MongoDB connection error**
- Check `MONGO_URI` in Render environment variables
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check Render logs for specific error

**Problem: Service keeps restarting**
- Check Render logs
- Verify `npm start` command works
- Ensure MongoDB connection string is correct

### Frontend Connection Issues

**Problem: CORS errors**
- Backend CORS is already configured to allow all origins
- Verify `VITE_API_BASE_URL` is set correctly in Netlify
- Make sure backend URL starts with `https://` (not `http://`)

**Problem: Network errors**
- Verify backend URL is correct
- Check if backend is running (visit backend URL in browser)
- Check browser console for specific error messages

**Problem: Environment variable not working**
- Make sure you redeployed after adding `VITE_API_BASE_URL`
- Clear cache and redeploy
- Verify variable name is exactly `VITE_API_BASE_URL`

---

## Quick Reference

### Render Backend Settings:
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV` = `production`
  - `MONGO_URI` = Your MongoDB connection string

### Netlify Frontend Settings:
- **Base Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL` = Your Render backend URL

---

## Success Indicators

✅ **Backend is working if:**
- Render shows "Your service is live"
- Visiting `/keys` returns JSON (even if empty array)
- Logs show "MongoDB connected"

✅ **Frontend is connected if:**
- No CORS errors in browser console
- Can upload/fetch keys successfully
- Can upload/download files
- Network requests show your Render backend URL

Good luck! 🚀

