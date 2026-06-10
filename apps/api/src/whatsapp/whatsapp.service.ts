import { Injectable, NotFoundException } from '@nestjs/common';
import {
  WhatsappRenderResult,
  WhatsappTemplateDto,
  formatMoney,
} from '@aiwms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RenderWhatsappDto } from './dto/whatsapp.dto';

@Injectable()
export class WhatsappService {
  constructor(private prisma: PrismaService) {}

  async findTemplates(locale = 'tr'): Promise<WhatsappTemplateDto[]> {
    const templates = await this.prisma.whatsappTemplate.findMany({
      where: { locale, isActive: true },
      orderBy: { name: 'asc' },
    });
    return templates.map((t) => ({
      id: t.id,
      key: t.key,
      name: t.name,
      body: t.body,
      locale: t.locale,
      isActive: t.isActive,
    }));
  }

  async renderTemplate(
    key: string,
    dto: RenderWhatsappDto,
    locale = 'tr',
  ): Promise<WhatsappRenderResult> {
    const template = await this.prisma.whatsappTemplate.findFirst({
      where: { key, locale, isActive: true },
    });
    if (!template) throw new NotFoundException('Template not found');

    const customer = dto.customerId
      ? await this.prisma.customer.findUnique({ where: { id: dto.customerId } })
      : null;

    const job = dto.jobId
      ? await this.prisma.job.findUnique({ where: { id: dto.jobId } })
      : null;

    const debt = dto.debtId
      ? await this.prisma.debt.findUnique({ where: { id: dto.debtId } })
      : null;

    if (dto.customerId && !customer) throw new NotFoundException('Customer not found');
    if (dto.jobId && !job) throw new NotFoundException('Job not found');
    if (dto.debtId && !debt) throw new NotFoundException('Debt not found');

    const resolvedCustomer =
      customer ??
      (debt
        ? await this.prisma.customer.findUnique({ where: { id: debt.customerId } })
        : null);

    const resolvedJob =
      job ?? (debt?.jobId ? await this.prisma.job.findUnique({ where: { id: debt.jobId } }) : null);

    const amount = debt ? Number(debt.amount) : 0;
    const paidAmount = debt ? Number(debt.paidAmount) : 0;
    const remaining = Math.max(amount - paidAmount, 0);

    const vars: Record<string, string> = {
      customerName: resolvedCustomer?.name ?? '',
      jobTitle: resolvedJob?.title ?? '',
      amount: debt ? formatMoney(amount) : '',
      remainingAmount: debt ? formatMoney(remaining) : '',
      dueDate: debt?.dueDate
        ? debt.dueDate.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')
        : '',
      phone: resolvedCustomer?.phone ?? '',
    };

    let message = template.body;
    for (const [k, v] of Object.entries(vars)) {
      message = message.replaceAll(`{{${k}}}`, v);
    }

    const phone = resolvedCustomer?.phone?.replace(/\D/g, '') ?? null;
    const whatsappUrl = phone
      ? `https://wa.me/${phone.startsWith('90') ? phone : `90${phone.replace(/^0/, '')}`}?text=${encodeURIComponent(message)}`
      : null;

    return { message, whatsappUrl, phone: resolvedCustomer?.phone ?? null };
  }
}
