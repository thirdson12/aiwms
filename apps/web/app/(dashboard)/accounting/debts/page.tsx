'use client';

import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  AuthUser,
  CustomerDto,
  DebtDto,
  JobDto,
  formatMoney,
  isAdminOrOwner,
} from '@aiwms/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/form-controls';
import { DebtBadge } from '@/components/debt-badge';
import { DebtStatusSelect, DebtWhatsappButton, DebtPaymentsList } from '@/components/job-workshop-sections';
import { TableSearch } from '@/components/table-search';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';
import { formatDate } from '@/lib/utils';
import { matchesSearch } from '@/lib/search-utils';

export default function DebtsPage() {
  const { t, locale } = useI18n();
  const [debts, setDebts] = useState<DebtDto[]>([]);
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    amount: '',
    customerId: '',
    jobId: '',
    dueDate: '',
  });
  const [search, setSearch] = useState('');
  const moneyLocale = locale === 'tr' ? 'tr-TR' : 'en-US';
  const canManage = user && isAdminOrOwner(user.role);

  const filteredCustomers = useMemo(
    () => customers.filter((c) => matchesSearch(search, c.name, c.phone)),
    [customers, search],
  );

  const filteredDebts = useMemo(
    () => debts.filter((d) => matchesSearch(search, d.title, d.customer?.name)),
    [debts, search],
  );

  async function loadData() {
    const [debtsData, customersData, jobsData, me] = await Promise.all([
      clientFetch<DebtDto[]>('accounting/debts'),
      clientFetch<CustomerDto[]>('customers'),
      clientFetch<JobDto[]>('jobs'),
      clientFetch<AuthUser>('auth/me'),
    ]);
    setDebts(debtsData);
    setCustomers(customersData);
    setJobs(jobsData);
    setUser(me);
  }

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await clientFetch('accounting/debts', {
      method: 'POST',
      body: JSON.stringify({
        title: form.title,
        amount: Number(form.amount),
        customerId: form.customerId,
        jobId: form.jobId || undefined,
        dueDate: form.dueDate || undefined,
      }),
    });
    setForm({ title: '', amount: '', customerId: '', jobId: '', dueDate: '' });
    await loadData();
  }

  async function payDebt(debtId: string) {
    const amount = Number(payAmounts[debtId]);
    if (!amount) return;
    await clientFetch(`accounting/debts/${debtId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    setPayAmounts((prev) => ({ ...prev, [debtId]: '' }));
    await loadData();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('accounting.debtsTab')}</h2>
        <p className="text-sm text-muted">{t('accounting.debtsDesc')}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>{t('debts.newDebt')}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder={t('jobs.titleCol')}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              placeholder={t('accounting.amount')}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <Select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              required
            >
              <option value="">{t('jobs.selectCustomer')}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })}>
              <option value="">{t('jobs.unassigned')}</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
            <Button type="submit">{t('common.create')}</Button>
          </form>
        </Card>
      )}

      <TableSearch value={search} onChange={setSearch} />

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-border px-4 py-3 font-semibold">{t('accounting.customerDebts')}</div>
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('customers.name')}</th>
              <th className="px-4 py-3">{t('customers.phone')}</th>
              <th className="px-4 py-3">{t('accounting.debtCol')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{customer.name}</td>
                <td className="px-4 py-3">{customer.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <DebtBadge summary={customer.debtSummary} />
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted">
                  {search ? t('common.noSearchResults') : t('customers.noCustomers')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-border px-4 py-3 font-semibold">{t('accounting.debtList')}</div>
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('jobs.titleCol')}</th>
              <th className="px-4 py-3">{t('debts.customer')}</th>
              <th className="px-4 py-3">{t('accounting.amount')}</th>
              <th className="px-4 py-3">{t('debts.remaining')}</th>
              <th className="px-4 py-3">{t('accounting.debtCol')}</th>
              <th className="px-4 py-3">{t('debts.dueDate')}</th>
              {canManage && <th className="px-4 py-3">{t('common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {filteredDebts.map((debt) => (
              <Fragment key={debt.id}>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-medium">{debt.title}</td>
                  <td className="px-4 py-3">{debt.customer?.name}</td>
                  <td className="px-4 py-3">{formatMoney(debt.amount, moneyLocale)}</td>
                  <td className="px-4 py-3">{formatMoney(debt.remainingAmount, moneyLocale)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={debt.status}>{t(`debtStatus.${debt.status}`)}</Badge>
                    {canManage && (
                      <div className="mt-2">
                        <DebtStatusSelect debt={debt} onUpdated={loadData} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDate(debt.dueDate, locale)}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      {debt.remainingAmount > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          <Input
                            className="h-8 w-24"
                            value={payAmounts[debt.id] ?? ''}
                            onChange={(e) => setPayAmounts({ ...payAmounts, [debt.id]: e.target.value })}
                          />
                          <Button type="button" onClick={() => payDebt(debt.id)}>
                            {t('debts.pay')}
                          </Button>
                          <DebtWhatsappButton debt={debt} />
                        </div>
                      ) : (
                        <DebtBadge
                          summary={{
                            hasDebt: false,
                            hasOverdue: false,
                            totalRemaining: 0,
                            openCount: 0,
                            status: 'paid',
                          }}
                        />
                      )}
                    </td>
                  )}
                </tr>
                {canManage && (debt.payments?.length ?? 0) > 0 && (
                  <tr key={`${debt.id}-payments`} className="border-b border-border last:border-0">
                    <td colSpan={canManage ? 7 : 6} className="px-4 pb-4 pt-0">
                      <DebtPaymentsList
                        debt={debt}
                        moneyLocale={moneyLocale}
                        locale={locale}
                        onUpdated={loadData}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filteredDebts.length === 0 && (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="px-4 py-8 text-center text-muted">
                  {search ? t('common.noSearchResults') : t('debts.noDebts')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
