import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { DebtStatus } from '@aiwms/shared';

const DEBT_STATUS_OVERRIDE_VALUES = ['open', 'partial', 'paid', 'overdue'] as const;

export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @MinLength(2)
  description!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  invoiceFileName?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  jobId?: string;
}

export class CreateIncomeDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @MinLength(2)
  description!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  invoiceFileName?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  jobId?: string;
}

export class CreateDebtDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  jobId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PayDebtDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDebtDto {
  @IsOptional()
  @IsIn([...DEBT_STATUS_OVERRIDE_VALUES, null])
  statusOverride?: DebtStatus | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
