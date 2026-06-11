import { apiFetch, getCurrentUser } from '@/lib/api';
import { getServerTranslator } from '@/lib/i18n/server';
import { DashboardStats, formatMoney, isAdminOrOwner } from '@aiwms/shared';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCharts } from '@/components/dashboard-charts';
import { DashboardQuickActions } from '@/components/dashboard-quick-actions';
import { DashboardDebtors } from '@/components/dashboard-debtors';
import { getLocale } from '@/lib/i18n/server';

export default async function DashboardPage() {
  const [{ t }, stats, locale, user] = await Promise.all([
    getServerTranslator(),
    apiFetch<DashboardStats>('/dashboard'),
    getLocale(),
    getCurrentUser(),
  ]);

  const moneyLocale = locale === 'tr' ? 'tr-TR' : 'en-US';
  const showFinance = user && isAdminOrOwner(user.role);

  const jobCards = [
    { label: t('dashboard.totalJobs'), value: stats.totalJobs },
    { label: t('dashboard.pending'), value: stats.pendingJobs },
    { label: t('dashboard.inProgress'), value: stats.inProgressJobs },
    { label: t('dashboard.completed'), value: stats.completedJobs },
  ];

  const opsCards = [
    { label: t('dashboard.totalCustomers'), value: stats.totalCustomers },
    { label: t('dashboard.totalProducts'), value: stats.totalProducts },
    { label: t('dashboard.lowStock'), value: stats.lowStockProducts },
  ];

  if (stats.myJobs !== undefined) {
    opsCards.unshift({ label: t('dashboard.myJobs'), value: stats.myJobs });
  }

  const financeCards = showFinance
    ? [
        { label: t('dashboard.openDebts'), value: stats.openDebts },
        { label: t('dashboard.overdueDebts'), value: stats.overdueDebts },
        { label: t('dashboard.debtRemaining'), value: formatMoney(stats.totalDebtRemaining, moneyLocale) },
        { label: t('dashboard.totalIncome'), value: formatMoney(stats.totalIncome, moneyLocale) },
        { label: t('dashboard.totalExpenses'), value: formatMoney(stats.totalExpenses, moneyLocale) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted">{t('dashboard.subtitle')}</p>
      </div>

      {user && <DashboardQuickActions user={user} />}
      {user && <DashboardDebtors />}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('jobs.title')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {jobCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-2xl">{card.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('nav.subtitle')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {opsCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-2xl">{card.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {financeCards.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('nav.accounting')}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {financeCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className="text-xl">{card.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}

      <DashboardCharts stats={stats} showFinance={!!showFinance} />
    </div>
  );
}
