# Docker Quick Start Guide

## TL;DR

```bash
# Make sure you have Docker installed and running
# Then run:
./docker-rebuild.sh
```

That's it! The app will be available at http://localhost:3000

## What Was Fixed

We encountered two build issues that have now been resolved:

### Issue 1: Postinstall Script Error ✅ FIXED
**Error:** `Could not find turbo.json`  
**Fix:** Added `--ignore-scripts` to Dockerfiles  
**Details:** See `DOCKER_FIX_SUMMARY.md`

### Issue 2: Missing TypeScript Types ✅ FIXED
**Error:** `Could not find a declaration file for module 'react'`  
**Fix:** Added `@types/react` to `packages/shared/package.json`  
**Details:** See `DOCKER_FIX_TYPES_REACT.md`

## Prerequisites

- Docker Desktop installed and running
- At least 4GB RAM allocated to Docker
- At least one LLM API key (OpenAI, Anthropic, etc.)

## Step-by-Step Setup

### 1. Configure Environment

Make sure your `.env` file in the root directory has at least one API key:

```bash
# Required: At least one of these
OPENAI_API_KEY=sk-your-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-key-here
# OR
GOOGLE_API_KEY=your-key-here
```

### 2. Build and Start

```bash
./docker-rebuild.sh
```

This will:
- Stop any existing containers
- Clear Docker cache
- Build fresh images
- Start all services
- Show status

### 3. Verify

Check that services are running:
```bash
docker-compose ps
```

You should see:
- `gutenberg-agents` - healthy
- `gutenberg-web` - healthy

### 4. Access the App

- **Web Interface:** http://localhost:3000
- **API Endpoint:** http://localhost:54367

## Common Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f web
docker-compose logs -f agents

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Check status
docker-compose ps

# Rebuild after code changes
./docker-rebuild.sh
```

## Troubleshooting

### Build Fails

```bash
# Complete clean rebuild
docker-compose down -v
docker system prune -a --volumes
./docker-rebuild.sh
```

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check Docker resources
docker stats
```

### Port Conflicts

If ports 3000 or 54367 are in use, edit `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Change 3000 to 8080
```

### Out of Memory

Increase Docker memory:
1. Docker Desktop → Settings → Resources
2. Set Memory to at least 4GB
3. Click "Apply & Restart"

## File Structure

```
.
├── docker-compose.yml          # Service orchestration
├── Dockerfile.agents           # Backend build
├── Dockerfile.web              # Frontend build
├── .dockerignore              # Build optimization
├── docker-rebuild.sh          # Quick rebuild script
├── docker-start.sh            # Initial setup script
├── DOCKER_DEPLOYMENT.md       # Full deployment guide
├── DOCKER_TROUBLESHOOTING.md  # Detailed troubleshooting
├── DOCKER_FIX_SUMMARY.md      # Fix for issue #1
└── DOCKER_FIX_TYPES_REACT.md  # Fix for issue #2
```

## What's Running

### Agents Service (Backend)
- **Container:** gutenberg-agents
- **Port:** 54367
- **Purpose:** LangGraph agent orchestration
- **Tech:** Node.js, LangChain, TypeScript

### Web Service (Frontend)
- **Container:** gutenberg-web
- **Port:** 3000
- **Purpose:** Next.js web application
- **Tech:** React, Next.js, TypeScript

### Data Persistence
- **Volume:** langgraph-data
- **Purpose:** Stores conversation history and memory

## Development Workflow

### Making Code Changes

1. Edit code locally
2. Rebuild: `./docker-rebuild.sh`
3. Test changes at http://localhost:3000

### Viewing Logs

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f web
```

### Debugging

```bash
# Access container shell
docker-compose exec agents sh
docker-compose exec web sh

# Check environment variables
docker-compose exec agents env
```

## Production Deployment

For production, see `DOCKER_DEPLOYMENT.md` for:
- SSL/TLS configuration
- Resource limits
- Monitoring setup
- Backup strategies
- Security hardening

## Getting Help

1. **Check logs:** `docker-compose logs -f`
2. **Check status:** `docker-compose ps`
3. **Review docs:**
   - `DOCKER_DEPLOYMENT.md` - Full deployment guide
   - `DOCKER_TROUBLESHOOTING.md` - Common issues
   - `DOCKER_FIX_SUMMARY.md` - Technical fixes

## Success Indicators

✅ Build completes without errors  
✅ Both services show as "healthy"  
✅ Web interface loads at http://localhost:3000  
✅ Can create new conversations  
✅ AI responses appear in canvas  

## Next Steps

1. Log in with your Epsimo credentials
2. Start a new conversation
3. Try attaching a document
4. Explore the quick actions
5. Check out the memory/reflections feature

Enjoy using Gutenberg AI! 🚀
