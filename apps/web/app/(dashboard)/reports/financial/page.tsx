'use client';

import { useEffect, useState } from 'react';
import { AuthUser, FinancialReport, formatMoney, isAdminOrOwner } from '@aiwms/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountingDataTable } from '@/components/accounting-data-table';
import { defaultReportRange, ReportDateFilter } from '@/components/report-date-filter';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';

function formatMonthLabel(label: string, locale: string) {
  const [year, month] = label.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function FinancialReportPage() {
  const { t, locale } = useI18n();
  const [range, setRange] = useState(defaultReportRange());
  const [filter, setFilter] = useState(defaultReportRange());
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const moneyLocale = locale === 'tr' ? 'tr-TR' : 'en-US';

  async function loadData(from: string, to: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const [data, me] = await Promise.all([
      clientFetch<FinancialReport>(`reports/financial?${params.toString()}`),
      clientFetch<AuthUser>('auth/me'),
    ]);
    setReport(data);
    setUser(me);
  }

  useEffect(() => {
    loadData(filter.from, filter.to).catch((err) => setError(err.message));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('reports.financial')}</h2>
        <p className="text-sm text-muted">{t('reports.financialDesc')}</p>
      </div>

      <ReportDateFilter
        from={range.from}
        to={range.to}
        onFromChange={(from) => setRange({ ...range, from })}
        onToChange={(to) => setRange({ ...range, to })}
        onApply={() => setFilter({ ...range })}
        exportType="financial"
        canExport={user ? isAdminOrOwner(user.role) : false}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('accounting.totalIncome')}</CardTitle><p className="text-2xl font-bold">{formatMoney(report.totalIncome, moneyLocale)}</p></CardHeader></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('accounting.totalExpenses')}</CardTitle><p className="text-2xl font-bold">{formatMoney(report.totalExpenses, moneyLocale)}</p></CardHeader></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('accounting.netBalance')}</CardTitle><p className="text-2xl font-bold">{formatMoney(report.netBalance, moneyLocale)}</p></CardHeader></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('reports.debtCollections')}</CardTitle><p className="text-2xl font-bold">{formatMoney(report.debtCollections, moneyLocale)}</p></CardHeader></Card>
          </div>

          <AccountingDataTable
            title={t('reports.monthlyBreakdown')}
            headers={[t('reports.period'), t('accounting.incomes'), t('accounting.expenses')]}
            rows={report.monthlyBreakdown.map((row) => [
              formatMonthLabel(row.label, locale),
              formatMoney(row.income, moneyLocale),
              formatMoney(row.expenses, moneyLocale),
            ])}
            empty={t('reports.noData')}
          />

          <AccountingDataTable
            title={t('reports.topExpenses')}
            headers={[t('accounting.category'), t('accounting.amount')]}
            rows={report.topExpenseCategories.map((row) => [
              row.category,
              formatMoney(row.amount, moneyLocale),
            ])}
            empty={t('reports.noData')}
          />
        </>
      )}
    </div>
  );
}
