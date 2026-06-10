'use client';

import { useEffect, useState } from 'react';
import { AuthUser, DebtsReport, formatMoney, isAdminOrOwner } from '@aiwms/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AccountingDataTable } from '@/components/accounting-data-table';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';
import { formatDate } from '@/lib/utils';

export default function DebtsReportPage() {
  const { t, locale } = useI18n();
  const [report, setReport] = useState<DebtsReport | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const moneyLocale = locale === 'tr' ? 'tr-TR' : 'en-US';

  useEffect(() => {
    Promise.all([
      clientFetch<DebtsReport>('reports/debts'),
      clientFetch<AuthUser>('auth/me'),
    ])
      .then(([data, me]) => {
        setReport(data);
        setUser(me);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{t('reports.debts')}</h2>
          <p className="text-sm text-muted">{t('reports.debtsDesc')}</p>
        </div>
        {user && isAdminOrOwner(user.role) && (
          <Button type="button" variant="outline" onClick={() => window.open('/api/proxy/reports/export/debts', '_blank')}>
            {t('reports.exportCsv')}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('accounting.openDebts')}</CardTitle><p className="text-2xl font-bold">{report.openDebts}</p></CardHeader></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('accounting.overdueDebts')}</CardTitle><p className="text-2xl font-bold">{report.overdueDebts}</p></CardHeader></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('accounting.debtRemaining')}</CardTitle><p className="text-2xl font-bold">{formatMoney(report.totalRemaining, moneyLocale)}</p></CardHeader></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('reports.totalCollected')}</CardTitle><p className="text-2xl font-bold">{formatMoney(report.totalCollected, moneyLocale)}</p></CardHeader></Card>
          </div>

          <AccountingDataTable
            title={t('accounting.customerDebts')}
            headers={[t('customers.name'), t('debts.remaining'), t('accounting.debtCol')]}
            rows={report.byCustomer.map((c) => [
              c.customerName,
              formatMoney(c.remaining, moneyLocale),
              t(`debtStatus.${c.status}`),
            ])}
            empty={t('reports.noDebtCustomers')}
          />

          <Card className="overflow-x-auto p-0">
            <div className="border-b border-border px-4 py-3 font-semibold">{t('reports.overdueList')}</div>
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3">{t('jobs.titleCol')}</th>
                  <th className="px-4 py-3">{t('debts.customer')}</th>
                  <th className="px-4 py-3">{t('debts.remaining')}</th>
                  <th className="px-4 py-3">{t('debts.dueDate')}</th>
                </tr>
              </thead>
              <tbody>
                {report.overdueList.map((debt) => (
                  <tr key={debt.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{debt.title}</td>
                    <td className="px-4 py-3">{debt.customer?.name}</td>
                    <td className="px-4 py-3">{formatMoney(debt.remainingAmount, moneyLocale)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="overdue">{formatDate(debt.dueDate, locale)}</Badge>
                    </td>
                  </tr>
                ))}
                {report.overdueList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted">
                      {t('reports.noOverdue')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
