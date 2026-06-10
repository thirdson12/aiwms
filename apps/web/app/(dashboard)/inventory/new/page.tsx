'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';

export default function NewProductPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('adet');
  const [quantityOnHand, setQuantityOnHand] = useState('0');
  const [minStockLevel, setMinStockLevel] = useState('0');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const product = await clientFetch<{ id: string }>('products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          sku,
          description: description || undefined,
          unit,
          quantityOnHand: Number(quantityOnHand),
          minStockLevel: Number(minStockLevel),
        }),
      });
      router.push(`/inventory/${product.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('inventory.createTitle')}</h1>
        <p className="text-muted">{t('inventory.createSubtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('inventory.detailTitle')}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('inventory.name')}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">{t('inventory.sku')}</Label>
            <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('jobs.description')}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="unit">{t('inventory.unit')}</Label>
              <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('inventory.initialStock')}</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantityOnHand}
                onChange={(e) => setQuantityOnHand(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">{t('inventory.minStock')}</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? t('jobs.creating') : t('common.create')}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
