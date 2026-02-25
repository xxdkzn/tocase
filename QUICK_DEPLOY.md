# Quick Deployment Checklist

Use this checklist for a fast deployment. See `DEPLOYMENT.md` for detailed instructions.

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to GitHub repository
- [ ] Supabase account created
- [ ] Render account created
- [ ] Vercel account created
- [ ] Telegram bot created via @BotFather

## 🗄️ Step 1: Database (5 minutes)

1. Create Supabase project
2. Copy Project URL and anon key
3. Run SQL migrations from `DEPLOYMENT.md`

## 🔧 Step 2: Backend on Render (10 minutes)

1. New Web Service → Connect GitHub repo
2. Render auto-detects `render.yaml`
3. Add environment variables:
   ```
   DATABASE_TYPE=supabase
   SUPABASE_URL=<from-supabase>
   SUPABASE_KEY=<from-supabase>
   BOT_TOKEN=<from-botfather>
   JWT_SECRET=<generate-random>
   ADMIN_USERNAME=<your-telegram-username>
   ```
4. Deploy and copy backend URL

## 🎨 Step 3: Frontend on Vercel (5 minutes)

1. New Project → Import GitHub repo
2. Vercel auto-detects `vercel.json`
3. Add environment variables:
   ```
   VITE_API_URL=<backend-url>/api
   VITE_BOT_USERNAME=<bot-username>
   ```
4. Deploy and copy frontend URL

## 🔄 Step 4: Update Cross-References (2 minutes)

1. In Render: Set `FRONTEND_URL=<vercel-url>`
2. In Render: Set `WEBHOOK_URL=<backend-url>/api/webhook`
3. Both will auto-redeploy

## 🤖 Step 5: Configure Telegram Bot (3 minutes)

Send to @BotFather:
```
/setcommands
start - Start the bot
help - Get help
balance - Check balance
profile - View profile

/setmenubutton
Button text: Open App
URL: <vercel-url>
```

## ✅ Step 6: Test (2 minutes)

- [ ] Visit `<backend-url>/api/health` → Should return `{"status":"ok"}`
- [ ] Visit `<vercel-url>` → Should load app
- [ ] Open Telegram bot → Click "Open App" → Should work
- [ ] Test admin panel at `<vercel-url>/admin`

## 🎉 Done!

Total time: ~30 minutes

## 🆘 Common Issues

**Backend won't start**: Check Render logs, verify all env vars set

**Frontend can't connect**: Verify `VITE_API_URL` is correct

**Bot doesn't respond**: Check webhook with:
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

**Database errors**: Verify Supabase credentials and run migrations

## 📚 Need More Help?

See `DEPLOYMENT.md` for:
- Detailed step-by-step instructions
- SQL migration scripts
- Troubleshooting guide
- Free tier limitations
- Security checklist
