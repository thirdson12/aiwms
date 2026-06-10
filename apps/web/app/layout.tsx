import type { Metadata } from 'next';
import { I18nProvider } from '@/components/i18n-provider';
import { getMessages } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIWMS',
  description: 'Accounting, Inventory and Work Management System',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
