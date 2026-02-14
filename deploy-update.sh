#!/bin/bash

# SweetBite Bakery - Update Script
# Usage: Run this script on the VPS to update the application

set -e # Exit on error

echo "=========================================="
echo "SweetBite Bakery - Update Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

# Directory check
PROJECT_DIR="/var/www/sweetbite-bakery"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "Error: Project directory $PROJECT_DIR not found!"
    echo "Please run the initial deployment script first."
    exit 1
fi

cd "$PROJECT_DIR"

# 1. Pull latest code
echo -e "${GREEN}Pulling latest changes from GitHub...${NC}"
git pull

# 2. Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

# 3. Build frontend
echo -e "${GREEN}Building frontend...${NC}"
npm run build

# 4. Database migrations
echo -e "${GREEN}Running database migrations...${NC}"
npm run db:push

# 5. Restart application
echo -e "${GREEN}Restarting application...${NC}"
pm2 restart sweetbite-bakery

echo ""
echo -e "${GREEN}Update Complete! Application is running.${NC}"
echo "Check status with: pm2 status"
