# SweetBite Bakery - Deployment Guide

This folder contains scripts to help you deploy SweetBite Bakery to your Hostinger VPS (Ubuntu 20.04/22.04).

## Files
- `setup.sh`: Automates the installation of Node.js, Nginx, PostgreSQL, and PM2.
- `nginx.conf`: Nginx configuration template for your domain.

## Deployment Steps (Revised)

### 1. Upload Scripts to VPS
Since your code is on GitHub, you only need to upload these helper scripts.
Run from Windows PowerShell:

```powershell
scp -r deploy root@72.62.249.216:~/
```

### 2. Connect to VPS
```bash
ssh root@72.62.249.216
```

### 3. Run Setup (First Time Only)
Installs Node.js, Nginx, etc.
```bash
chmod +x ~/deploy/setup.sh
~/deploy/setup.sh
```

### 4. Configure Environment
```bash
cd /var/www/sweetbite-bakery  # Created by setup script
cp .env.example .env
nano .env
```
*Paste your production keys, DB credentials, etc.*

### 5. Deploy Application
Run this whenever you want to update the site (it pulls from Git):
```bash
chmod +x ~/deploy/deploy_app.sh
~/deploy/deploy_app.sh
```

### 6. Final Nginx Config
```bash
sudo cp ~/deploy/nginx.conf /etc/nginx/sites-available/sweetbite-bakery
sudo ln -s /etc/nginx/sites-available/sweetbite-bakery /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```


### 8. SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d probashibakery.com -d www.probashibakery.com
```

## Congratulations!
Your site should now be live at https://probashibakery.com
