import { ApiProperty } from '@nestjs/swagger';
import { ProductionStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductionDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	productId!: string;

	@ApiProperty()
	@IsNumber()
	@IsNotEmpty()
	quantity!: number;

	@ApiProperty({ required: false, enum: ProductionStatus, default: ProductionStatus.EXPECTED })
	@IsEnum(ProductionStatus)
	@IsOptional()
	status?: ProductionStatus;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	note?: string;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	createdById?: string;
}
