import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQuizDto {
    @ApiProperty() @IsString() @IsNotEmpty() title!: string;
    @ApiProperty() @IsString() @IsNotEmpty() subject!: string;
    @ApiProperty() @IsString() @IsNotEmpty() classTarget!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
    @ApiProperty({ default: 30 }) @IsInt() @IsOptional() durationMinutes?: number;
    @ApiProperty() @IsString() @IsNotEmpty() deadline!: string;
    @ApiProperty({ default: 0 }) @IsInt() @IsOptional() totalPoints?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() createdBy?: string;
    @ApiProperty({ type: 'array', items: { type: 'object' } }) @IsArray() questions!: any[];
}

export class UpdateQuizDto extends PartialType(CreateQuizDto) {}

export class CreateQuizSubmissionDto {
    @ApiProperty() @IsString() @IsNotEmpty() quizId!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() studentId?: string;
    @ApiProperty() @IsString() @IsNotEmpty() studentName!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() submittedAt?: string;
    @ApiProperty({ type: 'array', items: { type: 'object' } }) @IsArray() answers!: any[];
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() score?: number;
    @ApiProperty({ default: false }) @IsBoolean() @IsOptional() autoGraded?: boolean;
    @ApiProperty({ required: false }) @IsOptional() marks?: Record<string, number>;
    @ApiProperty({ default: false }) @IsBoolean() @IsOptional() released?: boolean;
    @ApiProperty({ required: false }) @IsString() @IsOptional() feedback?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() gradedBy?: string;
}

export class UpdateQuizSubmissionDto extends PartialType(CreateQuizSubmissionDto) {}
