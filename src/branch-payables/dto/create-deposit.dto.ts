import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateDepositDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({ required: false, enum: PaymentMethod })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  recordedById?: string;

  @ApiProperty({ required: false, description: 'Branch cash account funds left from' })
  @IsString()
  @IsOptional()
  fromAccountId?: string;

  @ApiProperty({ required: false, description: 'HQ / main cash account funds arrived in' })
  @IsString()
  @IsOptional()
  toAccountId?: string;
}
