import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExamAssignmentDto {
    @ApiProperty({ example: 'primary' }) @IsString() @IsNotEmpty() level!: string;
    @ApiProperty() @IsString() @IsNotEmpty() className!: string;
    @ApiProperty() @IsString() @IsNotEmpty() subject!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() teacherEmail?: string;
}

export class UpdateExamAssignmentDto extends PartialType(CreateExamAssignmentDto) {}
