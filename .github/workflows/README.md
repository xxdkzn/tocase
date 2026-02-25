# CI/CD Information

This project uses automatic deployments through:

- **Render**: Auto-deploys backend from `main` branch (configured in `render.yaml`)
- **Vercel**: Auto-deploys frontend from `main` branch (configured in `vercel.json`)

## Deployment Triggers

Both services automatically deploy when:
- Code is pushed to the `main` branch
- A pull request is merged to `main`

## Manual Deployment

If you need to manually trigger a deployment:

### Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service
3. Click "Manual Deploy" → "Deploy latest commit"

### Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Deployments" tab
4. Click "Redeploy" on any previous deployment

## Monitoring Deployments

- **Render**: Dashboard → Your Service → Logs
- **Vercel**: Dashboard → Your Project → Deployments

## Environment Variables

Environment variables are managed separately in each platform:
- Render: Dashboard → Your Service → Environment
- Vercel: Dashboard → Your Project → Settings → Environment Variables

See `DEPLOYMENT.md` for complete setup instructions.
