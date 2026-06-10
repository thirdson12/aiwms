import { AccountingNav } from '@/components/accounting-nav';
import { getServerTranslator } from '@/lib/i18n/server';

export default async function AccountingLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getServerTranslator();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('accounting.title')}</h1>
        <p className="text-muted">{t('accounting.subtitle')}</p>
      </div>
      <AccountingNav />
      {children}
    </div>
  );
}
