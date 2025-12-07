"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SignupWithEmailInput } from "./Signup";

export async function signup(input: SignupWithEmailInput, _baseUrl: string) {
  try {
    // Call the custom auth API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://epsimo-api.alphaforh.com'}/auth/signup`, {
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
      const error = await response.json().catch(() => ({ message: 'Signup failed' }));
      console.error('Signup error:', response.status, error);
      
      // Provide specific error messages based on status code
      let errorMessage = 'An error occurred during signup';
      
      if (response.status === 400) {
        errorMessage = error.message || 'Invalid email or password format';
      } else if (response.status === 409) {
        errorMessage = 'An account with this email already exists';
      } else if (response.status === 403) {
        errorMessage = 'Signup is currently disabled';
      } else if (response.status === 429) {
        errorMessage = 'Too many signup attempts. Please try again later';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      redirect(`/auth/signup?error=${encodeURIComponent(errorMessage)}`);
    }

    const data = await response.json();
    const token = data.jwt_token || data.token;

    if (!token) {
      console.error('No token in response');
      redirect("/auth/signup?error=No authentication token received");
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

    // Redirect directly to home (no email confirmation needed)
    redirect("/");
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      redirect("/auth/signup?error=Cannot connect to authentication service. Please check your internet connection");
    }
    
    redirect("/auth/signup?error=An unexpected error occurred. Please try again");
  }
}
