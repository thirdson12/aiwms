'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';

const tabs = [
  { href: '/accounting', icon: LayoutDashboard, labelKey: 'overview' as const, exact: true },
  { href: '/accounting/expenses', icon: TrendingDown, labelKey: 'expenses' as const },
  { href: '/accounting/incomes', icon: TrendingUp, labelKey: 'incomes' as const },
  { href: '/accounting/debts', icon: Wallet, labelKey: 'debtsTab' as const },
];

export function AccountingNav() {
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
            {t(`accounting.${tab.labelKey}`)}
          </Link>
        );
      })}
    </nav>
  );
}
