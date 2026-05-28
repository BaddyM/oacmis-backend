import { ApiProperty } from '@nestjs/swagger';
import { ExamPeriod, ExamTerm, ProductionStatus } from '@prisma/client';
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

	@ApiProperty({ required: false, enum: ExamTerm, description: 'Term this batch is produced for (applies to all categories)' })
	@IsEnum(ExamTerm, { message: 'term must be TERM_1, TERM_2 or TERM_3' })
	@IsOptional()
	term?: ExamTerm;

	@ApiProperty({ required: false, enum: ExamPeriod, description: 'Period within the term (applies to all categories)' })
	@IsEnum(ExamPeriod, { message: 'period must be BEGINNING, MID or END' })
	@IsOptional()
	period?: ExamPeriod;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	note?: string;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	createdById?: string;
}
