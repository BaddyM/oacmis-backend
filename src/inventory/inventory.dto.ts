import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventoryItemDto {
    @ApiProperty() @IsString() @IsNotEmpty() name!: string;
    @ApiProperty() @IsString() @IsNotEmpty() category!: string;
    @ApiProperty() @IsString() @IsNotEmpty() sku!: string;
    @ApiProperty({ default: 0 }) @IsInt() @Min(0) @IsOptional() quantity?: number;
    @ApiProperty({ default: 0 }) @IsInt() @Min(0) @IsOptional() minStock?: number;
    @ApiProperty({ default: 0 }) @IsNumber() @Min(0) @IsOptional() unitPrice?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() supplier?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() location?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
}

export class UpdateInventoryItemDto extends PartialType(CreateInventoryItemDto) {}
