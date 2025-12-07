# Ubuntu Quick Start - Gutenberg AI

## On Your Ubuntu Server

### 1. Pull Latest Code

```bash
cd ~/gutenberg
git pull origin gutenbergai
```

### 2. Fix DNS Issue (Run Once)

```bash
sudo ./fix-ubuntu-dns.sh
```

### 3. Create Environment File

```bash
cp .env.example .env
nano .env
```

Add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-key-here
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### 4. Deploy

**Easy Way (Interactive):**
```bash
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

**Manual Way:**
```bash
docker compose -f docker-compose.ubuntu.yml up --build -d
```

### 5. Check Status

```bash
docker compose ps
docker compose logs -f
```

### 6. Access Application

Open in browser: `http://YOUR_SERVER_IP:3000`

Login with:
- Email: contact@epsimoai.com
- Password: EpsimoAI184

## Common Commands

```bash
# View logs
docker compose -f docker-compose.ubuntu.yml logs -f

# Stop services
docker compose -f docker-compose.ubuntu.yml down

# Restart services
docker compose -f docker-compose.ubuntu.yml restart

# Update and rebuild
git pull origin gutenbergai
docker compose -f docker-compose.ubuntu.yml up --build -d
```

## If You See DNS Errors

```bash
sudo ./fix-ubuntu-dns.sh
docker compose -f docker-compose.ubuntu.yml up --build
```

## Need Help?

See `UBUNTU_DEPLOYMENT.md` for complete guide.
