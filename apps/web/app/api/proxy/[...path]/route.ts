import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-cookies';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

async function proxyRequest(request: NextRequest, path: string) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const url = `${API_URL}/${path}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    headers.set('Content-Type', contentType);
  } else if (request.method !== 'GET' && request.method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (contentType.includes('multipart/form-data')) {
      init.body = await request.arrayBuffer();
    } else {
      init.body = await request.text();
    }
  }

  const response = await fetch(url, init);
  const responseType = response.headers.get('content-type') ?? 'application/json';

  if (responseType.includes('application/json')) {
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': responseType },
    });
  }

  const buffer = await response.arrayBuffer();
  const outHeaders = new Headers();
  outHeaders.set('Content-Type', responseType);
  const disposition = response.headers.get('content-disposition');
  if (disposition) outHeaders.set('Content-Disposition', disposition);

  return new NextResponse(buffer, {
    status: response.status,
    headers: outHeaders,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path.join('/'));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path.join('/'));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path.join('/'));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path.join('/'));
}
