import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRouteAssignmentDto {
    @ApiProperty() @IsString() @IsNotEmpty() routeId!: string;
    @ApiProperty() @IsString() @IsNotEmpty() studentId!: string;
    @ApiProperty() @IsString() @IsNotEmpty() studentName!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() className?: string;
}

export class UpdateRouteAssignmentDto extends PartialType(CreateRouteAssignmentDto) {}
