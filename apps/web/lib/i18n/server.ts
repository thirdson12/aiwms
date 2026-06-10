import { cookies } from 'next/headers';
import { createTranslator, DEFAULT_LOCALE, Locale, LOCALE_COOKIE } from './index';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === 'en' || value === 'tr' ? value : DEFAULT_LOCALE;
}

export async function getServerTranslator() {
  const locale = await getLocale();
  return createTranslator(locale);
}
