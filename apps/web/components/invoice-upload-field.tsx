'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { Label } from '@/components/ui/label';
import { clientUploadInvoice } from '@/lib/client-api';
import { invoiceProxyUrl, isInvoiceImage } from '@/lib/invoice-utils';

export function InvoiceUploadField({
  fileName,
  onChange,
}: {
  fileName: string;
  onChange: (fileName: string) => void;
}) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const result = await clientUploadInvoice(file);
      if (!result.fileName) {
        throw new Error(t('errors.requestFailed'));
      }
      onChange(result.fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
      onChange('');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="col-span-full space-y-3 rounded-lg border border-dashed border-border bg-slate-50 p-4">
      <Label htmlFor="invoice">{t('accounting.invoiceUpload')}</Label>
      <input
        id="invoice"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-blue-700"
      />
      {uploading && <p className="text-sm text-muted">{t('common.loading')}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {fileName && (
        <div className="flex flex-wrap items-start gap-4">
          {isInvoiceImage(fileName) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={invoiceProxyUrl(fileName)}
              alt={t('accounting.invoiceAttached')}
              className="max-h-40 rounded-md border border-border object-contain"
            />
          ) : (
            <p className="text-sm text-muted">
              {t('accounting.invoiceAttached')}: {fileName}
            </p>
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-sm text-destructive hover:underline"
          >
            {t('common.delete')}
          </button>
        </div>
      )}
    </div>
  );
}

export function InvoiceFileCell({ fileName }: { fileName: string }) {
  const { t } = useI18n();
  const url = invoiceProxyUrl(fileName);

  if (isInvoiceImage(fileName)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={t('accounting.invoiceAttached')}
          className="h-12 w-12 rounded border border-border object-cover hover:opacity-80"
        />
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
      {t('common.view')}
    </a>
  );
}
