import { PrismaService } from '../prisma/prisma.service';

export async function getFinanceTotals(prisma: PrismaService) {
  const [expenseAgg, incomeAgg, paymentAgg] = await Promise.all([
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.income.aggregate({ _sum: { amount: true } }),
    prisma.debtPayment.aggregate({ _sum: { amount: true } }),
  ]);

  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
  const totalIncome =
    Number(incomeAgg._sum.amount ?? 0) + Number(paymentAgg._sum.amount ?? 0);

  return {
    totalExpenses,
    totalIncome,
    netBalance: totalIncome - totalExpenses,
  };
}

export async function getMonthlyFinance(prisma: PrismaService) {
  const months: { label: string; income: number; expenses: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

    const [expenses, incomes, payments] = await Promise.all([
      prisma.expense.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.income.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.debtPayment.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    months.push({
      label,
      income: Number(incomes._sum.amount ?? 0) + Number(payments._sum.amount ?? 0),
      expenses: Number(expenses._sum.amount ?? 0),
    });
  }

  return months;
}
