'use client';

import { useEffect, useState } from 'react';
import { CustomerDto } from '@aiwms/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DebtBadge } from '@/components/debt-badge';
import { WhatsappComposer } from '@/components/whatsapp-composer';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n();
  const [customerId, setCustomerId] = useState('');
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then(({ id }) => setCustomerId(id));
  }, [params]);

  useEffect(() => {
    if (!customerId) return;
    clientFetch<CustomerDto>(`customers/${customerId}`)
      .then(setCustomer)
      .catch((err) => setError(err.message));
  }, [customerId]);

  if (!customer) {
    return <p className="text-muted">{t('common.loading')}</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-muted">{customer.phone ?? t('whatsapp.noPhone')}</p>
        </div>
        <DebtBadge summary={customer.debtSummary} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('customers.detailTitle')}</CardTitle>
        </CardHeader>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">{t('customers.email')}:</span> {customer.email ?? '—'}</p>
          <p><span className="font-medium">{t('customers.notes')}:</span> {customer.notes ?? '—'}</p>
        </div>
      </Card>

      <WhatsappComposer customerId={customer.id} />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
