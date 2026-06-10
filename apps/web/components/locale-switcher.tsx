'use client';

import { useRouter } from 'next/navigation';
import { Locale } from '@/lib/i18n';
import { useI18n } from '@/components/i18n-provider';
import { Select } from '@/components/ui/form-controls';
import { Label } from '@/components/ui/label';

export function LocaleSwitcher() {
  const router = useRouter();
  const { locale, t } = useI18n();

  async function handleChange(nextLocale: Locale) {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: nextLocale }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="locale">{t('common.language')}</Label>
      <Select
        id="locale"
        value={locale}
        onChange={(e) => handleChange(e.target.value as Locale)}
      >
        <option value="tr">{t('common.turkish')}</option>
        <option value="en">{t('common.english')}</option>
      </Select>
    </div>
  );
}
