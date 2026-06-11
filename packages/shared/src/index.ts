export const RoleName = {
  ADMIN: 'admin',
  OWNER: 'owner',
  WORKER: 'worker',
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];

export const JobStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const JobServiceType = {
  TRANSMISSION: 'transmission',
  NORMAL_SERVICE: 'normal_service',
} as const;

export type JobServiceType = (typeof JobServiceType)[keyof typeof JobServiceType];

export const ProductCategory = {
  TRANSMISSION: 'transmission',
  SERVICE_PART: 'service_part',
} as const;

export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory];

export const StockTransactionType = {
  STOCK_IN: 'stock_in',
  STOCK_OUT: 'stock_out',
  ADJUSTMENT: 'adjustment',
} as const;

export type StockTransactionType =
  (typeof StockTransactionType)[keyof typeof StockTransactionType];

export const DebtStatus = {
  OPEN: 'open',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  NONE: 'none',
} as const;

export type DebtStatus = (typeof DebtStatus)[keyof typeof DebtStatus];

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface JobDebtSummary {
  hasDebt: boolean;
  hasOverdue: boolean;
  totalRemaining: number;
  openCount: number;
  status: DebtStatus;
}

export interface DashboardChartPoint {
  label: string;
  income: number;
  expenses: number;
}

export interface DashboardStats {
  totalJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  myJobs?: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  totalExpenses: number;
  totalIncome: number;
  openDebts: number;
  overdueDebts: number;
  totalDebtRemaining: number;
  charts: {
    jobStatus: {
      pending: number;
      in_progress: number;
      completed: number;
      cancelled: number;
    };
    finance: {
      income: number;
      expenses: number;
    };
    monthlyFinance: DashboardChartPoint[];
  };
}

export interface AccountingSummary {
  totalExpenses: number;
  totalIncome: number;
  netBalance: number;
  openDebts: number;
  overdueDebts: number;
  totalDebtRemaining: number;
  paidDebts: number;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerDto {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  debtSummary?: JobDebtSummary;
}

export interface JobDto {
  id: string;
  title: string;
  description: string | null;
  status: JobStatus;
  serviceType: JobServiceType;
  plateNumber: string | null;
  createdById: string;
  assignedToId: string | null;
  customerId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; fullName: string; email: string };
  assignedTo?: { id: string; fullName: string; email: string } | null;
  customer?: { id: string; name: string; phone: string | null } | null;
  debtSummary?: JobDebtSummary;
  partsUsed?: JobPartUsageDto[];
}

export interface ProductDto {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: ProductCategory;
  unit: string;
  quantityOnHand: number;
  minStockLevel: number;
  isActive: boolean;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobPartUsageDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  category: ProductCategory;
  quantity: number;
  notes: string | null;
  createdAt: string;
}

export interface StockTransactionDto {
  id: string;
  productId: string;
  type: StockTransactionType;
  quantity: number;
  notes: string | null;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; fullName: string; email: string };
}

export interface ExpenseDto {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  invoiceFileName: string | null;
  customerId: string | null;
  jobId: string | null;
  createdById: string;
  createdAt: string;
  customer?: { id: string; name: string } | null;
  job?: { id: string; title: string } | null;
}

export interface IncomeDto {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  invoiceFileName: string | null;
  customerId: string | null;
  jobId: string | null;
  createdById: string;
  createdAt: string;
  customer?: { id: string; name: string } | null;
  job?: { id: string; title: string } | null;
}

export interface DebtDto {
  id: string;
  title: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string | null;
  notes: string | null;
  status: DebtStatus;
  statusOverride: DebtStatus | null;
  customerId: string;
  jobId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  customer?: { id: string; name: string; phone: string | null };
  job?: { id: string; title: string } | null;
  payments?: DebtPaymentDto[];
}

export interface DebtPaymentDto {
  id: string;
  debtId: string;
  amount: number;
  notes: string | null;
  createdById: string;
  createdAt: string;
}

export interface WhatsappTemplateDto {
  id: string;
  key: string;
  name: string;
  body: string;
  locale: string;
  isActive: boolean;
}

export interface WhatsappRenderResult {
  message: string;
  whatsappUrl: string | null;
  phone: string | null;
}

export function computeDebtStatus(
  amount: number,
  paidAmount: number,
  dueDate: string | null,
  statusOverride?: DebtStatus | null,
): DebtStatus {
  if (statusOverride) return statusOverride;
  const remaining = amount - paidAmount;
  if (remaining <= 0) return DebtStatus.PAID;
  if (dueDate && new Date(dueDate) < new Date(new Date().toDateString())) {
    return DebtStatus.OVERDUE;
  }
  if (paidAmount > 0) return DebtStatus.PARTIAL;
  return DebtStatus.OPEN;
}

export function summarizeDebts(
  debts: Array<{
    amount: number;
    paidAmount: number;
    dueDate: string | null;
    statusOverride?: DebtStatus | null;
  }>,
): JobDebtSummary {
  const openDebts = debts.filter((d) => {
    const status = computeDebtStatus(
      d.amount,
      d.paidAmount,
      d.dueDate,
      d.statusOverride ?? null,
    );
    return status !== DebtStatus.PAID && d.amount - d.paidAmount > 0;
  });
  if (openDebts.length === 0) {
    return {
      hasDebt: false,
      hasOverdue: false,
      totalRemaining: 0,
      openCount: 0,
      status: DebtStatus.NONE,
    };
  }

  const totalRemaining = openDebts.reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);
  const hasOverdue = openDebts.some(
    (d) =>
      computeDebtStatus(
        d.amount,
        d.paidAmount,
        d.dueDate,
        d.statusOverride ?? null,
      ) === DebtStatus.OVERDUE,
  );

  let status: DebtStatus = DebtStatus.OPEN;
  if (hasOverdue) status = DebtStatus.OVERDUE;
  else if (openDebts.some((d) => d.paidAmount > 0)) status = DebtStatus.PARTIAL;

  return {
    hasDebt: true,
    hasOverdue,
    totalRemaining,
    openCount: openDebts.length,
    status,
  };
}

export const MANAGEABLE_ROLES: Record<RoleName, RoleName[]> = {
  [RoleName.ADMIN]: [RoleName.ADMIN, RoleName.OWNER, RoleName.WORKER],
  [RoleName.OWNER]: [RoleName.OWNER, RoleName.WORKER],
  [RoleName.WORKER]: [],
};

export function canManageRole(actorRole: RoleName, targetRole: RoleName): boolean {
  return MANAGEABLE_ROLES[actorRole]?.includes(targetRole) ?? false;
}

export function isAdminOrOwner(role: RoleName): boolean {
  return role === RoleName.ADMIN || role === RoleName.OWNER;
}

export function isAdmin(role: RoleName): boolean {
  return role === RoleName.ADMIN;
}

export const ROLE_VALUES = Object.values(RoleName);
export const JOB_STATUS_VALUES = Object.values(JobStatus);
export const JOB_SERVICE_TYPE_VALUES = Object.values(JobServiceType);
export const PRODUCT_CATEGORY_VALUES = Object.values(ProductCategory);
export const STOCK_TRANSACTION_TYPE_VALUES = Object.values(StockTransactionType);
export const DEBT_STATUS_VALUES = Object.values(DebtStatus);

export function formatMoney(amount: number, locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export interface ReportDateRange {
  from: string;
  to: string;
}

export interface FinancialReport {
  range: ReportDateRange;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  debtCollections: number;
  monthlyBreakdown: DashboardChartPoint[];
  topExpenseCategories: { category: string; amount: number }[];
}

export interface JobsReport {
  range: ReportDateRange;
  total: number;
  byStatus: Record<JobStatus, number>;
  byWorker: { workerId: string; workerName: string; total: number; completed: number }[];
  completionRate: number;
}

export interface InventoryReport {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  lowStockProducts: ProductDto[];
  movementsSummary: { stock_in: number; stock_out: number; adjustment: number };
  recentMovements: Array<
    StockTransactionDto & { productName: string; productSku: string }
  >;
}

export interface DebtsReport {
  openDebts: number;
  overdueDebts: number;
  totalRemaining: number;
  totalCollected: number;
  byCustomer: Array<{
    customerId: string;
    customerName: string;
    remaining: number;
    status: DebtStatus;
  }>;
  overdueList: DebtDto[];
}

export type ReportExportType = 'financial' | 'jobs' | 'inventory' | 'debts';
