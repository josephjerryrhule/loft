# Plesk Deployment Guide

## Overview
Complete guide for deploying the Loft Next.js application on Plesk hosting.

**Good News:** Plesk has much better Node.js support than cPanel, making this deployment feasible! ✅

---

## ✅ Prerequisites

### Server Requirements:
- **Plesk Obsidian 18.0.50+** (with Node.js extension)
- **Node.js 20+** support
- **PostgreSQL 13+**
- **2GB+ RAM minimum**
- **SSH access** (recommended)
- **Root/Admin access** (for installing extensions)

### Check Your Plesk Version:
1. Log in to Plesk
2. Go to **Tools & Settings** → **Updates**
3. Ensure you have Plesk Obsidian 18.0.50 or newer

---

## 🚀 Step-by-Step Deployment

### Step 1: Install Required Plesk Extensions

1. **Log in to Plesk** as admin/root
2. **Extensions** → **My Extensions**
3. **Install these extensions:**
   - ✅ **Node.js** (essential)
   - ✅ **Git** (for deployment)
   - ✅ **PostgreSQL** (if not already installed)
   - ✅ **PM2** (for process management)
   - ✅ **Let's Encrypt** (for SSL)

### Step 2: Database Setup

#### Option A: PostgreSQL on Plesk Server (Recommended)

1. **Install PostgreSQL:**
   ```bash
   # SSH into your server
   ssh root@your-server.com
   
   # Install PostgreSQL (if not installed)
   # For Ubuntu/Debian:
   apt update
   apt install postgresql postgresql-contrib
   
   # For CentOS/RHEL:
   yum install postgresql-server postgresql-contrib
   systemctl enable postgresql
   systemctl start postgresql
   ```

2. **Create Database:**
   ```bash
   # Switch to postgres user
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE loft;
   CREATE USER loftuser WITH PASSWORD 'your_secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE loft TO loftuser;
   \c loft
   GRANT ALL ON SCHEMA public TO loftuser;
   \q
   ```

3. **Configure PostgreSQL for Local Connections:**
   ```bash
   # Edit pg_hba.conf
   nano /etc/postgresql/*/main/pg_hba.conf
   
   # Add this line (for local connections):
   host    loft    loftuser    127.0.0.1/32    md5
   
   # Restart PostgreSQL
   systemctl restart postgresql
   ```

4. **Get Connection String:**
   ```
   DATABASE_URL="postgresql://loftuser:your_password@localhost:5432/loft"
   DIRECT_URL="postgresql://loftuser:your_password@localhost:5432/loft"
   ```

#### Option B: External Database (Alternative)

Use a managed PostgreSQL service:
- **DigitalOcean Managed Database:** $15/month
- **AWS RDS:** Variable pricing
- **Supabase:** Keep just the database

### Step 3: Create Domain in Plesk

1. **Domains** → **Add Domain**
2. Enter your domain name (e.g., `loft.example.com`)
3. Leave **Document root** as default
4. Click **OK**

### Step 4: Configure Node.js Application

1. **Go to your domain** in Plesk
2. Click **Node.js** in the left sidebar
3. **Configure Node.js settings:**
   - ✅ **Enable Node.js:** Yes
   - ✅ **Node.js version:** 20.x or 22.x (latest LTS)
   - ✅ **Document root:** `/httpdocs`
   - ✅ **Application mode:** Production
   - ✅ **Application root:** `/httpdocs` (or custom path)
   - ✅ **Application startup file:** Leave empty (we'll use PM2)
   - ✅ **Custom environment variables:** (add later)

4. Click **Enable Node.js**

### Step 5: Upload Application Files

#### Method A: Git (Recommended)

1. **In Plesk** → **Git** → **Clone Repository**
2. Enter your repository URL
3. Choose deployment path: `/var/www/vhosts/yourdomain.com/httpdocs`
4. Add deployment key if using private repo
5. Click **Clone**

#### Method B: File Manager / FTP

1. **Compress your application:**
   ```bash
   # On your local machine
   cd /Users/joeseph/Desktop/Dev/public/loft
   
   # Remove node_modules and .next
   rm -rf node_modules .next
   
   # Create archive
   tar -czf loft-app.tar.gz .
   ```

2. **Upload to Plesk:**
   - Use **File Manager** or **FTP**
   - Upload to: `/var/www/vhosts/yourdomain.com/httpdocs`
   - Extract: `tar -xzf loft-app.tar.gz`

#### Method C: SSH + Git

```bash
# SSH into server
ssh your-plesk-user@your-server.com

# Navigate to domain directory
cd /var/www/vhosts/yourdomain.com/httpdocs

# Clone repository
git clone https://github.com/yourusername/loft.git .

# Or pull if already cloned
git pull origin main
```

### Step 6: Configure Environment Variables

1. **In Plesk** → **Node.js** → **Environment Variables**
2. **Add all required variables:**

```bash
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://loftuser:password@localhost:5432/loft
DIRECT_URL=postgresql://loftuser:password@localhost:5432/loft

# Authentication
AUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=https://yourdomain.com

# Storage (choose one option)
# Option 1: Local storage (simple)
STORAGE_PROVIDER=local

# Option 2: DigitalOcean Spaces (recommended)
STORAGE_PROVIDER=spaces
DO_SPACES_KEY=your_spaces_key
DO_SPACES_SECRET=your_spaces_secret
DO_SPACES_BUCKET=loft-uploads
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_CDN_ENDPOINT=https://loft-uploads.nyc3.cdn.digitaloceanspaces.com

# Payment
PAYSTACK_PUBLIC_KEY=your_public_key
PAYSTACK_SECRET_KEY=your_secret_key
PAYSTACK_MODE=live
PAYSTACK_LIVE_PUBLIC_KEY=pk_live_xxx
PAYSTACK_LIVE_SECRET_KEY=sk_live_xxx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Loft Platform

# Cron
CRON_SECRET=your_generated_cron_secret

# Redis (optional, for rate limiting)
REDIS_URL=redis://localhost:6379
```

3. **Generate secrets:**
   ```bash
   # Generate AUTH_SECRET
   openssl rand -hex 32
   
   # Generate CRON_SECRET
   openssl rand -hex 32
   ```

### Step 7: Install Dependencies and Build

**Via Plesk Node.js interface:**

1. **Go to Node.js** in your domain
2. **NPM Install** → Click **Run**
3. Wait for dependencies to install (~5 minutes)

**Or via SSH:**

```bash
# SSH into server
ssh your-plesk-user@your-server.com
cd /var/www/vhosts/yourdomain.com/httpdocs

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed database (first time only)
npx prisma db seed

# Build application
npm run build
```

### Step 8: Set Up PM2 Process Manager

1. **Install PM2 globally (SSH required):**
   ```bash
   ssh root@your-server.com
   npm install -g pm2
   ```

2. **Create PM2 ecosystem file:**
   ```bash
   # In your app directory
   cd /var/www/vhosts/yourdomain.com/httpdocs
   nano ecosystem.config.js
   ```

3. **Add this configuration:**
   ```javascript
   module.exports = {
     apps: [{
       name: 'loft',
       script: './node_modules/next/dist/bin/next',
       args: 'start',
       cwd: '/var/www/vhosts/yourdomain.com/httpdocs',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       error_file: '/var/www/vhosts/yourdomain.com/logs/pm2-error.log',
       out_file: '/var/www/vhosts/yourdomain.com/logs/pm2-out.log',
       log_file: '/var/www/vhosts/yourdomain.com/logs/pm2-combined.log',
       time: true
     }]
   }
   ```

4. **Start application with PM2:**
   ```bash
   # Start app
   pm2 start ecosystem.config.js
   
   # Set PM2 to start on server boot
   pm2 startup
   pm2 save
   
   # Check status
   pm2 status
   pm2 logs loft
   ```

### Step 9: Configure Nginx Reverse Proxy

1. **Create Nginx configuration:**
   ```bash
   # SSH as root
   ssh root@your-server.com
   
   # Create additional Nginx directives
   nano /var/www/vhosts/system/yourdomain.com/conf/vhost_nginx.conf
   ```

2. **Add proxy configuration:**
   ```nginx
   # Proxy to Node.js application
   location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
       
       # Security headers
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       
       # Timeouts
       proxy_connect_timeout 60s;
       proxy_send_timeout 60s;
       proxy_read_timeout 60s;
   }
   
   # Static files optimization
   location /_next/static {
       proxy_pass http://localhost:3000;
       proxy_cache_valid 200 60m;
       add_header Cache-Control "public, immutable";
   }
   
   # API routes (no caching)
   location /api {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

3. **Reload Nginx:**
   ```bash
   # Test configuration
   nginx -t
   
   # Reload if test passes
   systemctl reload nginx
   ```

**Alternative: Use Plesk's Apache-to-Nginx proxy (easier):**

1. **Tools & Settings** → **Updates** → Install **Proxy to Node.js**
2. In your domain → **Apache & Nginx Settings**
3. Enable **Proxy mode**
4. Nginx will automatically proxy to your Node.js app on port 3000

### Step 10: Set Up SSL Certificate

1. **In Plesk** → Your Domain → **SSL/TLS Certificates**
2. **Install Free Let's Encrypt Certificate:**
   - Click **Get it free**
   - Select your domain and www subdomain
   - Enable **Assign the certificate to mail domain**
   - Click **Get it free**
3. **Enable HTTPS redirect:**
   - Click **Hosting Settings**
   - Check **Permanent SEO-safe 301 redirect from HTTP to HTTPS**
   - Save

### Step 11: Set Up Cron Jobs

1. **In Plesk** → Your Domain → **Scheduled Tasks**
2. **Add New Task:**
   - **Task type:** Run a command
   - **Command:**
     ```bash
     curl -X POST https://yourdomain.com/api/cron/expire-subscriptions -H "Authorization: Bearer YOUR_CRON_SECRET"
     ```
   - **Schedule:** Daily at midnight
     - **Minute:** 0
     - **Hour:** 0
     - **Day:** *
     - **Month:** *
     - **Day of week:** *
   - **Enabled:** Yes
3. **Save**

### Step 12: Configure File Uploads

#### Option A: Local Storage (Simple)

1. **Create uploads directory:**
   ```bash
   ssh your-plesk-user@your-server.com
   cd /var/www/vhosts/yourdomain.com/httpdocs/public
   mkdir -p uploads/flipbooks uploads/products uploads/misc
   chmod -R 755 uploads
   chown -R your-plesk-user:psacln uploads
   ```

2. **Set environment:**
   ```bash
   STORAGE_PROVIDER=local
   ```

3. **Ensure Nginx serves uploads:**
   ```nginx
   # In vhost_nginx.conf
   location /uploads {
       alias /var/www/vhosts/yourdomain.com/httpdocs/public/uploads;
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

#### Option B: DigitalOcean Spaces (Recommended)

1. **Create Spaces bucket** (follow guide in DIGITALOCEAN_DEPLOYMENT.md)
2. **Install AWS SDK:**
   ```bash
   cd /var/www/vhosts/yourdomain.com/httpdocs
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```
3. **Update environment variables** (already shown in Step 6)
4. **Use storage abstraction** (src/lib/storage.ts already created)

### Step 13: Database Backups

1. **Set up automatic PostgreSQL backups:**
   ```bash
   # Create backup script
   nano /root/backup-postgres.sh
   ```

2. **Add backup script:**
   ```bash
   #!/bin/bash
   BACKUP_DIR="/var/backups/postgresql"
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   
   mkdir -p $BACKUP_DIR
   
   # Backup database
   sudo -u postgres pg_dump loft | gzip > $BACKUP_DIR/loft_$TIMESTAMP.sql.gz
   
   # Keep only last 7 days
   find $BACKUP_DIR -name "loft_*.sql.gz" -mtime +7 -delete
   
   echo "Backup completed: loft_$TIMESTAMP.sql.gz"
   ```

3. **Make executable:**
   ```bash
   chmod +x /root/backup-postgres.sh
   ```

4. **Add to cron:**
   ```bash
   crontab -e
   # Add: 0 2 * * * /root/backup-postgres.sh
   ```

---

## 🔧 Deployment Checklist

Before going live, verify:

- [ ] Node.js 20+ installed and enabled
- [ ] PostgreSQL database created and accessible
- [ ] All environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Database migrated (`npx prisma migrate deploy`)
- [ ] Database seeded (`npx prisma db seed`)
- [ ] Application built (`npm run build`)
- [ ] PM2 running (`pm2 status`)
- [ ] Nginx proxy configured
- [ ] SSL certificate installed
- [ ] HTTPS redirect enabled
- [ ] Cron job scheduled
- [ ] File uploads working
- [ ] Test all features:
  - [ ] User registration
  - [ ] Login
  - [ ] Payment processing
  - [ ] File uploads
  - [ ] PDF viewing
  - [ ] Email sending

---

## 🔄 Updating Your Application

### Manual Update (SSH):
```bash
# SSH into server
ssh your-plesk-user@your-server.com
cd /var/www/vhosts/yourdomain.com/httpdocs

# Pull latest code
git pull origin main

# Install new dependencies (if any)
npm install

# Run migrations (if any)
npx prisma migrate deploy

# Rebuild
npm run build

# Restart PM2
pm2 restart loft
```

### Automated Updates (Git Auto-Deploy):

1. **In Plesk** → **Git**
2. Enable **Deploy on push**
3. Add **post-deployment script:**
   ```bash
   cd {DOCUMENT_ROOT}
   npm install
   npx prisma migrate deploy
   npm run build
   pm2 restart loft
   ```

---

## 🐛 Troubleshooting

### Application Not Starting

1. **Check PM2 logs:**
   ```bash
   pm2 logs loft
   pm2 monit
   ```

2. **Check Nginx error log:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **Verify port 3000 is listening:**
   ```bash
   netstat -tulpn | grep 3000
   ```

### Database Connection Issues

1. **Test connection:**
   ```bash
   psql "postgresql://loftuser:password@localhost:5432/loft"
   ```

2. **Check PostgreSQL is running:**
   ```bash
   systemctl status postgresql
   ```

3. **Verify pg_hba.conf settings:**
   ```bash
   cat /etc/postgresql/*/main/pg_hba.conf | grep loft
   ```

### File Upload Issues

1. **Check directory permissions:**
   ```bash
   ls -la /var/www/vhosts/yourdomain.com/httpdocs/public/uploads
   ```

2. **Fix permissions if needed:**
   ```bash
   chmod -R 755 uploads
   chown -R your-plesk-user:psacln uploads
   ```

### 502 Bad Gateway

- **Cause:** Node.js app not running or wrong port
- **Fix:** 
  ```bash
  pm2 restart loft
  pm2 logs loft
  ```

### Memory Issues

1. **Check memory usage:**
   ```bash
   free -h
   pm2 monit
   ```

2. **Increase PM2 memory limit:**
   ```javascript
   // In ecosystem.config.js
   max_memory_restart: '2G'
   ```

---

## 💰 Cost Estimate

**Plesk Server Options:**

| Provider | Plan | Cost | RAM | Suitable? |
|----------|------|------|-----|-----------|
| **Hostinger** | VPS Plan 2 | $8/mo | 2GB | ⚠️ Tight |
| **Contabo** | VPS S | $5/mo | 4GB | ✅ Yes |
| **DigitalOcean** | Droplet + Plesk | $18/mo | 2GB | ✅ Yes |
| **Vultr** | Cloud + Plesk | $12/mo | 2GB | ✅ Yes |

**Additional Services:**

- **Storage (if using Spaces):** $5/month
- **Managed PostgreSQL (optional):** $15/month
- **Total:** $13-38/month depending on setup

---

## 🎯 Recommended Setup

**For Plesk deployment:**

1. ✅ **Server:** VPS with 2GB+ RAM ($8-18/month)
2. ✅ **Database:** Self-hosted PostgreSQL (free)
3. ✅ **Storage:** Local storage (free) or Spaces ($5/month)
4. ✅ **Total:** $8-23/month

**Pros:**
- Full control
- Cost-effective
- Good performance
- Plesk's UI makes management easier

**Cons:**
- Requires some technical knowledge
- You manage server updates
- Need to monitor resources

---

## 📚 Additional Resources

- **Plesk Node.js Documentation:** https://docs.plesk.com/en-US/obsidian/administrator-guide/website-management/nodejs-support.78675/
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Prisma Deploy:** https://www.prisma.io/docs/guides/deployment
- **Next.js Deployment:** https://nextjs.org/docs/deployment

---

## ✅ Success!

Once completed, your application will be live at:
- **Main:** https://yourdomain.com
- **API:** https://yourdomain.com/api
- **Admin:** https://yourdomain.com/admin

Monitor your application:
- **PM2:** `pm2 monit`
- **Logs:** `pm2 logs loft`
- **Plesk:** Server health monitoring in dashboard
