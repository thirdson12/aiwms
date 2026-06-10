import { ReportsNav } from '@/components/reports-nav';
import { getServerTranslator } from '@/lib/i18n/server';

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getServerTranslator();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
        <p className="text-muted">{t('reports.subtitle')}</p>
      </div>
      <ReportsNav />
      {children}
    </div>
  );
}
