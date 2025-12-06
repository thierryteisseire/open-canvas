/**
 * Custom authentication client for Epsimo API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://epsimo-api.alphaforh.com';

export interface AuthResponse {
  jwt_token: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  
  // Normalize the response - API returns jwt_token, we use token internally
  return {
    jwt_token: data.jwt_token || data.token,
    user: data.user,
  };
}

/**
 * Sign up with email and password
 */
export async function signup(email: string, password: string, name?: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Signup failed' }));
    throw new Error(error.message || 'Signup failed');
  }

  const data = await response.json();
  
  return {
    jwt_token: data.jwt_token || data.token,
    user: data.user,
  };
}

/**
 * Get current user from token
 */
export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user');
  }

  const data = await response.json();
  return data.user;
}
