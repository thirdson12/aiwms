import { apiFetch, getCurrentUser } from '@/lib/api';
import { getServerTranslator } from '@/lib/i18n/server';
import { DashboardStats, formatMoney } from '@aiwms/shared';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCharts } from '@/components/dashboard-charts';
import { getLocale } from '@/lib/i18n/server';
export default async function DashboardPage() {
  const [{ t }, stats, locale, user] = await Promise.all([
    getServerTranslator(),
    apiFetch<DashboardStats>('/dashboard'),
    getLocale(),
    getCurrentUser(),
  ]);

  const showFinance = !!user;
  const cards = [
    { label: t('dashboard.totalJobs'), value: stats.totalJobs },
    { label: t('dashboard.pending'), value: stats.pendingJobs },
    { label: t('dashboard.inProgress'), value: stats.inProgressJobs },
    { label: t('dashboard.completed'), value: stats.completedJobs },
    { label: t('dashboard.totalProducts'), value: stats.totalProducts },
    { label: t('dashboard.lowStock'), value: stats.lowStockProducts },
    { label: t('dashboard.totalCustomers'), value: stats.totalCustomers },
    { label: t('dashboard.totalExpenses'), value: formatMoney(stats.totalExpenses, locale === 'tr' ? 'tr-TR' : 'en-US') },
    { label: t('dashboard.totalIncome'), value: formatMoney(stats.totalIncome, locale === 'tr' ? 'tr-TR' : 'en-US') },
    { label: t('dashboard.openDebts'), value: stats.openDebts },
    { label: t('dashboard.overdueDebts'), value: stats.overdueDebts },
    { label: t('dashboard.debtRemaining'), value: formatMoney(stats.totalDebtRemaining, locale === 'tr' ? 'tr-TR' : 'en-US') },
  ];

  if (stats.myJobs !== undefined) {
    cards.splice(5, 0, { label: t('dashboard.myJobs'), value: stats.myJobs });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <DashboardCharts stats={stats} showFinance={showFinance} />
    </div>  );
}
