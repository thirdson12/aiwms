'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthUser,
  CustomerDto,
  JobDto,
  JobStatus,
  JOB_STATUS_VALUES,
  RoleName,
  UserDto,
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
import { DebtBadge } from '@/components/debt-badge';
import { WhatsappComposer } from '@/components/whatsapp-composer';
import { formatDate } from '@/lib/utils';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [jobId, setJobId] = useState('');
  const [job, setJob] = useState<JobDto | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workers, setWorkers] = useState<UserDto[]>([]);
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<JobStatus>(JobStatus.PENDING);
  const [assignedToId, setAssignedToId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(({ id }) => setJobId(id));
  }, [params]);

  useEffect(() => {
    if (!jobId) return;

    Promise.all([clientFetch<JobDto>(`jobs/${jobId}`), clientFetch<AuthUser>('auth/me')])
      .then(([jobData, userData]) => {
        setJob(jobData);
        setUser(userData);
        setTitle(jobData.title);
        setDescription(jobData.description ?? '');
        setStatus(jobData.status);
        setAssignedToId(jobData.assignedToId ?? '');
        setCustomerId(jobData.customerId ?? '');
        setDueDate(jobData.dueDate ? jobData.dueDate.slice(0, 10) : '');

        if (isAdminOrOwner(userData.role)) {
          return Promise.all([
            clientFetch<UserDto[]>('users/workers'),
            clientFetch<CustomerDto[]>('customers'),
          ]).then(([workersData, customersData]) => {
            setWorkers(workersData);
            setCustomers(customersData);
          });
        }
      })
      .catch((err) => setError(err.message));
  }, [jobId]);

  const isWorker = user?.role === RoleName.WORKER;
  const canEdit = user && isAdminOrOwner(user.role);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!jobId) return;

    setLoading(true);
    setError('');

    try {
      const payload = isWorker
        ? { status }
        : {
            title,
            description,
            status,
            assignedToId: assignedToId || null,
            customerId: customerId || null,
            dueDate: dueDate || null,
          };

      await clientFetch(`jobs/${jobId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      router.refresh();
      const updated = await clientFetch<JobDto>(`jobs/${jobId}`);
      setJob(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!jobId || !confirm(t('jobs.deleteConfirm'))) return;

    try {
      await clientFetch(`jobs/${jobId}`, { method: 'DELETE' });
      router.push('/jobs');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    }
  }

  if (!job) {
    return <p className="text-muted">{t('common.loading')}</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-muted">
            {t('jobs.created')} {formatDate(job.createdAt, locale)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={job.status}>{t(`jobStatus.${job.status}`)}</Badge>
          <DebtBadge summary={job.debtSummary} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isWorker ? t('jobs.updateStatus') : t('jobs.editTitle')}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isWorker && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">{t('jobs.titleCol')}</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('jobs.description')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerId">{t('jobs.customer')}</Label>
                <Select
                  id="customerId"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">{t('jobs.noCustomer')}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedToId">{t('jobs.assignedTo')}</Label>
                <Select
                  id="assignedToId"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                >
                  <option value="">{t('jobs.unassigned')}</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.fullName}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">{t('jobs.dueDate')}</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="status">{t('common.status')}</Label>
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
            >
              {JOB_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(`jobStatus.${value}`)}
                </option>
              ))}
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? t('jobs.saving') : t('jobs.saveChanges')}
            </Button>
            {canEdit && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                {t('common.delete')}
              </Button>
            )}
          </div>
        </form>
      </Card>

      {job.customerId && (
        <WhatsappComposer customerId={job.customerId} jobId={job.id} />
      )}
    </div>
  );
}
