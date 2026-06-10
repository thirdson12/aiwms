'use client';

import { useEffect, useState } from 'react';
import { AuthUser, IncomeDto, formatMoney, isAdminOrOwner } from '@aiwms/shared';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AccountingDataTable } from '@/components/accounting-data-table';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';
import { formatDate } from '@/lib/utils';

export default function IncomesPage() {
  const { t, locale } = useI18n();
  const [incomes, setIncomes] = useState<IncomeDto[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ amount: '', description: '', category: '' });
  const moneyLocale = locale === 'tr' ? 'tr-TR' : 'en-US';
  const canManage = user && isAdminOrOwner(user.role);

  async function loadData() {
    const [incomesData, me] = await Promise.all([
      clientFetch<IncomeDto[]>('accounting/incomes'),
      clientFetch<AuthUser>('auth/me'),
    ]);
    setIncomes(incomesData);
    setUser(me);
  }

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await clientFetch('accounting/incomes', {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(form.amount),
        description: form.description,
        category: form.category || undefined,
      }),
    });
    setForm({ amount: '', description: '', category: '' });
    await loadData();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('accounting.incomes')}</h2>
        <p className="text-sm text-muted">{t('accounting.incomesDesc')}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>{t('accounting.newIncome')}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder={t('accounting.amount')}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <Input
              placeholder={t('accounting.description')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
            <Input
              placeholder={t('accounting.category')}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Button type="submit">{t('common.create')}</Button>
          </form>
        </Card>
      )}

      <AccountingDataTable
        title={t('accounting.incomeList')}
        headers={[t('accounting.date'), t('accounting.description'), t('accounting.category'), t('accounting.amount')]}
        rows={incomes.map((item) => [
          formatDate(item.date, locale),
          item.description,
          item.category ?? '—',
          formatMoney(item.amount, moneyLocale),
        ])}
        empty={t('accounting.noRecords')}
      />
    </div>
  );
}
