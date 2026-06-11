import { ValidateIf, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  isActive?: boolean;
}
