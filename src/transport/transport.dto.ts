import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBusRouteDto {
    @ApiProperty() @IsString() @IsNotEmpty() routeName!: string;
    @ApiProperty() @IsString() @IsNotEmpty() busNumber!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() driverName?: string;
    @ApiProperty({ default: 0 }) @IsInt() @Min(0) @IsOptional() capacity?: number;
    @ApiProperty({ default: 0 }) @IsInt() @Min(0) @IsOptional() studentsCount?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() startTime?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() endTime?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
}

export class UpdateBusRouteDto extends PartialType(CreateBusRouteDto) {}
