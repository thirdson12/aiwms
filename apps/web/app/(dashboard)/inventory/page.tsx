import Link from 'next/link';
import { ProductDto, isAdminOrOwner } from '@aiwms/shared';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { getServerTranslator } from '@/lib/i18n/server';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t('inventory.name')}</th>
              <th className="px-4 py-3 font-medium">{t('inventory.sku')}</th>
              <th className="px-4 py-3 font-medium">{t('inventory.quantity')}</th>
              <th className="px-4 py-3 font-medium">{t('inventory.unit')}</th>
              <th className="px-4 py-3 font-medium">{t('common.status')}</th>
              <th className="px-4 py-3 font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3">{product.sku}</td>
                <td className="px-4 py-3">{product.quantityOnHand}</td>
                <td className="px-4 py-3">{product.unit}</td>
                <td className="px-4 py-3">
                  {!product.isActive ? (
                    <Badge variant="cancelled">{t('common.inactive')}</Badge>
                  ) : product.isLowStock ? (
                    <Badge variant="pending">{t('inventory.lowStock')}</Badge>
                  ) : (
                    <Badge variant="completed">{t('common.active')}</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/inventory/${product.id}`} className="text-primary hover:underline">
                    {t('common.view')}
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  {t('inventory.noProducts')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
