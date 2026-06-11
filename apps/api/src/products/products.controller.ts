import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthUser, RoleName, ProductCategory } from '@aiwms/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateProductDto,
  CreateStockTransactionDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('category') category?: ProductCategory,
  ) {
    return this.productsService.findAll(includeInactive === 'true', category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/transactions')
  listTransactions(@Param('id') id: string) {
    return this.productsService.listTransactions(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.OWNER, RoleName.WORKER)
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) {
    return this.productsService.create(dto, user);
  }

  @Post(':id/transactions')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.OWNER)
  addTransaction(
    @Param('id') id: string,
    @Body() dto: CreateStockTransactionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.addTransaction(id, dto, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.OWNER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.OWNER)
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.productsService.deactivate(id, user);
  }
}
