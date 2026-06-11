'use client';

import { useEffect, useState } from 'react';
import {
  DebtDto,
  JobDto,
  ProductDto,
  ProductCategory,
  WhatsappRenderResult,
  formatMoney,
} from '@aiwms/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/form-controls';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';
import { formatDate } from '@/lib/utils';

export function DebtPaymentsList({
  debt,
  moneyLocale,
  locale,
  onUpdated,
}: {
  debt: DebtDto;
  moneyLocale: string;
  locale: import('@/lib/i18n').Locale;
  onUpdated: () => Promise<void>;
}) {
  const { t } = useI18n();

  if (!debt.payments?.length) return null;

  async function reversePayment(paymentId: string) {
    if (!confirm(t('debts.reversePaymentConfirm'))) return;
    await clientFetch(`accounting/debts/${debt.id}/payments/${paymentId}`, { method: 'DELETE' });
    await onUpdated();
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="mb-2 text-xs font-semibold uppercase text-muted">{t('debts.paymentHistory')}</p>
      <ul className="space-y-2">
        {debt.payments.map((payment) => (
          <li
            key={payment.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-50 px-2 py-2"
          >
            <span>
              {formatMoney(payment.amount, moneyLocale)} · {formatDate(payment.createdAt, locale)}
              {payment.notes ? ` · ${payment.notes}` : ''}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => reversePayment(payment.id)}>
              {t('debts.reversePayment')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DebtManageSection({
  customerId,
  jobId,
  jobOptions,
  canManage,
  onUpdated,
}: {
  customerId: string;
  jobId?: string;
  jobOptions?: Array<{ id: string; title: string }>;
  canManage: boolean;
  onUpdated: () => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [debts, setDebts] = useState<DebtDto[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [linkJobId, setLinkJobId] = useState(jobId ?? '');
  const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});
  const moneyLocale = locale === 'tr' ? 'tr-TR' : 'en-US';

  async function loadDebts() {
    const items = await clientFetch<DebtDto[]>('accounting/debts');
    setDebts(
      items.filter((d) => {
        if (d.customerId !== customerId) return false;
        if (jobId) return d.jobId === jobId;
        return true;
      }),
    );
  }

  useEffect(() => {
    loadDebts().catch(() => setDebts([]));
  }, [customerId, jobId]);

  if (!canManage) return null;

  async function handleAddDebt(e: React.FormEvent) {
    e.preventDefault();
    await clientFetch('accounting/debts', {
      method: 'POST',
      body: JSON.stringify({
        title,
        amount: Number(amount),
        customerId,
        jobId: jobId ?? (linkJobId || undefined),
        dueDate: dueDate || undefined,
      }),
    });
    setTitle('');
    setAmount('');
    setDueDate('');
    if (!jobId) setLinkJobId('');
    await loadDebts();
    await onUpdated();
  }

  async function payDebt(debtId: string) {
    const payAmount = Number(payAmounts[debtId]);
    if (!payAmount) return;
    await clientFetch(`accounting/debts/${debtId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount: payAmount }),
    });
    setPayAmounts((prev) => ({ ...prev, [debtId]: '' }));
    await loadDebts();
    await onUpdated();
  }

  async function removeDebt(debtId: string) {
    if (!confirm(t('debts.softDeleteConfirm'))) return;
    await clientFetch(`accounting/debts/${debtId}`, { method: 'DELETE' });
    await loadDebts();
    await onUpdated();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('debts.manageTitle')}</CardTitle>
      </CardHeader>

      <form onSubmit={handleAddDebt} className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder={t('jobs.debtTitle')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          placeholder={t('jobs.debtAmount')}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        {!jobId && jobOptions && jobOptions.length > 0 && (
          <Select value={linkJobId} onChange={(e) => setLinkJobId(e.target.value)}>
            <option value="">{t('jobs.unassigned')}</option>
            {jobOptions.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </Select>
        )}
        <Button type="submit">{t('jobs.addDebt')}</Button>
      </form>

      {debts.length === 0 ? (
        <p className="text-sm text-muted">{t('debts.noDebts')}</p>
      ) : (
        <ul className="space-y-3">
          {debts.map((debt) => (
            <li
              key={debt.id}
              className="rounded-lg border border-border px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{debt.title}</p>
                  <p className="text-muted">
                    {t('debts.remaining')}: {formatMoney(debt.remainingAmount, moneyLocale)}
                    {' · '}
                    {t('accounting.amount')}: {formatMoney(debt.amount, moneyLocale)}
                  </p>
                  {debt.dueDate && (
                    <p className="text-xs text-muted">
                      {t('debts.dueDate')}: {formatDate(debt.dueDate, locale)}
                    </p>
                  )}
                </div>
                <Badge variant={debt.status}>{t(`debtStatus.${debt.status}`)}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {debt.remainingAmount > 0 && (
                  <>
                    <Input
                      className="h-8 w-28"
                      placeholder={t('debts.pay')}
                      value={payAmounts[debt.id] ?? ''}
                      onChange={(e) =>
                        setPayAmounts({ ...payAmounts, [debt.id]: e.target.value })
                      }
                    />
                    <Button type="button" size="sm" onClick={() => payDebt(debt.id)}>
                      {t('debts.pay')}
                    </Button>
                    <DebtWhatsappButton debt={debt} />
                  </>
                )}
                {debt.paidAmount === 0 ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeDebt(debt.id)}
                  >
                    {t('common.delete')}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDebt(debt.id)}
                  >
                    {t('debts.softDelete')}
                  </Button>
                )}
              </div>

              <DebtPaymentsList
                debt={debt}
                moneyLocale={moneyLocale}
                locale={locale}
                onUpdated={async () => {
                  await loadDebts();
                  await onUpdated();
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function JobDebtSection({
  job,
  canManage,
  onUpdated,
}: {
  job: JobDto;
  canManage: boolean;
  onUpdated: () => Promise<void>;
}) {
  if (!canManage || !job.customerId) return null;

  return (
    <DebtManageSection
      customerId={job.customerId}
      jobId={job.id}
      canManage={canManage}
      onUpdated={onUpdated}
    />
  );
}

export function JobPartsSection({
  job,
  canManage,
  onUpdated,
}: {
  job: JobDto;
  canManage: boolean;
  onUpdated: () => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    clientFetch<ProductDto[]>('products')
      .then((items) => setProducts(items.filter((p) => p.quantityOnHand > 0)))
      .catch(() => setProducts([]));
  }, [job.id, job.partsUsed?.length]);

  async function handleInstall(e: React.FormEvent) {
    e.preventDefault();
    await clientFetch(`jobs/${job.id}/parts`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: Number(quantity) }),
    });
    setProductId('');
    setQuantity('1');
    await onUpdated();
  }

  async function removePart(partId: string) {
    if (!confirm(t('jobs.removePartConfirm'))) return;
    await clientFetch(`jobs/${job.id}/parts/${partId}`, { method: 'DELETE' });
    await onUpdated();
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t('jobs.partsUsed')}</CardTitle></CardHeader>
      {canManage && (
        <form onSubmit={handleInstall} className="mb-4 grid gap-3 sm:grid-cols-3">
          <Select value={productId} onChange={(e) => setProductId(e.target.value)} required>
            <option value="">{t('jobs.selectProduct')}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.quantityOnHand} {p.unit}) — {p.category === ProductCategory.TRANSMISSION ? t('inventory.categoryTransmission') : t('inventory.categoryServicePart')}
              </option>
            ))}
          </Select>
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Button type="submit">{t('jobs.install')}</Button>
        </form>
      )}
      {(job.partsUsed ?? []).length === 0 ? (
        <p className="text-sm text-muted">{t('jobs.noPartsUsed')}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {(job.partsUsed ?? []).map((part) => (
            <li key={part.id} className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2">
              <span>{part.productName} ({part.productSku}) · {part.quantity}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted">{formatDate(part.createdAt, locale)}</span>
                {canManage && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => removePart(part.id)}>
                    {t('common.delete')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DebtWhatsappButton({ debt }: { debt: DebtDto }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const result = await clientFetch<WhatsappRenderResult>('whatsapp/templates/debt_reminder/render', {
        method: 'POST',
        body: JSON.stringify({ debtId: debt.id, customerId: debt.customerId }),
      });
      if (result.whatsappUrl) window.open(result.whatsappUrl, '_blank');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      className="border-green-600 bg-green-600 text-white hover:bg-green-700"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? t('common.loading') : t('debts.whatsappDebt')}
    </Button>
  );
}

export function DebtStatusSelect({
  debt,
  onUpdated,
}: {
  debt: DebtDto;
  onUpdated: () => Promise<void>;
}) {
  const { t } = useI18n();

  async function handleChange(value: string) {
    await clientFetch(`accounting/debts/${debt.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ statusOverride: value || null }),
    });
    await onUpdated();
  }

  return (
    <Select
      value={debt.statusOverride ?? debt.status}
      onChange={(e) => handleChange(e.target.value)}
      aria-label={t('debts.changeStatus')}
    >
      <option value="open">{t('debtStatus.open')}</option>
      <option value="partial">{t('debtStatus.partial')}</option>
      <option value="overdue">{t('debtStatus.overdue')}</option>
      <option value="paid">{t('debtStatus.paid')}</option>
      <option value="">{t('debts.autoStatus')}</option>
    </Select>
  );
}
