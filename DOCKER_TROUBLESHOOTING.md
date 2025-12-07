# Docker Build Troubleshooting Guide

## Common Issues and Solutions

### 1. "Could not find turbo.json" Error During Build

**Error Message:**
```
error /app/node_modules/@opencanvas/agents: Command failed.
Exit code: 1
Command: yarn turbo build
x Could not find turbo.json.
```

**Cause:** 
The `postinstall` script in `apps/agents/package.json` tries to run `yarn turbo build` during dependency installation, but turbo.json isn't available at that stage.

**Solution:**
The Dockerfiles have been updated to use `--ignore-scripts` flag during `yarn install`. If you still see this error:

1. Make sure you're using the latest Dockerfiles:
   ```bash
   git pull
   ```

2. Clear Docker cache and rebuild:
   ```bash
   docker-compose down
   docker system prune -a
   docker-compose build --no-cache
   ```

3. Verify the Dockerfile contains `--ignore-scripts`:
   ```dockerfile
   RUN yarn install --frozen-lockfile --ignore-scripts
   ```

### 2. Build Context Too Large

**Error Message:**
```
=> [agents internal] load build context  17.5s
=> => transferring context: 1.61GB
```

**Cause:**
Docker is copying too many files (like node_modules) into the build context.

**Solution:**

1. Ensure `.dockerignore` file exists and contains:
   ```
   node_modules
   .next
   dist
   .turbo
   ```

2. Clean local build artifacts:
   ```bash
   rm -rf node_modules apps/*/node_modules packages/*/node_modules
   rm -rf apps/web/.next
   rm -rf apps/agents/dist
   rm -rf .turbo
   ```

3. Rebuild:
   ```bash
   docker-compose build
   ```

### 3. Out of Memory During Build

**Error Message:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solution:**

1. Increase Docker memory limit (Docker Desktop → Settings → Resources)
   - Recommended: At least 4GB RAM

2. Build services separately:
   ```bash
   docker-compose build agents
   docker-compose build web
   ```

3. Use build arguments to limit parallelism:
   ```bash
   docker-compose build --build-arg NODE_OPTIONS="--max-old-space-size=4096"
   ```

### 4. Port Already in Use

**Error Message:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Solution:**

1. Stop conflicting services:
   ```bash
   # Find what's using the port
   lsof -i :3000
   lsof -i :54367
   
   # Kill the process
   kill -9 <PID>
   ```

2. Or change ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "8080:3000"  # Use port 8080 instead
   ```

### 5. Network Issues Between Services

**Error Message:**
```
Error: connect ECONNREFUSED agents:54367
```

**Solution:**

1. Ensure services are on the same network:
   ```bash
   docker network ls
   docker network inspect gutenberg_gutenberg-network
   ```

2. Check service health:
   ```bash
   docker-compose ps
   ```

3. Restart services:
   ```bash
   docker-compose restart
   ```

### 6. Missing Environment Variables

**Error Message:**
```
Error: Model name is missing in config
```

**Solution:**

1. Verify `.env` file exists in root directory

2. Check API keys are set:
   ```bash
   cat .env | grep API_KEY
   ```

3. Restart services to pick up changes:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### 7. Yarn Lock File Issues

**Error Message:**
```
error Your lockfile needs to be updated, but yarn was run with `--frozen-lockfile`.
```

**Solution:**

1. Update yarn.lock locally:
   ```bash
   yarn install
   ```

2. Commit the updated yarn.lock:
   ```bash
   git add yarn.lock
   git commit -m "Update yarn.lock"
   ```

3. Rebuild:
   ```bash
   docker-compose build --no-cache
   ```

## Debugging Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f agents
docker-compose logs -f web

# Last 100 lines
docker-compose logs --tail=100 agents
```

### Check Service Status
```bash
# List all services
docker-compose ps

# Check health
docker inspect gutenberg-agents --format='{{.State.Health.Status}}'
docker inspect gutenberg-web --format='{{.State.Health.Status}}'
```

### Access Container Shell
```bash
# Agents container
docker-compose exec agents sh

# Web container
docker-compose exec web sh
```

### Check Resource Usage
```bash
docker stats gutenberg-agents gutenberg-web
```

### Clean Everything
```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a --volumes

# Remove specific images
docker rmi gutenberg-agents gutenberg-web
```

## Build Performance Tips

### 1. Use BuildKit
```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
docker-compose build
```

### 2. Parallel Builds
```bash
docker-compose build --parallel
```

### 3. Layer Caching
The Dockerfiles are optimized for layer caching. To maximize cache hits:
- Don't modify package.json files unnecessarily
- Keep dependencies stable
- Use `--no-cache` only when necessary

### 4. Multi-stage Build Benefits
The Dockerfiles use multi-stage builds:
- **deps**: Install dependencies
- **builder**: Build the application
- **runner**: Minimal production image

This keeps the final image small and secure.

## Getting Help

If you're still experiencing issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config`
3. Check Docker version: `docker --version` (need 20.10+)
4. Check Docker Compose version: `docker-compose --version` (need V2)
5. Review DOCKER_DEPLOYMENT.md for detailed setup instructions

## Quick Reset

If all else fails, complete reset:

```bash
# Stop everything
docker-compose down -v

# Clean Docker
docker system prune -a --volumes

# Clean local files
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf apps/web/.next apps/agents/dist .turbo

# Reinstall and rebuild
yarn install
docker-compose build --no-cache
docker-compose up -d
```
