'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, DebtDto, RoleName, formatMoney } from '@aiwms/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';
import { formatDate } from '@/lib/utils';

export default function DeletedDebtsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [debts, setDebts] = useState<DebtDto[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const moneyLocale = locale === 'tr' ? 'tr-TR' : 'en-US';

  async function loadData() {
    const [debtsData, me] = await Promise.all([
      clientFetch<DebtDto[]>('accounting/debts/deleted'),
      clientFetch<AuthUser>('auth/me'),
    ]);
    setDebts(debtsData);
    setUser(me);
  }

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (user && user.role !== RoleName.ADMIN) {
      router.replace('/accounting/debts');
    }
  }, [user, router]);

  async function restoreDebt(debtId: string) {
    if (!confirm(t('debts.restoreConfirm'))) return;
    await clientFetch(`accounting/debts/${debtId}/restore`, { method: 'POST' });
    await loadData();
  }

  if (user && user.role !== RoleName.ADMIN) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t('accounting.deletedDebtsTab')}</h2>
        <p className="text-sm text-muted">{t('accounting.deletedDebtsDesc')}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('jobs.titleCol')}</th>
              <th className="px-4 py-3">{t('debts.customer')}</th>
              <th className="px-4 py-3">{t('accounting.amount')}</th>
              <th className="px-4 py-3">{t('debts.remaining')}</th>
              <th className="px-4 py-3">{t('debts.deletedAt')}</th>
              <th className="px-4 py-3">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {debts.map((debt) => (
              <tr key={debt.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{debt.title}</td>
                <td className="px-4 py-3">{debt.customer?.name}</td>
                <td className="px-4 py-3">{formatMoney(debt.amount, moneyLocale)}</td>
                <td className="px-4 py-3">{formatMoney(debt.remainingAmount, moneyLocale)}</td>
                <td className="px-4 py-3">{formatDate(debt.deletedAt, locale)}</td>
                <td className="px-4 py-3">
                  <Button type="button" size="sm" onClick={() => restoreDebt(debt.id)}>
                    {t('debts.restore')}
                  </Button>
                </td>
              </tr>
            ))}
            {debts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  {t('debts.noDeletedDebts')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
