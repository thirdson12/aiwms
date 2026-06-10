import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  AuthUser,
  RoleName,
  UserDto,
  canManageRole,
  isAdminOrOwner,
} from '@aiwms/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChangePasswordDto,
  CreateUserDto,
  UpdateProfileDto,
  UpdateUserDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(actor: AuthUser): Promise<UserDto[]> {
    this.assertCanManageUsers(actor);

    const users = await this.prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    return users
      .filter((user) => canManageRole(actor.role, user.role.name as RoleName) || user.id === actor.id)
      .map((user) => this.toDto(user));
  }

  async findOne(id: string, actor: AuthUser): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id !== actor.id && !this.canManageUser(actor, user.role.name as RoleName)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.toDto(user);
  }

  async create(dto: CreateUserDto, actor: AuthUser): Promise<UserDto> {
    this.assertCanManageUsers(actor);

    if (!canManageRole(actor.role, dto.role)) {
      throw new ForbiddenException('Cannot assign this role');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: dto.role },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        fullName: dto.fullName,
        passwordHash: await bcrypt.hash(dto.password, 10),
        roleId: role.id,
      },
      include: { role: true },
    });

    return this.toDto(user);
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.canManageUser(actor, user.role.name as RoleName)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (dto.role && !canManageRole(actor.role, dto.role)) {
      throw new ForbiddenException('Cannot assign this role');
    }

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Email already in use');
      }
    }

    const role = dto.role
      ? await this.prisma.role.findUniqueOrThrow({ where: { name: dto.role } })
      : undefined;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email?.toLowerCase(),
        fullName: dto.fullName,
        isActive: dto.isActive,
        roleId: role?.id,
      },
      include: { role: true },
    });

    return this.toDto(updated);
  }

  async deactivate(id: string, actor: AuthUser): Promise<UserDto> {
    if (id === actor.id) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    return this.update(id, { isActive: false }, actor);
  }

  async updateProfile(actor: AuthUser, dto: UpdateProfileDto): Promise<UserDto> {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing && existing.id !== actor.id) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: actor.id },
      data: {
        email: dto.email?.toLowerCase(),
        fullName: dto.fullName,
      },
      include: { role: true },
    });

    return this.toDto(updated);
  }

  async changePassword(actor: AuthUser, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: actor.id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    await this.prisma.user.update({
      where: { id: actor.id },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });

    return { message: 'Password updated successfully' };
  }

  async listWorkers(): Promise<UserDto[]> {
    const workerRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: RoleName.WORKER },
    });

    const users = await this.prisma.user.findMany({
      where: { roleId: workerRole.id, isActive: true },
      include: { role: true },
      orderBy: { fullName: 'asc' },
    });

    return users.map((user) => this.toDto(user));
  }

  private assertCanManageUsers(actor: AuthUser) {
    if (!isAdminOrOwner(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private canManageUser(actor: AuthUser, targetRole: RoleName): boolean {
    return isAdminOrOwner(actor.role) && canManageRole(actor.role, targetRole);
  }

  private toDto(user: {
    id: string;
    email: string;
    fullName: string;
    isActive: boolean;
    createdAt: Date;
    role: { name: string };
  }): UserDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name as RoleName,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
