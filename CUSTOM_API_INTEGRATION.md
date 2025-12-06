# Custom API Authentication Integration

## Your API Endpoints

**Base URL:** `https://epsimo-api.alphaforh.com`

### Available Endpoints:
1. ✅ `POST /auth/login` - Email/password login
2. ✅ `POST /auth/signup` - Create account
3. ✅ `GET /auth/google/login` - Google OAuth
4. ✅ `GET /auth/google/callback` - Google OAuth callback
5. ✅ `GET /auth/thread-info` - User thread usage
6. ✅ `POST /auth/verify-email` - Email verification
7. ✅ `POST /auth/resend-verification` - Resend verification
8. ✅ `POST /auth/forgot-password` - Password reset request
9. ✅ `POST /auth/reset-password` - Reset password
10. ✅ `DELETE /auth/delete-user` - Delete account
11. ✅ `GET /auth/verification-status/{email}` - Check verification

---

## Integration Difficulty: 🟡 **MEDIUM (2-3 days)**

This is **much easier** than NextAuth migration because:
- ✅ Backend already exists
- ✅ Just need to replace Supabase Auth client calls
- ✅ Can keep Supabase for database (or use your API's database)
- ✅ Similar auth flow to current implementation

---

## What Needs to Change

### Files to Modify: ~15 files (vs 30+ for NextAuth)

#### 1. Create API Client (NEW)
- `apps/web/src/lib/api/auth-client.ts` - API wrapper

#### 2. Update Auth Actions (2 files)
- `apps/web/src/components/auth/login/actions.ts`
- `apps/web/src/components/auth/signup/actions.ts`

#### 3. Update UserContext (1 file)
- `apps/web/src/contexts/UserContext.tsx`

#### 4. Update Middleware (1 file)
- `apps/web/src/middleware.ts`

#### 5. Update Auth Pages (4 files)
- `apps/web/src/app/auth/login/page.tsx`
- `apps/web/src/app/auth/signup/page.tsx`
- `apps/web/src/app/auth/callback/route.ts`
- `apps/web/src/app/auth/signout/page.tsx`

#### 6. Add New Pages (3 files)
- `apps/web/src/app/auth/verify-email/page.tsx` - NEW
- `apps/web/src/app/auth/forgot-password/page.tsx` - NEW
- `apps/web/src/app/auth/reset-password/page.tsx` - NEW

#### 7. Remove Supabase Auth (3 files)
- `apps/web/src/lib/supabase/client.ts` - Remove auth, keep DB
- `apps/web/src/lib/supabase/server.ts` - Remove auth, keep DB
- `apps/web/src/lib/supabase/middleware.ts` - Remove

---

## Implementation Plan

### Phase 1: Setup API Client (Day 1 - Morning)

Create the API client wrapper:

```typescript
// apps/web/src/lib/api/auth-client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://epsimo-api.alphaforh.com';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
  };
  token: string;
  refreshToken?: string;
}

export class AuthClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async signup(data: SignupRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async verifyEmail(code: string): Promise<{ success: boolean }> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  static async resendVerification(email: string): Promise<{ success: boolean }> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static async forgotPassword(email: string): Promise<{ success: boolean }> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static async resetPassword(token: string, password: string): Promise<{ success: boolean }> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  static async getThreadInfo(token: string): Promise<any> {
    return this.request('/auth/thread-info', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  static async deleteUser(token: string): Promise<{ success: boolean }> {
    return this.request('/auth/delete-user', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  static async getVerificationStatus(email: string): Promise<{ verified: boolean }> {
    return this.request(`/auth/verification-status/${encodeURIComponent(email)}`);
  }

  // Google OAuth
  static getGoogleLoginUrl(): string {
    return `${API_BASE_URL}/auth/google/login`;
  }
}
```

### Phase 2: Session Management (Day 1 - Afternoon)

Create session utilities:

```typescript
// apps/web/src/lib/api/session.ts

import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
}

export class SessionManager {
  static setSession(token: string, refreshToken: string | undefined, user: User) {
    Cookies.set(TOKEN_KEY, token, { expires: 7 }); // 7 days
    if (refreshToken) {
      Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 30 }); // 30 days
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static getToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
  }

  static getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_TOKEN_KEY);
  }

  static getUser(): User | null {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  static clearSession() {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
```

### Phase 3: Update UserContext (Day 1 - Evening)

```typescript
// apps/web/src/contexts/UserContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SessionManager, User } from '@/lib/api/session';
import { AuthClient } from '@/lib/api/auth-client';

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from session on mount
    const savedUser = SessionManager.getUser();
    if (savedUser && SessionManager.isAuthenticated()) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await AuthClient.login({ email, password });
    SessionManager.setSession(response.token, response.refreshToken, response.user);
    setUser(response.user);
  };

  const signup = async (email: string, password: string) => {
    const response = await AuthClient.signup({ email, password });
    SessionManager.setSession(response.token, response.refreshToken, response.user);
    setUser(response.user);
  };

  const logout = () => {
    SessionManager.clearSession();
    setUser(null);
  };

  const refreshUser = async () => {
    const savedUser = SessionManager.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within UserProvider');
  }
  return context;
}
```

### Phase 4: Update Middleware (Day 2 - Morning)

```typescript
// apps/web/src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/verify-email', '/auth/forgot-password', '/auth/reset-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If no token and trying to access protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If has token and trying to access auth pages
  if (token && isPublicRoute && !pathname.startsWith('/auth/verify-email')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Phase 5: Update Login Page (Day 2 - Afternoon)

```typescript
// apps/web/src/components/auth/login/actions.ts

'use server';

import { redirect } from 'next/navigation';
import { AuthClient } from '@/lib/api/auth-client';

export async function login(email: string, password: string) {
  try {
    const response = await AuthClient.login({ email, password });
    
    // Set cookies on server side
    const { cookies } = await import('next/headers');
    cookies().set('auth_token', response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    if (response.refreshToken) {
      cookies().set('refresh_token', response.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    redirect('/');
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Login failed');
  }
}
```

### Phase 6: Add Google OAuth (Day 2 - Evening)

```typescript
// apps/web/src/components/auth/login/Login.tsx

const handleGoogleLogin = () => {
  // Redirect to your API's Google OAuth endpoint
  window.location.href = AuthClient.getGoogleLoginUrl();
};

// In your UI:
<Button onClick={handleGoogleLogin}>
  <Icons.google className="mr-2 h-4 w-4" />
  Continue with Google
</Button>
```

```typescript
// apps/web/src/app/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const refreshToken = searchParams.get('refreshToken');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url));
  }

  if (token) {
    // Set cookies
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    if (refreshToken) {
      cookies().set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.redirect(new URL('/auth/login?error=invalid_callback', request.url));
}
```

### Phase 7: Add Email Verification (Day 3 - Morning)

```typescript
// apps/web/src/app/auth/verify-email/page.tsx

'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthClient } from '@/lib/api/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VerifyEmailPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      await AuthClient.verifyEmail(code);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await AuthClient.resendVerification(email);
      alert('Verification code sent!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    }
  };

  return (
    <div className="container max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
      <p className="mb-4">Enter the verification code sent to {email}</p>
      
      <Input
        type="text"
        placeholder="Enter code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="mb-4"
      />
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <Button onClick={handleVerify} disabled={loading} className="w-full mb-2">
        {loading ? 'Verifying...' : 'Verify Email'}
      </Button>
      
      <Button onClick={handleResend} variant="outline" className="w-full">
        Resend Code
      </Button>
    </div>
  );
}
```

---

## Environment Variables

Add to `apps/web/.env`:

```bash
NEXT_PUBLIC_API_URL=https://epsimo-api.alphaforh.com
```

---

## Database Strategy

### Option A: Keep Supabase for Data (Recommended)
- Use your API for authentication only
- Keep Supabase for storing threads, artifacts, memories
- User ID from your API maps to Supabase user ID

### Option B: Use Your API's Database
- Store everything in your API's database
- Remove Supabase entirely
- Need to update all database queries

**Recommendation:** Option A - Keep Supabase for data, use your API for auth only.

---

## Migration Checklist

### Day 1
- [ ] Create API client (`auth-client.ts`)
- [ ] Create session manager (`session.ts`)
- [ ] Update UserContext
- [ ] Test login/signup locally

### Day 2
- [ ] Update middleware
- [ ] Update login page
- [ ] Update signup page
- [ ] Add Google OAuth
- [ ] Test auth flow

### Day 3
- [ ] Add email verification page
- [ ] Add forgot password page
- [ ] Add reset password page
- [ ] Update all components using auth
- [ ] Test everything

---

## Advantages of Your API

✅ **You control the backend** - No vendor lock-in
✅ **Google OAuth included** - Already implemented
✅ **Email verification** - Built-in
✅ **Password reset** - Built-in
✅ **Thread info** - Custom endpoint for your app
✅ **Delete account** - GDPR compliant

---

## Potential Issues & Solutions

### Issue 1: CORS
**Problem:** Browser blocks requests to your API
**Solution:** Add CORS headers to your API:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

### Issue 2: Token Refresh
**Problem:** Token expires, user gets logged out
**Solution:** Implement token refresh logic:
```typescript
// Check token expiry and refresh if needed
if (isTokenExpired(token)) {
  const newToken = await refreshToken(refreshToken);
  SessionManager.setToken(newToken);
}
```

### Issue 3: SSR vs Client
**Problem:** Cookies not available on server
**Solution:** Use server actions for auth operations

---

## Testing Plan

1. **Login Flow**
   - Email/password login
   - Google OAuth login
   - Invalid credentials
   - Remember me

2. **Signup Flow**
   - Create account
   - Email verification
   - Duplicate email

3. **Password Reset**
   - Request reset
   - Reset with token
   - Invalid token

4. **Session Management**
   - Stay logged in
   - Logout
   - Token expiry
   - Refresh token

---

## Estimated Timeline

- **Day 1:** API client + UserContext (6-8 hours)
- **Day 2:** Auth pages + OAuth (6-8 hours)
- **Day 3:** Verification + Testing (6-8 hours)

**Total: 2-3 days**

---

## Next Steps

1. Install dependencies:
```bash
yarn add js-cookie
yarn add -D @types/js-cookie
```

2. Create the API client files
3. Update UserContext
4. Test login/signup
5. Add remaining features

Want me to start implementing this?
