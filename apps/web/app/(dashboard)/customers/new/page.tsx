'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/form-controls';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';

export default function NewCustomerPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const customer = await clientFetch<{ id: string }>('customers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone: phone || undefined,
          email: email || undefined,
          notes: notes || undefined,
        }),
      });
      router.push(`/customers/${customer.id}`);
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
        <h1 className="text-2xl font-bold">{t('customers.createTitle')}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>{t('customers.detailTitle')}</CardTitle></CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name">{t('customers.name')}</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="phone">{t('customers.phone')}</Label><Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="email">{t('customers.email')}</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="notes">{t('customers.notes')}</Label><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? t('users.creating') : t('common.create')}</Button>
        </form>
      </Card>
    </div>
  );
}
