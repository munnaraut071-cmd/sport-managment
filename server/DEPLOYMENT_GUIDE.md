# 🚀 Deployment & Production Guide

## Prerequisites for Production

- Node.js 14+ installed
- MongoDB Atlas account (or self-hosted MongoDB)
- Hosting platform account (Heroku, AWS, DigitalOcean, etc.)
- SSL certificate
- Domain name
- Email service (optional but recommended)

---

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Update `package.json` version number
- [ ] Remove all test/debug code
- [ ] Run full test suite
- [ ] Update environment variables
- [ ] Enable error logging
- [ ] Set up monitoring
- [ ] Create database backups
- [ ] Document all API endpoints
- [ ] Create user documentation
- [ ] Set up status page

### Environment Configuration

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET` (use cryptography)
- [ ] Configure `MONGODB_URI` for production database
- [ ] Set `CORS_ORIGIN` to your domain
- [ ] Configure email service credentials
- [ ] Enable rate limiting
- [ ] Set up HTTPS/SSL
- [ ] Configure firewall rules

### Security Hardening

- [ ] Enable helmet.js (security headers)
- [ ] Set up rate limiting (100 requests/min)
- [ ] Enable CORS with restricted origins
- [ ] Use environment variables for secrets
- [ ] Enable request validation
- [ ] Set up API key authentication for external services
- [ ] Enable audit logging
- [ ] Regular security updates

---

## 🌍 Deployment Options

### Option 1: Heroku (Easiest)

#### 1.1 Install Heroku CLI
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
heroku --version
```

#### 1.2 Login to Heroku
```bash
heroku login
```

#### 1.3 Create Heroku App
```bash
heroku create sports-kits-backend
```

#### 1.4 Add MongoDB Atlas
```bash
# Get connection string from MongoDB Atlas
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

#### 1.5 Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secure-random-key
heroku config:set CORS_ORIGIN=https://yourdomain.com
```

#### 1.6 Deploy
```bash
# Using Git
git push heroku main

# Or Container Registry
heroku container:push web
heroku container:release web
```

#### 1.7 View Logs
```bash
heroku logs --tail
```

---

### Option 2: AWS EC2 (More Control)

#### 2.1 Launch EC2 Instance
- AMI: Ubuntu 20.04 LTS
- Instance Type: t3.medium or larger
- Storage: 30GB+ EBS
- Security Group: Allow ports 22, 80, 443

#### 2.2 Connect to Instance
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 2.3 Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB (or use MongoDB Atlas)
sudo apt install -y mongodb

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 2.4 Clone Repository
```bash
git clone https://github.com/yourusername/sports-kit-backend.git
cd sports-kit-backend
npm install
```

#### 2.5 Configure Environment
```bash
# Copy and edit .env
cp .env.example .env
nano .env
```

#### 2.6 Setup Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/sports-kits

upstream app {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 2.7 Enable Nginx
```bash
sudo ln -s /etc/nginx/sites-available/sports-kits /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 2.8 Setup SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### 2.9 Start Application with PM2
```bash
pm2 start server.js --name "sports-kits-backend"
pm2 save
pm2 startup
```

#### 2.10 Monitor with PM2
```bash
pm2 monit
pm2 logs
```

---

### Option 3: DigitalOcean App Platform

#### 3.1 Prepare Code
```bash
# Ensure Procfile exists
echo "web: node server.js" > Procfile

# Commit to Git
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 3.2 Create App via Console
1. Go to DigitalOcean Dashboard → Apps
2. Click "Create App"
3. Connect GitHub repository
4. Select `sports-kit-backend` repository
5. Configure build settings

#### 3.3 Set Environment Variables
1. Go to Settings → Environment
2. Add each variable:
   - MONGODB_URI
   - NODE_ENV (production)
   - JWT_SECRET
   - CORS_ORIGIN

#### 3.4 Deploy
1. Click "Create Resources"
2. Click "Deploy"
3. Wait for deployment to complete

---

## 🔄 Continuous Integration/Deployment (CI/CD)

### GitHub Actions Setup

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to Heroku
      env:
        HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
        HEROKU_APP_NAME: sports-kits-backend
      run: |
        git remote add heroku https://git.heroku.com/$HEROKU_APP_NAME.git
        git push heroku main
```

---

## 📊 Monitoring & Maintenance

### Application Monitoring

```bash
# PM2 Monitoring
pm2 monit

# View logs
pm2 logs backend

# Restart on error
pm2 restart backend
```

### Database Monitoring

```bash
# MongoDB Atlas Dashboard
# - Check connections
# - Monitor disk usage
# - Review query performance

# Backup Database
mongodump --uri="mongodb+srv://..." --archive=backup.archive
```

### Server Monitoring

```bash
# CPU & Memory
htop

# Disk Space
df -h

# Network
netstat -tulpn
```

---

## 🔒 Security Hardening

### 1. Install Security Middleware
```javascript
// server.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### 2. Set Security Headers
```bash
# Nginx configuration
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### 3. Database Security
```bash
# Create database user
use admin
db.createUser({
  user: "sports_app",
  pwd: "strong_password",
  roles: ["readWrite"]
})
```

### 4. API Key Authentication
```javascript
// Generate secure API key
const crypto = require('crypto');
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('API Key:', apiKey);
```

---

## 🆘 Troubleshooting

### Connection Issues

```bash
# Test MongoDB connection
mongo "mongodb+srv://user:pass@cluster.mongodb.net"

# Check if port is open
netstat -tulpn | grep 5000

# Test with curl
curl http://localhost:5000/api/health
```

### Performance Issues

```bash
# Check memory usage
free -h

# Check CPU load
top

# Optimize Node process
NODE_OPTIONS="--max-old-space-size=2048" npm start
```

### Deployment Issues

```bash
# Check Heroku logs
heroku logs --tail

# Check PM2 logs
pm2 logs backend

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📈 Scaling Strategy

### Horizontal Scaling (Multiple Servers)

1. **Load Balancer Setup**
   - Use Nginx or AWS ELB
   - Distribute traffic across servers
   - Session replication via Redis

2. **Database Scaling**
   - Use MongoDB sharding
   - Enable read replicas
   - Set up proper indexes

3. **Caching Layer**
   ```bash
   # Install Redis
   npm install redis
   
   # Cache frequently accessed data
   const redis = require('redis');
   const client = redis.createClient();
   ```

### Vertical Scaling (Bigger Server)

1. **Increase Resources**
   - More CPU cores
   - More RAM
   - Faster disk

2. **Optimize Code**
   - Use clustering
   - Implement caching
   - Optimize queries

---

## 📊 Dashboard Setup

### Heroku Dashboard
```
https://dashboard.heroku.com/apps/sports-kits-backend
```

### MongoDB Atlas Dashboard
```
https://cloud.mongodb.com/v2
```

### Application Monitoring
```bash
# Install New Relic (optional)
npm install newrelic

# Add to top of server.js
require('newrelic');
```

---

## 🔄 Update Strategy

### Rolling Updates (Zero Downtime)

```bash
# 1. Deploy new version
git push origin main

# 2. With CI/CD it auto-deploys to staging
# 3. Run tests
# 4. Swap to production

# Or manual:
pm2 restart backend --update-env
pm2 save
```

### Rollback Strategy

```bash
# If update fails, rollback
git revert HEAD
git push origin main

# Or with docker
docker run -d sports-kits:previous-tag
```

---

## 📝 Deployment Commands

```bash
# Deploy to Heroku
heroku deploy

# Deploy to AWS
aws eb deploy

# Deploy to DigitalOcean
doctl apps create-deployment APP_ID

# Manual PM2 restart
pm2 restart backend

# View deployed version
curl https://yourdomain.com/api/health
```

---

## ✅ Post-Deployment Verification

```bash
# 1. Check API is running
curl https://yourdomain.com/api/health

# 2. Test authentication
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# 3. Check database connection
curl https://yourdomain.com/api/items

# 4. Verify SSL certificate
curl -v https://yourdomain.com/api/health

# 5. Check response times
time curl https://yourdomain.com/api/items

# 6. Monitor logs
heroku logs --tail
```

---

## 💰 Cost Estimation

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Heroku | Standard-2x | $50 |
| AWS EC2 | t3.medium | $35 |
| MongoDB Atlas | M2 Shared | $0 (free) - $57 |
| DigitalOcean | App | $5-50 |
|Total (Basic)| - | ~$60-90 |

---

**Status**: Production Ready
**Last Updated**: March 2024
**Version**: 1.0.0
