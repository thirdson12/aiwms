import Link from 'next/link';
import { CustomerDto } from '@aiwms/shared';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { getServerTranslator } from '@/lib/i18n/server';
import { CustomersTable } from '@/components/customers-table';

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

      <CustomersTable customers={customers} />
    </div>
  );
}
