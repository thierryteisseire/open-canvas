# Gutenberg AI Deployment Status

## Current Status: ❌ Not Working

### Issue: Cannot login, no console logs visible

## What's Working ✅

1. **Docker containers are running**
   - Agents service: Running on port 54367
   - Web service: Running on port 3001
   - Both services are healthy

2. **App responds locally**
   - `curl http://localhost:3001` returns HTTP 200
   - App is accessible from the server itself

3. **Cloudflare Tunnel is running**
   - Tunnel service is active
   - Connected to Cloudflare

## What's NOT Working ❌

1. **403 Error from Cloudflare**
   - `curl -I https://canvas.gutenbergai.app` returns HTTP 403
   - This is a **Cloudflare Zero Trust** access policy issue
   - NOT a Docker or app issue

2. **Login not working**
   - No console logs appearing (neither client nor server)
   - Form submission appears to be blocked

## Root Cause

**Cloudflare Zero Trust is blocking ALL requests to canvas.gutenbergai.app**

The 403 error is coming from Cloudflare's access policy, not from the application.

## Solution Steps

### Step 1: Fix Cloudflare Zero Trust (REQUIRED)

Go to **Cloudflare Dashboard**:

1. **Zero Trust** → **Access** → **Applications**
2. Find `canvas.gutenbergai.app`
3. **Option A - Remove Protection (Recommended for testing):**
   - Click the three dots (⋮) → **Delete**
   - This removes all access restrictions
   
4. **Option B - Allow Everyone:**
   - Click **Edit**
   - Go to **Policies** tab
   - Click **Add a policy** (or edit existing)
   - Set:
     - **Policy name**: Allow All
     - **Action**: Allow
     - **Include**: Everyone
   - Click **Save**

### Step 2: Verify Tunnel Configuration

1. **Zero Trust** → **Networks** → **Tunnels**
2. Click on your tunnel
3. **Public Hostname** tab
4. Find `canvas.gutenbergai.app`
5. Verify **URL** is: `http://localhost:3001`

### Step 3: Test After Changes

Wait 1-2 minutes for Cloudflare to propagate changes, then:

```bash
# On your server
curl -I https://canvas.gutenbergai.app
```

Should return `HTTP/2 200` or `HTTP/2 302` (not 403)

### Step 4: Access the App

Once the 403 is fixed, visit:
- https://canvas.gutenbergai.app

You should see the login page.

## Debugging Commands

### On Ubuntu Server:

```bash
# Check Docker containers
docker compose ps

# View web logs
docker compose -f docker-compose.ubuntu.yml logs -f web

# View agents logs
docker compose -f docker-compose.ubuntu.yml logs -f agents

# Test local access
curl -I http://localhost:3001

# Test external access
curl -I https://canvas.gutenbergai.app

# Restart services
docker compose -f docker-compose.ubuntu.yml restart

# Full rebuild
docker compose -f docker-compose.ubuntu.yml up --build -d
```

### In Browser:

1. Open DevTools (F12)
2. Go to **Console** tab
3. Try logging in
4. Look for `[CLIENT]` prefixed logs
5. Check **Network** tab for failed requests

## Expected Behavior After Fix

1. Visit https://canvas.gutenbergai.app
2. See the homepage (public, no auth required)
3. Click "Login"
4. Enter credentials:
   - Email: contact@epsimoai.com
   - Password: EpsimoAI184
5. See console logs in browser:
   ```
   [CLIENT] Login form submitted
   [CLIENT] Email: contact@epsimoai.com
   [CLIENT] Password length: 11
   [CLIENT] Calling onLoginWithEmail...
   ```
6. Redirect to homepage after successful login

## Technical Details

### Architecture

- **Frontend**: Next.js 14 (port 3001)
- **Backend**: LangGraph agents (port 54367)
- **Auth**: Custom JWT via https://epsimo-api.alphaforh.com
- **Proxy**: Cloudflare Zero Trust Tunnel
- **Server**: Ubuntu with Docker Compose

### Files Modified

- `docker-compose.ubuntu.yml` - Ubuntu-specific compose with port 3001
- `Dockerfile.agents.ubuntu` - Agents Dockerfile with DNS fixes
- `Dockerfile.web.ubuntu` - Web Dockerfile with DNS fixes
- `apps/web/src/middleware.ts` - Allow public access to homepage
- `apps/web/src/components/auth/login/actions.ts` - Detailed server logging
- `apps/web/src/components/auth/login/user-auth-form-login.tsx` - Client logging

### Environment Variables

Required in `.env`:
```bash
OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_API_URL=https://epsimo-api.alphaforh.com
```

## Next Steps

1. **Fix Cloudflare Zero Trust access policy** (see Step 1 above)
2. Test that `curl -I https://canvas.gutenbergai.app` returns 200
3. Access the site in browser
4. Try logging in
5. Share any error messages or logs

## Support

If still having issues after fixing Cloudflare:

1. Share browser console logs (F12 → Console)
2. Share server logs: `docker compose -f docker-compose.ubuntu.yml logs --tail=50 web`
3. Share the output of: `curl -I https://canvas.gutenbergai.app`
4. Confirm Cloudflare Zero Trust policy is set to "Allow Everyone"
