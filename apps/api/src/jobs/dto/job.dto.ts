import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import {
  JobServiceType,
  JOB_SERVICE_TYPE_VALUES,
  JobStatus,
  JOB_STATUS_VALUES,
} from '@aiwms/shared';

export class CreateJobDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(JOB_SERVICE_TYPE_VALUES)
  serviceType?: JobServiceType;

  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(JOB_STATUS_VALUES)
  status?: JobStatus;

  @IsOptional()
  @IsIn(JOB_SERVICE_TYPE_VALUES)
  serviceType?: JobServiceType;

  @IsOptional()
  @IsString()
  plateNumber?: string | null;

  @IsOptional()
  @IsUUID()
  assignedToId?: string | null;

  @IsOptional()
  @IsUUID()
  customerId?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}

export class UseJobPartDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
