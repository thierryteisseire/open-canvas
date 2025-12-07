#!/bin/bash

# Fix DNS issues for Docker on Ubuntu
# This script configures Docker to use Google DNS servers

echo "=========================================="
echo "Fixing Docker DNS on Ubuntu"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Create Docker daemon config directory if it doesn't exist
mkdir -p /etc/docker

# Backup existing config if it exists
if [ -f /etc/docker/daemon.json ]; then
    echo "Backing up existing daemon.json..."
    cp /etc/docker/daemon.json /etc/docker/daemon.json.backup.$(date +%Y%m%d_%H%M%S)
fi

# Create or update daemon.json with DNS settings
echo "Configuring Docker DNS..."
cat > /etc/docker/daemon.json <<EOF
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

echo "✓ DNS configuration updated"
echo ""

# Restart Docker service
echo "Restarting Docker service..."
systemctl restart docker

if [ $? -eq 0 ]; then
    echo "✓ Docker restarted successfully"
    echo ""
    echo "DNS servers configured:"
    echo "  - 8.8.8.8 (Google)"
    echo "  - 8.8.4.4 (Google)"
    echo "  - 1.1.1.1 (Cloudflare)"
    echo ""
    echo "You can now run: docker compose up --build"
else
    echo "✗ Failed to restart Docker"
    echo "Try manually: sudo systemctl restart docker"
    exit 1
fi
