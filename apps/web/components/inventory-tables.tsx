'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ProductDto, ProductCategory } from '@aiwms/shared';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableSearch } from '@/components/table-search';
import { useI18n } from '@/components/i18n-provider';
import { matchesSearch } from '@/lib/search-utils';

function ProductTable({
  items,
  title,
  search,
}: {
  items: ProductDto[];
  title: string;
  search: string;
}) {
  const { t } = useI18n();

  const filtered = useMemo(
    () => items.filter((p) => matchesSearch(search, p.name, p.sku, p.description)),
    [items, search],
  );

  return (
    <Card className="overflow-x-auto p-0">
      <div className="border-b border-border px-4 py-3 font-semibold">{title}</div>
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
          {filtered.map((product) => (
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
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted">
                {search ? t('common.noSearchResults') : t('inventory.noProducts')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

export function InventoryTables({ products }: { products: ProductDto[] }) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  const transmissions = products.filter((p) => p.category === ProductCategory.TRANSMISSION);
  const serviceParts = products.filter((p) => p.category === ProductCategory.SERVICE_PART);

  return (
    <div className="space-y-4">
      <TableSearch value={search} onChange={setSearch} />
      <ProductTable items={transmissions} title={t('inventory.transmissionStock')} search={search} />
      <ProductTable items={serviceParts} title={t('inventory.servicePartsStock')} search={search} />
    </div>
  );
}
