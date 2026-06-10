'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AccountingSummary, formatMoney } from '@aiwms/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

export default function AccountingOverviewPage() {
  const { t, locale } = useI18n();
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [error, setError] = useState('');
  const moneyLocale = locale === 'tr' ? 'tr-TR' : 'en-US';

  useEffect(() => {
    clientFetch<AccountingSummary>('accounting/summary')
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  const quickLinks = [
    {
      href: '/accounting/expenses',
      icon: TrendingDown,
      title: t('accounting.expenses'),
      description: t('accounting.expensesDesc'),
      value: summary ? formatMoney(summary.totalExpenses, moneyLocale) : '—',
    },
    {
      href: '/accounting/incomes',
      icon: TrendingUp,
      title: t('accounting.incomes'),
      description: t('accounting.incomesDesc'),
      value: summary ? formatMoney(summary.totalIncome, moneyLocale) : '—',
    },
    {
      href: '/accounting/debts',
      icon: Wallet,
      title: t('accounting.debtsTab'),
      description: t('accounting.debtsDesc'),
      value: summary ? String(summary.openDebts) : '—',
    },
  ];

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted">{t('accounting.netBalance')}</CardTitle>
              <p className="text-2xl font-bold">{formatMoney(summary.netBalance, moneyLocale)}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted">{t('accounting.totalExpenses')}</CardTitle>
              <p className="text-2xl font-bold">{formatMoney(summary.totalExpenses, moneyLocale)}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted">{t('accounting.totalIncome')}</CardTitle>
              <p className="text-2xl font-bold">{formatMoney(summary.totalIncome, moneyLocale)}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted">{t('accounting.openDebts')}</CardTitle>
              <p className="text-2xl font-bold">{summary.openDebts}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted">{t('accounting.overdueDebts')}</CardTitle>
              <p className="text-2xl font-bold">{summary.overdueDebts}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted">{t('accounting.debtRemaining')}</CardTitle>
              <p className="text-2xl font-bold">{formatMoney(summary.totalDebtRemaining, moneyLocale)}</p>
            </CardHeader>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-base">{link.title}</CardTitle>
                  </div>
                  <p className="text-sm text-muted">{link.description}</p>
                  <p className="mt-3 text-xl font-bold">{link.value}</p>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
