import Link from 'next/link';
import { JobDto, isAdminOrOwner } from '@aiwms/shared';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { getLocale, getServerTranslator } from '@/lib/i18n/server';
import { Card } from '@/components/ui/card';
import { DebtBadge } from '@/components/debt-badge';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default async function JobsPage() {
  const [{ t }, jobs, user, locale] = await Promise.all([
    getServerTranslator(),
    apiFetch<JobDto[]>('/jobs'),
    getCurrentUser(),
    getLocale(),
  ]);

  const canCreate = user && isAdminOrOwner(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('jobs.title')}</h1>
          <p className="text-muted">
            {canCreate ? t('jobs.subtitleAll') : t('jobs.subtitleWorker')}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/jobs/new"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-blue-700"
          >
            {t('jobs.newJob')}
          </Link>
        )}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t('jobs.titleCol')}</th>
              <th className="px-4 py-3 font-medium">{t('jobs.customer')}</th>
              <th className="px-4 py-3 font-medium">{t('jobs.debt')}</th>
              <th className="px-4 py-3 font-medium">{t('common.status')}</th>
              <th className="px-4 py-3 font-medium">{t('jobs.assignedTo')}</th>
              <th className="px-4 py-3 font-medium">{t('jobs.dueDate')}</th>
              <th className="px-4 py-3 font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{job.title}</td>
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
            {jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  {t('jobs.noJobs')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
