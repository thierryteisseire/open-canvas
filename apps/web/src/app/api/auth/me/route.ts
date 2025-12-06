import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Decode JWT to get user info
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    const user = {
      id: decoded.user_id || decoded.sub || decoded.id,
      email: decoded.email || 'user@example.com', // JWT doesn't contain email
      name: decoded.name || 'User',
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Failed to decode token:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
