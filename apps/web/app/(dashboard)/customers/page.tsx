import Link from 'next/link';
import { CustomerDto } from '@aiwms/shared';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { getServerTranslator } from '@/lib/i18n/server';
import { Card } from '@/components/ui/card';
import { DebtBadge } from '@/components/debt-badge';

export default async function CustomersPage() {
  const [{ t }, customers, user] = await Promise.all([
    getServerTranslator(),
    apiFetch<CustomerDto[]>('/customers'),
    getCurrentUser(),
  ]);

  const canCreate = !!user;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('customers.title')}</h1>
          <p className="text-muted">{t('customers.subtitle')}</p>
        </div>
        {canCreate && (
          <Link href="/customers/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-blue-700">
            {t('customers.newCustomer')}
          </Link>
        )}
      </div>

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
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{customer.name}</td>
                <td className="px-4 py-3">{customer.phone ?? '—'}</td>
                <td className="px-4 py-3">{customer.email ?? '—'}</td>
                <td className="px-4 py-3"><DebtBadge summary={customer.debtSummary} /></td>
                <td className="px-4 py-3">
                  <Link href={`/customers/${customer.id}`} className="text-primary hover:underline">{t('common.view')}</Link>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">{t('customers.noCustomers')}</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
