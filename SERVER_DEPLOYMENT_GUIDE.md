# Server Deployment Guide for Gutenberg AI

## Issue: "no configuration file provided: not found"

This error means Docker Compose can't find the `docker-compose.yml` file.

## Solution Steps

### 1. Verify Files Exist

```bash
cd ~/gutenberg
ls -la docker-compose.yml Dockerfile.agents Dockerfile.web
```

If files are missing, the clone might have failed. Try:

```bash
cd ~
rm -rf gutenberg
git clone https://github.com/thierryteisseire/open-canvas.git gutenberg
cd gutenberg
git checkout gutenbergai
```

### 2. Create Environment File

The `.env` file is not tracked in git (for security). Create it on the server:

```bash
cd ~/gutenberg
nano .env
```

Add your environment variables:

```bash
# Required: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Other LLM providers
ANTHROPIC_API_KEY=
FIREWORKS_API_KEY=
GOOGLE_API_KEY=
GROQ_API_KEY=
FIRECRAWL_API_KEY=

# Optional: LangSmith (for tracing)
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=

# Optional: Azure OpenAI
_AZURE_OPENAI_API_KEY=
_AZURE_OPENAI_API_INSTANCE_NAME=
_AZURE_OPENAI_API_DEPLOYMENT_NAME=
_AZURE_OPENAI_API_VERSION=2024-08-01-preview
_AZURE_OPENAI_API_BASE_PATH=

# Optional: Ollama (local models)
OLLAMA_API_URL=http://host.docker.internal:11434

# Optional: Feature flags (defaults shown)
NEXT_PUBLIC_FIREWORKS_ENABLED=true
NEXT_PUBLIC_GEMINI_ENABLED=true
NEXT_PUBLIC_ANTHROPIC_ENABLED=true
NEXT_PUBLIC_OPENAI_ENABLED=true
NEXT_PUBLIC_AZURE_ENABLED=false
NEXT_PUBLIC_OLLAMA_ENABLED=false
NEXT_PUBLIC_GROQ_ENABLED=false

# Custom Auth API (default shown)
NEXT_PUBLIC_API_URL=https://epsimo-api.alphaforh.com
```

Save and exit (Ctrl+X, then Y, then Enter).

### 3. Build and Start Services

```bash
cd ~/gutenberg
docker compose up --build
```

Or run in detached mode:

```bash
docker compose up --build -d
```

### 4. Verify Services Are Running

```bash
docker compose ps
```

You should see:
```
NAME               STATUS
gutenberg-agents   Up (healthy)
gutenberg-web      Up (healthy)
```

### 5. Check Logs

```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f agents
docker compose logs -f web
```

### 6. Test the Application

```bash
# Test agents backend
curl http://localhost:54367/ok

# Test web frontend
curl http://localhost:3000/api/health
```

Open in browser: `http://your-server-ip:3000`

## Common Issues

### Port Already in Use

If ports 3000 or 54367 are already in use:

```bash
# Check what's using the ports
sudo lsof -i :3000
sudo lsof -i :54367

# Kill the process or change ports in docker-compose.yml
```

### Permission Denied

If you get permission errors:

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then try again
```

### Out of Disk Space

Docker images can be large. Check disk space:

```bash
df -h
docker system df
```

Clean up if needed:

```bash
docker system prune -a
```

## Production Deployment

For production, you should:

1. **Use a reverse proxy (nginx/Traefik)** for SSL/TLS
2. **Set up a domain name** and configure DNS
3. **Use Docker secrets** for API keys instead of .env file
4. **Enable monitoring** (Prometheus, Grafana)
5. **Set up automated backups** for the langgraph-data volume
6. **Configure resource limits** in docker-compose.yml

Example nginx configuration:

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
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Useful Commands

```bash
# Stop services
docker compose down

# Stop and remove volumes (clears all data)
docker compose down -v

# Restart a service
docker compose restart agents
docker compose restart web

# View resource usage
docker stats gutenberg-agents gutenberg-web

# Update to latest code
git pull origin gutenbergai
docker compose up --build -d
```

## Support

If you encounter issues:

1. Check logs: `docker compose logs -f`
2. Verify .env file has correct API keys
3. Ensure ports 3000 and 54367 are available
4. Check Docker is running: `docker ps`
5. Verify disk space: `df -h`

## Security Notes

- Never commit `.env` file to git
- Use strong passwords for production
- Enable firewall rules to restrict access
- Use HTTPS in production (via reverse proxy)
- Regularly update Docker images
- Monitor logs for suspicious activity
