import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StockTransactionType as PrismaStockType } from '@aiwms/database';
import {
  AuthUser,
  ProductCategory,
  ProductDto,
  StockTransactionDto,
  StockTransactionType,
  isAdminOrOwner,
} from '@aiwms/shared';
import { ProductCategory as PrismaProductCategory } from '@aiwms/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  CreateStockTransactionDto,
  UpdateProductDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false, category?: ProductCategory): Promise<ProductDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(category ? { category } : {}),
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => this.toProductDto(product));
  }

  async findOne(id: string): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.toProductDto(product);
  }

  async create(dto: CreateProductDto, actor: AuthUser): Promise<ProductDto> {
    const existing = await this.prisma.product.findUnique({
      where: { sku: dto.sku.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException('SKU already exists');
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        sku: dto.sku.toUpperCase(),
        description: dto.description,
        category: (dto.category ?? ProductCategory.SERVICE_PART) as PrismaProductCategory,
        unit: dto.unit ?? 'adet',
        quantityOnHand: dto.quantityOnHand ?? 0,
        minStockLevel: dto.minStockLevel ?? 0,
      },
    });

    if ((dto.quantityOnHand ?? 0) > 0) {
      await this.prisma.stockTransaction.create({
        data: {
          productId: product.id,
          type: 'stock_in',
          quantity: dto.quantityOnHand!,
          notes: 'Initial stock',
          createdById: actor.id,
        },
      });
    }

    return this.toProductDto(product);
  }

  async update(id: string, dto: UpdateProductDto, actor: AuthUser): Promise<ProductDto> {
    this.assertCanManage(actor);

    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { sku: dto.sku.toUpperCase() },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('SKU already exists');
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku?.toUpperCase(),
        description: dto.description,
        category: dto.category as PrismaProductCategory | undefined,
        unit: dto.unit,
        minStockLevel: dto.minStockLevel,
        isActive: dto.isActive,
      },
    });

    return this.toProductDto(updated);
  }

  async deactivate(id: string, actor: AuthUser): Promise<ProductDto> {
    return this.update(id, { isActive: false }, actor);
  }

  async listTransactions(productId: string): Promise<StockTransactionDto[]> {
    await this.findOne(productId);

    const transactions = await this.prisma.stockTransaction.findMany({
      where: { productId },
      include: { createdBy: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((tx) => this.toTransactionDto(tx));
  }

  async addTransaction(
    productId: string,
    dto: CreateStockTransactionDto,
    actor: AuthUser,
  ): Promise<{ product: ProductDto; transaction: StockTransactionDto }> {
    this.assertCanManage(actor);

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    let newQuantity = product.quantityOnHand;

    if (dto.type === StockTransactionType.STOCK_IN) {
      newQuantity += dto.quantity;
    } else if (dto.type === StockTransactionType.STOCK_OUT) {
      if (product.quantityOnHand < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }
      newQuantity -= dto.quantity;
    } else if (dto.type === StockTransactionType.ADJUSTMENT) {
      newQuantity = dto.quantity;
    }

    if (newQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    const [updatedProduct, transaction] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: { quantityOnHand: newQuantity },
      }),
      this.prisma.stockTransaction.create({
        data: {
          productId,
          type: dto.type as PrismaStockType,
          quantity: dto.quantity,
          notes: dto.notes,
          createdById: actor.id,
        },
        include: { createdBy: { select: { id: true, fullName: true, email: true } } },
      }),
    ]);

    return {
      product: this.toProductDto(updatedProduct),
      transaction: this.toTransactionDto(transaction),
    };
  }

  private assertCanManage(actor: AuthUser) {
    if (!isAdminOrOwner(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private toProductDto(product: {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    category: string;
    unit: string;
    quantityOnHand: number;
    minStockLevel: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ProductDto {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      category: product.category as ProductCategory,
      unit: product.unit,
      quantityOnHand: product.quantityOnHand,
      minStockLevel: product.minStockLevel,
      isActive: product.isActive,
      isLowStock: product.quantityOnHand <= product.minStockLevel,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private toTransactionDto(tx: {
    id: string;
    productId: string;
    type: string;
    quantity: number;
    notes: string | null;
    createdById: string;
    createdAt: Date;
    createdBy?: { id: string; fullName: string; email: string };
  }): StockTransactionDto {
    return {
      id: tx.id,
      productId: tx.productId,
      type: tx.type as StockTransactionType,
      quantity: tx.quantity,
      notes: tx.notes,
      createdById: tx.createdById,
      createdAt: tx.createdAt.toISOString(),
      createdBy: tx.createdBy,
    };
  }
}
