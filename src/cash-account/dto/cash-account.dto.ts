import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CashAccountType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCashAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: CashAccountType })
  @IsEnum(CashAccountType)
  type!: CashAccountType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ required: false, default: 'UGX' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  openingBalance?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCashAccountDto extends PartialType(CreateCashAccountDto) {}

export class CreateTransferDto {
  @ApiProperty({ description: 'Source cash account' })
  @IsString()
  @IsNotEmpty()
  fromAccountId!: string;

  @ApiProperty({ description: 'Destination cash account' })
  @IsString()
  @IsNotEmpty()
  toAccountId!: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  occurredAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateAdjustmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ description: 'Signed: positive for inflow, negative for outflow' })
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  occurredAt?: string;
}
