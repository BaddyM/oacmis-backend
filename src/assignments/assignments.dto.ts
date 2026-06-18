import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAssignmentDto {
    @ApiProperty() @IsString() @IsNotEmpty() title!: string;
    @ApiProperty() @IsString() @IsNotEmpty() subject!: string;
    @ApiProperty() @IsString() @IsNotEmpty() className!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() dueDate?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() createdBy?: string;
}

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}

export class CreateAssignmentSubmissionDto {
    @ApiProperty() @IsString() @IsNotEmpty() assignmentId!: string;
    @ApiProperty() @IsString() @IsNotEmpty() studentName!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() content?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() link?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() submittedAt?: string;
}

export class UpdateAssignmentSubmissionDto extends PartialType(CreateAssignmentSubmissionDto) {}
