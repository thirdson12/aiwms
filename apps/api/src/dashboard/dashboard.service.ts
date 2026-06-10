import { Injectable } from '@nestjs/common';
import { AuthUser, DashboardStats, RoleName, computeDebtStatus } from '@aiwms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { getFinanceTotals, getMonthlyFinance } from '../common/finance-totals';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(actor: AuthUser): Promise<DashboardStats> {
    const isWorker = actor.role === RoleName.WORKER;
    const where = isWorker ? { assignedToId: actor.id } : {};

    const [
      totalJobs,
      pendingJobs,
      inProgressJobs,
      completedJobs,
      cancelledJobs,
      totalProducts,
      totalCustomers,
      debts,
      financeTotals,
      monthlyFinance,
    ] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.count({ where: { ...where, status: 'pending' } }),
      this.prisma.job.count({ where: { ...where, status: 'in_progress' } }),
      this.prisma.job.count({ where: { ...where, status: 'completed' } }),
      this.prisma.job.count({ where: { ...where, status: 'cancelled' } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.customer.count({ where: { isActive: true } }),
      this.prisma.debt.findMany(),
      getFinanceTotals(this.prisma),
      getMonthlyFinance(this.prisma),
    ]);

    const lowStockProducts = await this.countLowStock();

    let openDebts = 0;
    let overdueDebts = 0;
    let totalDebtRemaining = 0;

    for (const debt of debts) {
      const amount = Number(debt.amount);
      const paid = Number(debt.paidAmount);
      const remaining = amount - paid;
      if (remaining <= 0) continue;
      openDebts += 1;
      totalDebtRemaining += remaining;
      if (computeDebtStatus(amount, paid, debt.dueDate?.toISOString() ?? null) === 'overdue') {
        overdueDebts += 1;
      }
    }

    const stats: DashboardStats = {
      totalJobs,
      pendingJobs,
      inProgressJobs,
      completedJobs,
      cancelledJobs,
      totalProducts,
      lowStockProducts,
      totalCustomers,
      totalExpenses: financeTotals.totalExpenses,
      totalIncome: financeTotals.totalIncome,
      openDebts,
      overdueDebts,
      totalDebtRemaining,
      charts: {
        jobStatus: {
          pending: pendingJobs,
          in_progress: inProgressJobs,
          completed: completedJobs,
          cancelled: cancelledJobs,
        },
        finance: {
          income: financeTotals.totalIncome,
          expenses: financeTotals.totalExpenses,
        },
        monthlyFinance,
      },
    };
    if (!isWorker) {
      stats.myJobs = await this.prisma.job.count({
        where: { assignedToId: actor.id },
      });
    }

    return stats;
  }

  private async countLowStock(): Promise<number> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { quantityOnHand: true, minStockLevel: true },
    });

    return products.filter((p) => p.quantityOnHand <= p.minStockLevel).length;
  }
}
