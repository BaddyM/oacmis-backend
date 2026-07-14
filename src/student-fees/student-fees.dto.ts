import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFeeRecordDto {
    @ApiProperty({ required: false }) @IsString() @IsOptional() studentId?: string;
    @ApiProperty() @IsString() @IsNotEmpty() studentName!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() class?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() term?: string;
    // Must be declared or the global ValidationPipe({ whitelist: true }) strips
    // it, and the record lands with a null year that no term filter can match.
    @ApiProperty({ required: false }) @IsInt() @IsOptional() year?: number;
    @ApiProperty() @IsString() @IsNotEmpty() feeType!: string;
    @ApiProperty({ default: 0 }) @IsNumber() @Min(0) @IsOptional() amount?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() dueDate?: string;
    @ApiProperty({ required: false }) @IsNumber() @Min(0) @IsOptional() paidAmount?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
}

export class UpdateFeeRecordDto extends PartialType(CreateFeeRecordDto) {}
