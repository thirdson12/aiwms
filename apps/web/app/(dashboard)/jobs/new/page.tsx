'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserDto, CustomerDto, JobServiceType, JOB_SERVICE_TYPE_VALUES } from '@aiwms/shared';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, Textarea } from '@/components/ui/form-controls';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';

export default function NewJobPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [workers, setWorkers] = useState<UserDto[]>([]);
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState<JobServiceType>(JobServiceType.NORMAL_SERVICE);
  const [plateNumber, setPlateNumber] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      clientFetch<UserDto[]>('users/workers'),
      clientFetch<CustomerDto[]>('customers'),
    ])
      .then(([workersData, customersData]) => {
        setWorkers(workersData);
        setCustomers(customersData);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const job = await clientFetch<{ id: string }>('jobs', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || undefined,
          serviceType,
          plateNumber: plateNumber || undefined,
          assignedToId: assignedToId || undefined,
          customerId: customerId || undefined,
          dueDate: dueDate || undefined,
        }),
      });
      router.push(`/jobs/${job.id}`);
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
        <h1 className="text-2xl font-bold">{t('jobs.createTitle')}</h1>
        <p className="text-muted">{t('jobs.createSubtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('jobs.details')}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="serviceType">{t('jobs.serviceType')}</Label>
            <Select id="serviceType" value={serviceType} onChange={(e) => setServiceType(e.target.value as JobServiceType)}>
              {JOB_SERVICE_TYPE_VALUES.map((value) => (
                <option key={value} value={value}>{t(`jobServiceType.${value}`)}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plateNumber">{t('jobs.plateNumber')}</Label>
            <Input id="plateNumber" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value.toUpperCase())} placeholder="34 ABC 123" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerId">{t('jobs.customer')}</Label>
            <Select id="customerId" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">{t('jobs.noCustomer')}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedToId">{t('jobs.assignWorker')}</Label>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? t('jobs.creating') : t('jobs.newJob')}
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
