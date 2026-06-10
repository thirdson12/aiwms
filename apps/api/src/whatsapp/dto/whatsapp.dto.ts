import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RenderWhatsappDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  jobId?: string;

  @IsOptional()
  @IsUUID()
  debtId?: string;
}

export class UpdateWhatsappTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  isActive?: boolean;
}
