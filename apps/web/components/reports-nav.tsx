'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Briefcase,
  LayoutDashboard,
  Package,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';

const tabs = [
  { href: '/reports', icon: LayoutDashboard, labelKey: 'overview' as const, exact: true },
  { href: '/reports/financial', icon: TrendingUp, labelKey: 'financial' as const },
  { href: '/reports/jobs', icon: Briefcase, labelKey: 'jobs' as const },
  { href: '/reports/inventory', icon: Package, labelKey: 'inventory' as const },
  { href: '/reports/debts', icon: Wallet, labelKey: 'debts' as const },
];

export function ReportsNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-slate-100 text-foreground hover:bg-slate-200',
            )}
          >
            <Icon className="h-4 w-4" />
            {t(`reports.${tab.labelKey}`)}
          </Link>
        );
      })}
    </nav>
  );
}

export function ReportsOverviewIcon() {
  return <BarChart3 className="h-5 w-5" />;
}
