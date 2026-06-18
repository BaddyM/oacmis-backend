import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHealthRecordDto {
    @ApiProperty() @IsString() @IsNotEmpty() studentName!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() bloodType?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() allergies?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() conditions?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() immunizations?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() emergencyContact?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() emergencyPhone?: string;
}

export class UpdateHealthRecordDto extends PartialType(CreateHealthRecordDto) {}
