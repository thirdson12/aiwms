import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountingSummary,
  AuthUser,
  DebtDto,
  ExpenseDto,
  IncomeDto,
  computeDebtStatus,
  isAdmin,
  isAdminOrOwner,
} from '@aiwms/shared';
import { DebtStatusOverride as PrismaDebtStatusOverride } from '@aiwms/database';
import { PrismaService } from '../prisma/prisma.service';
import { ACTIVE_DEBT_WHERE, DELETED_DEBT_WHERE } from '../common/debt-filters';
import { getFinanceTotals } from '../common/finance-totals';
import {
  CreateDebtDto,
  CreateExpenseDto,
  CreateIncomeDto,
  PayDebtDto,
  UpdateDebtDto,
} from './dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async getSummary(): Promise<AccountingSummary> {
    const [totals, debts] = await Promise.all([
      getFinanceTotals(this.prisma),
      this.prisma.debt.findMany({ where: ACTIVE_DEBT_WHERE }),
    ]);

    let openDebts = 0;
    let overdueDebts = 0;
    let totalDebtRemaining = 0;
    let paidDebts = 0;

    for (const debt of debts) {
      const amount = Number(debt.amount);
      const paid = Number(debt.paidAmount);
      const remaining = amount - paid;
      const status = computeDebtStatus(
        amount,
        paid,
        debt.dueDate?.toISOString() ?? null,
        (debt.statusOverride as import('@aiwms/shared').DebtStatus | null) ?? null,
      );

      if (status === 'paid') paidDebts += 1;
      if (remaining > 0) {
        openDebts += 1;
        totalDebtRemaining += remaining;
        if (status === 'overdue') overdueDebts += 1;
      }
    }

    return {
      totalExpenses: totals.totalExpenses,
      totalIncome: totals.totalIncome,
      netBalance: totals.netBalance,
      openDebts,
      overdueDebts,
      totalDebtRemaining,
      paidDebts,
    };
  }

  async findExpenses(): Promise<ExpenseDto[]> {
    const rows = await this.prisma.expense.findMany({
      include: {
        customer: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
      },
      orderBy: { date: 'desc' },
    });
    return rows.map((r) => this.toExpenseDto(r));
  }

  async createExpense(dto: CreateExpenseDto, actor: AuthUser): Promise<ExpenseDto> {
    this.assertCanManage(actor);
    const row = await this.prisma.expense.create({
      data: {
        amount: dto.amount,
        description: dto.description,
        category: dto.category,
        date: dto.date ? new Date(dto.date) : undefined,
        invoiceFileName: dto.invoiceFileName,
        customerId: dto.customerId,
        jobId: dto.jobId,
        createdById: actor.id,
      },
      include: {
        customer: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
      },
    });
    return this.toExpenseDto(row);
  }

  async findIncomes(): Promise<IncomeDto[]> {
    const rows = await this.prisma.income.findMany({
      include: {
        customer: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
      },
      orderBy: { date: 'desc' },
    });
    return rows.map((r) => this.toIncomeDto(r));
  }

  async createIncome(dto: CreateIncomeDto, actor: AuthUser): Promise<IncomeDto> {
    this.assertCanManage(actor);
    const row = await this.prisma.income.create({
      data: {
        amount: dto.amount,
        description: dto.description,
        category: dto.category,
        date: dto.date ? new Date(dto.date) : undefined,
        invoiceFileName: dto.invoiceFileName,
        customerId: dto.customerId,
        jobId: dto.jobId,
        createdById: actor.id,
      },
      include: {
        customer: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
      },
    });
    return this.toIncomeDto(row);
  }

  async findDebts(): Promise<DebtDto[]> {
    const rows = await this.prisma.debt.findMany({
      where: ACTIVE_DEBT_WHERE,
      include: this.debtInclude(),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDebtDto(r));
  }

  async findDeletedDebts(actor: AuthUser): Promise<DebtDto[]> {
    this.assertAdmin(actor);
    const rows = await this.prisma.debt.findMany({
      where: DELETED_DEBT_WHERE,
      include: this.debtInclude(),
      orderBy: { deletedAt: 'desc' },
    });
    return rows.map((r) => this.toDebtDto(r));
  }

  async findDebt(id: string): Promise<DebtDto> {
    const row = await this.prisma.debt.findFirst({
      where: { id, ...ACTIVE_DEBT_WHERE },
      include: this.debtInclude(),
    });
    if (!row) throw new NotFoundException('Debt not found');
    return this.toDebtDto(row);
  }

  async createDebt(dto: CreateDebtDto, actor: AuthUser): Promise<DebtDto> {
    this.assertCanManage(actor);
    const row = await this.prisma.debt.create({
      data: {
        title: dto.title,
        amount: dto.amount,
        customerId: dto.customerId,
        jobId: dto.jobId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        createdById: actor.id,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        job: { select: { id: true, title: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    return this.toDebtDto(row);
  }

  async payDebt(id: string, dto: PayDebtDto, actor: AuthUser): Promise<DebtDto> {
    this.assertCanManage(actor);
    const debt = await this.prisma.debt.findFirst({ where: { id, ...ACTIVE_DEBT_WHERE } });
    if (!debt) throw new NotFoundException('Debt not found');

    const remaining = Number(debt.amount) - Number(debt.paidAmount);
    if (dto.amount > remaining) {
      throw new BadRequestException('Payment exceeds remaining balance');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.debtPayment.create({
        data: {
          debtId: id,
          amount: dto.amount,
          notes: dto.notes,
          createdById: actor.id,
        },
      });
      return tx.debt.update({
        where: { id },
        data: { paidAmount: Number(debt.paidAmount) + dto.amount },
        include: this.debtInclude(),
      });
    });

    return this.toDebtDto(updated);
  }

  async reverseDebtPayment(
    debtId: string,
    paymentId: string,
    actor: AuthUser,
  ): Promise<DebtDto> {
    this.assertCanManage(actor);

    const payment = await this.prisma.debtPayment.findFirst({
      where: { id: paymentId, debtId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const debt = await this.prisma.debt.findFirst({ where: { id: debtId, ...ACTIVE_DEBT_WHERE } });
    if (!debt) throw new NotFoundException('Debt not found');

    const paymentAmount = Number(payment.amount);
    const newPaidAmount = Number(debt.paidAmount) - paymentAmount;
    if (newPaidAmount < 0) {
      throw new BadRequestException('Cannot reverse payment: paid amount would be negative');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.debtPayment.delete({ where: { id: paymentId } });
      return tx.debt.update({
        where: { id: debtId },
        data: { paidAmount: newPaidAmount },
        include: this.debtInclude(),
      });
    });

    return this.toDebtDto(updated);
  }

  async updateDebt(id: string, dto: UpdateDebtDto, actor: AuthUser): Promise<DebtDto> {
    this.assertCanManage(actor);
    const debt = await this.prisma.debt.findFirst({ where: { id, ...ACTIVE_DEBT_WHERE } });
    if (!debt) throw new NotFoundException('Debt not found');

    const updated = await this.prisma.debt.update({
      where: { id },
      data: {
        statusOverride:
          dto.statusOverride === null
            ? null
            : (dto.statusOverride as PrismaDebtStatusOverride | undefined),
        dueDate: dto.dueDate === null ? null : dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes === null ? null : dto.notes,
      },
      include: this.debtInclude(),
    });
    return this.toDebtDto(updated);
  }

  async deleteDebt(id: string, actor: AuthUser): Promise<{ message: string }> {
    this.assertCanManage(actor);
    const debt = await this.prisma.debt.findFirst({
      where: { id, ...ACTIVE_DEBT_WHERE },
    });
    if (!debt) throw new NotFoundException('Debt not found');

    await this.prisma.debt.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Debt archived' };
  }

  async restoreDebt(id: string, actor: AuthUser): Promise<DebtDto> {
    this.assertAdmin(actor);
    const debt = await this.prisma.debt.findFirst({
      where: { id, ...DELETED_DEBT_WHERE },
    });
    if (!debt) throw new NotFoundException('Deleted debt not found');

    const restored = await this.prisma.debt.update({
      where: { id },
      data: { deletedAt: null },
      include: this.debtInclude(),
    });
    return this.toDebtDto(restored);
  }

  private debtInclude() {
    return {
      customer: { select: { id: true, name: true, phone: true } },
      job: { select: { id: true, title: true } },
      payments: { orderBy: { createdAt: 'desc' as const } },
    };
  }

  private assertCanManage(actor: AuthUser) {
    if (!isAdminOrOwner(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private assertAdmin(actor: AuthUser) {
    if (!isAdmin(actor.role)) {
      throw new ForbiddenException('Admin only');
    }
  }

  private toExpenseDto(row: {
    id: string;
    amount: unknown;
    description: string;
    category: string | null;
    date: Date;
    invoiceFileName: string | null;
    customerId: string | null;
    jobId: string | null;
    createdById: string;
    createdAt: Date;
    customer?: { id: string; name: string } | null;
    job?: { id: string; title: string } | null;
  }): ExpenseDto {
    return {
      id: row.id,
      amount: Number(row.amount),
      description: row.description,
      category: row.category,
      date: row.date.toISOString(),
      invoiceFileName: row.invoiceFileName,
      customerId: row.customerId,
      jobId: row.jobId,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      customer: row.customer,
      job: row.job,
    };
  }

  private toIncomeDto(row: {
    id: string;
    amount: unknown;
    description: string;
    category: string | null;
    date: Date;
    invoiceFileName: string | null;
    customerId: string | null;
    jobId: string | null;
    createdById: string;
    createdAt: Date;
    customer?: { id: string; name: string } | null;
    job?: { id: string; title: string } | null;
  }): IncomeDto {
    return {
      id: row.id,
      amount: Number(row.amount),
      description: row.description,
      category: row.category,
      date: row.date.toISOString(),
      invoiceFileName: row.invoiceFileName,
      customerId: row.customerId,
      jobId: row.jobId,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      customer: row.customer,
      job: row.job,
    };
  }

  private toDebtDto(row: {
    id: string;
    title: string;
    amount: unknown;
    paidAmount: unknown;
    dueDate: Date | null;
    notes: string | null;
    statusOverride: string | null;
    customerId: string;
    jobId: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    customer?: { id: string; name: string; phone: string | null };
    job?: { id: string; title: string } | null;
    payments?: Array<{
      id: string;
      debtId: string;
      amount: unknown;
      notes: string | null;
      createdById: string;
      createdAt: Date;
    }>;
  }): DebtDto {
    const amount = Number(row.amount);
    const paidAmount = Number(row.paidAmount);
    const dueDate = row.dueDate?.toISOString() ?? null;
    return {
      id: row.id,
      title: row.title,
      amount,
      paidAmount,
      remainingAmount: Math.max(amount - paidAmount, 0),
      dueDate,
      notes: row.notes,
      status: computeDebtStatus(
        amount,
        paidAmount,
        dueDate,
        (row.statusOverride as import('@aiwms/shared').DebtStatus | null) ?? null,
      ),
      statusOverride: (row.statusOverride as import('@aiwms/shared').DebtStatus | null) ?? null,
      customerId: row.customerId,
      jobId: row.jobId,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: row.deletedAt?.toISOString() ?? null,
      customer: row.customer,
      job: row.job,
      payments: (row.payments ?? []).map((p) => ({
        id: p.id,
        debtId: p.debtId,
        amount: Number(p.amount),
        notes: p.notes,
        createdById: p.createdById,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }
}
