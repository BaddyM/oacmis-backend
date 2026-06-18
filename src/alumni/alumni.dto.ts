import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAlumnusDto {
    @ApiProperty() @IsString() @IsNotEmpty() fullName!: string;
    @ApiProperty({ required: false }) @IsInt() @IsOptional() graduationYear?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() occupation?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() email?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() phone?: string;
    @ApiProperty({ required: false }) @IsBoolean() @IsOptional() isDonor?: boolean;
}

export class UpdateAlumnusDto extends PartialType(CreateAlumnusDto) {}
