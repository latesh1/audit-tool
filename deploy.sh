#!/usr/bin/env bash
set -e

echo "=========================================="
echo "🚀 SiteScope AI - Automated Deployment"
echo "=========================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURRENT_USER="$(whoami)"

echo "--> Target directory: $PROJECT_DIR"
echo "--> Current user: $CURRENT_USER"

# 1. Update system packages
echo "--> Updating APT package index..."
sudo apt-get update -y
sudo apt-get install -y curl git unzip nginx sqlite3 software-properties-common

# 2. Ensure PHP 8.2 or 8.3 is available
if ! apt-cache show php8.3-cli &> /dev/null; then
    echo "--> Adding Ondrej PHP PPA for PHP 8.3..."
    sudo add-apt-repository -y ppa:ondrej/php
    sudo apt-get update -y
fi

echo "--> Installing PHP 8.3 and required extensions..."
sudo apt-get install -y php8.3-cli php8.3-common php8.3-curl php8.3-mbstring php8.3-xml php8.3-sqlite3 php8.3-zip

# 3. Install Composer if not present
if ! command -v composer &> /dev/null; then
    echo "--> Installing Composer..."
    curl -sS https://getcomposer.org/installer | php
    sudo mv composer.phar /usr/local/bin/composer
    sudo chmod +x /usr/local/bin/composer
fi

# 4. Install Node.js 20 LTS & npm if not present
if ! command -v node &> /dev/null; then
    echo "--> Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 5. Backend Configuration
echo "--> Configuring Laravel Backend..."
cd "$PROJECT_DIR"

if [ ! -f ".env" ]; then
    echo "--> Creating .env from .env.example..."
    cp .env.example .env
fi

composer install --no-dev --optimize-autoloader

php artisan key:generate --force
touch database/database.sqlite
php artisan migrate --force --seed

# 6. File Permissions for SQLite & Laravel cache
echo "--> Configuring storage & database permissions..."
sudo chown -R "$CURRENT_USER":www-data storage bootstrap/cache database
sudo chmod -R 775 storage bootstrap/cache database

# 7. Frontend Build
echo "--> Building React Frontend..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build
cd "$PROJECT_DIR"

# 8. Configure Systemd Service for Laravel Backend API
echo "--> Creating systemd service for Laravel..."
sudo bash -c "cat > /etc/systemd/system/sitescope-backend.service <<EOF
[Unit]
Description=SiteScope AI Laravel Backend API
After=network.target

[Service]
User=$CURRENT_USER
Group=www-data
WorkingDirectory=$PROJECT_DIR
ExecStart=$(which php) artisan serve --host=127.0.0.1 --port=8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable sitescope-backend
sudo systemctl restart sitescope-backend

# 9. Configure Nginx Reverse Proxy & Static Host
echo "--> Setting up Nginx configuration..."
sudo bash -c "cat > /etc/nginx/sites-available/sitescope <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root PROJECT_DIR_PLACEHOLDER/frontend/dist;
    index index.html;

    # Frontend SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Laravel Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
    }

    # Laravel Up / Health check
    location /up {
        proxy_pass http://127.0.0.1:8000;
    }
}
EOF"

sudo sed -i "s|PROJECT_DIR_PLACEHOLDER|$PROJECT_DIR|g" /etc/nginx/sites-available/sitescope
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/sitescope /etc/nginx/sites-enabled/sitescope
sudo nginx -t
sudo systemctl restart nginx

# 10. Display Completion Info
PUBLIC_IP=$(curl -s -m 5 https://api.ipify.org || curl -s -m 5 https://ifconfig.me || echo "YOUR_SERVER_IP")
echo "=========================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "🌐 Web App URL: http://$PUBLIC_IP/"
echo "🩺 API Health Check: http://$PUBLIC_IP/api/health"
echo "=========================================="
