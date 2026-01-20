---
description: Deploy SweetBite Bakery to Hostinger KVM 2 (Malaysia)
---

# Deploying SweetBite Bakery to Hostinger KVM 2 - Malaysia

This guide will help you deploy your full-stack bakery application to Hostinger KVM 2 VPS in Malaysia.

## Prerequisites Checklist

- [ ] Hostinger KVM 2 VPS account (Malaysia region)
- [ ] SSH access credentials from Hostinger
- [ ] Domain name (optional but recommended)
- [ ] All environment variables ready (Pathao API keys, database credentials, etc.)

## Part 1: Initial VPS Setup

### 1. Connect to Your VPS via SSH

```bash
ssh root@your-server-ip
```

### 2. Update System Packages

```bash
apt update && apt upgrade -y
```

### 3. Install Node.js (v20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version
```

### 4. Install PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 5. Install Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 6. Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### 7. Setup Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## Part 2: Database Configuration

### 8. Create PostgreSQL Database and User

```bash
sudo -u postgres psql
```

Then in PostgreSQL prompt:

```sql
CREATE DATABASE sweetbite_bakery;
CREATE USER sweetbite_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE sweetbite_bakery TO sweetbite_user;
\q
```

### 9. Configure PostgreSQL for Remote Access (if needed)

Edit PostgreSQL config:

```bash
nano /etc/postgresql/*/main/postgresql.conf
```

Find and change:
```
listen_addresses = 'localhost'
```

Edit pg_hba.conf:

```bash
nano /etc/postgresql/*/main/pg_hba.conf
```

Add:
```
local   all             sweetbite_user                          md5
```

Restart PostgreSQL:

```bash
systemctl restart postgresql
```

## Part 3: Project Deployment

### 10. Create Application Directory

```bash
mkdir -p /var/www/sweetbite-bakery
cd /var/www/sweetbite-bakery
```

### 11. Upload Project Files

**Option A: Using Git (Recommended)**

```bash
# Install git if not already installed
apt install -y git

# Clone your repository
git clone https://github.com/yourusername/SweetBiteBakery.git .
```

**Option B: Using SCP from your local machine**

From your Windows machine (PowerShell):

```powershell
scp -r "d:\Open AI Projects\SweetBakary\SweetBiteBakery\*" root@your-server-ip:/var/www/sweetbite-bakery/
```

**Option C: Using FileZilla or WinSCP**
- Connect to your VPS using SFTP
- Upload all project files to `/var/www/sweetbite-bakery/`

### 12. Create Environment File

```bash
cd /var/www/sweetbite-bakery
nano .env
```

Add your environment variables:

```env
# Database
DATABASE_URL=postgresql://sweetbite_user:your_secure_password_here@localhost:5432/sweetbite_bakery

# Server
NODE_ENV=production
PORT=5000

# Pathao API (Malaysia)
PATHAO_CLIENT_ID=your_pathao_client_id
PATHAO_CLIENT_SECRET=your_pathao_client_secret
PATHAO_STORE_ID=your_store_id
PATHAO_BASE_URL=https://api-hermes.pathao.com

# Session Secret
SESSION_SECRET=your_very_secure_random_string_here

# Other configurations
VITE_API_URL=https://yourdomain.com
```

Save and exit (Ctrl+X, Y, Enter)

### 13. Install Dependencies

```bash
npm install
```

### 14. Build the Frontend

```bash
npm run build
```

### 15. Run Database Migrations

```bash
npm run db:push
# or if you have migrations
npm run db:migrate
```

## Part 4: Configure PM2

### 16. Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

Add:

```javascript
module.exports = {
  apps: [{
    name: 'sweetbite-bakery',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 17. Create Logs Directory

```bash
mkdir -p logs
```

### 18. Start Application with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Copy and run the command that PM2 outputs.

### 19. Check Application Status

```bash
pm2 status
pm2 logs sweetbite-bakery
```

## Part 5: Configure Nginx

### 20. Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/sweetbite-bakery
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain or server IP

    # Gzip compression for Malaysia users
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Client body size (for image uploads)
    client_max_body_size 10M;

    # Serve static files
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 21. Enable Site and Test Nginx

```bash
ln -s /etc/nginx/sites-available/sweetbite-bakery /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Part 6: SSL Certificate (Optional but Recommended)

### 22. Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 23. Obtain SSL Certificate

```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts. Certbot will automatically configure HTTPS.

### 24. Test Auto-Renewal

```bash
certbot renew --dry-run
```

## Part 7: Malaysia-Specific Optimizations

### 25. Configure Timezone

```bash
timedatectl set-timezone Asia/Kuala_Lumpur
```

### 26. Install and Configure Fail2Ban (Security)

```bash
apt install -y fail2ban
systemctl start fail2ban
systemctl enable fail2ban
```

### 27. Setup Automated Backups

Create backup script:

```bash
nano /root/backup-sweetbite.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump sweetbite_bakery > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploaded files (if any)
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/sweetbite-bakery/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable:

```bash
chmod +x /root/backup-sweetbite.sh
```

Add to crontab (daily at 2 AM Malaysia time):

```bash
crontab -e
```

Add:

```
0 2 * * * /root/backup-sweetbite.sh >> /var/log/backup.log 2>&1
```

## Part 8: Monitoring and Maintenance

### 28. Monitor Application

```bash
# View logs
pm2 logs sweetbite-bakery

# Monitor resources
pm2 monit

# Check Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 29. Update Application

When you need to update:

```bash
cd /var/www/sweetbite-bakery
git pull  # if using git
npm install
npm run build
pm2 restart sweetbite-bakery
```

## Part 9: Testing

### 30. Test Your Deployment

- [ ] Visit http://your-server-ip or http://your-domain.com
- [ ] Test user registration and login
- [ ] Test product browsing
- [ ] Test cart functionality
- [ ] Test order placement
- [ ] Test Pathao delivery integration
- [ ] Test admin panel access
- [ ] Check mobile responsiveness

## Troubleshooting

### Application won't start

```bash
pm2 logs sweetbite-bakery --lines 100
```

### Database connection issues

```bash
sudo -u postgres psql -d sweetbite_bakery -U sweetbite_user
```

### Nginx issues

```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Check if port 5000 is listening

```bash
netstat -tulpn | grep 5000
```

## Performance Tips for Malaysia

1. **Enable Cloudflare** (free CDN) for faster content delivery across Malaysia
2. **Optimize images** before uploading to reduce bandwidth
3. **Use Redis** for session storage (optional, for better performance)
4. **Monitor with UptimeRobot** or similar service

## Security Checklist

- [ ] Changed default SSH port (optional)
- [ ] Disabled root SSH login (optional)
- [ ] Enabled UFW firewall
- [ ] Installed Fail2Ban
- [ ] SSL certificate installed
- [ ] Strong database passwords
- [ ] Regular backups configured
- [ ] Keep system updated (`apt update && apt upgrade`)

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check database connection: `psql -U sweetbite_user -d sweetbite_bakery`
4. Verify environment variables: `cat .env`

---

**Deployment Complete! 🎉**

Your SweetBite Bakery is now live in Malaysia on Hostinger KVM 2!
