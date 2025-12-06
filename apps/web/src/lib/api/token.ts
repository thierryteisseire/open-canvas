/**
 * JWT token management utilities
 */



/**
 * Set auth token in httpOnly cookie (server-side only)
 */
export async function setAuthToken(token: string): Promise<void> {
  await fetch('/api/auth/set-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
}

/**
 * Clear auth token (server-side only)
 */
export async function clearAuthToken(): Promise<void> {
  await fetch('/api/auth/signout', {
    method: 'POST',
  });
}

/**
 * Get current user from server
 */
export async function getCurrentUser() {
  const response = await fetch('/api/auth/me');
  
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.user;
}
