'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthUser,
  ProductDto,
  StockTransactionDto,
  StockTransactionType,
  STOCK_TRANSACTION_TYPE_VALUES,
  isAdminOrOwner,
} from '@aiwms/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, Textarea } from '@/components/ui/form-controls';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';
import { formatDateTime } from '@/lib/utils';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [productId, setProductId] = useState('');
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [transactions, setTransactions] = useState<StockTransactionDto[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [type, setType] = useState<StockTransactionType>(StockTransactionType.STOCK_IN);
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(({ id }) => setProductId(id));
  }, [params]);

  async function loadData(id: string) {
    const [productData, txData, userData] = await Promise.all([
      clientFetch<ProductDto>(`products/${id}`),
      clientFetch<StockTransactionDto[]>(`products/${id}/transactions`),
      clientFetch<AuthUser>('auth/me'),
    ]);
    setProduct(productData);
    setTransactions(txData);
    setUser(userData);
  }

  useEffect(() => {
    if (!productId) return;
    loadData(productId).catch((err) => setError(err.message));
  }, [productId]);

  const canManage = user && isAdminOrOwner(user.role);

  async function handleMovement(event: React.FormEvent) {
    event.preventDefault();
    if (!productId) return;

    setLoading(true);
    setError('');

    try {
      await clientFetch(`products/${productId}/transactions`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          quantity: Number(quantity),
          notes: notes || undefined,
        }),
      });
      setNotes('');
      setQuantity('1');
      await loadData(productId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate() {
    if (!productId || !confirm(t('inventory.deactivateConfirm'))) return;

    try {
      await clientFetch(`products/${productId}`, { method: 'DELETE' });
      router.push('/inventory');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    }
  }

  if (!product) {
    return <p className="text-muted">{t('common.loading')}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-muted">{product.sku}</p>
        </div>
        {product.isLowStock ? (
          <Badge variant="pending">{t('inventory.lowStock')}</Badge>
        ) : (
          <Badge variant="completed">{t('common.active')}</Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">{t('inventory.quantity')}</CardTitle>
            <p className="text-2xl font-bold">
              {product.quantityOnHand} {product.unit}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">{t('inventory.minStock')}</CardTitle>
            <p className="text-2xl font-bold">{product.minStockLevel}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">{t('inventory.unit')}</CardTitle>
            <p className="text-2xl font-bold">{product.unit}</p>
          </CardHeader>
        </Card>
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>{t('inventory.addMovement')}</CardTitle>
          </CardHeader>
          <form onSubmit={handleMovement} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">{t('inventory.movementType')}</Label>
                <Select id="type" value={type} onChange={(e) => setType(e.target.value as StockTransactionType)}>
                  {STOCK_TRANSACTION_TYPE_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {t(`stockType.${value}`)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">{t('inventory.movementQty')}</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>
            {type === StockTransactionType.ADJUSTMENT && (
              <p className="text-sm text-muted">{t('inventory.adjustmentHint')}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('inventory.notes')}</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? t('jobs.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeactivate}>
                {t('inventory.deactivate')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">{t('inventory.stockMovements')}</h2>
        </div>
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t('inventory.date')}</th>
              <th className="px-4 py-3 font-medium">{t('inventory.movementType')}</th>
              <th className="px-4 py-3 font-medium">{t('inventory.movementQty')}</th>
              <th className="px-4 py-3 font-medium">{t('inventory.by')}</th>
              <th className="px-4 py-3 font-medium">{t('inventory.notes')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{formatDateTime(tx.createdAt, locale)}</td>
                <td className="px-4 py-3 capitalize">{t(`stockType.${tx.type}`)}</td>
                <td className="px-4 py-3">{tx.quantity}</td>
                <td className="px-4 py-3">{tx.createdBy?.fullName ?? '—'}</td>
                <td className="px-4 py-3">{tx.notes ?? '—'}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  {t('common.none')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
