import { NextResponse } from 'next/server';
import { defaultLocale, localeCookieName, locales, type Locale } from '@/i18n/config';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { locale?: string };
  const locale = locales.includes(body.locale as Locale) ? (body.locale as Locale) : defaultLocale;

  const response = NextResponse.json({ success: true, locale });

  response.cookies.set(localeCookieName, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  return response;
}
