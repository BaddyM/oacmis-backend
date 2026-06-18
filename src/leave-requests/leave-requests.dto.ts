import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLeaveRequestDto {
    @ApiProperty() @IsString() @IsNotEmpty() employeeName!: string;
    @ApiProperty() @IsString() @IsNotEmpty() type!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() startDate?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() endDate?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() reason?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
}

export class UpdateLeaveRequestDto extends PartialType(CreateLeaveRequestDto) {}
