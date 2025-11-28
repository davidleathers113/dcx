# Netlify Quick Start Guide

Follow these steps to deploy DCX to Netlify (frontend only).

## Prerequisites

- [ ] Backend deployed and accessible (see `DEPLOYMENT.md` for full guide)
- [ ] Backend URL noted (e.g., `https://dcx-backend.railway.app`)
- [ ] `ADMIN_API_KEY` from backend environment variables

## Step-by-Step Instructions

### 1. Push Code to Git

```bash
# From the dcx directory
git add .
git commit -m "chore: add Netlify deployment configuration"
git push origin main
```

### 2. Deploy to Netlify

#### Option A: Netlify Dashboard (Recommended for first time)

1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub/GitLab/Bitbucket)
4. Authorize Netlify to access your repositories
5. Select the `dcx` repository
6. Netlify will auto-detect the `netlify.toml` configuration

#### Option B: Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy from the dcx directory
cd /Users/davidleathers/dcx
netlify init

# Follow the prompts:
# - Create & configure a new site
# - Select your team
# - Site name: dcx-production (or your choice)
# - Build command: (leave as detected)
# - Netlify will detect netlify.toml settings

# Deploy
netlify deploy --prod
```

### 3. Configure Environment Variables

In Netlify Dashboard:

1. Go to your site → **Site configuration** → **Environment variables**
2. Click "Add a variable" and add these:

```bash
# Required
NEXT_PUBLIC_API_BASE_URL="https://your-backend-url.com"
NEXT_PUBLIC_ADMIN_API_KEY="your-admin-api-key-here"
```

**Important Notes:**
- Replace `your-backend-url.com` with your actual backend URL (from Railway/Render/Fly.io)
- The `ADMIN_API_KEY` must match the one set on your backend
- Don't include trailing slashes in the URL

### 4. Update Backend CORS Settings

Your backend needs to allow requests from your Netlify domain.

Edit `/backend/src/server.ts` (around line 43):

```typescript
// Replace this:
app.use(cors());

// With this:
app.use(cors({
  origin: [
    'http://localhost:3000',              // Local development
    'https://your-site.netlify.app',      // Your Netlify URL
    'https://your-custom-domain.com'      // If you have a custom domain
  ],
  credentials: true
}));
```

Then redeploy your backend.

### 5. Trigger Redeploy

After setting environment variables:

1. Go to **Deploys** tab in Netlify
2. Click "Trigger deploy" → "Deploy site"

Or via CLI:
```bash
netlify deploy --prod
```

### 6. Verify Deployment

1. **Check build logs**: Netlify Dashboard → Deploys → Click latest deploy
2. **Visit your site**: Click the site URL (e.g., `https://dcx-abc123.netlify.app`)
3. **Test API connection**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Check for any CORS or network errors
   - Try navigating to Campaigns or other pages

### 7. Test End-to-End

- [ ] Homepage loads
- [ ] Dashboard displays metrics
- [ ] Campaigns page loads campaign list
- [ ] Can create/edit campaigns
- [ ] Live calls page shows WebSocket connection
- [ ] No console errors

## Common Issues

### "Failed to fetch" errors

**Problem**: Frontend can't reach backend

**Solutions**:
1. Check `NEXT_PUBLIC_API_BASE_URL` is correct (no typos)
2. Verify backend is running (visit `https://your-backend-url.com/health`)
3. Check CORS settings on backend allow your Netlify domain

### CORS errors in console

**Problem**: `Access-Control-Allow-Origin` header missing

**Solutions**:
1. Update backend `server.ts` CORS config to include your Netlify URL
2. Redeploy backend after changing CORS
3. Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### 401 Unauthorized errors

**Problem**: API key mismatch

**Solutions**:
1. Verify `NEXT_PUBLIC_ADMIN_API_KEY` in Netlify matches backend
2. Check for extra spaces or quotes in environment variable
3. Redeploy frontend after changing env vars

### WebSocket connection fails

**Problem**: Live metrics/calls not updating

**Solutions**:
1. Ensure backend WebSocket endpoint is accessible
2. Check browser console for WebSocket errors
3. Verify no proxy/firewall blocking WebSocket connections
4. Test WebSocket directly: `wscat -c wss://your-backend-url.com/ws/live-metrics`

## Next Steps

- [ ] Set up custom domain (Netlify Dashboard → Domain management)
- [ ] Configure branch deploys (auto-deploy from `main`, preview for PRs)
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure notifications (Netlify Slack/email integration)

## Rollback

If something goes wrong:

1. Netlify Dashboard → **Deploys**
2. Find a previous working deploy
3. Click the deploy → "Publish deploy"

This instantly switches your site back to the previous version.

## Support

- Netlify Docs: https://docs.netlify.com/
- Netlify Support: https://answers.netlify.com/
- Full Deployment Guide: See `DEPLOYMENT.md` in this repo
