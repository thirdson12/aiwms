'use client';

import { createContext, useContext, useMemo } from 'react';
import { createTranslator, Locale, Messages } from '@/lib/i18n';

type I18nContextValue = ReturnType<typeof createTranslator>;

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      messages,
      t: (key: string) => {
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
      },
    }),
    [locale, messages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
