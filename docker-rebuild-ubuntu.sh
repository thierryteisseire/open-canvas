#!/bin/bash

# Gutenberg AI - Ubuntu Docker Rebuild Script
# This script rebuilds and restarts the Docker containers

set -e

echo "🔄 Rebuilding Gutenberg AI Docker containers..."
echo ""

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker compose -f docker-compose.ubuntu.yml down

# Remove old images to force rebuild
echo "🗑️  Removing old images..."
docker rmi gutenberg-web gutenberg-agents 2>/dev/null || true

# Rebuild and start
echo "🔨 Building new images..."
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
