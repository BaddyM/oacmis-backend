import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRfidDeviceDto {
    @ApiProperty() @IsString() @IsNotEmpty() name!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() location?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() lastSync?: string;
}

export class UpdateRfidDeviceDto extends PartialType(CreateRfidDeviceDto) {}

export class CreateRfidRecordDto {
    @ApiProperty() @IsString() @IsNotEmpty() studentId!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() studentName?: string;
    @ApiProperty() @IsString() @IsNotEmpty() rfidTag!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() timestamp?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() scannedBy?: string;
}

export class UpdateRfidRecordDto extends PartialType(CreateRfidRecordDto) {}
