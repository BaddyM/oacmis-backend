import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlastDto {
    @ApiProperty() @IsString() @IsNotEmpty() channel!: string;
    @ApiProperty() @IsString() @IsNotEmpty() audience!: string;
    @ApiProperty() @IsString() @IsNotEmpty() subject!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() body?: string;
    @ApiProperty({ default: 0 }) @IsInt() @IsOptional() recipients?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() sentAt?: string;
}

export class UpdateBlastDto extends PartialType(CreateBlastDto) {}
