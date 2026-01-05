#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🚀 APEX PLATFORM - Server Setup Script
# Server IP: 34.18.154.179
# Date: 2026-01-05
# ═══════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 APEX PLATFORM - Server Setup"
echo "═══════════════════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────────
# Step 1: Update System
# ─────────────────────────────────────────────────────────────────
echo ""
echo "📦 Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y

# ─────────────────────────────────────────────────────────────────
# Step 2: Install Docker
# ─────────────────────────────────────────────────────────────────
echo ""
echo "🐳 Step 2: Installing Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# ─────────────────────────────────────────────────────────────────
# Step 3: Install Docker Compose
# ─────────────────────────────────────────────────────────────────
echo ""
echo "🐳 Step 3: Installing Docker Compose..."
sudo apt install -y docker-compose-plugin

# ─────────────────────────────────────────────────────────────────
# Step 4: Install Node.js 20 LTS
# ─────────────────────────────────────────────────────────────────
echo ""
echo "📗 Step 4: Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ─────────────────────────────────────────────────────────────────
# Step 5: Install pnpm
# ─────────────────────────────────────────────────────────────────
echo ""
echo "📦 Step 5: Installing pnpm..."
sudo npm install -g pnpm

# ─────────────────────────────────────────────────────────────────
# Step 6: Install Git
# ─────────────────────────────────────────────────────────────────
echo ""
echo "📂 Step 6: Installing Git..."
sudo apt install -y git

# ─────────────────────────────────────────────────────────────────
# Step 7: Create project directory
# ─────────────────────────────────────────────────────────────────
echo ""
echo "📁 Step 7: Creating project directory..."
mkdir -p ~/apex
cd ~/apex

# ─────────────────────────────────────────────────────────────────
# Step 8: Clone the repository
# ─────────────────────────────────────────────────────────────────
echo ""
echo "📥 Step 8: Cloning Apex Platform repository..."
git clone https://github.com/adelfree2023-dev/Apex-Platform.git .

# ─────────────────────────────────────────────────────────────────
# Step 9: Setup environment files
# ─────────────────────────────────────────────────────────────────
echo ""
echo "⚙️ Step 9: Setting up environment files..."

# Root .env
cp .env.example .env

# Engine .env
cp apps/engine/.env.example apps/engine/.env
sed -i 's/DB_HOST=localhost/DB_HOST=vendure-db/' apps/engine/.env

# Manager .env  
cp apps/manager/.env.example apps/manager/.env
sed -i 's/localhost:5432/saas-db:5432/' apps/manager/.env
sed -i 's/localhost:3001/engine:3001/' apps/manager/.env

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANT: Log out and log back in for Docker permissions!"
echo ""
echo "Then run these commands:"
echo ""
echo "  cd ~/apex"
echo "  docker compose -f docker-compose.dev.yml up -d"
echo "  pnpm install"
echo "  cd apps/manager && npx prisma migrate dev && npx prisma generate"
echo "  cd ../engine && pnpm run dev"
echo ""
echo "═══════════════════════════════════════════════════════════════"
