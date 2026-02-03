# 🎮 Bandwidth - Vercel Deployment Guide

Complete Next.js multiplayer guessing game ready for instant Vercel deployment!

## 🚀 Quick Deploy to Vercel (1-Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

### Method 1: Deploy from GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/bandwidth-game.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy" (no configuration needed!)
   - Your game will be live in ~2 minutes! 🎉

3. **Share Your Game**
   - Copy the deployment URL (e.g., `bandwidth-game.vercel.app`)
   - Share with friends
   - They can join using room codes!

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (from project directory)
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? bandwidth-game
# - Deploy? Yes

# Get production URL
vercel --prod
```

## 📦 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🎯 How It Works

### Storage System

This version uses **localStorage** to sync game state across players:

- **Browser-based**: No backend required!
- **Real-time sync**: 1-second polling for updates
- **Cross-tab support**: Works across multiple browser tabs
- **Same network**: Players on the same WiFi can play together

### Important Note

⚠️ **This version uses localStorage for simplicity**. This means:
- Players must be on the same network/location to access the same storage
- Game state is stored in the browser
- For internet-wide multiplayer, you'd need a real backend (see upgrade options below)

## 🔧 Project Structure

```
bandwidth-vercel/
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── globals.css        # Global styles
├── components/
│   └── BandwidthGame.js   # Main game component
├── utils/
│   └── storage.js         # Storage utility
├── package.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

## 🌐 Upgrading to Real Multiplayer

For true internet-wide multiplayer, replace the storage system with a backend:

### Option 1: Firebase Realtime Database

```bash
npm install firebase
```

```javascript
// utils/storage.js
import { getDatabase, ref, set, get } from 'firebase/database';

const db = getDatabase();

export default {
  async get(key) {
    const snapshot = await get(ref(db, key));
    return { value: snapshot.val() };
  },
  async set(key, value) {
    await set(ref(db, key), value);
    return { key, value };
  }
};
```

### Option 2: Supabase

```bash
npm install @supabase/supabase-js
```

```javascript
// utils/storage.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default {
  async get(key) {
    const { data } = await supabase
      .from('games')
      .select('value')
      .eq('key', key)
      .single();
    return { value: data?.value };
  },
  async set(key, value) {
    await supabase
      .from('games')
      .upsert({ key, value });
    return { key, value };
  }
};
```

### Option 3: Vercel KV (Redis)

```bash
npm install @vercel/kv
```

Create API routes in `app/api/`:

```javascript
// app/api/storage/route.js
import { kv } from '@vercel/kv';

export async function GET(request) {
  const key = request.nextUrl.searchParams.get('key');
  const value = await kv.get(key);
  return Response.json({ value });
}

export async function POST(request) {
  const { key, value } = await request.json();
  await kv.set(key, value);
  return Response.json({ key, value });
}
```

## 🎨 Customization

### Change Colors

Edit `components/BandwidthGame.js`:

```javascript
// Change from purple/pink theme to blue/green
className="bg-gradient-to-br from-blue-900 via-teal-900 to-green-900"
```

### Add New Topics

Edit the `DEFAULT_TOPICS` array:

```javascript
const DEFAULT_TOPICS = [
  { left: "Worst Movie", right: "Best Movie" },
  { left: "Your custom left", right: "Your custom right" },
  // Add more...
];
```

### Modify Scoring

Change points in the `submitGuess` function:

```javascript
if (distance <= 5) points = 5;  // Changed from 4
else if (distance <= 10) points = 4;  // Changed from 3
```

## 🐛 Troubleshooting

### Game not syncing?

**Problem**: Players can't see each other's updates

**Solutions**:
1. Make sure all players are using the exact same room code
2. Check browser console for errors
3. Try refreshing the page
4. Clear browser cache and localStorage
5. For internet-wide play, upgrade to a real backend (see above)

### Vercel deployment fails?

**Problem**: Build errors during deployment

**Solutions**:
1. Run `npm install` locally to check for errors
2. Run `npm run build` to test the build locally
3. Check Vercel logs for specific errors
4. Ensure all dependencies are in `package.json`

### Styling looks broken?

**Problem**: Tailwind CSS not loading

**Solutions**:
1. Check `tailwind.config.js` paths are correct
2. Verify `globals.css` has Tailwind imports
3. Clear Next.js cache: `rm -rf .next`
4. Rebuild: `npm run build`

## 📊 Performance Tips

- **Game state size**: Keep room codes short (current: 6 chars)
- **Polling interval**: 1 second is optimal (faster = more updates, more resource usage)
- **Player limit**: Works well up to 20 players with current setup
- **Storage cleanup**: Implement auto-cleanup for old games (30+ minutes inactive)

## 🔒 Security Considerations

Current version is casual/friendly use. For production:

1. **Validate inputs**: Sanitize player names and room codes
2. **Rate limiting**: Prevent spam room creation
3. **Room expiration**: Auto-delete old games
4. **Authentication**: Add user accounts for persistent stats
5. **Content moderation**: Filter inappropriate names/clues

## 🎉 Features

- ✅ Multiplayer via room codes
- ✅ Real-time updates (1s polling)
- ✅ Beautiful retro-arcade design
- ✅ Mobile responsive
- ✅ No backend required
- ✅ Instant Vercel deployment
- ✅ Custom topics support
- ✅ Score tracking
- ✅ Rotating psychic role

## 📝 Environment Variables

No environment variables needed for basic version!

For upgraded backends:
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Vercel KV
KV_REST_API_URL=your_url
KV_REST_API_TOKEN=your_token
```

Add these in Vercel Dashboard → Settings → Environment Variables

## 🤝 Contributing

Want to enhance the game? Ideas:

- Add sound effects
- Add time limits per round
- Add animations for score reveals
- Add game history/stats
- Add team mode
- Add power-ups
- Add custom themes
- Add chat functionality

## 📄 License

MIT License - Use freely!

---

**Need Help?**
- Check [Next.js docs](https://nextjs.org/docs)
- Check [Vercel docs](https://vercel.com/docs)
- Open an issue on GitHub

**Have fun playing! 🎮🎉**
