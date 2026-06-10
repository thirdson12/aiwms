'use client';

import { useEffect, useState } from 'react';
import { AuthUser, InventoryReport, isAdminOrOwner } from '@aiwms/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AccountingDataTable } from '@/components/accounting-data-table';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';
import { formatDateTime } from '@/lib/utils';

export default function InventoryReportPage() {
  const { t, locale } = useI18n();
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      clientFetch<InventoryReport>('reports/inventory'),
      clientFetch<AuthUser>('auth/me'),
    ])
      .then(([data, me]) => {
        setReport(data);
        setUser(me);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{t('reports.inventory')}</h2>
          <p className="text-sm text-muted">{t('reports.inventoryDesc')}</p>
        </div>
        {user && isAdminOrOwner(user.role) && (
          <Button type="button" variant="outline" onClick={() => window.open('/api/proxy/reports/export/inventory', '_blank')}>
            {t('reports.exportCsv')}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('dashboard.totalProducts')}</CardTitle><p className="text-2xl font-bold">{report.totalProducts}</p></CardHeader></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('reports.activeProducts')}</CardTitle><p className="text-2xl font-bold">{report.activeProducts}</p></CardHeader></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('dashboard.lowStock')}</CardTitle><p className="text-2xl font-bold">{report.lowStockCount}</p></CardHeader></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('reports.stockIn')}</CardTitle><p className="text-2xl font-bold">{report.movementsSummary.stock_in}</p></CardHeader></Card>
          </div>

          <AccountingDataTable
            title={t('reports.lowStockList')}
            headers={[t('inventory.name'), t('inventory.sku'), t('inventory.quantity'), t('common.status')]}
            rows={report.lowStockProducts.map((p) => [
              p.name,
              p.sku,
              String(p.quantityOnHand),
              p.isActive ? t('common.active') : t('common.inactive'),
            ])}
            empty={t('reports.noLowStock')}
          />

          <AccountingDataTable
            title={t('reports.recentMovements')}
            headers={[t('inventory.name'), t('reports.movementType'), t('inventory.quantity'), t('accounting.date')]}
            rows={report.recentMovements.map((m) => [
              m.productName,
              t(`stockType.${m.type}`),
              String(m.quantity),
              formatDateTime(m.createdAt, locale),
            ])}
            empty={t('reports.noData')}
          />
        </>
      )}
    </div>
  );
}
