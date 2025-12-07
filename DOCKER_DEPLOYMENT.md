# Docker Deployment Guide for Gutenberg AI

This guide explains how to deploy Gutenberg AI using Docker Compose.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose V2 installed
- At least one LLM API key (OpenAI, Anthropic, etc.)

## Quick Start

### 1. Configure Environment Variables

Create or update your `.env` file in the root directory with your API keys:

```bash
# Required: At least one LLM API key
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Additional LLM providers
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
FIREWORKS_API_KEY=your-fireworks-key
GROQ_API_KEY=your-groq-key

# Optional: Web scraping
FIRECRAWL_API_KEY=your-firecrawl-key

# Optional: LangSmith tracing
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=your-langsmith-key
```

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f web
docker-compose logs -f agents
```

### 3. Access the Application

- **Web Interface**: http://localhost:3000
- **LangGraph API**: http://localhost:54367

### 4. Stop Services

```bash
# Stop services
docker-compose down

# Stop and remove volumes (clears all data)
docker-compose down -v
```

## Architecture

The Docker Compose setup includes two services:

### 1. Agents Service (Backend)
- **Container**: `gutenberg-agents`
- **Port**: 54367
- **Purpose**: LangGraph agent orchestration
- **Health Check**: Checks `/ok` endpoint every 30s

### 2. Web Service (Frontend)
- **Container**: `gutenberg-web`
- **Port**: 3000
- **Purpose**: Next.js web application
- **Depends On**: Agents service must be healthy

## Configuration

### Environment Variables

#### Required Variables
- `OPENAI_API_KEY` - OpenAI API key (or another LLM provider key)

#### Optional Variables
- `NEXT_PUBLIC_API_URL` - Custom auth API URL (default: https://epsimo-api.alphaforh.com)
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `GOOGLE_API_KEY` - Google Gemini API key
- `FIREWORKS_API_KEY` - Fireworks AI API key
- `GROQ_API_KEY` - Groq API key
- `FIRECRAWL_API_KEY` - FireCrawl web scraping API key
- `OLLAMA_API_URL` - Ollama server URL (default: http://host.docker.internal:11434)

#### Feature Flags
Control which LLM providers are shown in the UI:
- `NEXT_PUBLIC_OPENAI_ENABLED` (default: true)
- `NEXT_PUBLIC_ANTHROPIC_ENABLED` (default: true)
- `NEXT_PUBLIC_GEMINI_ENABLED` (default: true)
- `NEXT_PUBLIC_FIREWORKS_ENABLED` (default: true)
- `NEXT_PUBLIC_AZURE_ENABLED` (default: false)
- `NEXT_PUBLIC_OLLAMA_ENABLED` (default: false)
- `NEXT_PUBLIC_GROQ_ENABLED` (default: false)

### Volumes

- `langgraph-data` - Persists LangGraph state and memory

## Development vs Production

### Development Mode
The current setup is optimized for development with:
- Hot reload disabled (use local development for that)
- Persistent volumes for data
- Health checks enabled
- Automatic restart on failure

### Production Recommendations
For production deployment, consider:

1. **Use a reverse proxy** (nginx, Traefik) for SSL/TLS
2. **Set resource limits** in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 4G
   ```
3. **Use secrets management** instead of .env files
4. **Enable monitoring** (Prometheus, Grafana)
5. **Set up backups** for the `langgraph-data` volume
6. **Use production-grade logging** (ELK stack, Loki)

## Troubleshooting

### Services Won't Start

Check logs:
```bash
docker-compose logs agents
docker-compose logs web
```

### Port Conflicts

If ports 3000 or 54367 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Change external port
```

### API Key Issues

Verify your API keys are set:
```bash
docker-compose exec agents env | grep API_KEY
```

### Network Issues

Ensure services can communicate:
```bash
docker-compose exec web ping agents
```

### Clear All Data and Restart

```bash
docker-compose down -v
docker-compose up -d --build
```

## Building Individual Services

### Build Agents Only
```bash
docker build -f Dockerfile.agents -t gutenberg-agents .
```

### Build Web Only
```bash
docker build -f Dockerfile.web -t gutenberg-web .
```

## Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or rebuild specific service
docker-compose up -d --build web
```

## Monitoring

### Check Service Health
```bash
# Check all services
docker-compose ps

# Check specific service health
docker inspect gutenberg-agents --format='{{.State.Health.Status}}'
```

### View Resource Usage
```bash
docker stats gutenberg-agents gutenberg-web
```

## Backup and Restore

### Backup LangGraph Data
```bash
docker run --rm -v gutenberg_langgraph-data:/data -v $(pwd):/backup alpine tar czf /backup/langgraph-backup.tar.gz -C /data .
```

### Restore LangGraph Data
```bash
docker run --rm -v gutenberg_langgraph-data:/data -v $(pwd):/backup alpine tar xzf /backup/langgraph-backup.tar.gz -C /data
```

## Advanced Configuration

### Using with Ollama (Local LLMs)

1. Install Ollama on your host machine
2. Enable Ollama in your `.env`:
   ```bash
   NEXT_PUBLIC_OLLAMA_ENABLED=true
   OLLAMA_API_URL=http://host.docker.internal:11434
   ```
3. Restart services:
   ```bash
   docker-compose up -d
   ```

### Custom Network Configuration

To integrate with existing Docker networks:
```yaml
networks:
  gutenberg-network:
    external: true
    name: your-existing-network
```

## Security Considerations

1. **Never commit `.env` files** with real API keys
2. **Use Docker secrets** for production:
   ```yaml
   secrets:
     openai_key:
       external: true
   ```
3. **Limit container capabilities**
4. **Run containers as non-root** (already configured)
5. **Keep images updated** regularly

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review health checks: `docker-compose ps`
- Verify environment variables are set correctly
- Ensure API keys are valid

## License

Same as the main Gutenberg AI project.
