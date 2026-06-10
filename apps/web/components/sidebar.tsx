'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthUser, RoleName, isAdminOrOwner } from '@aiwms/shared';
import {
  Briefcase,
  Calculator,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Users,
  UserRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';

export function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const navItems = [
    { href: '/', label: t('nav.dashboard'), icon: LayoutDashboard, roles: 'all' as const },
    { href: '/jobs', label: t('nav.jobs'), icon: Briefcase, roles: 'all' as const },
    { href: '/inventory', label: t('nav.inventory'), icon: Package, roles: 'all' as const },
    { href: '/customers', label: t('nav.customers'), icon: UserRound, roles: 'all' as const },
    { href: '/accounting', label: t('nav.accounting'), icon: Calculator, roles: 'all' as const },
    { href: '/reports', label: t('nav.reports'), icon: BarChart3, roles: 'all' as const },
    {
      href: '/users',
      label: t('nav.users'),
      icon: Users,
      roles: [RoleName.ADMIN, RoleName.OWNER] as RoleName[],
    },
    { href: '/settings', label: t('nav.settings'), icon: Settings, roles: 'all' as const },
  ];

  const visibleItems = navItems.filter((item) => {
    if (item.roles === 'all') return true;
    return item.roles.includes(user.role);
  });

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <p className="text-lg font-bold">{t('nav.brand')}</p>
        <p className="text-sm text-muted">{t('nav.subtitle')}</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-slate-100',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium">{user.fullName}</p>
          <p className="text-xs text-muted">{t(`roles.${user.role}`)}</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <Button type="submit" variant="outline" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />
            {t('nav.signOut')}
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card lg:block">
        {content}
      </div>
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-card shadow-xl">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-3 top-3"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
