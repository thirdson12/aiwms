'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { JobDto } from '@aiwms/shared';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DebtBadge } from '@/components/debt-badge';
import { TableSearch } from '@/components/table-search';
import { useI18n } from '@/components/i18n-provider';
import { formatDate } from '@/lib/utils';
import { matchesSearch } from '@/lib/search-utils';

export function JobsTable({ jobs }: { jobs: JobDto[] }) {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      jobs.filter((job) =>
        matchesSearch(search, job.title, job.plateNumber, job.customer?.name, job.assignedTo?.fullName),
      ),
    [jobs, search],
  );

  return (
    <div className="space-y-3">
      <TableSearch value={search} onChange={setSearch} />
      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t('jobs.titleCol')}</th>
              <th className="px-4 py-3 font-medium">{t('jobs.plateNumber')}</th>
              <th className="px-4 py-3 font-medium">{t('jobs.customer')}</th>
              <th className="px-4 py-3 font-medium">{t('jobs.debt')}</th>
              <th className="px-4 py-3 font-medium">{t('common.status')}</th>
              <th className="px-4 py-3 font-medium">{t('jobs.assignedTo')}</th>
              <th className="px-4 py-3 font-medium">{t('jobs.dueDate')}</th>
              <th className="px-4 py-3 font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => (
              <tr key={job.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{job.title}</td>
                <td className="px-4 py-3">{job.plateNumber ?? '—'}</td>
                <td className="px-4 py-3">{job.customer?.name ?? t('jobs.noCustomer')}</td>
                <td className="px-4 py-3">
                  <DebtBadge summary={job.debtSummary} />
                </td>
                <td className="px-4 py-3">
                  <Badge variant={job.status}>{t(`jobStatus.${job.status}`)}</Badge>
                </td>
                <td className="px-4 py-3">{job.assignedTo?.fullName ?? t('jobs.unassigned')}</td>
                <td className="px-4 py-3">{formatDate(job.dueDate, locale)}</td>
                <td className="px-4 py-3">
                  <Link href={`/jobs/${job.id}`} className="text-primary hover:underline">
                    {t('common.view')}
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  {search ? t('common.noSearchResults') : t('jobs.noJobs')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
