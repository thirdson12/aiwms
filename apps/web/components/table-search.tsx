'use client';

import { Input } from '@/components/ui/input';
import { useI18n } from '@/components/i18n-provider';

export function TableSearch({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('common.searchByName')}
      className={className ?? 'max-w-sm'}
    />
  );
}
