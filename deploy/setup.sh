#!/bin/bash

# SweetBite Bakery - Server Setup Script
# Works on Ubuntu 20.04/22.04 LTS

set -e

echo "🚀 Starting Server Setup for SweetBite Bakery..."

# 1. Update System
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 LTS
echo "🟢 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

# 3. Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 4. Install PostgreSQL
echo "🐘 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 5. Install PM2
echo "⚙️ Installing PM2..."
sudo npm install -g pm2

# 6. Configure Firewall (UFW)
echo "🛡️ Configuring Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
# Enable UFW non-interactively if possible, otherwise user must do it manually to avoid lockout
echo "⚠️  NOTE: Please run 'sudo ufw enable' manually if not already enabled. careful not to lock yourself out of SSH."

# 7. Create App Directory
echo "📂 Creating application directory at /var/www/sweetbite-bakery..."
sudo mkdir -p /var/www/sweetbite-bakery
sudo chown -R $USER:$USER /var/www/sweetbite-bakery

echo "✅ Server Setup Complete!"
echo "Next steps:"
echo "1. Configure PostgreSQL user and database."
echo "2. Upload your project files to /var/www/sweetbite-bakery"
echo "3. Configure .env file"
echo "4. Build and start with PM2"
