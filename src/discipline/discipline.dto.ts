import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDisciplineIncidentDto {
    @ApiProperty() @IsString() @IsNotEmpty() studentName!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() date?: string;
    @ApiProperty() @IsString() @IsNotEmpty() type!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() severity?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() action?: string;
}

export class UpdateDisciplineIncidentDto extends PartialType(CreateDisciplineIncidentDto) {}
