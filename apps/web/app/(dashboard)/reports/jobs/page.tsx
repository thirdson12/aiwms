'use client';

import { useEffect, useState } from 'react';
import { AuthUser, JOB_STATUS_VALUES, JobsReport, isAdminOrOwner } from '@aiwms/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccountingDataTable } from '@/components/accounting-data-table';
import { defaultReportRange, ReportDateFilter } from '@/components/report-date-filter';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';

export default function JobsReportPage() {
  const { t } = useI18n();
  const [range, setRange] = useState(defaultReportRange());
  const [filter, setFilter] = useState(defaultReportRange());
  const [report, setReport] = useState<JobsReport | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');

  async function loadData(from: string, to: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const [data, me] = await Promise.all([
      clientFetch<JobsReport>(`reports/jobs?${params.toString()}`),
      clientFetch<AuthUser>('auth/me'),
    ]);
    setReport(data);
    setUser(me);
  }

  useEffect(() => {
    loadData(filter.from, filter.to).catch((err) => setError(err.message));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('reports.jobs')}</h2>
        <p className="text-sm text-muted">{t('reports.jobsDesc')}</p>
      </div>

      <ReportDateFilter
        from={range.from}
        to={range.to}
        onFromChange={(from) => setRange({ ...range, from })}
        onToChange={(to) => setRange({ ...range, to })}
        onApply={() => setFilter({ ...range })}
        exportType="jobs"
        canExport={user ? isAdminOrOwner(user.role) : false}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('dashboard.totalJobs')}</CardTitle><p className="text-2xl font-bold">{report.total}</p></CardHeader></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('reports.completionRate')}</CardTitle><p className="text-2xl font-bold">%{report.completionRate}</p></CardHeader></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted">{t('dashboard.completed')}</CardTitle><p className="text-2xl font-bold">{report.byStatus.completed}</p></CardHeader></Card>
          </div>

          <div className="flex flex-wrap gap-2">
            {JOB_STATUS_VALUES.map((status) => (
              <Badge key={status} variant={status}>
                {t(`jobStatus.${status}`)}: {report.byStatus[status]}
              </Badge>
            ))}
          </div>

          <AccountingDataTable
            title={t('reports.byWorker')}
            headers={[t('reports.worker'), t('reports.totalJobs'), t('dashboard.completed')]}
            rows={report.byWorker.map((row) => [row.workerName, String(row.total), String(row.completed)])}
            empty={t('reports.noData')}
          />
        </>
      )}
    </div>
  );
}
