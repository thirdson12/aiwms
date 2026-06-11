import Link from 'next/link';
import { ProductDto, isAdminOrOwner } from '@aiwms/shared';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { getServerTranslator } from '@/lib/i18n/server';
import { InventoryTables } from '@/components/inventory-tables';

export default async function InventoryPage() {
  const [{ t }, products, user] = await Promise.all([
    getServerTranslator(),
    apiFetch<ProductDto[]>('/products?includeInactive=true'),
    getCurrentUser(),
  ]);

  const canCreate = !!user;
  const canManage = user && isAdminOrOwner(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
          <p className="text-muted">
            {canManage ? t('inventory.subtitleAll') : t('inventory.subtitleWorker')}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/inventory/new"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-blue-700"
          >
            {t('inventory.newProduct')}
          </Link>
        )}
      </div>

      <InventoryTables products={products} />
    </div>
  );
}
