# NextAuth.js Migration Analysis

## Executive Summary

**Difficulty Level: 🔴 HIGH (7-10 days of work)**

Replacing Supabase Auth with NextAuth.js is a **major refactor** that touches ~30+ files across authentication, middleware, contexts, and components. While technically feasible, it requires careful planning and execution.

---

## Current Supabase Auth Integration

### Files Using Supabase Auth (30+ files)

#### Core Auth Infrastructure (6 files)
1. `apps/web/src/lib/supabase/client.ts` - Browser client
2. `apps/web/src/lib/supabase/server.ts` - Server client
3. `apps/web/src/lib/supabase/middleware.ts` - Session management
4. `apps/web/src/lib/supabase/verify_user_server.ts` - User verification
5. `apps/web/src/middleware.ts` - Route protection
6. `apps/web/src/contexts/UserContext.tsx` - User state management

#### Auth Pages & Components (8 files)
7. `apps/web/src/app/auth/login/page.tsx`
8. `apps/web/src/app/auth/signup/page.tsx`
9. `apps/web/src/app/auth/signup/success/page.tsx`
10. `apps/web/src/app/auth/signout/page.tsx`
11. `apps/web/src/app/auth/callback/route.ts` - OAuth callback
12. `apps/web/src/app/auth/confirm/route.ts` - Email confirmation
13. `apps/web/src/components/auth/login/Login.tsx`
14. `apps/web/src/components/auth/signup/Signup.tsx`

#### Auth Actions (2 files)
15. `apps/web/src/components/auth/login/actions.ts`
16. `apps/web/src/components/auth/signup/actions.ts`

#### Components Using Auth (15+ files)
17. `apps/web/src/components/canvas/content-composer.tsx`
18. `apps/web/src/components/chat-interface/thread-history.tsx`
19. `apps/web/src/components/chat-interface/thread.tsx`
20. `apps/web/src/components/chat-interface/model-selector/index.tsx`
21. `apps/web/src/components/artifacts/ArtifactRenderer.tsx`
22. `apps/web/src/components/artifacts/actions_toolbar/custom/index.tsx`
23. `apps/web/src/contexts/GraphContext.tsx`
24. `apps/web/src/contexts/ThreadProvider.tsx`
25. `apps/web/src/lib/attachments.tsx`
26. `apps/web/src/workers/graph-stream/stream.worker.ts`
27-30+. Various other components using `useUserContext()`

---

## What Needs to Change

### 1. **Install NextAuth.js** ⏱️ 30 mins
```bash
yarn add next-auth @auth/core
```

### 2. **Create NextAuth Configuration** ⏱️ 2-3 hours
- `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- Configure providers (Google, GitHub, Email)
- Setup JWT/session strategy
- Configure callbacks (jwt, session)

### 3. **Replace Supabase Auth Clients** ⏱️ 1-2 hours
- Remove `apps/web/src/lib/supabase/client.ts`
- Remove `apps/web/src/lib/supabase/server.ts`
- Create NextAuth helper utilities
- Keep Supabase client for database operations only

### 4. **Rewrite Middleware** ⏱️ 2-3 hours
- Replace `apps/web/src/lib/supabase/middleware.ts`
- Use NextAuth's `withAuth` middleware
- Implement route protection
- Handle session refresh

### 5. **Update UserContext** ⏱️ 2-3 hours
- Rewrite `apps/web/src/contexts/UserContext.tsx`
- Use `useSession()` from NextAuth
- Update user type definitions
- Handle loading states

### 6. **Rewrite Auth Pages** ⏱️ 3-4 hours
- `/auth/login` - Use NextAuth signIn
- `/auth/signup` - Custom signup flow
- `/auth/signout` - Use NextAuth signOut
- `/auth/callback` - NextAuth handles this
- Remove `/auth/confirm` (NextAuth handles email verification differently)

### 7. **Update Auth Actions** ⏱️ 2 hours
- Rewrite login action to use NextAuth
- Rewrite signup action (may need custom API route)
- Update OAuth flows

### 8. **Update All Components** ⏱️ 4-6 hours
- Replace `useUserContext()` calls (15+ files)
- Update user object references
- Handle session loading states
- Update type definitions

### 9. **Database Schema Changes** ⏱️ 2-3 hours
- NextAuth requires specific tables:
  - `accounts` - OAuth accounts
  - `sessions` - User sessions
  - `users` - User data
  - `verification_tokens` - Email verification
- Migrate existing Supabase user data
- Update RLS policies

### 10. **Environment Variables** ⏱️ 30 mins
```bash
# Remove
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Add
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### 11. **Testing & Debugging** ⏱️ 1-2 days
- Test all auth flows
- Test protected routes
- Test session persistence
- Test OAuth providers
- Fix edge cases

---

## Detailed Breakdown

### Current Supabase Auth Flow
```
User → Supabase Auth → Session Cookie → Middleware → Protected Routes
                    ↓
              Supabase Database (RLS)
```

### NextAuth.js Flow
```
User → NextAuth → JWT/Session → Middleware → Protected Routes
                ↓
          Supabase Database (Manual Auth Check)
```

---

## Key Challenges

### 1. **Session Management** 🔴 HIGH
- Supabase uses its own session format
- NextAuth uses JWT or database sessions
- Need to migrate session handling across entire app

### 2. **User Object Structure** 🟡 MEDIUM
- Supabase: `{ id, email, user_metadata, ... }`
- NextAuth: `{ id, email, name, image, ... }`
- Need to update all user references

### 3. **Database Integration** 🔴 HIGH
- Supabase RLS relies on `auth.uid()`
- NextAuth doesn't integrate with Supabase RLS
- Need to manually pass user ID to database queries
- Rewrite all RLS policies or use service role key

### 4. **Email Verification** 🟡 MEDIUM
- Supabase handles email verification automatically
- NextAuth requires custom implementation
- Need to build verification flow

### 5. **OAuth Callbacks** 🟢 LOW
- NextAuth handles this better than Supabase
- Simpler configuration

### 6. **Type Safety** 🟡 MEDIUM
- Need to update TypeScript types throughout
- NextAuth has good type support but different structure

---

## Migration Steps (Recommended Order)

### Phase 1: Setup (Day 1)
1. Install NextAuth.js
2. Create NextAuth configuration
3. Setup providers (Google, GitHub)
4. Test basic authentication

### Phase 2: Core Infrastructure (Days 2-3)
5. Create NextAuth utilities
6. Rewrite middleware
7. Update UserContext
8. Test session management

### Phase 3: Auth Pages (Day 4)
9. Rewrite login page
10. Rewrite signup page
11. Update signout page
12. Test all auth flows

### Phase 4: Component Updates (Days 5-6)
13. Update all components using auth
14. Fix TypeScript errors
15. Update user references
16. Test each component

### Phase 5: Database (Day 7)
17. Create NextAuth tables in Supabase
18. Migrate user data
19. Update RLS policies or remove them
20. Test database operations

### Phase 6: Testing & Polish (Days 8-10)
21. End-to-end testing
22. Fix bugs
23. Performance optimization
24. Documentation

---

## Risks & Considerations

### 🔴 HIGH RISK
1. **Breaking Changes**: All users will need to re-authenticate
2. **Data Migration**: Risk of losing user data if not done carefully
3. **RLS Policies**: May need to rewrite or remove Supabase RLS
4. **Session Persistence**: Users may get logged out unexpectedly

### 🟡 MEDIUM RISK
5. **OAuth Configuration**: Need to reconfigure OAuth apps
6. **Email Verification**: Custom implementation required
7. **Type Errors**: Many TypeScript errors to fix

### 🟢 LOW RISK
8. **NextAuth is well-documented**: Good community support
9. **Can keep Supabase Database**: Only auth changes

---

## Alternative: Keep Supabase, Add Providers

Instead of full migration, you can add more OAuth providers through Supabase:

### Supabase Supports:
- ✅ Google
- ✅ GitHub
- ✅ Apple
- ✅ Azure
- ✅ Discord
- ✅ Facebook
- ✅ GitLab
- ✅ LinkedIn
- ✅ Notion
- ✅ Slack
- ✅ Spotify
- ✅ Twitch
- ✅ Twitter/X
- ✅ WorkOS

### How to Add (5 minutes per provider):
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable provider
3. Add OAuth credentials
4. Update frontend to show new provider button

**No code changes required!**

---

## Recommendation

### ❌ **DO NOT MIGRATE** if:
- You just want more OAuth providers (use Supabase providers)
- You're happy with current auth flow
- You don't have 1-2 weeks for migration
- You need Supabase RLS

### ✅ **MIGRATE** if:
- You need NextAuth-specific features
- You want to move away from Supabase entirely
- You have time for a major refactor
- You're willing to rewrite RLS policies

---

## Cost-Benefit Analysis

### Costs
- **Time**: 7-10 days of development
- **Risk**: High risk of bugs and breaking changes
- **Complexity**: Touches 30+ files
- **Testing**: Extensive testing required
- **User Impact**: All users need to re-authenticate

### Benefits
- **Flexibility**: More control over auth flow
- **Providers**: Easier to add custom providers
- **TypeScript**: Better type support
- **Community**: Larger NextAuth community

### Verdict
**Not worth it** unless you have specific requirements that Supabase Auth cannot meet. The current Supabase Auth integration is solid and well-implemented.

---

## Conclusion

**Difficulty: 🔴 HIGH (7-10 days)**

The migration is **technically feasible** but **not recommended** unless you have compelling reasons. Supabase Auth is working well in this codebase, and adding more OAuth providers can be done through Supabase's dashboard without any code changes.

If you still want to proceed, budget **2 weeks** for development and testing, and plan for a **breaking change** that will require all users to re-authenticate.
