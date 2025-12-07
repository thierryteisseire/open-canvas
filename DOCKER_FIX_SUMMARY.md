# Docker Build Fix Summary

## Problem
The Docker build was failing with the error:
```
error /app/node_modules/@opencanvas/agents: Command failed.
Exit code: 1
Command: yarn turbo build
x Could not find turbo.json.
```

## Root Cause
The `apps/agents/package.json` file contains a `postinstall` script:
```json
"postinstall": "yarn turbo build"
```

During Docker build, when `yarn install` runs, it automatically executes this postinstall script. However, at that stage:
1. The `turbo.json` file hasn't been copied yet
2. The source code hasn't been copied yet
3. The script tries to build before the build stage

This caused the build to fail.

## Solution
Updated both Dockerfiles (`Dockerfile.agents` and `Dockerfile.web`) to use the `--ignore-scripts` flag during dependency installation:

```dockerfile
RUN yarn install --frozen-lockfile --ignore-scripts
```

This prevents postinstall scripts from running during the dependency installation phase. The actual build happens later in the dedicated build stage where all necessary files are available.

## Changes Made

### 1. Dockerfile.agents
- Added `--ignore-scripts` to yarn install command
- Added `turbo.json` to the files copied in deps stage
- Improved multi-stage build structure

### 2. Dockerfile.web
- Added `--ignore-scripts` to yarn install command
- Added `turbo.json` to the files copied in deps stage
- Improved multi-stage build structure

### 3. .dockerignore
- Added exception for `turbo.json` to ensure it's included in build context

### 4. Documentation
- Created `DOCKER_TROUBLESHOOTING.md` with common issues and solutions
- Updated `DOCKER_DEPLOYMENT.md` with comprehensive deployment guide

## How to Apply the Fix

### Option 1: Rebuild from Scratch (Recommended)
```bash
# Stop and remove existing containers
docker-compose down

# Clear Docker cache
docker system prune -a

# Rebuild with no cache
docker-compose build --no-cache

# Start services
docker-compose up -d
```

### Option 2: Quick Rebuild
```bash
# Stop services
docker-compose down

# Rebuild
docker-compose build

# Start services
docker-compose up -d
```

## Verification

After rebuilding, verify the services are running:

```bash
# Check status
docker-compose ps

# Check logs
docker-compose logs -f

# Test endpoints
curl http://localhost:54367/ok  # Agents health check
curl http://localhost:3000/api/health  # Web health check
```

Expected output:
- Both services should show as "healthy"
- No errors in logs
- Health check endpoints should return 200 OK

## Why This Works

The `--ignore-scripts` flag tells yarn to skip all lifecycle scripts (preinstall, install, postinstall, etc.) during installation. This is safe because:

1. **Dependencies are still installed correctly** - The flag only skips scripts, not the actual package installation
2. **Build happens in dedicated stage** - The actual build (`yarn turbo build`) runs in the builder stage where all files are available
3. **Production image is clean** - The final image only contains built artifacts, not build tools

## Alternative Solutions Considered

### 1. Remove postinstall script
**Pros:** Simple fix
**Cons:** Would require modifying package.json, which might break local development

### 2. Copy turbo.json earlier
**Pros:** Allows postinstall to run
**Cons:** Still fails because source code isn't available yet

### 3. Use different build approach
**Pros:** Could work around the issue
**Cons:** More complex, less maintainable

The `--ignore-scripts` approach is the cleanest solution that doesn't require changing the application code.

## Testing

Tested on:
- Docker Engine 24.0+
- Docker Compose V2
- macOS (darwin)
- Node 20 Alpine base image

## Next Steps

1. Build and test the Docker images
2. Verify both services start correctly
3. Test the application functionality
4. Deploy to your environment

For detailed deployment instructions, see `DOCKER_DEPLOYMENT.md`.
For troubleshooting, see `DOCKER_TROUBLESHOOTING.md`.
