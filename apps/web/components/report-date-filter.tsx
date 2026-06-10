'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/components/i18n-provider';

export function ReportDateFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  exportType,
  canExport,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
  exportType?: string;
  canExport?: boolean;
}) {
  const { t } = useI18n();

  function handleExport() {
    if (!exportType) return;
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    window.open(`/api/proxy/reports/export/${exportType}?${params.toString()}`, '_blank');
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-slate-50 p-4">
      <div className="space-y-1">
        <Label htmlFor="from">{t('reports.fromDate')}</Label>
        <Input id="from" type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to">{t('reports.toDate')}</Label>
        <Input id="to" type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
      </div>
      <Button type="button" onClick={onApply}>
        {t('reports.applyFilter')}
      </Button>
      {canExport && exportType && (
        <Button type="button" variant="outline" onClick={handleExport}>
          {t('reports.exportCsv')}
        </Button>
      )}
    </div>
  );
}

export function defaultReportRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}
