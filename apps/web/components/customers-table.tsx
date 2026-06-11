'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CustomerDto } from '@aiwms/shared';
import { Card } from '@/components/ui/card';
import { DebtBadge } from '@/components/debt-badge';
import { TableSearch } from '@/components/table-search';
import { useI18n } from '@/components/i18n-provider';
import { matchesSearch } from '@/lib/search-utils';

export function CustomersTable({ customers }: { customers: CustomerDto[] }) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => customers.filter((c) => matchesSearch(search, c.name, c.phone, c.email)),
    [customers, search],
  );

  return (
    <div className="space-y-3">
      <TableSearch value={search} onChange={setSearch} />
      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('customers.name')}</th>
              <th className="px-4 py-3">{t('customers.phone')}</th>
              <th className="px-4 py-3">{t('customers.email')}</th>
              <th className="px-4 py-3">{t('customers.debtStatus')}</th>
              <th className="px-4 py-3">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{customer.name}</td>
                <td className="px-4 py-3">{customer.phone ?? '—'}</td>
                <td className="px-4 py-3">{customer.email ?? '—'}</td>
                <td className="px-4 py-3"><DebtBadge summary={customer.debtSummary} /></td>
                <td className="px-4 py-3">
                  <Link href={`/customers/${customer.id}`} className="text-primary hover:underline">
                    {t('common.view')}
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  {search ? t('common.noSearchResults') : t('customers.noCustomers')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
