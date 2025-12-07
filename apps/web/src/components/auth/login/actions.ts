"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LoginWithEmailInput } from "./Login";

export async function login(input: LoginWithEmailInput) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://epsimo-api.alphaforh.com';
  const loginEndpoint = `${apiUrl}/auth/login`;
  
  console.log('[LOGIN] Starting login attempt');
  console.log('[LOGIN] API URL:', apiUrl);
  console.log('[LOGIN] Login endpoint:', loginEndpoint);
  console.log('[LOGIN] Email:', input.email);
  
  try {
    console.log('[LOGIN] Sending POST request to auth API...');
    
    // Call the custom auth API
    const response = await fetch(loginEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
      }),
    });

    console.log('[LOGIN] Response status:', response.status);
    console.log('[LOGIN] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LOGIN] Error response body:', errorText);
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: 'Login failed' };
      }
      
      console.error('[LOGIN] Parsed error:', error);
      
      // Provide specific error messages based on status code
      let errorMessage = 'An error occurred during login';
      
      if (response.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (response.status === 403) {
        errorMessage = 'Access denied. Please check your credentials';
      } else if (response.status === 404) {
        errorMessage = 'Authentication service not found';
      } else if (response.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('[LOGIN] Final error message:', errorMessage);
      redirect(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
    }

    const responseText = await response.text();
    console.log('[LOGIN] Success response body:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[LOGIN] Failed to parse response as JSON:', e);
      redirect("/auth/login?error=Invalid response from authentication service");
    }
    
    console.log('[LOGIN] Parsed response data:', { ...data, jwt_token: data.jwt_token ? '[REDACTED]' : undefined });
    
    const token = data.jwt_token || data.token;

    if (!token) {
      console.error('[LOGIN] No token in response. Response keys:', Object.keys(data));
      redirect("/auth/login?error=No authentication token received");
    }

    console.log('[LOGIN] Token received, length:', token.length);
    console.log('[LOGIN] Setting auth cookie...');

    // Set the token in an httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('[LOGIN] Cookie set successfully');
    console.log('[LOGIN] Revalidating path and redirecting to home...');

    revalidatePath("/", "layout");
    redirect("/");
  } catch (error) {
    // NEXT_REDIRECT is not an error - it's how Next.js handles redirects in server actions
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      console.log('[LOGIN] Redirect successful (NEXT_REDIRECT is expected)');
      throw error; // Re-throw to let Next.js handle the redirect
    }
    
    console.error('[LOGIN] Caught exception:', error);
    console.error('[LOGIN] Error type:', error?.constructor?.name);
    console.error('[LOGIN] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[LOGIN] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[LOGIN] Network error detected');
      redirect("/auth/login?error=Cannot connect to authentication service. Please check your internet connection");
    }
    
    console.error('[LOGIN] Unexpected error, redirecting with generic message');
    redirect("/auth/login?error=An unexpected error occurred. Please try again");
  }
}
