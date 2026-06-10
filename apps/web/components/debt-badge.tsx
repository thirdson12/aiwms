'use client';

import { JobDebtSummary, DebtStatus } from '@aiwms/shared';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/components/i18n-provider';

export function DebtBadge({ summary }: { summary?: JobDebtSummary }) {
  const { t } = useI18n();

  if (!summary || summary.status === DebtStatus.NONE || summary.status === DebtStatus.PAID) {
    return <Badge variant="none">{t('debts.noDebt')}</Badge>;
  }

  return (
    <Badge variant={summary.status}>
      {t(`debtStatus.${summary.status}`)}
    </Badge>
  );
}
