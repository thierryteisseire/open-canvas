# Ubuntu Server Deployment Guide

## Quick Start for Ubuntu

### 1. Fix DNS Issues (if you see DNS errors)

The error you're seeing is a DNS resolution problem. Fix it with:

```bash
sudo ./fix-ubuntu-dns.sh
```

Or manually:

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"]
}
EOF
sudo systemctl restart docker
```

### 2. Use Ubuntu-Specific Files

We've created Ubuntu-optimized Docker files that handle DNS issues better:

```bash
# Use the Ubuntu-specific docker-compose file
docker compose -f docker-compose.ubuntu.yml up --build
```

Or use the deployment script:

```bash
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

## Complete Ubuntu Setup from Scratch

### Step 1: Install Docker (if not installed)

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

### Step 2: Clone the Repository

```bash
cd ~
git clone -b gutenbergai https://github.com/thierryteisseire/open-canvas.git gutenberg
cd gutenberg
```

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit and add your API keys
nano .env
```

At minimum, add your OpenAI API key:
```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 4: Fix DNS (Important!)

```bash
sudo ./fix-ubuntu-dns.sh
```

### Step 5: Deploy

**Option A: Use the deployment script (recommended)**

```bash
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

**Option B: Manual deployment**

```bash
# Build and start in background
docker compose -f docker-compose.ubuntu.yml up --build -d

# View logs
docker compose -f docker-compose.ubuntu.yml logs -f
```

### Step 6: Verify

```bash
# Check services are running
docker compose ps

# Test endpoints
curl http://localhost:54367/ok
curl http://localhost:3000/api/health

# Access in browser
# http://your-server-ip:3000
```

## Troubleshooting

### DNS Errors During Build

**Error:**
```
WARNING: fetching https://dl-cdn.alpinelinux.org/alpine/v3.23/main/x86_64/APKINDEX.tar.gz: DNS: transient error
ERROR: unable to select packages
```

**Solution:**

1. Run the DNS fix script:
```bash
sudo ./fix-ubuntu-dns.sh
```

2. Or configure Docker DNS manually:
```bash
sudo mkdir -p /etc/docker
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"]
}
```

Then restart Docker:
```bash
sudo systemctl restart docker
```

3. Use Ubuntu-specific Dockerfiles:
```bash
docker compose -f docker-compose.ubuntu.yml up --build
```

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :54367

# Kill the process
sudo kill -9 <PID>

# Or change ports in docker-compose.ubuntu.yml
```

### Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
exit
# (log back in via SSH)

# Verify
docker ps
```

### Out of Disk Space

```bash
# Check disk space
df -h

# Clean up Docker
docker system prune -a
docker volume prune
```

### Build Fails with Network Timeout

If yarn install times out:

```bash
# The Ubuntu Dockerfiles already include --network-timeout 100000
# But you can also try building with more memory:
docker compose -f docker-compose.ubuntu.yml build --memory=4g
```

### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.ubuntu.yml logs

# Restart services
docker compose -f docker-compose.ubuntu.yml restart

# Full rebuild
docker compose -f docker-compose.ubuntu.yml down -v
docker compose -f docker-compose.ubuntu.yml up --build
```

## Production Deployment

### 1. Set Up Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if using reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Or allow direct access to app (not recommended for production)
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable
```

### 2. Set Up Reverse Proxy (Recommended)

Install nginx:

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Create nginx config:

```bash
sudo nano /etc/nginx/sites-available/gutenberg
```

Add:

```nginx
server {
    listen 80;
    server_name gutenberg.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/gutenberg /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Get SSL certificate:

```bash
sudo certbot --nginx -d gutenberg.yourdomain.com
```

### 3. Set Up Auto-Start

Create systemd service:

```bash
sudo nano /etc/systemd/system/gutenberg.service
```

Add:

```ini
[Unit]
Description=Gutenberg AI
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/YOUR_USER/gutenberg
ExecStart=/usr/bin/docker compose -f docker-compose.ubuntu.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.ubuntu.yml down
User=YOUR_USER

[Install]
WantedBy=multi-user.target
```

Enable service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable gutenberg
sudo systemctl start gutenberg
```

### 4. Set Up Monitoring

```bash
# Install monitoring tools
sudo apt-get install -y htop iotop nethogs

# Monitor Docker containers
docker stats

# Monitor logs
docker compose -f docker-compose.ubuntu.yml logs -f --tail=100
```

### 5. Set Up Backups

```bash
# Backup script
sudo nano /usr/local/bin/backup-gutenberg.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/backup/gutenberg"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Docker volume
docker run --rm -v gutenberg_langgraph-data:/data -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/langgraph-data-$DATE.tar.gz -C /data .

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t langgraph-data-*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: langgraph-data-$DATE.tar.gz"
```

Make executable and add to cron:

```bash
sudo chmod +x /usr/local/bin/backup-gutenberg.sh
sudo crontab -e
```

Add daily backup at 2 AM:

```
0 2 * * * /usr/local/bin/backup-gutenberg.sh
```

## Useful Commands

```bash
# Start services
docker compose -f docker-compose.ubuntu.yml up -d

# Stop services
docker compose -f docker-compose.ubuntu.yml down

# View logs
docker compose -f docker-compose.ubuntu.yml logs -f

# Restart specific service
docker compose -f docker-compose.ubuntu.yml restart agents
docker compose -f docker-compose.ubuntu.yml restart web

# Check status
docker compose -f docker-compose.ubuntu.yml ps

# Update to latest code
cd ~/gutenberg
git pull origin gutenbergai
docker compose -f docker-compose.ubuntu.yml up --build -d

# Clean rebuild
docker compose -f docker-compose.ubuntu.yml down -v
docker compose -f docker-compose.ubuntu.yml up --build -d

# View resource usage
docker stats gutenberg-agents gutenberg-web

# Access container shell
docker exec -it gutenberg-agents sh
docker exec -it gutenberg-web sh
```

## Files Overview

- `docker-compose.ubuntu.yml` - Ubuntu-optimized compose file with DNS fixes
- `Dockerfile.agents.ubuntu` - Ubuntu-optimized agents Dockerfile
- `Dockerfile.web.ubuntu` - Ubuntu-optimized web Dockerfile
- `deploy-ubuntu.sh` - Interactive deployment script
- `fix-ubuntu-dns.sh` - DNS fix script
- `.env` - Environment variables (create from .env.example)

## Support

If you encounter issues:

1. Check DNS is configured: `cat /etc/docker/daemon.json`
2. Check Docker is running: `sudo systemctl status docker`
3. Check logs: `docker compose -f docker-compose.ubuntu.yml logs`
4. Verify .env has API keys: `grep OPENAI_API_KEY .env`
5. Check disk space: `df -h`
6. Check ports: `sudo lsof -i :3000 && sudo lsof -i :54367`

## Security Checklist

- [ ] Firewall configured (ufw)
- [ ] Reverse proxy with SSL (nginx + certbot)
- [ ] Strong passwords in .env
- [ ] .env file permissions: `chmod 600 .env`
- [ ] Regular backups configured
- [ ] Docker daemon secured
- [ ] SSH key-based authentication
- [ ] Fail2ban installed
- [ ] Regular system updates: `sudo apt-get update && sudo apt-get upgrade`
