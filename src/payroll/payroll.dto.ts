import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePayrollRecordDto {
    @ApiProperty() @IsString() @IsNotEmpty() employeeId!: string;
    @ApiProperty() @IsString() @IsNotEmpty() name!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() position?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() department?: string;
    @ApiProperty({ default: 0 }) @IsNumber() @Min(0) @IsOptional() baseSalary?: number;
    @ApiProperty({ default: 0 }) @IsNumber() @Min(0) @IsOptional() allowances?: number;
    @ApiProperty({ default: 0 }) @IsNumber() @Min(0) @IsOptional() deductions?: number;
    @ApiProperty({ default: 0 }) @IsNumber() @Min(0) @IsOptional() netSalary?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() month?: string;
    @ApiProperty({ required: false }) @IsInt() @IsOptional() year?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
}

export class UpdatePayrollRecordDto extends PartialType(CreatePayrollRecordDto) {}
