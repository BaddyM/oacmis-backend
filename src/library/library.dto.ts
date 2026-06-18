import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookDto {
    @ApiProperty() @IsString() @IsNotEmpty() title!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() author?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() isbn?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() category?: string;
    @ApiProperty({ default: 0 }) @IsInt() @Min(0) @IsOptional() totalCopies?: number;
    @ApiProperty({ default: 0 }) @IsInt() @Min(0) @IsOptional() availableCopies?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
}

export class UpdateBookDto extends PartialType(CreateBookDto) {}

export class CreateBorrowRecordDto {
    @ApiProperty() @IsString() @IsNotEmpty() bookTitle!: string;
    @ApiProperty() @IsString() @IsNotEmpty() studentName!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() studentId?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() borrowDate?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() dueDate?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
}

export class UpdateBorrowRecordDto extends PartialType(CreateBorrowRecordDto) {}
