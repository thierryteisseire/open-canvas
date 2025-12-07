#!/bin/bash

# Gutenberg AI Docker Quick Start Script

set -e

echo "🚀 Starting Gutenberg AI with Docker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo ""
        echo "⚠️  IMPORTANT: Please edit .env and add your API keys before continuing!"
        echo "   At minimum, you need to set OPENAI_API_KEY or another LLM provider key."
        echo ""
        read -p "Press Enter after you've configured your .env file..."
    else
        echo "❌ No .env.example file found. Please create a .env file manually."
        exit 1
    fi
fi

# Check if at least one API key is set
if ! grep -q "OPENAI_API_KEY=sk-" .env && \
   ! grep -q "ANTHROPIC_API_KEY=sk-" .env && \
   ! grep -q "GOOGLE_API_KEY=" .env | grep -v "^#" | grep -v "=$"; then
    echo "⚠️  Warning: No LLM API keys detected in .env file."
    echo "   The application requires at least one of:"
    echo "   - OPENAI_API_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo "   - GOOGLE_API_KEY"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Building Docker images..."
docker-compose build

echo ""
echo "🎬 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Wait for agents service
echo "   Checking agents service..."
for i in {1..30}; do
    if docker-compose ps agents | grep -q "healthy"; then
        echo "   ✅ Agents service is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ⚠️  Agents service health check timeout"
        echo "   Check logs with: docker-compose logs agents"
    fi
    sleep 2
done

# Wait for web service
echo "   Checking web service..."
for i in {1..30}; do
    if docker-compose ps web | grep -q "healthy"; then
        echo "   ✅ Web service is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ⚠️  Web service health check timeout"
        echo "   Check logs with: docker-compose logs web"
    fi
    sleep 2
done

echo ""
echo "✨ Gutenberg AI is running!"
echo ""
echo "📍 Access points:"
echo "   Web Interface: http://localhost:3000"
echo "   LangGraph API: http://localhost:54367"
echo ""
echo "📊 Useful commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart:          docker-compose restart"
echo "   View status:      docker-compose ps"
echo ""
echo "📖 For more information, see DOCKER_DEPLOYMENT.md"
