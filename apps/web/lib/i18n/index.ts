import tr from '@/messages/tr.json';
import en from '@/messages/en.json';
import { DEFAULT_LOCALE, Locale, Messages } from './types';

const catalogs: Record<Locale, Messages> = {
  tr: tr as Messages,
  en: en as Messages,
};

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs[DEFAULT_LOCALE];
}

export function translate(messages: Messages, key: string): string {
  const parts = key.split('.');
  let current: unknown = messages;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  return typeof current === 'string' ? current : key;
}

export function createTranslator(locale: Locale) {
  const messages = getMessages(locale);
  return {
    locale,
    messages,
    t: (key: string) => translate(messages, key),
  };
}

export * from './types';
