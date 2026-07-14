import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// A starting chart of accounts for a nursery/primary school. Kept as a plain
// string on the model rather than an enum so a school can add its own without
// a migration; these are what the UI offers.
export const EXPENSE_CATEGORIES = [
    'Salaries',
    'Utilities',
    'Rent',
    'Scholastic Materials',
    'Food & Feeding',
    'Transport & Fuel',
    'Maintenance & Repairs',
    'Medical',
    'Administration',
    'Co-curricular',
    'Other',
] as const;

export class CreateExpenseDto {
    @ApiProperty({ description: 'ISO date, yyyy-mm-dd' }) @IsString() @IsNotEmpty() date!: string;
    @ApiProperty() @IsString() @IsNotEmpty() category!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
    @ApiProperty({ default: 0 }) @IsNumber() @Min(0) amount!: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() payee?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() method?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() reference?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() recordedBy?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() term?: string;
    @ApiProperty({ required: false }) @IsInt() @IsOptional() year?: number;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
