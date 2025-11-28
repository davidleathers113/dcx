# DCX Deployment Guide

This guide covers deploying the DCX application using a hybrid approach: frontend on Netlify, backend on a Node.js hosting platform.

## Architecture Overview

- **Frontend**: Next.js 16 app → Netlify (static + serverless)
- **Backend**: Express + Prisma + PostgreSQL → Railway/Render/Fly.io
- **Database**: PostgreSQL → Managed service (Neon, Supabase, Railway, etc.)

## Prerequisites

- [ ] Git repository hosted on GitHub/GitLab/Bitbucket
- [ ] Netlify account (free tier works)
- [ ] Backend hosting account (Railway/Render/Fly.io)
- [ ] PostgreSQL database (managed service recommended)

---

## Part 1: Backend Deployment

### Recommended Backend Hosting Options

#### Option A: Railway (Recommended)
**Pros**: Dead simple, automatic deployments, includes PostgreSQL, generous free tier
**Pricing**: $5/month after free credits

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo" → select your DCX repo
4. Railway will auto-detect the Express app
5. Add PostgreSQL service from Railway marketplace
6. Set environment variables (see below)

#### Option B: Render
**Pros**: Great free tier, managed PostgreSQL included
**Pricing**: Free tier available (spins down after 15 min inactivity)

1. Go to [render.com](https://render.com)
2. Create "New Web Service" → connect GitHub
3. Select `/backend` as root directory
4. Build command: `npm install && npx prisma generate`
5. Start command: `npm start`
6. Add PostgreSQL database (separate service)

#### Option C: Fly.io
**Pros**: Global edge deployment, excellent for low-latency
**Pricing**: Pay-as-you-go (small apps ~$5-10/month)

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. `cd backend && fly launch`
3. Follow prompts to configure
4. Attach Postgres: `fly postgres create`

### Backend Environment Variables

Configure these in your hosting platform:

```bash
# Required
DATABASE_URL="postgresql://user:pass@host:5432/dcx_production"
ADMIN_API_KEY="generate-a-strong-random-key-here"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"

# Optional
PORT=4000
NODE_ENV=production
```

**Generate secure ADMIN_API_KEY**:
```bash
openssl rand -base64 32
```

### Database Setup

After deployment, run migrations:

```bash
# Railway/Render: Use their CLI or run via dashboard
npx prisma migrate deploy

# Or connect to production DB locally:
DATABASE_URL="production-url" npx prisma migrate deploy
```

### Verify Backend Deployment

```bash
# Test health check
curl https://your-backend-url.com/health

# Test authenticated endpoint
curl -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  https://your-backend-url.com/api/campaigns
```

---

## Part 2: Frontend Deployment to Netlify

### Step 1: Connect Repository

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub, GitLab, Bitbucket)
4. Select your DCX repository
5. Netlify will auto-detect Next.js configuration

### Step 2: Configure Build Settings

Netlify should auto-detect these from `netlify.toml`, but verify:

- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 22

### Step 3: Set Environment Variables

In Netlify dashboard → Site settings → Environment variables:

```bash
NEXT_PUBLIC_API_BASE_URL="https://your-backend-url.com"
NEXT_PUBLIC_ADMIN_API_KEY="same-key-as-backend"
```

**Important**:
- Use the full backend URL (including `https://`)
- The API key must match your backend's `ADMIN_API_KEY`
- `NEXT_PUBLIC_` prefix makes variables available in browser

### Step 4: Deploy

1. Click "Deploy site"
2. Netlify will build and deploy automatically
3. You'll get a URL like `https://dcx-abc123.netlify.app`

### Step 5: Custom Domain (Optional)

1. In Netlify dashboard → Domain settings
2. Click "Add custom domain"
3. Follow DNS configuration instructions
4. Netlify provides free SSL certificates

---

## Part 3: Connect Frontend to Backend

### Update CORS Settings (Backend)

Edit `/backend/src/server.ts` to allow your Netlify domain:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',  // Local development
    'https://your-site.netlify.app',  // Netlify deployment
    'https://yourdomain.com'  // Custom domain (if any)
  ],
  credentials: true
}));
```

Redeploy backend after changing CORS settings.

### Test End-to-End

1. Visit your Netlify URL
2. Check browser console for API errors
3. Try logging into dashboard
4. Test campaign creation or other CRUD operations

---

## Part 4: Continuous Deployment

Both Netlify and modern backend hosts (Railway, Render) support automatic deployments:

- **Push to `main` branch** → Automatic production deploy
- **Pull request preview** → Netlify creates preview deploy with unique URL
- **Backend changes** → Railway/Render auto-redeploy on git push

### Recommended Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, commit
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create PR → Netlify creates preview deploy
# Merge PR → Production auto-deploys
```

---

## Monitoring & Debugging

### Netlify Logs
- Dashboard → Deploys → Click latest deploy → View logs
- Function logs available under Functions tab

### Backend Logs
- **Railway**: Dashboard → Service → Logs tab
- **Render**: Dashboard → Service → Logs
- **Fly.io**: `fly logs` in terminal

### Common Issues

#### Frontend can't reach backend
- ✅ Check `NEXT_PUBLIC_API_BASE_URL` is correct
- ✅ Verify CORS settings on backend
- ✅ Check backend is actually running (visit health endpoint)

#### 401 Unauthorized errors
- ✅ Verify `NEXT_PUBLIC_ADMIN_API_KEY` matches backend
- ✅ Check `Authorization` header is being sent (browser DevTools → Network)

#### Database connection errors
- ✅ Verify `DATABASE_URL` is correct
- ✅ Check database is accepting connections from backend host IP
- ✅ Confirm migrations have been run (`npx prisma migrate deploy`)

#### Twilio webhooks not working
- ✅ Update webhook URLs in Twilio console to production backend URL
- ✅ Verify `TWILIO_AUTH_TOKEN` is set correctly

---

## Cost Estimates

### Minimal Setup (Development/Testing)
- Netlify: Free
- Railway: $5/month (includes Postgres)
- **Total: $5/month**

### Production Setup
- Netlify: Free (or $19/month for Pro features)
- Railway/Render: $10-20/month
- Database: $10-25/month (managed Postgres)
- **Total: $20-65/month**

### Scale Considerations
- Netlify handles frontend scaling automatically
- Backend: Consider load balancers, multiple instances for high traffic
- Database: Managed services auto-scale (with cost increases)

---

## Security Checklist

Before going live:

- [ ] Rotate all API keys and secrets
- [ ] Enable Netlify's built-in DDoS protection
- [ ] Configure rate limiting on backend
- [ ] Set up database backups (most managed services do this automatically)
- [ ] Enable SSL (Netlify provides free, backend hosts usually do too)
- [ ] Review CORS settings (don't use `*` wildcard in production)
- [ ] Set up monitoring/alerts (Sentry, LogRocket, etc.)

---

## Rollback Strategy

### Frontend Rollback (Netlify)
1. Dashboard → Deploys
2. Find previous working deploy
3. Click "Publish deploy"

### Backend Rollback
- **Railway**: Dashboard → Deployments → Click previous deploy
- **Render**: Dashboard → Manual Deploy → Select previous commit
- **Fly.io**: `fly releases list` → `fly releases rollback v123`

---

## Next Steps

1. **Set up monitoring**: Sentry for error tracking, Uptime Robot for availability
2. **Configure backups**: Database backups, regular snapshots
3. **Performance optimization**: CDN for static assets, database query optimization
4. **CI/CD enhancements**: Automated tests, staging environment

---

## Support

- Netlify Docs: https://docs.netlify.com/
- Railway Docs: https://docs.railway.app/
- Render Docs: https://render.com/docs/
- Fly.io Docs: https://fly.io/docs/
