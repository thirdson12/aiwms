'use client';

import Link from 'next/link';
import { Briefcase, Package, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/components/i18n-provider';

export default function ReportsOverviewPage() {
  const { t } = useI18n();

  const links = [
    {
      href: '/reports/financial',
      icon: TrendingUp,
      title: t('reports.financial'),
      description: t('reports.financialDesc'),
    },
    {
      href: '/reports/jobs',
      icon: Briefcase,
      title: t('reports.jobs'),
      description: t('reports.jobsDesc'),
    },
    {
      href: '/reports/inventory',
      icon: Package,
      title: t('reports.inventory'),
      description: t('reports.inventoryDesc'),
    },
    {
      href: '/reports/debts',
      icon: Wallet,
      title: t('reports.debts'),
      description: t('reports.debtsDesc'),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <Icon className="h-5 w-5" />
                  <CardTitle className="text-base">{link.title}</CardTitle>
                </div>
                <p className="text-sm text-muted">{link.description}</p>
              </CardHeader>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
