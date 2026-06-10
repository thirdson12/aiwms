import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthUser, RoleName } from '@aiwms/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateDebtDto,
  CreateExpenseDto,
  CreateIncomeDto,
  PayDebtDto,
} from './dto/accounting.dto';
import { AccountingService } from './accounting.service';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private accountingService: AccountingService) {}

  @Get('summary')
  getSummary() {
    return this.accountingService.getSummary();
  }

  @Get('expenses')
  findExpenses() {
    return this.accountingService.findExpenses();
  }

  @Post('expenses')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.OWNER)
  createExpense(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthUser) {
    return this.accountingService.createExpense(dto, user);
  }

  @Get('incomes')
  findIncomes() {
    return this.accountingService.findIncomes();
  }

  @Post('incomes')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.OWNER)
  createIncome(@Body() dto: CreateIncomeDto, @CurrentUser() user: AuthUser) {
    return this.accountingService.createIncome(dto, user);
  }

  @Get('debts')
  findDebts() {
    return this.accountingService.findDebts();
  }

  @Get('debts/:id')
  findDebt(@Param('id') id: string) {
    return this.accountingService.findDebt(id);
  }

  @Post('debts')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.OWNER)
  createDebt(@Body() dto: CreateDebtDto, @CurrentUser() user: AuthUser) {
    return this.accountingService.createDebt(dto, user);
  }

  @Post('debts/:id/pay')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.OWNER)
  payDebt(
    @Param('id') id: string,
    @Body() dto: PayDebtDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.accountingService.payDebt(id, dto, user);
  }
}
