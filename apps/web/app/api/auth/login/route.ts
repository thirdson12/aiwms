import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  cookieOptions,
} from '@/lib/auth-cookies';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Login failed' },
        { status: response.status },
      );
    }

    const nextResponse = NextResponse.json({ user: data.user });
    nextResponse.cookies.set(ACCESS_TOKEN_COOKIE, data.accessToken, {
      ...cookieOptions,
      maxAge: 60 * 15,
    });
    nextResponse.cookies.set(REFRESH_TOKEN_COOKIE, data.refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    return nextResponse;
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes('fetch failed')
        ? 'Cannot reach the API server. Make sure it is running on port 3001 (pnpm dev).'
        : 'Login failed';

    return NextResponse.json({ message }, { status: 503 });
  }
}
