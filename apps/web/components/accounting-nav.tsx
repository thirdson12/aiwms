'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthUser, RoleName } from '@aiwms/shared';
import { LayoutDashboard, TrendingDown, TrendingUp, Wallet, ArchiveRestore } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';

const baseTabs = [
  { href: '/accounting', icon: LayoutDashboard, labelKey: 'overview' as const, exact: true },
  { href: '/accounting/expenses', icon: TrendingDown, labelKey: 'expenses' as const },
  { href: '/accounting/incomes', icon: TrendingUp, labelKey: 'incomes' as const },
  { href: '/accounting/debts', icon: Wallet, labelKey: 'debtsTab' as const },
];

export function AccountingNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    clientFetch<AuthUser>('auth/me')
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const tabs =
    user?.role === RoleName.ADMIN
      ? [
          ...baseTabs,
          {
            href: '/accounting/deleted-debts',
            icon: ArchiveRestore,
            labelKey: 'deletedDebtsTab' as const,
            exact: false,
          },
        ]
      : baseTabs;

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
