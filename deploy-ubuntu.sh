#!/bin/bash

# Gutenberg AI - Ubuntu Server Deployment Script
# This script automates the deployment process on Ubuntu servers

set -e  # Exit on error

echo "=========================================="
echo "Gutenberg AI - Ubuntu Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}ℹ $1${NC}"
}

# Check if running on Ubuntu
if [ ! -f /etc/os-release ]; then
    print_error "Cannot detect OS. This script is designed for Ubuntu."
    exit 1
fi

. /etc/os-release
if [ "$ID" != "ubuntu" ]; then
    print_warning "This script is optimized for Ubuntu but detected: $ID"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_success "Running on Ubuntu $VERSION_ID"
echo ""

# Check if Docker is installed
print_info "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    echo ""
    echo "Install Docker with:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    echo "  sudo usermod -aG docker \$USER"
    echo ""
    exit 1
fi
print_success "Docker is installed: $(docker --version)"

# Check if Docker Compose is available
print_info "Checking Docker Compose..."
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available!"
    echo ""
    echo "Docker Compose should be included with Docker."
    echo "Try: sudo apt-get update && sudo apt-get install docker-compose-plugin"
    echo ""
    exit 1
fi
print_success "Docker Compose is available: $(docker compose version)"
echo ""

# Check if .env file exists
print_info "Checking environment configuration..."
if [ ! -f .env ]; then
    print_warning ".env file not found!"
    echo ""
    echo "Creating .env from .env.example..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env file"
        echo ""
        print_warning "IMPORTANT: Edit .env and add your API keys!"
        echo ""
        echo "At minimum, you need to set:"
        echo "  OPENAI_API_KEY=your_key_here"
        echo ""
        read -p "Press Enter to edit .env now, or Ctrl+C to exit and edit manually..."
        ${EDITOR:-nano} .env
    else
        print_error ".env.example not found!"
        exit 1
    fi
else
    print_success ".env file exists"
    
    # Check if OPENAI_API_KEY is set
    if ! grep -q "OPENAI_API_KEY=.\+" .env; then
        print_warning "OPENAI_API_KEY appears to be empty in .env"
        echo ""
        read -p "Edit .env now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    fi
fi
echo ""

# Check if docker-compose.yml exists
print_info "Checking Docker Compose configuration..."
if [ ! -f docker-compose.yml ] && [ ! -f docker-compose.ubuntu.yml ]; then
    print_error "No docker-compose.yml or docker-compose.ubuntu.yml found!"
    echo ""
    echo "Make sure you're in the correct directory."
    echo "Expected files: docker-compose.yml, Dockerfile.agents, Dockerfile.web"
    echo ""
    exit 1
fi

# Determine which compose file to use
COMPOSE_FILE="docker-compose.yml"
if [ -f docker-compose.ubuntu.yml ]; then
    print_info "Found Ubuntu-specific compose file"
    read -p "Use docker-compose.ubuntu.yml instead of docker-compose.yml? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        COMPOSE_FILE="docker-compose.ubuntu.yml"
    fi
fi
print_success "Using $COMPOSE_FILE"
echo ""

# Check available disk space
print_info "Checking disk space..."
AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 10 ]; then
    print_warning "Low disk space: ${AVAILABLE_SPACE}GB available"
    print_warning "Docker images require ~5-10GB. Consider freeing up space."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_success "Sufficient disk space: ${AVAILABLE_SPACE}GB available"
fi
echo ""

# Ask user what to do
echo "=========================================="
echo "Deployment Options:"
echo "=========================================="
echo "1) Build and start services (foreground)"
echo "2) Build and start services (background/detached)"
echo "3) Stop services"
echo "4) View logs"
echo "5) Restart services"
echo "6) Clean rebuild (removes volumes)"
echo "7) Exit"
echo ""
read -p "Select option (1-7): " -n 1 -r
echo
echo ""

case $REPLY in
    1)
        print_info "Building and starting services in foreground..."
        print_warning "Press Ctrl+C to stop"
        echo ""
        docker compose -f "$COMPOSE_FILE" up --build
        ;;
    2)
        print_info "Building and starting services in background..."
        docker compose -f "$COMPOSE_FILE" up --build -d
        echo ""
        print_success "Services started!"
        echo ""
        print_info "Check status with: docker compose ps"
        print_info "View logs with: docker compose logs -f"
        echo ""
        print_info "Access the application at:"
        echo "  http://localhost:3000"
        echo "  http://$(hostname -I | awk '{print $1}'):3000"
        ;;
    3)
        print_info "Stopping services..."
        docker compose -f "$COMPOSE_FILE" down
        print_success "Services stopped"
        ;;
    4)
        print_info "Viewing logs (Ctrl+C to exit)..."
        docker compose -f "$COMPOSE_FILE" logs -f
        ;;
    5)
        print_info "Restarting services..."
        docker compose -f "$COMPOSE_FILE" restart
        print_success "Services restarted"
        ;;
    6)
        print_warning "This will remove all data including conversation history!"
        read -p "Are you sure? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Stopping and removing everything..."
            docker compose -f "$COMPOSE_FILE" down -v
            print_info "Rebuilding..."
            docker compose -f "$COMPOSE_FILE" up --build -d
            print_success "Clean rebuild complete!"
        else
            print_info "Cancelled"
        fi
        ;;
    7)
        print_info "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

echo ""
print_success "Done!"
