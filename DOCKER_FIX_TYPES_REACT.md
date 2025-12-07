# Docker Build Fix: Missing @types/react

## Problem
After fixing the postinstall script issue, the Docker build now fails with TypeScript compilation errors:

```
error TS7016: Could not find a declaration file for module 'react'.
Try `npm i --save-dev @types/react` if it exists
```

## Root Cause
The `packages/shared/src/utils/thinking.ts` file imports React:
```typescript
import { Dispatch, SetStateAction } from "react";
```

However, `packages/shared/package.json` has `react` in devDependencies but is missing `@types/react`, which provides the TypeScript type definitions.

## Solution
Added `@types/react` to the devDependencies in `packages/shared/package.json`:

```json
"devDependencies": {
  "@types/react": "^18",
  // ... other dependencies
}
```

## How to Apply

### Quick Method (Recommended)
```bash
./docker-rebuild.sh
```

This script will:
1. Stop existing containers
2. Clear Docker cache
3. Rebuild images with no cache
4. Start services
5. Show status

### Manual Method
```bash
# Stop containers
docker-compose down

# Clear cache
docker builder prune -f

# Rebuild
docker-compose build --no-cache

# Start
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

## Why This Happened

The shared package uses React types for the `thinking.ts` utility, which is used by both the web frontend and the agents backend. The package had `react` installed but was missing the TypeScript type definitions (`@types/react`).

In local development, this might not be noticed because:
1. The types might be available from the web app's node_modules
2. TypeScript might use looser checking in development

In Docker's isolated build environment, each package must have all its dependencies explicitly declared.

## Verification

After rebuilding, you should see:
```
✅ @opencanvas/shared:build: Successfully compiled
✅ @opencanvas/agents:build: Successfully compiled
```

No TypeScript errors should appear in the build logs.

## Files Modified

1. **packages/shared/package.json** - Added `@types/react` to devDependencies
2. **docker-rebuild.sh** - Created helper script for clean rebuilds

## Next Steps

1. Run `./docker-rebuild.sh` to apply the fix
2. Wait for build to complete (may take 5-10 minutes)
3. Verify services are running: `docker-compose ps`
4. Access the app at http://localhost:3000

## Troubleshooting

### If build still fails:
```bash
# Complete clean slate
docker-compose down -v
docker system prune -a --volumes
./docker-rebuild.sh
```

### If you see "node_modules" errors:
```bash
# Clean local node_modules (they're not needed for Docker)
rm -rf node_modules apps/*/node_modules packages/*/node_modules
./docker-rebuild.sh
```

### Check build progress:
```bash
# Watch build output
docker-compose build 2>&1 | tee build.log

# Check for errors
grep -i error build.log
```

## Prevention

To prevent similar issues in the future:
1. Always declare type dependencies explicitly in package.json
2. Test builds in isolated environments (like Docker)
3. Use `yarn install` to update yarn.lock after dependency changes
4. Run `yarn turbo build` locally before committing

## Related Issues

- First issue: postinstall script running too early (fixed with `--ignore-scripts`)
- Second issue: missing @types/react (fixed by adding to devDependencies)

Both issues are now resolved in the Dockerfiles and package.json files.
