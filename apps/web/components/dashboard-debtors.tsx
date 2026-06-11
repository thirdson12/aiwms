'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CustomerDto, formatMoney } from '@aiwms/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSearch } from '@/components/table-search';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';
import { matchesSearch } from '@/lib/search-utils';

const MAX_DEBTORS = 5;

export function DashboardDebtors() {
  const { t, locale } = useI18n();
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [search, setSearch] = useState('');
  const moneyLocale = locale === 'tr' ? 'tr-TR' : 'en-US';

  useEffect(() => {
    clientFetch<CustomerDto[]>('customers')
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, []);

  const debtors = useMemo(() => {
    return customers
      .filter((c) => c.debtSummary?.hasDebt && (c.debtSummary?.totalRemaining ?? 0) > 0)
      .filter((c) => matchesSearch(search, c.name, c.phone))
      .sort((a, b) => (b.debtSummary?.totalRemaining ?? 0) - (a.debtSummary?.totalRemaining ?? 0))
      .slice(0, MAX_DEBTORS);
  }, [customers, search]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{t('dashboard.debtorsTitle')}</CardTitle>
        <TableSearch value={search} onChange={setSearch} className="w-full sm:max-w-xs" />
      </CardHeader>
      {debtors.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted">{t('dashboard.noDebtors')}</p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {debtors.map((customer) => (
            <li key={customer.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <Link href={`/customers/${customer.id}`} className="font-medium hover:text-primary hover:underline">
                {customer.name}
              </Link>
              <span className="font-semibold text-destructive">
                {formatMoney(customer.debtSummary?.totalRemaining ?? 0, moneyLocale)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
