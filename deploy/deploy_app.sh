#!/bin/bash
set -e

# Configuration
APP_DIR="/var/www/sweetbite-bakery"
REPO_URL="https://github.com/kalayanroy/SweetBiteBakery.git"

echo "🚀 Starting Deployment..."

# 1. Ensure Directory Exists
if [ ! -d "$APP_DIR" ]; then
    echo "📂 Creating application directory..."
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
fi

# 2. Pull Code
echo "⬇️  Pulling latest code from GitHub..."
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    git pull origin main
else
    # Clone if empty
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# 3. Install Dependencies
echo "📦 Installing dependencies..."
npm install

# 4. Build
echo "🏗️  Building application..."
npm run build

# 5. Database Migrations
echo "🗄️  Running database migrations..."
# Ensure .env exists!
if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: .env file missing! Please create it."
    exit 1
fi
npm run db:push

# 6. Restart PM2
echo "🔄 Restarting application..."
pm2 restart sweetbite-bakery || pm2 start ecosystem.config.cjs

echo "✅ Deployment Complete!"
