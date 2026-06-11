import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus as PrismaJobStatus, JobServiceType as PrismaJobServiceType, StockTransactionType as PrismaStockType } from '@aiwms/database';
import {
  AuthUser,
  DebtStatus,
  JobDto,
  JobPartUsageDto,
  JobServiceType,
  JobStatus,
  ProductCategory,
  RoleName,
  isAdminOrOwner,
  summarizeDebts,
} from '@aiwms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto, UseJobPartDto } from './dto/job.dto';

const jobInclude = {
  createdBy: { select: { id: true, fullName: true, email: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } },
  customer: { select: { id: true, name: true, phone: true } },
  debts: { where: { deletedAt: null } },
  stockTransactions: {
    include: {
      product: { select: { id: true, name: true, sku: true, category: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async findAll(actor: AuthUser): Promise<JobDto[]> {
    const where =
      actor.role === RoleName.WORKER ? { assignedToId: actor.id } : {};

    const jobs = await this.prisma.job.findMany({
      where,
      include: jobInclude,
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => this.toDto(job));
  }

  async findOne(id: string, actor: AuthUser): Promise<JobDto> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: jobInclude,
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    this.assertCanView(job.assignedToId, actor);
    return this.toDto(job);
  }

  async create(dto: CreateJobDto, actor: AuthUser): Promise<JobDto> {
    if (!isAdminOrOwner(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (dto.assignedToId) {
      await this.assertWorker(dto.assignedToId);
    }

    if (dto.customerId) {
      await this.assertCustomer(dto.customerId);
    }

    const job = await this.prisma.job.create({
      data: {
        title: dto.title,
        description: dto.description,
        serviceType: (dto.serviceType ?? JobServiceType.NORMAL_SERVICE) as PrismaJobServiceType,
        plateNumber: dto.plateNumber,
        assignedToId: dto.assignedToId,
        customerId: dto.customerId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        createdById: actor.id,
      },
      include: jobInclude,
    });

    return this.toDto(job);
  }

  async update(id: string, dto: UpdateJobDto, actor: AuthUser): Promise<JobDto> {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (actor.role === RoleName.WORKER) {
      if (job.assignedToId !== actor.id) {
        throw new ForbiddenException('Insufficient permissions');
      }

      const allowed: UpdateJobDto = { status: dto.status };
      if (
        dto.title ||
        dto.description ||
        dto.assignedToId !== undefined ||
        dto.customerId !== undefined ||
        dto.dueDate !== undefined
      ) {
        throw new ForbiddenException('Workers can only update job status');
      }

      return this.applyUpdate(id, allowed);
    }

    if (!isAdminOrOwner(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (dto.assignedToId) {
      await this.assertWorker(dto.assignedToId);
    }

    if (dto.customerId) {
      await this.assertCustomer(dto.customerId);
    }

    return this.applyUpdate(id, dto);
  }

  async usePart(jobId: string, dto: UseJobPartDto, actor: AuthUser): Promise<JobDto> {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    this.assertCanView(job.assignedToId, actor);

    if (actor.role === RoleName.WORKER && job.assignedToId !== actor.id) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }
    if (product.quantityOnHand < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { quantityOnHand: product.quantityOnHand - dto.quantity },
      }),
      this.prisma.stockTransaction.create({
        data: {
          productId: dto.productId,
          jobId,
          type: PrismaStockType.stock_out,
          quantity: dto.quantity,
          notes: dto.notes ?? `Job: ${job.title}`,
          createdById: actor.id,
        },
      }),
    ]);

    return this.findOne(jobId, actor);
  }

  async removePart(jobId: string, transactionId: string, actor: AuthUser): Promise<JobDto> {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    this.assertCanView(job.assignedToId, actor);
    if (actor.role === RoleName.WORKER && job.assignedToId !== actor.id) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const tx = await this.prisma.stockTransaction.findFirst({
      where: { id: transactionId, jobId, type: PrismaStockType.stock_out },
      include: { product: true },
    });
    if (!tx) throw new NotFoundException('Part usage not found');

    await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: tx.productId },
        data: { quantityOnHand: tx.product.quantityOnHand + tx.quantity },
      }),
      this.prisma.stockTransaction.delete({ where: { id: transactionId } }),
    ]);

    return this.findOne(jobId, actor);
  }

  async remove(id: string, actor: AuthUser): Promise<{ message: string }> {
    if (!isAdminOrOwner(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.prisma.job.delete({ where: { id } });
    return { message: 'Job deleted' };
  }

  private async applyUpdate(id: string, dto: UpdateJobDto): Promise<JobDto> {
    const job = await this.prisma.job.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status as PrismaJobStatus | undefined,
        serviceType: dto.serviceType as PrismaJobServiceType | undefined,
        plateNumber: dto.plateNumber,
        assignedToId: dto.assignedToId,
        customerId: dto.customerId,
        dueDate: dto.dueDate === null ? null : dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: jobInclude,
    });

    return this.toDto(job);
  }

  private assertCanView(assignedToId: string | null, actor: AuthUser) {
    if (actor.role === RoleName.WORKER && assignedToId !== actor.id) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async assertWorker(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.isActive || user.role.name !== RoleName.WORKER) {
      throw new ForbiddenException('Assigned user must be an active worker');
    }
  }

  private async assertCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || !customer.isActive) {
      throw new ForbiddenException('Customer not found');
    }
  }

  private toDto(job: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    serviceType: string;
    plateNumber: string | null;
    createdById: string;
    assignedToId: string | null;
    customerId: string | null;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: { id: string; fullName: string; email: string };
    assignedTo?: { id: string; fullName: string; email: string } | null;
    customer?: { id: string; name: string; phone: string | null } | null;
    debts?: Array<{
      amount: unknown;
      paidAmount: unknown;
      dueDate: Date | null;
      statusOverride: string | null;
    }>;
    stockTransactions?: Array<{
      id: string;
      productId: string;
      quantity: number;
      notes: string | null;
      createdAt: Date;
      product: { id: string; name: string; sku: string; category: string };
    }>;
  }): JobDto {
    const debtSummary = summarizeDebts(
      (job.debts ?? []).map((d) => ({
        amount: Number(d.amount),
        paidAmount: Number(d.paidAmount),
        dueDate: d.dueDate?.toISOString() ?? null,
        statusOverride: (d.statusOverride as DebtStatus | null) ?? null,
      })),
    );

    const partsUsed: JobPartUsageDto[] = (job.stockTransactions ?? []).map((tx) => ({
      id: tx.id,
      productId: tx.productId,
      productName: tx.product.name,
      productSku: tx.product.sku,
      category: tx.product.category as ProductCategory,
      quantity: tx.quantity,
      notes: tx.notes,
      createdAt: tx.createdAt.toISOString(),
    }));

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      status: job.status as JobStatus,
      serviceType: job.serviceType as JobServiceType,
      plateNumber: job.plateNumber,
      createdById: job.createdById,
      assignedToId: job.assignedToId,
      customerId: job.customerId,
      dueDate: job.dueDate?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      createdBy: job.createdBy,
      assignedTo: job.assignedTo,
      customer: job.customer,
      debtSummary,
      partsUsed,
    };
  }
}
