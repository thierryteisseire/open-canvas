# Supabase Removal - Migration to Local Storage

## Summary

Successfully removed all Supabase dependencies from Open Canvas. The application now uses:

- **LangGraph's built-in store** for all data persistence (memory, reflections, custom actions)
- **Custom JWT authentication** via `NEXT_PUBLIC_API_URL`
- **Direct file upload** for audio transcription (no cloud storage needed)

## Changes Made

### 1. Removed Supabase Dependencies

**Deleted files:**
- `apps/web/src/lib/supabase/client.ts`
- `apps/web/src/lib/supabase/server.ts`
- `apps/web/src/lib/supabase/middleware.ts`
- `apps/web/src/lib/supabase/verify_user_server.ts`

**Updated `apps/web/package.json`:**
- Removed `@supabase/ssr`
- Removed `@supabase/supabase-js`

### 2. Updated Authentication

**OAuth Integration:**
- Login/Signup now use `getGoogleLoginUrl()` from `@/lib/api/auth`
- OAuth callback handled via `/auth/callback` route
- GitHub OAuth placeholder added (not yet implemented)

**Sign Out:**
- Created new API route: `apps/web/src/app/api/auth/signout/route.ts`
- Clears `auth_token` cookie on sign out

**Metadata Updates:**
- Changed `supabase_user_id` → `user_id` in thread metadata
- Updated in `ThreadProvider.tsx` and API proxy route

### 3. Audio Transcription

**Before:** Upload to Supabase Storage → Download → Transcribe → Delete

**After:** Direct file upload via FormData → Transcribe

**Updated files:**
- `apps/web/src/app/api/whisper/audio/route.ts` - Now accepts FormData with file
- `apps/web/src/lib/attachments.tsx` - Sends file directly without storage

### 4. Environment Variables

**Removed from `apps/web/.env.example`:**
```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL_DOCUMENTS
NEXT_PUBLIC_SUPABASE_ANON_KEY_DOCUMENTS
```

**Kept:**
```bash
NEXT_PUBLIC_API_URL=https://epsimo-api.alphaforh.com
LANGGRAPH_API_URL=http://localhost:54367
GROQ_API_KEY=
```

### 5. Documentation Updates

**Updated files:**
- `apps/web/README.md` - New authentication setup instructions
- `.kiro/steering/tech.md` - Updated tech stack
- `.kiro/steering/product.md` - Updated architecture description

## Storage Architecture

### LangGraph Store Structure

All data is stored in `.langgraph_api/.langgraphjs_api.store.json`:

```typescript
// Memory/Reflections
namespace: ["memories", assistantId]
key: "reflection"
value: { styleRules: string[], content: string[] }

// Custom Actions
namespace: ["custom_actions", assistantId]
key: "actions"
value: { actions: CustomAction[] }

// Context Documents
namespace: ["context_documents", assistantId]
value: { documents: ContextDocument[] }
```

### API Routes for Store Access

- `POST /api/store/get` - Get item from store
- `POST /api/store/put` - Put item in store
- `POST /api/store/delete` - Delete item from store

All routes proxy to LangGraph SDK's store methods.

## Authentication Flow

### Current Implementation

1. User logs in via custom API (`NEXT_PUBLIC_API_URL/auth/login`)
2. API returns JWT token
3. Token stored in httpOnly cookie (`auth_token`)
4. Middleware checks for token on protected routes
5. Token used for user identification in thread metadata

### Required API Endpoints

Your auth API should implement:

```typescript
POST /auth/login
Body: { email: string, password: string }
Response: { token: string, user: { id: string, email: string } }

POST /auth/signup
Body: { email: string, password: string }
Response: { token: string, user: { id: string, email: string } }

GET /auth/google/login?redirect_uri=...
Response: Redirect to Google OAuth
```

## Migration Steps for Existing Deployments

If you have an existing deployment with Supabase:

1. **Backup data** - Export any user data from Supabase
2. **Update environment variables** - Remove Supabase vars, add `NEXT_PUBLIC_API_URL`
3. **Install dependencies** - Run `yarn install` to update packages
4. **Deploy auth API** - Ensure your custom auth API is running
5. **Test authentication** - Verify login/signup/OAuth flows work
6. **Migrate user data** - If needed, import user mappings to new system

## Benefits

✅ **No external dependencies** - Everything runs locally or on your infrastructure
✅ **Simpler deployment** - No Supabase account or configuration needed
✅ **Cost savings** - No Supabase subscription required
✅ **Full control** - Own your authentication and data storage
✅ **Faster development** - No network calls to external services for storage

## Next Steps

1. Remove Supabase dependencies: `cd apps/web && yarn install`
2. Update your `.env` files with the new variables
3. Test the application locally
4. Deploy your custom auth API if not already running
5. Update production environment variables

## Notes

- LangGraph store persists to `.langgraph_api/.langgraphjs_api.store.json`
- For production, consider backing up this file regularly
- The store is thread-safe and handles concurrent access
- All memory/reflection operations already use LangGraph store (no migration needed)
