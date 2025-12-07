import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://epsimo-api.alphaforh.com';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch user data from the API
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Fallback to decoding JWT if API call fails
      const payload = token.split('.')[1];
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      const user = {
        id: decoded.user_id || decoded.sub || decoded.id,
        email: decoded.email || 'user@example.com',
        name: decoded.name || 'User',
      };

      return NextResponse.json({ user });
    }

    const data = await response.json();
    return NextResponse.json({ user: data.user });
  } catch (error) {
    console.error('Failed to get user:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
