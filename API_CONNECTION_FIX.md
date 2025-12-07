# API Connection Fix - Frontend to Backend Communication

## Problem

After successful login, the frontend was trying to connect directly to `http://localhost:54367` (the LangGraph agents backend) from the browser. This failed when accessing the app through the Cloudflare domain `canvas.gutenbergai.app` because:

1. The browser runs on the user's machine, not the server
2. `localhost:54367` refers to the user's local machine, not the server
3. The agents service is only accessible within the Docker network

**Error logs showed:**
```
POST http://localhost:54367/threads/search net::ERR_CONNECTION_REFUSED
POST http://localhost:54367/assistants/search net::ERR_CONNECTION_REFUSED
```

## Solution

Modified the `createClient()` function in `apps/web/src/hooks/utils.ts` to use different URLs based on where the code is running:

- **Client-side (browser)**: Use relative URL `/api` which goes through Next.js API proxy
- **Server-side (Next.js)**: Use `LANGGRAPH_API_URL` environment variable (e.g., `http://agents:54367`)

### Code Change

```typescript
export const createClient = () => {
  // Use relative URL for client-side requests (browser)
  // This ensures requests go through Next.js API proxy at /api/[...path]
  const isClient = typeof window !== "undefined";
  
  let apiUrl: string;
  if (isClient) {
    // In browser: construct full URL using current origin + /api
    apiUrl = `${window.location.origin}/api`;
  } else {
    // On server: use environment variable (e.g., http://agents:54367)
    apiUrl = LANGGRAPH_API_URL;
  }
  
  return new Client({
    apiUrl,
  });
};
```

## How It Works

### Request Flow (Before Fix)
```
Browser → http://localhost:54367/threads/search ❌ FAILS
```

### Request Flow (After Fix)
```
Browser → https://canvas.gutenbergai.app/api/threads/search → Next.js API Proxy → http://agents:54367/threads/search ✅ SUCCESS
```

The Next.js API proxy at `/api/[..._path]/route.ts`:
1. Receives the request from the browser
2. Adds authentication (JWT token from cookie)
3. Forwards to the agents service using Docker internal network
4. Returns the response to the browser

## Files Modified

1. **`apps/web/src/hooks/utils.ts`** - Updated `createClient()` to use relative URLs in browser
2. **`apps/web/.env.example`** - Added documentation for environment variables
3. **`docker-compose.ubuntu.yml`** - Already configured with correct environment variables
4. **`docker-rebuild-ubuntu.sh`** - New script for easy rebuilding

## Deployment

To apply this fix on your Ubuntu server:

```bash
# 1. Pull the latest code
git pull origin gutenbergai

# 2. Rebuild the containers
./docker-rebuild-ubuntu.sh

# 3. Verify it's working
docker compose -f docker-compose.ubuntu.yml logs -f
```

## Testing

After deployment, you should see:
1. Login works ✅ (already working)
2. Thread history loads ✅ (should now work)
3. Assistants load ✅ (should now work)
4. Chat functionality works ✅ (should now work)

Check browser console - you should no longer see `ERR_CONNECTION_REFUSED` errors.

## Environment Variables

The Docker Compose file sets:
```yaml
environment:
  - NEXT_PUBLIC_LANGGRAPH_API_URL=http://agents:54367
```

This is used for server-side requests. Client-side requests automatically use `/api` instead.

## Why This Approach?

1. **Security**: All requests go through Next.js, which adds authentication
2. **Flexibility**: Works in any deployment scenario (local, Docker, cloud)
3. **Simplicity**: No need to expose agents service to the internet
4. **CORS**: No cross-origin issues since requests are same-origin
