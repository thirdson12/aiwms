'use client';

import { useEffect, useState } from 'react';
import { WhatsappRenderResult, WhatsappTemplateDto } from '@aiwms/shared';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/form-controls';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';

export function WhatsappComposer({
  customerId,
  jobId,
  debtId,
}: {
  customerId?: string;
  jobId?: string;
  debtId?: string;
}) {
  const { t, locale } = useI18n();
  const [templates, setTemplates] = useState<WhatsappTemplateDto[]>([]);
  const [selectedKey, setSelectedKey] = useState('car_ready');
  const [rendered, setRendered] = useState<WhatsappRenderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    clientFetch<WhatsappTemplateDto[]>(`whatsapp/templates?locale=${locale}`)
      .then((data) => {
        setTemplates(data);
        if (data[0]) setSelectedKey(data[0].key);
      })
      .catch((err) => setError(err.message));
  }, [locale]);

  async function handleRender() {
    setLoading(true);
    setError('');
    try {
      const result = await clientFetch<WhatsappRenderResult>(
        `whatsapp/templates/${selectedKey}/render?locale=${locale}`,
        {
          method: 'POST',
          body: JSON.stringify({ customerId, jobId, debtId }),
        },
      );
      setRendered(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('whatsapp.title')}</CardTitle>
      </CardHeader>
      <div className="space-y-4">
        <Select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
          {templates.map((template) => (
            <option key={template.id} value={template.key}>
              {template.name}
            </option>
          ))}
        </Select>
        <div className="flex gap-3">
          <Button type="button" onClick={handleRender} disabled={loading}>
            {loading ? t('common.loading') : t('whatsapp.prepareMessage')}
          </Button>
          {rendered?.whatsappUrl && (
            <a
              href={rendered.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-slate-50"
            >
              {t('whatsapp.openWhatsapp')}
            </a>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {rendered && (
          <div className="rounded-lg border border-border bg-slate-50 p-4 text-sm whitespace-pre-wrap">
            {rendered.message}
          </div>
        )}
        {!rendered?.phone && rendered && (
          <p className="text-sm text-muted">{t('whatsapp.noPhone')}</p>
        )}
      </div>
    </Card>
  );
}
