import Link from 'next/link';
import { JobDto, isAdminOrOwner } from '@aiwms/shared';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { getServerTranslator } from '@/lib/i18n/server';
import { JobsTable } from '@/components/jobs-table';

export default async function JobsPage() {
  const [{ t }, jobs, user] = await Promise.all([
    getServerTranslator(),
    apiFetch<JobDto[]>('/jobs'),
    getCurrentUser(),
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

      <JobsTable jobs={jobs} />
    </div>
  );
}
