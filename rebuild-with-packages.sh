#!/bin/bash

# Gutenberg AI - Full Rebuild with Packages
# This script rebuilds packages and Docker containers

set -e

echo "🔄 Full rebuild with package updates..."
echo ""

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker compose -f docker-compose.ubuntu.yml down

# Remove old images to force rebuild
echo "🗑️  Removing old images..."
docker rmi gutenberg-web gutenberg-agents 2>/dev/null || true

# Build packages first (this is important!)
echo "📦 Building shared packages..."
docker compose -f docker-compose.ubuntu.yml build --no-cache

echo "🚀 Starting containers..."
docker compose -f docker-compose.ubuntu.yml up -d

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "📊 Container status:"
docker compose -f docker-compose.ubuntu.yml ps

echo ""
echo "📝 To view logs:"
echo "   docker compose -f docker-compose.ubuntu.yml logs -f"
echo ""
echo "🌐 Access the app at: http://localhost:3001"
echo "   Or through Cloudflare: https://canvas.gutenbergai.app"
echo ""
echo "⚠️  Note: Clear your browser cache to see the new Scaleway model!"
