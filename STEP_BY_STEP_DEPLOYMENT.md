# Step-by-Step Deployment Guide

Follow these steps exactly to deploy your Secure File Share application.

---

## PART 1: SETUP MONGODB ATLAS (Database)

### Step 1.1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"** or **"Sign Up"**
3. Sign up with your email or Google account
4. Verify your email if required

### Step 1.2: Create a Free Cluster
1. After logging in, click **"Build a Database"**
2. Choose **"FREE"** (M0) tier
3. Select a cloud provider (AWS recommended)
4. Choose a region closest to you
5. Name your cluster (e.g., "Cluster0") or leave default
6. Click **"Create"**
7. Wait 3-5 minutes for cluster to be created

### Step 1.3: Create Database User
1. In the security section, click **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., `admin` or `securefiles`)
5. Click **"Autogenerate Secure Password"** or create your own
6. **IMPORTANT**: Copy and save this password somewhere safe!
7. Under "Database User Privileges", select **"Atlas admin"** or **"Read and write to any database"**
8. Click **"Add User"**

### Step 1.4: Whitelist IP Addresses
1. Click **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - This allows Render to connect to your database
4. Click **"Confirm"**

### Step 1.5: Get Connection String
1. Click **"Database"** (left sidebar) → **"Connect"**
2. Click **"Connect your application"**
3. Choose **"Node.js"** as driver
4. Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
5. Replace `<password>` with your actual password (the one you saved in Step 1.3)
6. Replace `<dbname>` with `securefiles` (or your preferred database name)
7. **SAVE THIS CONNECTION STRING** - you'll need it for Render!

**Example of final connection string:**
```
mongodb+srv://admin:MyPassword123@cluster0.xxxxx.mongodb.net/securefiles?retryWrites=true&w=majority
```

---

## PART 2: DEPLOY BACKEND TO RENDER

### Step 2.1: Push Code to GitHub (if not already done)
1. Open terminal/command prompt in your project folder
2. Check if you have a git repository:
   ```bash
   git status
   ```
3. If not initialized, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ready for deployment"
   ```
4. Go to https://github.com and create a new repository
   - Click your profile → **"New repository"**
   - Name it (e.g., `secure-file-share`)
   - Choose **Public** or **Private**
   - **DO NOT** initialize with README
   - Click **"Create repository"**
5. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```
   (Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual values)

### Step 2.2: Create Render Account
1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended) or email
4. If using GitHub, authorize Render to access your repositories

### Step 2.3: Create Web Service
1. In Render dashboard, click **"New +"** (top right)
2. Click **"Web Service"**
3. Click **"Connect account"** if you see GitHub connection option
4. Find and select your repository from the list
5. Click **"Connect"** next to your repository

### Step 2.4: Configure Backend Service
Fill in the following settings:

**Basic Settings:**
- **Name**: `secure-file-share-backend` (or any name you prefer)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or `master` if that's your branch)
- **Root Directory**: `backend` ⚠️ **IMPORTANT: Type "backend" here**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plan:**
- Select **"Free"** plan (or choose paid if you want)

### Step 2.5: Set Environment Variables
1. Scroll down to **"Environment Variables"** section
2. Click **"Add Environment Variable"** for each:

   **Variable 1:**
   - Key: `NODE_ENV`
   - Value: `production`
   - Click **"Save"**

   **Variable 2:**
   - Key: `MONGO_URI`
   - Value: Paste your MongoDB connection string from Step 1.5
   - Click **"Save"**

   **Note:** `PORT` is automatically set by Render, so you don't need to add it.

### Step 2.6: Deploy
1. Scroll to bottom
2. Click **"Create Web Service"**
3. Wait for deployment (takes 5-10 minutes)
4. Watch the build logs - it should show:
   - Installing dependencies
   - Building...
   - Starting service...
5. When you see **"Your service is live"**, deployment is complete!
6. **Copy your service URL** (looks like: `https://secure-file-share-backend.onrender.com`)
   - Click on the URL or copy it from the top of the page
   - **SAVE THIS URL** - you'll need it for Netlify!

### Step 2.7: Test Backend
1. Open your backend URL in browser
2. You should see an error page (that's normal - there's no root route)
3. Try: `https://your-backend-url.onrender.com/keys`
   - Should return JSON (empty array `[]` is fine)
4. Check logs in Render dashboard to see if MongoDB connected successfully

---

## PART 3: DEPLOY FRONTEND TO NETLIFY

### Step 3.1: Create Netlify Account
1. Go to https://netlify.com
2. Click **"Sign up"**
3. Choose **"Sign up with GitHub"** (recommended) or email
4. If using GitHub, authorize Netlify

### Step 3.2: Import Project
1. In Netlify dashboard, click **"Add new site"** → **"Import an existing project"**
2. Click **"Deploy with GitHub"** (or GitLab/Bitbucket if you use those)
3. Authorize Netlify if prompted
4. Find and select your repository from the list
5. Click on your repository name

### Step 3.3: Configure Build Settings
Fill in these settings:

**Build settings:**
- **Base directory**: `frontend` ⚠️ **Type "frontend" here**
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist`

**Advanced build settings:**
- Click **"Show advanced"**
- Click **"New variable"** to add environment variable:
  - **Key**: `VITE_API_BASE_URL`
  - **Value**: Your Render backend URL from Step 2.6
    - Example: `https://secure-file-share-backend.onrender.com`
    - **Make sure it starts with `https://` and has NO trailing slash!**

### Step 3.4: Deploy
1. Click **"Deploy site"**
2. Wait for build to complete (3-5 minutes)
3. Watch the build logs:
   - Installing dependencies
   - Building with Vite
   - Deploying...
4. When complete, you'll see **"Site is live"**
5. **Copy your site URL** (looks like: `https://random-name-12345.netlify.app`)
   - Or click **"Site settings"** → **"Change site name"** to set a custom name

### Step 3.5: Test Frontend
1. Open your Netlify site URL in browser
2. Open browser Developer Tools (F12) → Console tab
3. Check for any errors
4. Try generating a keypair - it should work!
5. If you see CORS errors, check that your backend URL in Netlify environment variables is correct

---

## PART 4: VERIFY EVERYTHING WORKS

### Test Checklist:
- [ ] Backend URL loads (even if it shows an error page)
- [ ] Frontend URL loads and shows the app
- [ ] Can generate a keypair in frontend
- [ ] Can upload a public key
- [ ] Can fetch a public key
- [ ] Can upload a file
- [ ] Can download a file
- [ ] No errors in browser console
- [ ] No errors in Render logs
- [ ] No errors in Netlify logs

---

## TROUBLESHOOTING

### Backend Issues:

**Problem: MongoDB connection error in Render logs**
- **Solution**: 
  - Double-check `MONGO_URI` in Render environment variables
  - Make sure password in connection string is correct (no special characters need URL encoding)
  - Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`

**Problem: Build fails in Render**
- **Solution**:
  - Check Root Directory is set to `backend`
  - Verify `package.json` exists in backend folder
  - Check build logs for specific error

**Problem: Service keeps restarting**
- **Solution**:
  - Check Render logs for errors
  - Verify MongoDB connection string is correct
  - Make sure `npm start` command works locally

### Frontend Issues:

**Problem: Can't connect to backend (CORS or network errors)**
- **Solution**:
  - Verify `VITE_API_BASE_URL` in Netlify is set correctly
  - Make sure it starts with `https://` (not `http://`)
  - No trailing slash at the end
  - Rebuild the site after changing environment variables

**Problem: Build fails in Netlify**
- **Solution**:
  - Check Base directory is set to `frontend`
  - Verify `package.json` exists in frontend folder
  - Check build logs for specific error

**Problem: 404 errors when navigating**
- **Solution**:
  - Verify `netlify.toml` exists in `frontend` folder
  - Check that redirects are configured correctly

---

## QUICK REFERENCE

### URLs You Need:
1. **MongoDB Connection String**: From MongoDB Atlas → Connect → Connect your application
2. **Backend URL**: From Render dashboard (e.g., `https://your-backend.onrender.com`)
3. **Frontend URL**: From Netlify dashboard (e.g., `https://your-site.netlify.app`)

### Environment Variables:

**Render (Backend):**
- `NODE_ENV` = `production`
- `MONGO_URI` = Your MongoDB connection string

**Netlify (Frontend):**
- `VITE_API_BASE_URL` = Your Render backend URL

---

## NEXT STEPS (Optional)

1. **Custom Domain**: Add your own domain in Netlify/Render settings
2. **Environment Variables**: Add more configs as needed
3. **Monitoring**: Set up error tracking (e.g., Sentry)
4. **CI/CD**: Automatic deployments on git push (already enabled!)

---

## NEED HELP?

- Check the detailed `DEPLOYMENT.md` file
- Render Docs: https://render.com/docs
- Netlify Docs: https://docs.netlify.com
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com

Good luck with your deployment! 🚀

