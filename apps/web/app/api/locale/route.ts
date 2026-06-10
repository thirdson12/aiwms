import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, LOCALE_COOKIE, Locale } from '@/lib/i18n';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const locale: Locale =
    body.locale === 'en' || body.locale === 'tr' ? body.locale : DEFAULT_LOCALE;

  const response = NextResponse.json({ locale });
  response.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
