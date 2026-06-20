import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFeePaymentDto {
    @ApiProperty({ required: false }) @IsString() @IsOptional() studentId?: string;
    @ApiProperty() @IsString() @IsNotEmpty() studentName!: string;
    @ApiProperty() @IsString() @IsNotEmpty() invoiceRef!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() feeRecordId?: string;
    @ApiProperty({ default: 0 }) @IsNumber() @IsOptional() amount?: number;
    @ApiProperty() @IsString() @IsNotEmpty() method!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() cardLast4?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() paidAt?: string;
}

export class UpdateFeePaymentDto extends PartialType(CreateFeePaymentDto) {}
