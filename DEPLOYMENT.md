# Deployment Guide

This guide will help you deploy the Secure File Share application:
- **Frontend** → Netlify
- **Backend** → Render

## Prerequisites

1. GitHub account (to connect repositories)
2. Netlify account (free tier available)
3. Render account (free tier available)
4. MongoDB Atlas account (free tier available) or MongoDB instance

---

## Backend Deployment (Render)

### Step 1: Set up MongoDB

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster
2. Create a database user and note the username/password
3. Get your connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/securefiles?retryWrites=true&w=majority`)

### Step 2: Deploy to Render

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Go to Render Dashboard**
   - Visit [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"

3. **Connect Repository**
   - Connect your GitHub repository
   - Select the repository containing this project

4. **Configure Service**
   - **Name**: `secure-file-share-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose a paid plan)

5. **Set Environment Variables**
   - Click "Advanced" → "Add Environment Variable"
   - Add the following:
     ```
     NODE_ENV=production
     PORT=10000
     MONGO_URI=your_mongodb_connection_string_here
     ```
   - Replace `your_mongodb_connection_string_here` with your actual MongoDB Atlas connection string

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://secure-file-share-backend.onrender.com`)

---

## Frontend Deployment (Netlify)

### Step 1: Update API Configuration

Before deploying, you need to set the backend URL. You'll configure this in Netlify's environment variables.

### Step 2: Deploy to Netlify

1. **Push your code to GitHub** (if not already done)

2. **Go to Netlify Dashboard**
   - Visit [netlify.com](https://netlify.com) and sign up/login
   - Click "Add new site" → "Import an existing project"

3. **Connect Repository**
   - Connect your GitHub account
   - Select the repository containing this project

4. **Configure Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

5. **Set Environment Variables**
   - Click "Site settings" → "Environment variables" → "Add variable"
   - Add the following:
     ```
     VITE_API_BASE_URL=https://your-backend-url.onrender.com
     ```
   - Replace `https://your-backend-url.onrender.com` with your actual Render backend URL (from Step 2.6)

6. **Deploy**
   - Click "Deploy site"
   - Wait for deployment to complete
   - Your site will be live at a URL like `https://random-name-12345.netlify.app`

---

## Post-Deployment Checklist

- [ ] Backend is accessible (check Render logs)
- [ ] Frontend can connect to backend (check browser console)
- [ ] MongoDB connection is working (check Render logs)
- [ ] File upload/download functionality works
- [ ] Key generation and sharing works

---

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error**
   - Verify `MONGO_URI` is set correctly in Render
   - Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Render)
   - Ensure database user has proper permissions

2. **Port Issues**
   - Render automatically sets `PORT` environment variable
   - Your code should use `process.env.PORT` (which it does)

3. **Build Failures**
   - Check Render build logs
   - Ensure `package.json` has correct scripts
   - Verify Node.js version compatibility

### Frontend Issues

1. **API Connection Errors**
   - Verify `VITE_API_BASE_URL` is set correctly in Netlify
   - Ensure backend URL includes `https://` (not `http://`)
   - Check CORS settings in backend (should allow all origins)

2. **Build Failures**
   - Check Netlify build logs
   - Ensure all dependencies are in `package.json`
   - Verify Vite configuration is correct

3. **404 Errors on Routes**
   - Netlify redirects are configured in `netlify.toml`
   - Ensure `netlify.toml` is in the `frontend` directory

---

## Custom Domain (Optional)

### Netlify Custom Domain
1. Go to Site settings → Domain management
2. Add your custom domain
3. Follow DNS configuration instructions

### Render Custom Domain
1. Go to your service → Settings → Custom Domain
2. Add your custom domain
3. Update DNS records as instructed

---

## Environment Variables Reference

### Backend (Render)
- `NODE_ENV`: `production`
- `PORT`: `10000` (or let Render set it automatically)
- `MONGO_URI`: Your MongoDB connection string

### Frontend (Netlify)
- `VITE_API_BASE_URL`: Your Render backend URL (e.g., `https://your-backend.onrender.com`)

---

## Notes

- Render free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid plans for production use
- MongoDB Atlas free tier has storage and connection limits

