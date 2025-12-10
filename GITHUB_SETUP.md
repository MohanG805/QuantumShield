# How to Push Code to GitHub - Step by Step

Follow these steps to push your code to GitHub.

---

## METHOD 1: Using GitHub Website (Easier for Beginners)

### Step 1: Create GitHub Account (if you don't have one)
1. Go to https://github.com
2. Click **"Sign up"**
3. Enter your email, create a password, and choose a username
4. Verify your email address

### Step 2: Create a New Repository on GitHub
1. After logging in, click the **"+"** icon (top right) → **"New repository"**
2. Fill in:
   - **Repository name**: `secure-file-share` (or any name you like)
   - **Description**: (optional) "Secure file sharing app with post-quantum cryptography"
   - **Visibility**: Choose **Public** (free) or **Private** (if you want it private)
   - **DO NOT** check "Add a README file" (we already have code)
   - **DO NOT** check "Add .gitignore" (we already have one)
   - **DO NOT** choose a license (unless you want to)
3. Click **"Create repository"**

### Step 3: Copy the Repository URL
After creating the repository, GitHub will show you a page with instructions.
- Look for the section that says **"...or push an existing repository from the command line"**
- **Copy the repository URL** - it looks like:
  ```
  https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
  ```
  Example: `https://github.com/johnsmith/secure-file-share.git`

### Step 4: Open Terminal/Command Prompt
- **Windows**: Press `Win + R`, type `cmd` or `powershell`, press Enter
- **Mac**: Press `Cmd + Space`, type `Terminal`, press Enter
- **Linux**: Press `Ctrl + Alt + T`

### Step 5: Navigate to Your Project Folder
```bash
cd "C:\Users\prajw\OneDrive\Desktop\copy postq"
```
(Or navigate to wherever your project folder is)

### Step 6: Initialize Git Repository
```bash
git init
```

### Step 7: Add All Files
```bash
git add .
```

### Step 8: Create First Commit
```bash
git commit -m "Initial commit - ready for deployment"
```

### Step 9: Add GitHub Remote
Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Example:**
```bash
git remote add origin https://github.com/johnsmith/secure-file-share.git
```

### Step 10: Rename Branch to Main (if needed)
```bash
git branch -M main
```

### Step 11: Push to GitHub
```bash
git push -u origin main
```

### Step 12: Enter GitHub Credentials
- If prompted for **username**: Enter your GitHub username
- If prompted for **password**: You'll need to use a **Personal Access Token** (see below)

---

## 🔐 Creating a Personal Access Token (For Password)

GitHub no longer accepts passwords. You need a Personal Access Token:

### Step 1: Create Token
1. Go to GitHub → Click your profile picture (top right) → **"Settings"**
2. Scroll down → Click **"Developer settings"** (left sidebar)
3. Click **"Personal access tokens"** → **"Tokens (classic)"**
4. Click **"Generate new token"** → **"Generate new token (classic)"**
5. Fill in:
   - **Note**: "Deployment Token" (or any name)
   - **Expiration**: Choose 90 days or No expiration
   - **Scopes**: Check **"repo"** (this gives full repository access)
6. Click **"Generate token"** at the bottom
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Use Token as Password
When you run `git push` and it asks for a password, paste your **Personal Access Token** instead of your GitHub password.

---

## METHOD 2: Using GitHub Desktop (Visual/GUI Method)

### Step 1: Download GitHub Desktop
1. Go to https://desktop.github.com
2. Download and install GitHub Desktop
3. Sign in with your GitHub account

### Step 2: Add Your Local Repository
1. Open GitHub Desktop
2. Click **"File"** → **"Add Local Repository"**
3. Click **"Choose..."** and select your project folder:
   `C:\Users\prajw\OneDrive\Desktop\copy postq`
4. Click **"Add Repository"**

### Step 3: Publish to GitHub
1. GitHub Desktop will show your files
2. At the bottom, enter a commit message: `"Initial commit - ready for deployment"`
3. Click **"Commit to main"**
4. Click **"Publish repository"** (top right)
5. Choose:
   - **Name**: `secure-file-share` (or your preferred name)
   - **Keep this code private**: Check if you want it private
6. Click **"Publish Repository"**
7. Done! Your code is now on GitHub.

---

## VERIFY YOUR CODE IS ON GITHUB

1. Go to https://github.com/YOUR_USERNAME/YOUR_REPO_NAME
2. You should see all your files:
   - `backend/` folder
   - `frontend/` folder
   - `package.json`
   - `README.md`
   - etc.

---

## TROUBLESHOOTING

### Problem: "fatal: not a git repository"
**Solution**: Make sure you're in the project folder and run `git init` first.

### Problem: "remote origin already exists"
**Solution**: Remove the existing remote first:
```bash
git remote remove origin
```
Then add it again with the correct URL.

### Problem: "Authentication failed" or "Permission denied"
**Solution**: 
- Make sure you're using a Personal Access Token, not your password
- Verify the token has "repo" scope
- Try creating a new token

### Problem: "failed to push some refs"
**Solution**: If GitHub created a README when you created the repo:
```bash
git pull origin main --allow-unrelated-histories
```
Then push again:
```bash
git push -u origin main
```

### Problem: "Please tell me who you are"
**Solution**: Set your git identity:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```
Then commit again.

---

## QUICK COMMAND REFERENCE

```bash
# Navigate to project folder
cd "C:\Users\prajw\OneDrive\Desktop\copy postq"

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for deployment"

# Add remote (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## AFTER PUSHING TO GITHUB

Once your code is on GitHub, you can:
1. ✅ Deploy backend to Render (connect to GitHub repo)
2. ✅ Deploy frontend to Netlify (connect to GitHub repo)
3. ✅ Share your code with others
4. ✅ Track changes and versions

**Next Step**: Follow `STEP_BY_STEP_DEPLOYMENT.md` to deploy your app!

---

## NEED HELP?

- GitHub Docs: https://docs.github.com
- Git Documentation: https://git-scm.com/doc
- GitHub Support: https://support.github.com

Good luck! 🚀

