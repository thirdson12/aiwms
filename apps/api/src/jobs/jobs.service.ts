import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus as PrismaJobStatus } from '@aiwms/database';
import {
  AuthUser,
  JobDto,
  JobStatus,
  RoleName,
  isAdminOrOwner,
  summarizeDebts,
} from '@aiwms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto } from './dto/job.dto';

const jobInclude = {
  createdBy: { select: { id: true, fullName: true, email: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } },
  customer: { select: { id: true, name: true, phone: true } },
  debts: true,
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
    createdById: string;
    assignedToId: string | null;
    customerId: string | null;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: { id: string; fullName: string; email: string };
    assignedTo?: { id: string; fullName: string; email: string } | null;
    customer?: { id: string; name: string; phone: string | null } | null;
    debts?: Array<{ amount: unknown; paidAmount: unknown; dueDate: Date | null }>;
  }): JobDto {
    const debtSummary = summarizeDebts(
      (job.debts ?? []).map((d) => ({
        amount: Number(d.amount),
        paidAmount: Number(d.paidAmount),
        dueDate: d.dueDate?.toISOString() ?? null,
      })),
    );

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      status: job.status as JobStatus,
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
    };
  }
}
