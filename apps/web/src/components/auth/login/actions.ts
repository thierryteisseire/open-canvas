"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LoginWithEmailInput } from "./Login";

export async function login(input: LoginWithEmailInput) {
  try {
    // Call the custom auth API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://epsimo-api.alphaforh.com'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      console.error('Login error:', response.status, error);
      
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
      
      redirect(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
    }

    const data = await response.json();
    const token = data.jwt_token || data.token;

    if (!token) {
      console.error('No token in response');
      redirect("/auth/login?error=No authentication token received");
    }

    // Set the token in an httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    revalidatePath("/", "layout");
    redirect("/");
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      redirect("/auth/login?error=Cannot connect to authentication service. Please check your internet connection");
    }
    
    redirect("/auth/login?error=An unexpected error occurred. Please try again");
  }
}
