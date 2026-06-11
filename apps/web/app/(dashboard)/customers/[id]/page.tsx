'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AuthUser,
  CustomerDto,
  JobDto,
  isAdminOrOwner,
} from '@aiwms/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/form-controls';
import { DebtBadge } from '@/components/debt-badge';
import { DebtManageSection } from '@/components/job-workshop-sections';
import { WhatsappComposer } from '@/components/whatsapp-composer';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';
import { formatDate } from '@/lib/utils';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [customerId, setCustomerId] = useState('');
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canEdit = user && isAdminOrOwner(user.role);

  useEffect(() => {
    params.then(({ id }) => setCustomerId(id));
  }, [params]);

  async function loadData() {
    if (!customerId) return;
    const [customerData, allJobs, me] = await Promise.all([
      clientFetch<CustomerDto>(`customers/${customerId}`),
      clientFetch<JobDto[]>('jobs'),
      clientFetch<AuthUser>('auth/me'),
    ]);
    setCustomer(customerData);
    setJobs(allJobs.filter((job) => job.customerId === customerId));
    setUser(me);
    setName(customerData.name);
    setPhone(customerData.phone ?? '');
    setEmail(customerData.email ?? '');
    setNotes(customerData.notes ?? '');
  }

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, [customerId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;
    setLoading(true);
    setError('');
    try {
      const updated = await clientFetch<CustomerDto>(`customers/${customerId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          phone: phone || null,
          email: email || null,
          notes: notes || null,
        }),
      });
      setCustomer(updated);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (!customer) {
    return <p className="text-muted">{t('common.loading')}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-muted">{customer.phone ?? t('whatsapp.noPhone')}</p>
        </div>
        <DebtBadge summary={customer.debtSummary} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{editing ? t('customers.editTitle') : t('customers.detailTitle')}</CardTitle>
          {canEdit && !editing && (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
              {t('common.edit')}
            </Button>
          )}
        </CardHeader>
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('customers.name')}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('customers.phone')}</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('customers.email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('customers.notes')}</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? t('jobs.saving') : t('common.save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setName(customer.name);
                  setPhone(customer.phone ?? '');
                  setEmail(customer.email ?? '');
                  setNotes(customer.notes ?? '');
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">{t('customers.email')}:</span> {customer.email ?? '—'}</p>
            <p><span className="font-medium">{t('customers.notes')}:</span> {customer.notes ?? '—'}</p>
          </div>
        )}
      </Card>

      {canEdit && (
        <DebtManageSection
          customerId={customer.id}
          jobOptions={jobs.map((j) => ({ id: j.id, title: j.title }))}
          canManage={!!canEdit}
          onUpdated={loadData}
        />
      )}

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-border px-4 py-3 font-semibold">{t('customers.jobsTitle')}</div>
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('jobs.titleCol')}</th>
              <th className="px-4 py-3">{t('jobs.plateNumber')}</th>
              <th className="px-4 py-3">{t('common.status')}</th>
              <th className="px-4 py-3">{t('jobs.dueDate')}</th>
              <th className="px-4 py-3">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{job.title}</td>
                <td className="px-4 py-3">{job.plateNumber ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={job.status}>{t(`jobStatus.${job.status}`)}</Badge>
                </td>
                <td className="px-4 py-3">{formatDate(job.dueDate, locale)}</td>
                <td className="px-4 py-3">
                  <Link href={`/jobs/${job.id}`} className="text-primary hover:underline">
                    {t('common.view')}
                  </Link>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  {t('customers.noJobs')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <WhatsappComposer customerId={customer.id} />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
