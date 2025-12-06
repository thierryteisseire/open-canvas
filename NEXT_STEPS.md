# Next Steps - Post Supabase Removal

## Immediate Actions Required

### 1. Install Updated Dependencies

```bash
cd apps/web
yarn install
```

This will remove the Supabase packages from `node_modules`.

### 2. Update Environment Variables

**Remove from `apps/web/.env`:**
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SUPABASE_URL_DOCUMENTS=...
NEXT_PUBLIC_SUPABASE_ANON_KEY_DOCUMENTS=...
```

**Ensure you have:**
```bash
NEXT_PUBLIC_API_URL=https://epsimo-api.alphaforh.com
LANGGRAPH_API_URL=http://localhost:54367
GROQ_API_KEY=your_groq_key  # Optional, for audio transcription
```

### 3. Test Locally

```bash
# Terminal 1: Start LangGraph server
cd apps/agents
yarn dev

# Terminal 2: Start Next.js frontend
cd apps/web
yarn dev
```

Visit http://localhost:3000 and test:
- ✅ Login/Signup with email
- ✅ Google OAuth (if configured)
- ✅ Creating threads
- ✅ Generating artifacts
- ✅ Reflections/memory system
- ✅ Audio transcription (if GROQ_API_KEY set)

## Authentication Setup

Your custom auth API (`NEXT_PUBLIC_API_URL`) must implement:

### Required Endpoints

#### 1. Login
```typescript
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"  // optional
  }
}

Response (401):
{
  "message": "Invalid credentials"
}
```

#### 2. Signup
```typescript
POST /auth/signup
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (201):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com"
  }
}

Response (400):
{
  "message": "User already exists"
}
```

#### 3. Google OAuth (Optional)
```typescript
GET /auth/google/login?redirect_uri=http://localhost:3000/auth/callback

Response (302):
Location: https://accounts.google.com/o/oauth2/v2/auth?...
```

After Google authentication, redirect to:
```
{redirect_uri}?token={jwt_token}
```

### JWT Token Requirements

The JWT token should:
- Be signed with a secret key
- Include user ID in payload: `{ userId: "user-123", ... }`
- Have reasonable expiration (7 days recommended)
- Be validated on your backend

Example JWT payload:
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "iat": 1701878400,
  "exp": 1702483200
}
```

## Optional: Disable Authentication for Local Dev

If you want to run without authentication for local development:

### 1. Comment out middleware check

Edit `apps/web/src/middleware.ts`:

```typescript
export async function middleware(request: NextRequest) {
  // Temporarily disable auth for local dev
  return NextResponse.next();
  
  /* Original code:
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;
  ...
  */
}
```

### 2. Use mock user

The app will automatically use a mock user ID when no auth token is present.

## Production Deployment

### 1. Environment Variables

Set in your production environment:
```bash
NEXT_PUBLIC_API_URL=https://your-auth-api.com
LANGGRAPH_API_URL=https://your-langgraph-server.com
GROQ_API_KEY=your_production_key
```

### 2. Backup Strategy

Set up automated backups of the LangGraph store:

```bash
# Add to crontab
0 2 * * * /path/to/backup-store.sh
```

See `LOCAL_STORAGE_GUIDE.md` for backup script.

### 3. Monitoring

Monitor the store file size:
```bash
# Alert if store file > 100MB
if [ $(stat -f%z .langgraph_api/.langgraphjs_api.store.json) -gt 104857600 ]; then
  echo "Store file is getting large!"
fi
```

### 4. Security Checklist

- ✅ Use HTTPS in production
- ✅ Set `secure: true` for cookies in production
- ✅ Implement rate limiting on auth endpoints
- ✅ Validate JWT tokens properly
- ✅ Use strong JWT secret keys
- ✅ Set appropriate CORS policies
- ✅ Regular security updates

## Troubleshooting

### "Failed to fetch" errors

Check that `NEXT_PUBLIC_API_URL` is accessible:
```bash
curl https://epsimo-api.alphaforh.com/auth/login
```

### Authentication redirects not working

Verify middleware is running:
```typescript
// apps/web/src/middleware.ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Store not persisting

Check LangGraph server logs and file permissions:
```bash
ls -la .langgraph_api/
```

### Audio transcription failing

Ensure GROQ_API_KEY is set and valid:
```bash
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

## Documentation

Created documentation files:
- `SUPABASE_REMOVAL_SUMMARY.md` - Complete change log
- `LOCAL_STORAGE_GUIDE.md` - How to use LangGraph store
- `NEXT_STEPS.md` - This file

Updated files:
- `apps/web/README.md` - New setup instructions
- `.kiro/steering/tech.md` - Updated tech stack
- `.kiro/steering/product.md` - Updated architecture
- `.kiro/steering/structure.md` - Updated structure comments

## Support

If you encounter issues:

1. Check the troubleshooting sections in this document
2. Review `SUPABASE_REMOVAL_SUMMARY.md` for what changed
3. Verify your auth API is working correctly
4. Check LangGraph server logs
5. Ensure all environment variables are set

## Rollback (If Needed)

If you need to rollback to Supabase:

```bash
git checkout HEAD~1 apps/web/package.json
git checkout HEAD~1 apps/web/src/lib/supabase/
git checkout HEAD~1 apps/web/src/components/auth/
cd apps/web && yarn install
```

Then restore your `.env` with Supabase credentials.
