import { Injectable } from '@nestjs/common';
import {
  AuthUser,
  DebtsReport,
  FinancialReport,
  InventoryReport,
  JobStatus,
  JobsReport,
  ProductDto,
  RoleName,
  computeDebtStatus,
  summarizeDebts,
} from '@aiwms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  getFinancialReport(query: ReportQueryDto): Promise<FinancialReport> {
    const { from, to, start, end } = this.parseRange(query);
    return this.buildFinancialReport(from, to, start, end);
  }

  getJobsReport(query: ReportQueryDto, actor: AuthUser): Promise<JobsReport> {
    const { from, to, start, end } = this.parseRange(query);
    return this.buildJobsReport(from, to, start, end, actor);
  }

  getInventoryReport(): Promise<InventoryReport> {
    return this.buildInventoryReport();
  }

  getDebtsReport(): Promise<DebtsReport> {
    return this.buildDebtsReport();
  }

  async exportCsv(type: string, query: ReportQueryDto, actor: AuthUser): Promise<string> {
    let content = 'Geçersiz rapor türü';

    switch (type) {
      case 'financial': {
        const report = await this.getFinancialReport(query);
        content = [
          'Ay,Gelir,Gider',
          ...report.monthlyBreakdown.map(
            (row) => `${row.label},${row.income},${row.expenses}`,
          ),
          '',
          `Toplam Gelir,${report.totalIncome}`,
          `Toplam Gider,${report.totalExpenses}`,
          `Net Bakiye,${report.netBalance}`,
          `Borç Tahsilatı,${report.debtCollections}`,
        ].join('\n');
        break;
      }
      case 'jobs': {
        const report = await this.getJobsReport(query, actor);
        content = [
          'Çalışan,Toplam İş,Tamamlanan',
          ...report.byWorker.map((w) => `${w.workerName},${w.total},${w.completed}`),
          '',
          `Toplam,${report.total}`,
          `Tamamlanma Oranı,${report.completionRate}%`,
        ].join('\n');
        break;
      }
      case 'inventory': {
        const report = await this.getInventoryReport();
        content = [
          'Ürün,SKU,Miktar,Min Stok,Durum',
          ...report.lowStockProducts.map(
            (p) =>
              `${p.name},${p.sku},${p.quantityOnHand},${p.minStockLevel},${p.isActive ? 'Aktif' : 'Pasif'}`,
          ),
        ].join('\n');
        break;
      }
      case 'debts': {
        const report = await this.getDebtsReport();
        content = [
          'Müşteri,Kalan Borç,Durum',
          ...report.byCustomer.map((c) => `${c.customerName},${c.remaining},${c.status}`),
          '',
          `Açık Borç,${report.openDebts}`,
          `Gecikmiş,${report.overdueDebts}`,
          `Toplam Kalan,${report.totalRemaining}`,
        ].join('\n');
        break;
      }
    }

    return `\uFEFF${content}`;
  }

  private parseRange(query: ReportQueryDto) {
    const now = new Date();
    const end = query.to ? new Date(`${query.to}T23:59:59.999`) : now;
    const start = query.from
      ? new Date(`${query.from}T00:00:00.000`)
      : new Date(end.getFullYear(), end.getMonth(), 1);

    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      start,
      end,
    };
  }

  private async buildFinancialReport(
    from: string,
    to: string,
    start: Date,
    end: Date,
  ): Promise<FinancialReport> {
    const [expenses, incomes, payments] = await Promise.all([
      this.prisma.expense.findMany({
        where: { date: { gte: start, lte: end } },
      }),
      this.prisma.income.findMany({
        where: { date: { gte: start, lte: end } },
      }),
      this.prisma.debtPayment.findMany({
        where: { createdAt: { gte: start, lte: end } },
      }),
    ]);

    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const incomeRecords = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const debtCollections = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalIncome = incomeRecords + debtCollections;

    const categoryMap = new Map<string, number>();
    for (const expense of expenses) {
      const key = expense.category || 'Diğer';
      categoryMap.set(key, (categoryMap.get(key) ?? 0) + Number(expense.amount));
    }

    const topExpenseCategories = [...categoryMap.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const monthlyBreakdown = await this.monthlyBreakdownInRange(start, end);

    return {
      range: { from, to },
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      debtCollections,
      monthlyBreakdown,
      topExpenseCategories,
    };
  }

  private async monthlyBreakdownInRange(start: Date, end: Date) {
    const months: { label: string; income: number; expenses: number }[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

    while (cursor <= end) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
      const rangeStart = monthStart < start ? start : monthStart;
      const rangeEnd = monthEnd > end ? end : monthEnd;
      const label = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;

      const [expenseAgg, incomeAgg, paymentAgg] = await Promise.all([
        this.prisma.expense.aggregate({
          where: { date: { gte: rangeStart, lte: rangeEnd } },
          _sum: { amount: true },
        }),
        this.prisma.income.aggregate({
          where: { date: { gte: rangeStart, lte: rangeEnd } },
          _sum: { amount: true },
        }),
        this.prisma.debtPayment.aggregate({
          where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
          _sum: { amount: true },
        }),
      ]);

      months.push({
        label,
        income:
          Number(incomeAgg._sum.amount ?? 0) + Number(paymentAgg._sum.amount ?? 0),
        expenses: Number(expenseAgg._sum.amount ?? 0),
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  }

  private async buildJobsReport(
    from: string,
    to: string,
    start: Date,
    end: Date,
    actor: AuthUser,
  ): Promise<JobsReport> {
    const where = {
      createdAt: { gte: start, lte: end },
      ...(actor.role === RoleName.WORKER ? { assignedToId: actor.id } : {}),
    };

    const jobs = await this.prisma.job.findMany({
      where,
      include: { assignedTo: { select: { id: true, fullName: true } } },
    });

    const byStatus: Record<JobStatus, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    const workerMap = new Map<
      string,
      { workerId: string; workerName: string; total: number; completed: number }
    >();

    for (const job of jobs) {
      byStatus[job.status as JobStatus] += 1;
      const workerId = job.assignedToId ?? 'unassigned';
      const workerName = job.assignedTo?.fullName ?? 'Atanmamış';
      const existing = workerMap.get(workerId) ?? {
        workerId,
        workerName,
        total: 0,
        completed: 0,
      };
      existing.total += 1;
      if (job.status === 'completed') existing.completed += 1;
      workerMap.set(workerId, existing);
    }

    const completed = byStatus.completed;
    const completionRate = jobs.length > 0 ? Math.round((completed / jobs.length) * 100) : 0;

    return {
      range: { from, to },
      total: jobs.length,
      byStatus,
      byWorker: [...workerMap.values()].sort((a, b) => b.total - a.total),
      completionRate,
    };
  }

  private async buildInventoryReport(): Promise<InventoryReport> {
    const [products, movements] = await Promise.all([
      this.prisma.product.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.stockTransaction.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, sku: true } } },
      }),
    ]);

    const lowStockProducts = products
      .filter((p) => p.isActive && p.quantityOnHand <= p.minStockLevel)
      .map((p) => this.toProductDto(p));

    const allMovements = await this.prisma.stockTransaction.findMany({
      select: { type: true, quantity: true },
    });

    const movementsSummary = { stock_in: 0, stock_out: 0, adjustment: 0 };
    for (const move of allMovements) {
      if (move.type in movementsSummary) {
        movementsSummary[move.type as keyof typeof movementsSummary] += move.quantity;
      }
    }

    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.isActive).length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      movementsSummary,
      recentMovements: movements.map((m) => ({
        id: m.id,
        productId: m.productId,
        type: m.type as InventoryReport['recentMovements'][0]['type'],
        quantity: m.quantity,
        notes: m.notes,
        createdById: m.createdById,
        createdAt: m.createdAt.toISOString(),
        productName: m.product.name,
        productSku: m.product.sku,
      })),
    };
  }

  private async buildDebtsReport(): Promise<DebtsReport> {
    const [debts, customers, payments] = await Promise.all([
      this.prisma.debt.findMany({
        where: { deletedAt: null },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          job: { select: { id: true, title: true } },
        },
      }),
      this.prisma.customer.findMany({
        where: { isActive: true },
        include: { debts: { where: { deletedAt: null } } },
      }),
      this.prisma.debtPayment.aggregate({ _sum: { amount: true } }),
    ]);

    let openDebts = 0;
    let overdueDebts = 0;
    let totalRemaining = 0;
    const overdueList: DebtsReport['overdueList'] = [];

    for (const debt of debts) {
      const amount = Number(debt.amount);
      const paid = Number(debt.paidAmount);
      const remaining = amount - paid;
      const dueDate = debt.dueDate?.toISOString() ?? null;
      const statusOverride = (debt.statusOverride as import('@aiwms/shared').DebtStatus | null) ?? null;
      const status = computeDebtStatus(amount, paid, dueDate, statusOverride);

      if (remaining <= 0) continue;
      openDebts += 1;
      totalRemaining += remaining;
      if (status === 'overdue') {
        overdueDebts += 1;
        overdueList.push({
          id: debt.id,
          title: debt.title,
          amount,
          paidAmount: paid,
          remainingAmount: remaining,
          dueDate,
          notes: debt.notes,
          status,
          statusOverride,
          customerId: debt.customerId,
          jobId: debt.jobId,
          createdById: debt.createdById,
          createdAt: debt.createdAt.toISOString(),
          updatedAt: debt.updatedAt.toISOString(),
          deletedAt: null,
          customer: debt.customer,
          job: debt.job,
        });
      }
    }

    const byCustomer = customers
      .map((customer) => {
        const summary = summarizeDebts(
          customer.debts.map((d) => ({
            amount: Number(d.amount),
            paidAmount: Number(d.paidAmount),
            dueDate: d.dueDate?.toISOString() ?? null,
            statusOverride: (d.statusOverride as import('@aiwms/shared').DebtStatus | null) ?? null,
          })),
        );
        return {
          customerId: customer.id,
          customerName: customer.name,
          remaining: summary.totalRemaining,
          status: summary.status,
        };
      })
      .filter((c) => c.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining);

    return {
      openDebts,
      overdueDebts,
      totalRemaining,
      totalCollected: Number(payments._sum.amount ?? 0),
      byCustomer,
      overdueList,
    };
  }

  private toProductDto(product: {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    unit: string;
    quantityOnHand: number;
    minStockLevel: number;
    isActive: boolean;
    category: string;
    createdAt: Date;
    updatedAt: Date;
  }): ProductDto {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      unit: product.unit,
      quantityOnHand: product.quantityOnHand,
      minStockLevel: product.minStockLevel,
      isActive: product.isActive,
      isLowStock: product.quantityOnHand <= product.minStockLevel,
      category: product.category as ProductDto['category'],
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
