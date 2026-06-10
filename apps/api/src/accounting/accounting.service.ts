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
  isAdminOrOwner,
} from '@aiwms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { getFinanceTotals } from '../common/finance-totals';
import {
  CreateDebtDto,
  CreateExpenseDto,
  CreateIncomeDto,
  PayDebtDto,
} from './dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async getSummary(): Promise<AccountingSummary> {
    const [totals, debts] = await Promise.all([
      getFinanceTotals(this.prisma),
      this.prisma.debt.findMany(),
    ]);

    let openDebts = 0;
    let overdueDebts = 0;
    let totalDebtRemaining = 0;
    let paidDebts = 0;

    for (const debt of debts) {
      const amount = Number(debt.amount);
      const paid = Number(debt.paidAmount);
      const remaining = amount - paid;
      const status = computeDebtStatus(amount, paid, debt.dueDate?.toISOString() ?? null);

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
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDebtDto(r));
  }

  async findDebt(id: string): Promise<DebtDto> {
    const row = await this.prisma.debt.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        job: { select: { id: true, title: true } },
      },
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
      },
    });
    return this.toDebtDto(row);
  }

  async payDebt(id: string, dto: PayDebtDto, actor: AuthUser): Promise<DebtDto> {
    this.assertCanManage(actor);
    const debt = await this.prisma.debt.findUnique({ where: { id } });
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
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          job: { select: { id: true, title: true } },
        },
      });
    });

    return this.toDebtDto(updated);
  }

  private assertCanManage(actor: AuthUser) {
    if (!isAdminOrOwner(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private toExpenseDto(row: {
    id: string;
    amount: unknown;
    description: string;
    category: string | null;
    date: Date;
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
    customerId: string;
    jobId: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    customer?: { id: string; name: string; phone: string | null };
    job?: { id: string; title: string } | null;
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
      status: computeDebtStatus(amount, paidAmount, dueDate),
      customerId: row.customerId,
      jobId: row.jobId,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      customer: row.customer,
      job: row.job,
    };
  }
}
