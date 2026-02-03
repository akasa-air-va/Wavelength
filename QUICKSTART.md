# 🚀 Quick Start - Deploy in 5 Minutes

## Option 1: GitHub + Vercel (Easiest)

### Step 1: Push to GitHub
```bash
# In the bandwidth-vercel folder
git init
git add .
git commit -m "Initial commit: Bandwidth game"
git branch -M main

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/bandwidth-game.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `bandwidth-game` repository
4. Click **Deploy** (don't change any settings!)
5. Wait ~2 minutes
6. 🎉 **Done!** Copy your live URL

### Step 3: Play!
- Share the URL with friends
- Create a room and share the code
- Everyone can join and play!

---

## Option 2: Vercel CLI (For Developers)

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd bandwidth-vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

---

## Option 3: Manual Upload

1. Zip the entire `bandwidth-vercel` folder
2. Go to https://vercel.com/new
3. Drag and drop the zip file
4. Click Deploy
5. Done!

---

## Testing Locally First

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
# Create a room and test!
```

---

## What You'll Get

After deployment, you'll have:
- 🌐 A public URL (e.g., `bandwidth-game.vercel.app`)
- 🎮 Fully functional multiplayer game
- 📱 Mobile-friendly interface
- ⚡ Lightning-fast performance
- 🆓 Free hosting (Vercel's hobby plan)

---

## Troubleshooting

### "npm install failed"
- Make sure `package.json` is in the root directory
- Check that all dependencies are listed correctly

### "Build failed"
- Run `npm run build` locally to see the error
- Check Next.js version compatibility

### "Game not syncing"
- Current version uses localStorage (same-network only)
- For internet-wide multiplayer, see README.md for backend options

---

## Next Steps

Once deployed:
1. **Share your URL** with friends
2. **Test multiplayer** by opening in multiple devices
3. **Customize** (change colors, add topics, etc.)
4. **Upgrade storage** to Firebase/Supabase for global multiplayer

---

## Free Hosting Limits

Vercel's free tier includes:
- ✅ Unlimited projects
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments

Perfect for personal projects and games! 🎉

---

**Need help?** Check the full README.md or Vercel's documentation.
