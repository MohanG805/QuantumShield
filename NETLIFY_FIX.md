# Netlify Build Fix

## The Problem
Netlify is trying to run `npm run build` but can't find the script because it's running from the wrong directory.

## Solution Options

### Option 1: Configure in Netlify Dashboard (RECOMMENDED)

1. Go to your Netlify site dashboard
2. Click **"Site settings"** → **"Build & deploy"**
3. Under **"Build settings"**, click **"Edit settings"**
4. Set these values:
   - **Base directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `frontend/dist`
5. Click **"Save"**
6. Trigger a new deployment

### Option 2: Use netlify.toml (Current Setup)

The `netlify.toml` file in the root should work, but you may need to:
1. Make sure it's committed and pushed to GitHub
2. In Netlify dashboard, verify the settings match the netlify.toml

### Option 3: Move netlify.toml to frontend folder

If the above doesn't work, you can:
1. Delete the root `netlify.toml`
2. Keep only `frontend/netlify.toml`
3. In Netlify dashboard, set:
   - **Base directory**: `frontend`
   - Build command and publish directory will be read from `frontend/netlify.toml`

## Verify Your Configuration

After making changes:
1. Commit and push to GitHub
2. Check Netlify build logs
3. Look for: "Installing dependencies" and "Building site"
4. Should see: "vite build" output

## Common Issues

- **"Missing script: build"** → Netlify is running from wrong directory
- **"Cannot find package.json"** → Base directory not set correctly
- **Build succeeds but site doesn't work** → Publish directory might be wrong

