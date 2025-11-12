# 🚀 DermaAI Deployment Guide - Render.com

## Why Render.com?

✅ **Easiest option** for deploying full-stack apps
✅ **Free tier** - No credit card needed to start
✅ **All-in-one** - Frontend, Backend, PostgreSQL, and Redis on one platform
✅ **Auto-deploy** from GitHub
✅ **HIPAA-ready** (paid tiers)

---

## 📋 Prerequisites

1. ✅ GitHub account
2. ✅ Render.com account (free) - [Sign up here](https://render.com)
3. ✅ Your code pushed to GitHub

---

## 🎯 DEPLOYMENT STEPS

### **STEP 1: Push Your Code to GitHub**

```bash
# If not already done
git add .
git commit -m "feat: ready for deployment"
git push origin main
```

---

### **STEP 2: Sign Up for Render.com**

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with GitHub (easiest option)
4. Authorize Render to access your repositories

---

### **STEP 3: Deploy Using Blueprint (Easiest Method)**

#### Option A: One-Click Deploy (Recommended)

1. In Render Dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Select the **DermaAI** repository
4. Render will automatically detect the `render.yaml` file
5. Click **"Apply"**
6. ⏳ Wait 5-10 minutes for deployment

#### Option B: Manual Setup (Alternative)

If you prefer manual setup, follow the detailed steps below.

---

### **STEP 4: Set Up Databases First**

#### **4.1 Create PostgreSQL Database**

1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `dermai-postgres`
   - **Database**: `dermai_db`
   - **User**: `dermai_user`
   - **Region**: Choose closest to you
   - **Plan**: Free
3. Click **"Create Database"**
4. ⏳ Wait 2-3 minutes
5. **Copy the Internal Database URL** (starts with `postgresql://`)

#### **4.2 Create Redis Instance**

1. Click **"New +"** → **"Redis"**
2. Configure:
   - **Name**: `dermai-redis`
   - **Region**: Same as PostgreSQL
   - **Plan**: Free
3. Click **"Create Redis"**
4. ⏳ Wait 1-2 minutes
5. **Copy the Internal Redis URL** (starts with `redis://`)

---

### **STEP 5: Deploy Backend (FastAPI)**

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `dermai-backend`
   - **Region**: Same as databases
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free

4. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):

```bash
# Database
DATABASE_URL=<paste-postgres-internal-url-here>

# Redis
REDIS_URL=<paste-redis-internal-url-here>

# Security (IMPORTANT: Generate a secure key)
SECRET_KEY=<generate-using-command-below>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=production
DEBUG=False

# CORS (add your frontend URL later)
ALLOWED_ORIGINS=http://localhost:3000

# AI API Keys (add your keys)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
KANTESTI_API_KEY=...
```

**Generate SECRET_KEY:**
```bash
# Run this locally
openssl rand -hex 32
```

5. Click **"Create Web Service"**
6. ⏳ Wait 5-10 minutes for build & deploy
7. **Copy your backend URL** (e.g., `https://dermai-backend.onrender.com`)

---

### **STEP 6: Deploy Frontend (Next.js)**

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `dermai-frontend`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free

4. **Add Environment Variables**:

```bash
NEXT_PUBLIC_API_URL=<paste-backend-url-here>
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production
```

5. Click **"Create Web Service"**
6. ⏳ Wait 5-10 minutes for build & deploy
7. **Your app is now live!** 🎉

---

### **STEP 7: Update Backend CORS**

1. Go to your **backend service** in Render
2. Go to **"Environment"** tab
3. Update `ALLOWED_ORIGINS` to include your frontend URL:
   ```
   https://dermai-frontend.onrender.com
   ```
4. Click **"Save Changes"**
5. Backend will auto-redeploy

---

### **STEP 8: Initialize Database**

Your database needs to be initialized with tables. Here's how:

#### **Option A: Using Render Shell (Easiest)**

1. Go to your **backend service** in Render
2. Click **"Shell"** tab (top right)
3. Run:
   ```bash
   cd /app
   alembic upgrade head
   python init_db.py  # If you have this script
   ```

#### **Option B: Using Local Connection**

1. Get the **External Database URL** from PostgreSQL service
2. Run locally:
   ```bash
   cd backend
   export DATABASE_URL="<external-database-url>"
   alembic upgrade head
   python init_db.py
   ```

---

## ✅ Verify Deployment

1. **Backend Health Check**:
   - Visit: `https://dermai-backend.onrender.com/health`
   - Should return: `{"status": "healthy"}`

2. **Backend API Docs**:
   - Visit: `https://dermai-backend.onrender.com/docs`
   - Interactive API documentation

3. **Frontend**:
   - Visit: `https://dermai-frontend.onrender.com`
   - Should load your app

---

## 🔧 Post-Deployment Configuration

### **Set Up Custom Domain (Optional)**

1. Go to frontend service → **"Settings"** → **"Custom Domains"**
2. Add your domain (e.g., `app.dermai.com`)
3. Update DNS records as instructed
4. Enable **"Force HTTPS"**

### **Enable Auto-Deploy**

By default, Render auto-deploys on git push. To verify:
1. Go to service → **"Settings"**
2. Check **"Auto-Deploy"** is enabled

### **Monitor Your App**

1. **Logs**: Each service has a "Logs" tab
2. **Metrics**: View CPU, memory, and response times
3. **Alerts**: Set up email/Slack notifications

---

## 💰 Pricing & Limits

### **Free Tier Includes:**
- ✅ Web services with 750 hours/month
- ✅ PostgreSQL: 1GB storage
- ✅ Redis: 25MB storage
- ✅ Auto-deploy from GitHub
- ⚠️ Services spin down after 15 min of inactivity (cold starts)

### **Upgrading (When Needed):**
- **Starter ($7/month)**: No sleep, better performance
- **Standard ($25/month)**: More resources, horizontal scaling
- **Pro ($85/month)**: HIPAA compliance, priority support

---

## 🐛 Troubleshooting

### **Backend Build Fails**

1. Check logs in Render dashboard
2. Ensure `requirements.txt` is complete
3. Verify Python version in Dockerfile

### **Frontend Build Fails**

1. Check if `npm install` completes
2. Ensure `next.config.ts` has `output: 'standalone'`
3. Verify Node version (20+)

### **Database Connection Issues**

1. Use **Internal URLs** for connections between services
2. Check environment variables are set correctly
3. Ensure PostgreSQL is running (check status)

### **CORS Errors**

1. Update backend `ALLOWED_ORIGINS` with frontend URL
2. Include both `http` and `https` versions if testing
3. Restart backend after changes

### **Cold Starts (Free Tier)**

Free services sleep after 15min inactivity. First request takes ~30s.

**Solutions:**
- Upgrade to paid plan ($7/month)
- Use a service like [UptimeRobot](https://uptimerobot.com) to ping your app every 5 minutes

---

## 🔄 Updating Your App

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "feat: new feature"
   git push origin main
   ```
3. Render auto-deploys in ~5 minutes
4. Check logs to verify successful deployment

---

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong `SECRET_KEY`
- [ ] Enable HTTPS (automatic on Render)
- [ ] Set up environment variables (never commit secrets)
- [ ] Configure proper CORS origins
- [ ] Set up database backups (Render does this automatically)
- [ ] Enable 2FA on Render account
- [ ] Review Render's security docs for HIPAA compliance

---

## 🎓 Alternative Deployment Options

If Render doesn't meet your needs:

1. **Railway.app** - Similar to Render, very easy
2. **Vercel (frontend) + Render (backend)** - Split deployment
3. **DigitalOcean App Platform** - More control
4. **Fly.io** - Edge deployment, global
5. **AWS/GCP/Azure** - Enterprise, complex, expensive

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **DermaAI Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

## 🎉 You're Done!

Your DermaAI app is now live on the web! 🚀

**Next Steps:**
1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure custom domain
4. Plan for scaling (upgrade when needed)
5. Set up CI/CD for automated testing

---

**Deployed on Render with ❤️**

*Last updated: 2025-11-12*
