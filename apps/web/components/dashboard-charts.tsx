'use client';

import { DashboardStats, formatMoney } from '@aiwms/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/components/i18n-provider';

const JOB_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

function formatMonthLabel(label: string, locale: string) {
  const [year, month] = label.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    month: 'short',
  });
}

function DonutChart({
  segments,
  totalLabel,
}: {
  segments: { key: string; label: string; value: number; color: string }[];
  totalLabel: string;
}) {
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted">
        —
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="18" />
        {segments.map((segment) => {
          if (segment.value <= 0) return null;
          const dash = (segment.value / total) * circumference;
          const circle = (
            <circle
              key={segment.key}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += dash;
          return circle;
        })}
        <text x="70" y="66" textAnchor="middle" className="fill-slate-900 text-xl font-bold">
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" className="fill-slate-500 text-[10px]">
          {totalLabel}
        </text>
      </svg>
      <div className="grid w-full gap-2">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span>{segment.label}</span>
            </div>
            <span className="font-medium">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBars({
  items,
  maxValue,
  formatValue,
}: {
  items: { label: string; value: number; color: string }[];
  maxValue: number;
  formatValue?: (value: number) => string;
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const width = maxValue > 0 ? Math.max((item.value / maxValue) * 100, item.value > 0 ? 4 : 0) : 0;
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span className="font-medium">{formatValue ? formatValue(item.value) : item.value}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full transition-all"
                style={{ width: `${width}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyBars({
  data,
  locale,
  incomeLabel,
  expenseLabel,
}: {
  data: DashboardStats['charts']['monthlyFinance'];
  locale: string;
  incomeLabel: string;
  expenseLabel: string;
}) {
  const maxValue = Math.max(...data.flatMap((point) => [point.income, point.expenses]), 1);

  return (
    <div className="space-y-5">
      {data.map((point) => (
        <div key={point.label} className="space-y-2">
          <p className="text-sm font-medium">{formatMonthLabel(point.label, locale)}</p>
          <div className="grid gap-2">
            <div className="flex items-center gap-3">
              <span className="w-14 text-xs text-muted">{incomeLabel}</span>
              <div className="h-2 flex-1 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${(point.income / maxValue) * 100}%` }}
                />
              </div>
              <span className="w-20 text-right text-xs font-medium">
                {formatMoney(point.income, locale === 'tr' ? 'tr-TR' : 'en-US')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-14 text-xs text-muted">{expenseLabel}</span>
              <div className="h-2 flex-1 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-red-500"
                  style={{ width: `${(point.expenses / maxValue) * 100}%` }}
                />
              </div>
              <span className="w-20 text-right text-xs font-medium">
                {formatMoney(point.expenses, locale === 'tr' ? 'tr-TR' : 'en-US')}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardCharts({
  stats,
  showFinance,
}: {
  stats: DashboardStats;
  showFinance: boolean;
}) {
  const { t, locale } = useI18n();
  const moneyLocale = locale === 'tr' ? 'tr-TR' : 'en-US';

  const jobSegments = [
    { key: 'pending', label: t('dashboard.pending'), value: stats.charts.jobStatus.pending, color: JOB_COLORS.pending },
    { key: 'in_progress', label: t('dashboard.inProgress'), value: stats.charts.jobStatus.in_progress, color: JOB_COLORS.in_progress },
    { key: 'completed', label: t('dashboard.completed'), value: stats.charts.jobStatus.completed, color: JOB_COLORS.completed },
    { key: 'cancelled', label: t('dashboard.cancelled'), value: stats.charts.jobStatus.cancelled, color: JOB_COLORS.cancelled },
  ];

  const financeMax = Math.max(stats.charts.finance.income, stats.charts.finance.expenses, 1);

  return (
    <div className={`grid gap-4 ${showFinance ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.jobStatusChart')}</CardTitle>
        </CardHeader>
        <DonutChart segments={jobSegments} totalLabel={t('dashboard.totalJobs')} />
      </Card>

      {showFinance && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.financeChart')}</CardTitle>
            </CardHeader>
            <HorizontalBars
              maxValue={financeMax}
              formatValue={(value) => formatMoney(value, moneyLocale)}
              items={[
                { label: t('dashboard.incomeLabel'), value: stats.charts.finance.income, color: '#22c55e' },
                { label: t('dashboard.expenseLabel'), value: stats.charts.finance.expenses, color: '#ef4444' },
              ]}
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.monthlyChart')}</CardTitle>
            </CardHeader>
            <MonthlyBars
              data={stats.charts.monthlyFinance}
              locale={locale}
              incomeLabel={t('dashboard.incomeLabel')}
              expenseLabel={t('dashboard.expenseLabel')}
            />
          </Card>
        </>
      )}
    </div>
  );
}
