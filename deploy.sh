#!/bin/bash
# Flowify Automated Deployment Script for Alma Linux
# Usage: sudo bash deploy.sh

echo "========================================="
echo "🚀 Starting Flowify Deployment..."
echo "========================================="

# 1. Update Project Directory
cd "$(dirname "$0")" || exit
echo "📁 Working directory: $(pwd)"
git pull origin main

# 2. Dependency & Build
echo "📦 Installing Node Dependencies..."
npm install

echo "🛠 Building Vite Frontend for Production..."
npm run build

# 3. Dynamic Port Allocation
echo "🔍 Checking for available ports to avoid collision..."
PORT=3000
while ss -ltn | grep -q ":$PORT "; do
  echo "⚠️ Port $PORT is already in use by another app."
  PORT=$((PORT+1))
done
echo "✅ Selected Port: $PORT"

# 4. Environment Variables
echo "🔐 Setting up .env file..."
cat > .env <<EOF
PORT=$PORT
JWT_SECRET=super_secret_flowify_production_key_$(date +%s)
JWT_EXPIRES_IN=7d
DB_PATH=./data/flowify.db
EOF

# 5. PM2 Process Management
echo "⚙️ Registering with PM2..."
# Install PM2 globally if not exist
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

pm2 stop flowify 2>/dev/null || true
pm2 delete flowify 2>/dev/null || true
pm2 start server/index.js --name "flowify"
pm2 save

# 6. Nginx Reverse Proxy Setup
echo "🌐 Configuring Nginx Reverse Proxy..."
DOMAIN="flowify.mibot.my.id"
NGINX_CONF="/etc/nginx/conf.d/flowify.conf"

cat > /tmp/flowify-nginx.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo mv /tmp/flowify-nginx.conf $NGINX_CONF

# 7. Restart Nginx safely
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "========================================="
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "App is mapped to $DOMAIN routing to internal port $PORT."
echo "Wait a few seconds for DNS/Cache, then visit http://$DOMAIN"
echo "========================================="
