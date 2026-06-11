'use client';

import Link from 'next/link';
import { AuthUser, RoleName, isAdminOrOwner } from '@aiwms/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/components/i18n-provider';

export function DashboardQuickActions({ user }: { user: AuthUser }) {
  const { t } = useI18n();
  const canManageAccounting = isAdminOrOwner(user.role);
  const canCreateJob = canManageAccounting;

  const actions = [
    canCreateJob && { href: '/jobs/new', label: t('dashboard.quickJob'), desc: t('dashboard.quickJobDesc') },
    { href: '/customers/new', label: t('dashboard.quickCustomer'), desc: t('dashboard.quickCustomerDesc') },
    canManageAccounting && { href: '/accounting/debts', label: t('dashboard.quickDebt'), desc: t('dashboard.quickDebtDesc') },
    { href: '/inventory/new', label: t('dashboard.quickInventory'), desc: t('dashboard.quickInventoryDesc') },
  ].filter(Boolean) as Array<{ href: string; label: string; desc: string }>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.quickActions')}</CardTitle>
      </CardHeader>
      <div className="grid gap-3 p-4 pt-0 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-lg border border-border bg-slate-50 p-4 transition hover:border-primary hover:bg-white"
          >
            <div className="font-semibold">{action.label}</div>
            <div className="mt-1 text-sm text-muted">{action.desc}</div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
