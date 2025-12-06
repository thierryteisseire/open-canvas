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
      console.error('Signup error:', error);
      redirect("/auth/signup?error=true");
    }

    const data = await response.json();
    const token = data.jwt_token || data.token;

    if (!token) {
      console.error('No token in response');
      redirect("/auth/signup?error=true");
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
    redirect("/auth/signup?error=true");
  }
}
