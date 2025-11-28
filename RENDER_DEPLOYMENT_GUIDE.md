# Render Deployment Guide for DCX Backend

This guide walks you through deploying the DCX backend to Render's free tier.

## Why Render?

✅ **Generous free tier** (750 hours/month per service)
✅ **Automatic SSL certificates**
✅ **Built-in PostgreSQL** (90 days free, then $7/month)
✅ **Auto-deploy from GitHub**
✅ **Zero configuration** with render.yaml

⚠️ **Important**: Free tier services spin down after 15 minutes of inactivity. First request after sleep takes ~30-60 seconds to wake up.

---

## Step-by-Step Deployment

### Step 1: Prepare Your Repository

Push your code to GitHub if you haven't already:

```bash
cd /Users/davidleathers/dcx
git add .
git commit -m "chore: add Render deployment configuration"
git push origin main
```

### Step 2: Sign Up for Render

1. Go to https://render.com/
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended for easier integration)
4. Authorize Render to access your repositories

### Step 3: Create a New Blueprint

Render will automatically detect the `render.yaml` file and create both services.

1. From Render Dashboard, click **"New +"** → **"Blueprint"**
2. Connect your **dcx** repository
3. Render will detect `render.yaml` and show:
   - ✅ Web Service: `dcx-backend`
   - ✅ PostgreSQL Database: `dcx-db`
4. Click **"Apply"**

Render will now:
- Create a PostgreSQL database
- Create the backend web service
- Link them together automatically
- Start the build process

### Step 4: Configure Environment Variables

While the service is building, set up required environment variables:

1. Go to **Dashboard** → **dcx-backend** service
2. Click **"Environment"** in the left sidebar
3. You'll see auto-generated variables:
   - `NODE_ENV=production` ✅
   - `PORT=4000` ✅
   - `DATABASE_URL` ✅ (auto-linked from database)
   - `ADMIN_API_KEY` ✅ (auto-generated secure key)

4. **Add missing variable**: Click "Add Environment Variable"
   - **Key**: `TWILIO_AUTH_TOKEN`
   - **Value**: Get this from https://console.twilio.com/ → Account Info → Auth Token
   - Click "Save Changes"

### Step 5: Wait for Build to Complete

The first build takes 3-5 minutes:

1. Click **"Logs"** tab to watch progress
2. You should see:
   ```
   Installing dependencies...
   Generating Prisma client...
   Compiling TypeScript...
   Starting server...
   DCX backend listening on port 4000 (production)
   ```
3. Once you see **"Service is live"**, deployment is complete! 🎉

### Step 6: Run Database Migrations

Your database is empty and needs schema setup:

1. In **dcx-backend** service, click **"Shell"** tab
2. Run these commands:

```bash
# Apply database migrations
npx prisma migrate deploy

# (Optional) Seed with test data
npx prisma db seed
```

Alternatively, run locally connected to production database:

```bash
# Copy DATABASE_URL from Render dashboard
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### Step 7: Get Your Backend URL

1. In **dcx-backend** service dashboard
2. Look for **"Your service is live at"** message
3. Copy the URL (e.g., `https://dcx-backend.onrender.com`)
4. Test it:

```bash
curl https://dcx-backend.onrender.com/health
# Should return: {"status":"ok","uptime_seconds":123}
```

### Step 8: Copy Important Values

You'll need these for frontend deployment:

- **Backend URL**: `https://dcx-backend.onrender.com` (or your URL)
- **Admin API Key**: Dashboard → Environment → find `ADMIN_API_KEY` value

---

## Deploying Frontend to Netlify

Now that your backend is live, deploy the frontend:

### 1. Update Backend CORS

Edit `/backend/src/server.ts` line 43:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-site.netlify.app',  // Add your Netlify URL here
  ],
  credentials: true
}));
```

Commit and push (Render auto-deploys):

```bash
git add backend/src/server.ts
git commit -m "fix: add Netlify CORS origin"
git push origin main
```

### 2. Deploy to Netlify

Follow the steps in `NETLIFY_QUICKSTART.md`, using:

- `NEXT_PUBLIC_API_BASE_URL`: Your Render backend URL
- `NEXT_PUBLIC_ADMIN_API_KEY`: The value from Render environment

---

## Monitoring & Management

### View Logs

Dashboard → dcx-backend → **Logs** tab

Shows real-time logs from your Express server.

### Shell Access

Dashboard → dcx-backend → **Shell** tab

Opens a terminal connected to your running service. Useful for:
- Running Prisma commands
- Checking environment variables: `printenv`
- Debugging issues

### Metrics

Dashboard → dcx-backend → **Metrics** tab

Shows:
- CPU usage
- Memory usage
- HTTP request rates
- Response times

### Database Management

Dashboard → dcx-db → **Connections**

Get connection details to connect with GUI tools:
- TablePlus
- pgAdmin
- Postico

---

## Handling Free Tier Sleep

Free services sleep after 15 minutes of inactivity.

### Options to Keep Alive

#### Option 1: Accept the Sleep (Recommended for dev/testing)
- Do nothing
- First request takes ~30-60s to wake up
- Subsequent requests are fast

#### Option 2: Ping Service (Free)
Use a free uptime monitor to ping every 10 minutes:

- **UptimeRobot** (https://uptimerobot.com/) - free, 50 monitors
- **Cronitor** (https://cronitor.io/) - free tier available
- **Healthchecks.io** (https://healthchecks.io/) - open source

Setup:
1. Create monitor at UptimeRobot
2. URL: `https://dcx-backend.onrender.com/health`
3. Interval: 10 minutes

⚠️ **Note**: This keeps your service awake 24/7, using your 750 free hours faster.

#### Option 3: Upgrade to Paid Plan ($7/month)
- Never sleeps
- Better for production use

---

## Troubleshooting

### Build Fails: "Prisma schema not found"

**Problem**: Render can't find prisma schema

**Solution**: Verify `render.yaml` has `rootDir: backend`

### Runtime Error: "DATABASE_URL is not set"

**Problem**: Database connection not linked

**Solution**:
1. Dashboard → dcx-backend → Environment
2. Verify `DATABASE_URL` exists and points to `dcx-db`
3. If missing, add manually:
   - Key: `DATABASE_URL`
   - Value: From dcx-db → Connection String (Internal)

### Error: "Table 'CallSession' does not exist"

**Problem**: Migrations haven't been run

**Solution**:
```bash
# In Render Shell tab:
npx prisma migrate deploy
```

### 502 Bad Gateway

**Problem**: Service failed to start or crashed

**Solution**:
1. Check Logs tab for error messages
2. Common causes:
   - Missing environment variables
   - Database connection failure
   - Port mismatch (must use $PORT env var)

### High Memory Usage / Crashes

**Problem**: Free tier has 512MB RAM limit

**Solution**:
1. Check Metrics tab
2. If consistently over 400MB, consider:
   - Upgrading to Starter plan ($7/month, 1GB RAM)
   - Optimizing database queries
   - Reducing WebSocket polling frequency

---

## Upgrade Path

When you're ready for production:

### Database: $7/month
- No sleep/spin down
- Daily backups
- Point-in-time recovery
- More storage

### Backend: Starter ($7/month) or Standard ($25/month)
- No sleep
- More resources (1-2GB RAM)
- Better for production traffic

**Upgrade Steps**:
1. Dashboard → Service → Settings
2. Click "Change Plan"
3. Select new plan
4. Click "Update Plan"

No code changes needed!

---

## Cost Summary

### Free Tier (Development)
- Backend: Free (750 hours/month, sleeps after 15min)
- Database: Free for 90 days, then $7/month
- **Total: $0 for 3 months, then $7/month**

### Paid Tier (Production)
- Backend: $7/month (Starter plan, always on)
- Database: $7/month (always on, backups)
- **Total: $14/month**

---

## Security Checklist

Before going live:

- [ ] Rotate `ADMIN_API_KEY` (don't use auto-generated one long-term)
- [ ] Update CORS origins in backend (only allow your domains)
- [ ] Enable Render's built-in DDoS protection (automatically enabled)
- [ ] Set up database backups (included in paid tier)
- [ ] Configure Twilio webhook URLs to use Render backend URL
- [ ] Set up monitoring/alerts (Sentry, UptimeRobot)
- [ ] Review environment variables (no secrets in code)

---

## Next Steps

1. ✅ Backend deployed to Render
2. → Deploy frontend to Netlify (see `NETLIFY_QUICKSTART.md`)
3. → Update Twilio webhook URLs to point to Render backend
4. → Test end-to-end flow
5. → Set up monitoring

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com/
- **Render Status**: https://status.render.com/
- **DCX Docs**: See `DEPLOYMENT.md` for more details

---

## Quick Reference

### Useful Commands (Render Shell)

```bash
# Check environment variables
printenv | grep -E "DATABASE_URL|ADMIN_API_KEY|NODE_ENV"

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Check Prisma connection
npx prisma db pull

# View logs
tail -f /var/log/*.log

# Check Node version
node --version

# Check disk space
df -h
```

### Important URLs

- **Backend Health**: `https://your-backend.onrender.com/health`
- **API Test**: `curl -H "Authorization: Bearer YOUR_KEY" https://your-backend.onrender.com/api/campaigns`
- **WebSocket Test**: `wscat -c wss://your-backend.onrender.com/ws/live-metrics`

---

Good luck with your deployment! 🚀
