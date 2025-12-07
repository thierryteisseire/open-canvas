#!/bin/bash

# Quick Docker rebuild script after fixing dependencies

set -e

echo "🔧 Fixing Docker build issues..."
echo ""

# Stop any running containers
echo "📦 Stopping existing containers..."
docker-compose down

# Clear Docker build cache for a clean build
echo "🧹 Clearing Docker cache..."
docker builder prune -f

# Rebuild with no cache to ensure fresh build
echo "🏗️  Rebuilding Docker images (this may take a few minutes)..."
docker-compose build --no-cache

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo ""
echo "📊 Service status:"
docker-compose ps

echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🌐 Access points:"
echo "   Web: http://localhost:3000"
echo "   API: http://localhost:54367"
