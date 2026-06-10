import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser, CustomerDto, JobDebtSummary, isAdminOrOwner, summarizeDebts } from '@aiwms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<CustomerDto[]> {
    const customers = await this.prisma.customer.findMany({
      where: { isActive: true },
      include: { debts: true },
      orderBy: { name: 'asc' },
    });

    return customers.map((c) =>
      this.toDto(c, summarizeDebts(c.debts.map((d) => this.debtNumbers(d)))),
    );
  }

  async findOne(id: string): Promise<CustomerDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { debts: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.toDto(customer, summarizeDebts(customer.debts.map((d) => this.debtNumbers(d))));
  }

  async create(dto: CreateCustomerDto, actor: AuthUser): Promise<CustomerDto> {
    const customer = await this.prisma.customer.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        notes: dto.notes,
      },
      include: { debts: true },
    });
    return this.toDto(customer, summarizeDebts([]));
  }

  async update(id: string, dto: UpdateCustomerDto, actor: AuthUser): Promise<CustomerDto> {
    this.assertCanManage(actor);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
      include: { debts: true },
    });
    return this.toDto(customer, summarizeDebts(customer.debts.map((d) => this.debtNumbers(d))));
  }

  async deactivate(id: string, actor: AuthUser): Promise<CustomerDto> {
    return this.update(id, { isActive: false }, actor);
  }

  private assertCanManage(actor: AuthUser) {
    if (!isAdminOrOwner(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private debtNumbers(debt: { amount: unknown; paidAmount: unknown; dueDate: Date | null }) {
    return {
      amount: Number(debt.amount),
      paidAmount: Number(debt.paidAmount),
      dueDate: debt.dueDate?.toISOString() ?? null,
    };
  }

  private toDto(
    customer: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      notes: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    debtSummary: JobDebtSummary,
  ): CustomerDto {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      debtSummary,
    };
  }
}
