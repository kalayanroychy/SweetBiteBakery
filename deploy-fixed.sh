#!/bin/bash

# SweetBite Bakery - Fixed VPS Deployment Script
# For Hostinger KVM 2 (Malaysia) - Ubuntu/Debian

set -e  # Exit on any error

echo "=========================================="
echo "SweetBite Bakery - Fixed Deployment"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Update System
echo -e "${GREEN}[1/12] Updating system...${NC}"
apt update && apt upgrade -y

# Step 2: Install Node.js 20
echo -e "${GREEN}[2/12] Installing Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "Node: $(node --version), npm: $(npm --version)"

# Step 3: Install PostgreSQL
echo -e "${GREEN}[3/12] Installing PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi

# Step 4: Install Nginx
echo -e "${GREEN}[4/12] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi

# Step 5: Install PM2 and tsx
echo -e "${GREEN}[5/12] Installing PM2 and tsx...${NC}"
npm install -g pm2 tsx

# Step 6: Setup Firewall
echo -e "${GREEN}[6/12] Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable || true

# Step 7: Setup Database
echo -e "${GREEN}[7/12] Setting up PostgreSQL database...${NC}"
sudo -u postgres psql <<EOF || echo "Database might already exist"
DROP DATABASE IF EXISTS sweetbite_bakery;
DROP USER IF EXISTS sweetbite_user;
CREATE DATABASE sweetbite_bakery;
CREATE USER sweetbite_user WITH PASSWORD 'SweetBite2026!Secure';
GRANT ALL PRIVILEGES ON DATABASE sweetbite_bakery TO sweetbite_user;
ALTER DATABASE sweetbite_bakery OWNER TO sweetbite_user;
EOF

# Grant schema permissions
sudo -u postgres psql -d sweetbite_bakery <<EOF
GRANT ALL ON SCHEMA public TO sweetbite_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sweetbite_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sweetbite_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sweetbite_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sweetbite_user;
EOF

echo "Database setup complete"

# Step 8: Clone/Update Repository
echo -e "${GREEN}[8/12] Cloning/updating repository...${NC}"
cd /var/www
if [ -d "sweetbite-bakery" ]; then
    echo "Updating existing repository..."
    cd sweetbite-bakery
    git fetch --all
    git reset --hard origin/main
    git pull origin main
else
    git clone https://github.com/kalayanroy/SweetBiteBakery.git sweetbite-bakery
    cd sweetbite-bakery
fi

# Step 9: Create .env file
echo -e "${GREEN}[9/12] Creating environment file...${NC}"
cat > .env <<EOF
DATABASE_URL=postgresql://sweetbite_user:SweetBite2026!Secure@localhost:5432/sweetbite_bakery
NODE_ENV=production
PORT=5000
PATHAO_CLIENT_ID=your_pathao_client_id
PATHAO_CLIENT_SECRET=your_pathao_client_secret
PATHAO_STORE_ID=your_store_id
PATHAO_BASE_URL=https://api-hermes.pathao.com
SESSION_SECRET=$(openssl rand -base64 32)
VITE_API_URL=http://72.62.249.216
EOF

# Step 10: Install dependencies and build
echo -e "${GREEN}[10/12] Installing dependencies and building...${NC}"
npm install
echo "Building application..."
npm run build

# Run database migrations
echo "Running database migrations..."
npm run db:push || echo "Migration completed with warnings"

# Step 11: Setup PM2
echo -e "${GREEN}[11/12] Setting up PM2...${NC}"

# Stop any existing PM2 processes
pm2 delete sweetbite-bakery 2>/dev/null || true

# Create PM2 config
cat > ecosystem.config.cjs <<'EOF'
module.exports = {
  apps: [{
    name: 'sweetbite-bakery',
    script: 'tsx',
    args: 'server/index.ts',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    exp_backoff_restart_delay: 100
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
echo "Starting application..."
pm2 start ecosystem.config.cjs
pm2 save

# Setup PM2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
pm2 save

# Step 12: Configure Nginx
echo -e "${GREEN}[12/12] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/sweetbite-bakery <<'EOF'
server {
    listen 80;
    server_name 72.62.249.216;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    client_max_body_size 10M;

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

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/sweetbite-bakery /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Set timezone
timedatectl set-timezone Asia/Kuala_Lumpur

# Final status check
echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Checking application status..."
sleep 3
pm2 status

echo ""
echo -e "${YELLOW}Application URL: http://72.62.249.216${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status                    - Check status"
echo "  pm2 logs sweetbite-bakery     - View logs"
echo "  pm2 restart sweetbite-bakery  - Restart app"
echo ""
echo -e "${RED}IMPORTANT:${NC}"
echo "1. Update Pathao credentials in /var/www/sweetbite-bakery/.env"
echo "2. Test the website at http://72.62.249.216"
echo "3. Change database password for production"
echo ""
