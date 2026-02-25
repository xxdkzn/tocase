# Deployment Guide

This guide covers deploying the Telegram NFT Case Opener to production using free-tier services:
- **Backend**: Render (Free tier)
- **Frontend**: Vercel (Free tier)
- **Database**: Supabase (Free tier)

## Prerequisites

Before deploying, ensure you have:

1. **Node.js** (v18 or higher) and npm installed
2. **Git** repository with your code pushed to GitHub
3. **Accounts created** on:
   - [Render](https://render.com) - for backend hosting
   - [Vercel](https://vercel.com) - for frontend hosting
   - [Supabase](https://supabase.com) - for PostgreSQL database
4. **Telegram Bot** created via [@BotFather](https://t.me/BotFather)

## Table of Contents

1. [Database Setup (Supabase)](#1-database-setup-supabase)
2. [Backend Deployment (Render)](#2-backend-deployment-render)
3. [Frontend Deployment (Vercel)](#3-frontend-deployment-vercel)
4. [Telegram Bot Configuration](#4-telegram-bot-configuration)
5. [Post-Deployment Verification](#5-post-deployment-verification)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Database Setup (Supabase)

### Step 1.1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: telegram-nft-case-opener
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

### Step 1.2: Get Database Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Step 1.3: Run Database Migrations

The backend will automatically create tables on first run, but you can also manually create them:

1. Go to **SQL Editor** in Supabase
2. Run the following SQL:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  balance INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NFTs table
CREATE TABLE IF NOT EXISTS nfts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  rarity VARCHAR(50) NOT NULL,
  value INTEGER NOT NULL,
  external_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Case Items (NFTs in cases)
CREATE TABLE IF NOT EXISTS case_items (
  id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
  nft_id INTEGER REFERENCES nfts(id) ON DELETE CASCADE,
  drop_rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Inventory
CREATE TABLE IF NOT EXISTS user_inventory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nft_id INTEGER REFERENCES nfts(id) ON DELETE CASCADE,
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opening History
CREATE TABLE IF NOT EXISTS opening_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
  nft_id INTEGER REFERENCES nfts(id) ON DELETE SET NULL,
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_case_items_case_id ON case_items(case_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_opening_history_user_id ON opening_history(user_id);
```

---

## 2. Backend Deployment (Render)

### Step 2.1: Connect Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your repository

### Step 2.2: Configure Service

Render will auto-detect the `render.yaml` file. Verify these settings:

- **Name**: telegram-nft-case-opener-backend
- **Environment**: Node
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && node dist/index.js`
- **Plan**: Free

### Step 2.3: Set Environment Variables

In the Render dashboard, add these environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `3000` | Auto-set by Render |
| `DATABASE_TYPE` | `supabase` | Use Supabase in production |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | From Supabase dashboard |
| `SUPABASE_KEY` | `eyJ...` | From Supabase dashboard (anon key) |
| `BOT_TOKEN` | `123456:ABC-DEF...` | From @BotFather |
| `JWT_SECRET` | Generate random | Use: `openssl rand -base64 32` |
| `ADMIN_USERNAME` | `your_telegram_username` | Without @ symbol |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Add after Vercel deployment |
| `WEBHOOK_URL` | Leave empty | Will be set after deployment |

### Step 2.4: Deploy

1. Click "Create Web Service"
2. Wait for deployment (~5-10 minutes)
3. Once deployed, copy your backend URL: `https://your-app.onrender.com`

### Step 2.5: Update WEBHOOK_URL

1. Go back to Environment Variables in Render
2. Add `WEBHOOK_URL` = `https://your-app.onrender.com/api/webhook`
3. Save changes (will trigger redeploy)

---

## 3. Frontend Deployment (Vercel)

### Step 3.1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository

### Step 3.2: Configure Project

Vercel will auto-detect the `vercel.json` file. Verify:

- **Framework Preset**: Vite
- **Root Directory**: `./` (project root)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install --prefix frontend`

### Step 3.3: Set Environment Variables

Add these environment variables in Vercel:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://your-app.onrender.com/api` | Your Render backend URL |
| `VITE_BOT_USERNAME` | `your_bot_username` | Without @ symbol |
| `VITE_ENABLE_SOUND` | `true` | Optional |
| `VITE_ENABLE_HAPTICS` | `true` | Optional |

### Step 3.4: Deploy

1. Click "Deploy"
2. Wait for deployment (~2-3 minutes)
3. Once deployed, copy your frontend URL: `https://your-app.vercel.app`

### Step 3.5: Update Backend FRONTEND_URL

1. Go back to Render dashboard
2. Update `FRONTEND_URL` environment variable with your Vercel URL
3. Save (will trigger redeploy)

---

## 4. Telegram Bot Configuration

### Step 4.1: Set Bot Commands

Send these commands to [@BotFather](https://t.me/BotFather):

```
/setcommands

start - Start the bot and open the app
help - Get help information
balance - Check your balance
profile - View your profile
```

### Step 4.2: Configure Menu Button

Set the Web App URL:

```
/setmenubutton
```

Then select your bot and provide:
- **Button text**: "Open App"
- **Web App URL**: `https://your-app.vercel.app`

### Step 4.3: Set Webhook

The backend automatically sets the webhook on startup, but you can verify:

1. Send a request to your backend:
```bash
curl https://your-app.onrender.com/api/health
```

2. Check webhook status via Telegram API:
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

You should see your webhook URL set to: `https://your-app.onrender.com/api/webhook`

---

## 5. Post-Deployment Verification

### Step 5.1: Test Backend Health

```bash
curl https://your-app.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Step 5.2: Test Frontend

1. Open `https://your-app.vercel.app` in browser
2. Check browser console for errors
3. Verify API connection

### Step 5.3: Test Telegram Bot

1. Open Telegram and find your bot
2. Send `/start` command
3. Click "Open App" button
4. Verify the Web App loads correctly

### Step 5.4: Test Admin Access

1. Open the Web App
2. Navigate to `/admin` (if you're the admin user)
3. Verify admin panel loads

---

## 6. Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- Check Render logs: Dashboard → Logs
- Verify all environment variables are set
- Ensure `DATABASE_TYPE=supabase` and credentials are correct

**Problem**: Database connection fails
- Verify Supabase URL and key are correct
- Check Supabase project is active
- Review Supabase logs in dashboard

**Problem**: Webhook not receiving updates
- Verify `WEBHOOK_URL` is set correctly
- Check Telegram webhook status: `/getWebhookInfo`
- Ensure backend is accessible (not sleeping)

### Frontend Issues

**Problem**: Frontend shows "Cannot connect to server"
- Verify `VITE_API_URL` points to correct Render URL
- Check backend is running (visit health endpoint)
- Review browser console for CORS errors

**Problem**: Telegram WebApp doesn't load
- Verify bot menu button URL is correct
- Check `VITE_BOT_USERNAME` is set
- Test frontend URL directly in browser first

### Free Tier Limitations

**Render Free Tier**:
- Spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month (enough for one service)

**Vercel Free Tier**:
- 100 GB bandwidth/month
- Serverless function timeout: 10 seconds
- No sleep/spin-down issues

**Supabase Free Tier**:
- 500 MB database space
- 2 GB bandwidth/month
- Pauses after 7 days of inactivity

### Keeping Backend Awake

To prevent Render from spinning down, you can:

1. Use a service like [UptimeRobot](https://uptimerobot.com) (free)
2. Ping your health endpoint every 10 minutes
3. Upgrade to Render paid plan ($7/month)

---

## Environment Variables Summary

### Backend (.env)

```bash
NODE_ENV=production
PORT=3000
DATABASE_TYPE=supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJ...
BOT_TOKEN=123456:ABC-DEF...
JWT_SECRET=<random-32-char-string>
ADMIN_USERNAME=your_username
FRONTEND_URL=https://your-app.vercel.app
WEBHOOK_URL=https://your-app.onrender.com/api/webhook
```

### Frontend (.env)

```bash
VITE_API_URL=https://your-app.onrender.com/api
VITE_BOT_USERNAME=your_bot_username
VITE_ENABLE_SOUND=true
VITE_ENABLE_HAPTICS=true
```

---

## Maintenance

### Updating the Application

1. Push changes to your GitHub repository
2. Render and Vercel will auto-deploy (if enabled)
3. Monitor deployment logs for errors

### Database Backups

Supabase automatically backs up your database daily. To manually backup:

1. Go to Supabase Dashboard → Database → Backups
2. Click "Create backup"

### Monitoring

- **Render**: Dashboard → Logs (real-time)
- **Vercel**: Dashboard → Deployments → Logs
- **Supabase**: Dashboard → Logs

---

## Security Checklist

- [ ] Changed `JWT_SECRET` from default
- [ ] Set strong Supabase database password
- [ ] Verified `ADMIN_USERNAME` is correct
- [ ] Enabled HTTPS only (automatic on Render/Vercel)
- [ ] Set correct `FRONTEND_URL` for CORS
- [ ] Kept `BOT_TOKEN` and `SUPABASE_KEY` secret
- [ ] Reviewed Supabase Row Level Security policies

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs (Render, Vercel, Supabase)
3. Verify all environment variables are set correctly
4. Test each component individually (database, backend, frontend)

For service-specific issues:
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
