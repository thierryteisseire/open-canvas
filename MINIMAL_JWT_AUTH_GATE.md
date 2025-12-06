# Minimal JWT Auth Gate Implementation

## Goal
Add JWT-based authentication as a gate to the app with **minimum changes**. Just check if user has valid JWT token - if yes, let them in; if no, show login.

## What Changes (Only 8 files!)

### New Files (3)
1. `apps/web/src/lib/api/auth.ts` - API client ✅ CREATED
2. `apps/web/src/lib/api/token.ts` - Token management ✅ CREATED  
3. `apps/web/.env.example` - Updated env vars ✅ CREATED

### Modified Files (5)
4. `apps/web/src/components/auth/login/actions.ts` - Use JWT API
5. `apps/web/src/components/auth/signup/actions.ts` - Use JWT API
6. `apps/web/src/contexts/UserContext.tsx` - Check JWT token
7. `apps/web/src/middleware.ts` - JWT gate
8. `apps/web/src/app/auth/callback/route.ts` - Handle OAuth callback

## Installation

```bash
cd apps/web
yarn add js-cookie
yarn add -D @types/js-cookie
```

## Environment Variables

Add to `apps/web/.env`:
```bash
NEXT_PUBLIC_API_URL=https://epsimo-api.alphaforh.com
```

## Implementation

I've created the new files. Now just need to update the 5 existing files with minimal changes.

### Summary of Changes:
- Login/Signup: Call your API instead of Supabase
- UserContext: Check JWT token exists (don't decode, just check)
- Middleware: Simple JWT gate (has token = pass, no token = redirect to login)
- Callback: Handle OAuth token from your API

**No changes to:**
- ❌ Database queries (keep Supabase)
- ❌ UI components
- ❌ Graph/Thread contexts
- ❌ Any other business logic

Just a simple auth gate!
